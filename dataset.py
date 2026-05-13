import os
import shutil
import math
import numpy as np
import yaml
from config import UPLOAD_FOLDER, ANNOTATIONS_FOLDER, DATASET_FOLDER, YOLO_CONFIG

def prepare_yolo_dataset(classes):
    """Prépare le dataset au format YOLOv5"""
    # Vérifier qu'il y a des images annotées
    image_files = [f for f in os.listdir(UPLOAD_FOLDER) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    annotated_images = []
    total_objects = 0
    
    for img_file in image_files:
        base_name = os.path.splitext(img_file)[0]
        ann_file = os.path.join(ANNOTATIONS_FOLDER, f"{base_name}.txt")
        if os.path.exists(ann_file):
            with open(ann_file, 'r') as f:
                annotations = f.readlines()
                if annotations:  # Vérifier que le fichier n'est pas vide
                    annotated_images.append(img_file)
                    total_objects += len(annotations)
    
    if len(annotated_images) < 1:
        raise ValueError("Au moins une image annotée est nécessaire pour l'entraînement")
    
    print(f"Dataset: {len(annotated_images)} images, {total_objects} objets annotés")
    
    # Nettoyer les dossiers de dataset
    for split in ['train', 'val', 'test']:
        for subdir in ['images', 'labels']:
            dir_path = os.path.join(DATASET_FOLDER, split, subdir)
            for f in os.listdir(dir_path):
                os.remove(os.path.join(dir_path, f))
    
    # Répartir les images (70% train, 20% val, 10% test)
    np.random.shuffle(annotated_images)
    n_files = len(annotated_images)
    
    if n_files <= 3:
        splits = {
            'train': annotated_images,
            'val': annotated_images[:1],
            'test': annotated_images[:1]
        }
    else:
        n_train = max(1, math.floor(0.7 * n_files))
        n_val = max(1, math.floor(0.2 * n_files))
        
        splits = {
            'train': annotated_images[:n_train],
            'val': annotated_images[n_train:n_train+n_val],
            'test': annotated_images[n_train+n_val:]
        }
    
    # Copier les fichiers
    for split, files in splits.items():
        print(f"Split {split}: {len(files)} images")
        for filename in files:
            base_filename = os.path.splitext(filename)[0]
            
            # Copier l'image
            src_img = os.path.join(UPLOAD_FOLDER, filename)
            dst_img = os.path.join(DATASET_FOLDER, split, 'images', filename)
            shutil.copy2(src_img, dst_img)
            
            # Copier l'annotation
            src_ann = os.path.join(ANNOTATIONS_FOLDER, f"{base_filename}.txt")
            if os.path.exists(src_ann):
                dst_ann = os.path.join(DATASET_FOLDER, split, 'labels', f"{base_filename}.txt")
                shutil.copy2(src_ann, dst_ann)
    
    return create_config_files(classes)

def create_config_files(classes):
    """Crée les fichiers de configuration YOLO"""
    # Créer le fichier data.yaml
    data_yaml = {
        'path': os.path.abspath(DATASET_FOLDER),
        'train': os.path.join('train', 'images'),
        'val': os.path.join('val', 'images'),
        'test': os.path.join('test', 'images'),
        'nc': len(classes),
        'names': list(classes)
    }
    
    yaml_path = os.path.join(YOLO_CONFIG, 'data.yaml')
    with open(yaml_path, 'w') as f:
        yaml.dump(data_yaml, f)
    
    # Créer le fichier hyp.yaml avec des paramètres optimisés
    hyp_yaml = {
        'lr0': 0.01,
        'lrf': 0.1,
        'momentum': 0.937,
        'weight_decay': 0.0005,
        'warmup_epochs': 3.0,
        'warmup_momentum': 0.8,
        'warmup_bias_lr': 0.1,
        'box': 0.05,
        'cls': 0.3,
        'cls_pw': 1.0,
        'obj': 0.7,
        'obj_pw': 1.0,
        'iou_t': 0.2,
        'anchor_t': 4.0,
        'fl_gamma': 0.0,
        'hsv_h': 0.015,
        'hsv_s': 0.7,
        'hsv_v': 0.4,
        'degrees': 0.0,
        'translate': 0.1,
        'scale': 0.9,
        'shear': 0.0,
        'perspective': 0.0,
        'flipud': 0.0,
        'fliplr': 0.5,
        'mosaic': 1.0,
        'mixup': 0.1,
        'copy_paste': 0.1
    }
    
    hyp_path = os.path.join(YOLO_CONFIG, 'hyp.yaml')
    with open(hyp_path, 'w') as f:
        yaml.dump(hyp_yaml, f)
    
    return yaml_path, hyp_path