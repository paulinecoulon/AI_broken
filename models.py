import os
import json
from PIL import Image
import subprocess
import shutil
import glob
from datetime import datetime
from config import ANNOTATIONS_FOLDER, MODEL_FOLDER, UPLOAD_FOLDER

def get_model_versions():
    """Retourne la liste des versions de modèles disponibles"""
    versions = []
    exp_dirs = [d for d in os.listdir(MODEL_FOLDER) if d.startswith('exp')]
    
    for exp_dir in exp_dirs:
        model_path = os.path.join(MODEL_FOLDER, exp_dir, 'weights', 'best.pt')
        if os.path.exists(model_path):
            created_time = os.path.getmtime(model_path)
            versions.append({
                'version': exp_dir,
                'date': datetime.fromtimestamp(created_time).strftime('%Y-%m-%d %H:%M:%S'),
                'path': model_path
            })
    
    # Trier par date de création (plus récent en premier)
    versions.sort(key=lambda x: x['date'], reverse=True)
    
    # Garder uniquement les 3 dernières versions
    if len(versions) > 3:
        # Supprimer les anciennes versions
        for version in versions[3:]:
            exp_dir = os.path.join(MODEL_FOLDER, version['version'])
            if os.path.exists(exp_dir):
                shutil.rmtree(exp_dir)
        versions = versions[:3]
    
    return versions


def save_annotation(filename, annotations, classes):
    """Sauvegarde les annotations au format YOLO"""
    base_filename = os.path.splitext(filename)[0]
    annotation_path = os.path.join(ANNOTATIONS_FOLDER, f"{base_filename}.txt")
    
    with open(annotation_path, 'w') as f:
        for ann in annotations:
            class_id = list(classes).index(ann['class'])
            coords = ann['coordinates']
            f.write(f"{class_id} {' '.join(map(str, coords))}\n")

def load_annotations(filename, classes):
    """Charge les annotations d'une image"""
    base_filename = os.path.splitext(filename)[0]
    annotation_path = os.path.join(ANNOTATIONS_FOLDER, f"{base_filename}.txt")
    
    if not os.path.exists(annotation_path):
        return []
    
    annotations = []
    with open(annotation_path, 'r') as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) == 5:  # class_id x y w h
                class_id = int(parts[0])
                if class_id < len(classes):
                    class_name = list(classes)[class_id]
                    coords = [float(x) for x in parts[1:]]
                    annotations.append({
                        'class': class_name,
                        'coordinates': coords
                    })
    
    return annotations

def predict_image(file, classes, version=None):
    """Effectue des prédictions sur une image avec le modèle entraîné
    
    Args:
        file: Fichier image à prédire
        classes: Liste des classes
        version: Version spécifique du modèle à utiliser (exp1, exp2, etc.)
    """
    temp_path = os.path.join(UPLOAD_FOLDER, 'temp_predict.jpg')
    pred_dir = os.path.join('predictions', 'temp')
    
    try:
        # S'assurer que les dossiers nécessaires existent
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        os.makedirs(os.path.join(pred_dir, 'labels'), exist_ok=True)
        
        # Sauvegarder l'image temporairement
        file.save(temp_path)
        
        # Obtenir le chemin du modèle
        if version:
            model_path = os.path.join(MODEL_FOLDER, version, 'weights', 'best.pt')
            if not os.path.exists(model_path):
                raise Exception(f"Version du modèle '{version}' non trouvée")
        else:
            # Utiliser la dernière version si aucune n'est spécifiée
            versions = get_model_versions()
            if not versions:
                raise Exception("Aucun modèle entraîné trouvé")
            model_path = versions[0]['path']
        
        # Exécuter la prédiction avec YOLOv5
        cmd = [
            'python', 'yolov5/detect.py',
            '--source', temp_path,
            '--weights', model_path,
            '--conf', '0.25',
            '--save-txt',
            '--save-conf',
            '--exist-ok',
            '--project', 'predictions',
            '--name', 'temp'
        ]
        
        subprocess.run(cmd, check=True)
        
        # Lire les résultats
        predictions = []
        pred_txt = os.path.join(pred_dir, 'labels', 'temp_predict.txt')
        
        if os.path.exists(pred_txt):
            img = Image.open(temp_path)
            w, h = img.size
            
            with open(pred_txt, 'r') as f:
                for line in f:
                    class_id, x_center, y_center, width, height, conf = map(float, line.strip().split())
                    predictions.append({
                        'class': list(classes)[int(class_id)],
                        'box': [x_center, y_center, width, height],
                        'confidence': conf
                    })
        
        return predictions
        
    except Exception as e:
        raise Exception(f"Erreur lors de la prédiction: {str(e)}")
        
    finally:
        # Nettoyer les fichiers temporaires
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass
                
        if os.path.exists(pred_dir):
            try:
                shutil.rmtree(pred_dir, ignore_errors=True)
            except:
                pass