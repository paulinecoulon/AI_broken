import os
import subprocess
import threading
import queue
import ssl
import urllib.request
from utils import parse_training_metrics

# Queue pour les logs d'entraînement
training_logs = queue.Queue()

def process_training_output(process, total_epochs):
    """Traite la sortie du processus d'entraînement en temps réel"""
    best_metrics = {
        'mAP_0_5': 0,
        'precision': 0,
        'recall': 0,
        'loss': float('inf')
    }
    final_metrics = None
    
    while True:
        line = process.stdout.readline()
        if not line and process.poll() is not None:
            break
        if line:
            line = line.strip()
            training_logs.put({
                'type': 'log',
                'message': line
            })
            
            # Parser les métriques si c'est une ligne de progression
            if 'epoch' in line and '/' in line:
                metrics = parse_training_metrics(line)
                if metrics and 'epoch' in metrics:
                    # Mettre à jour les meilleures métriques
                    if metrics.get('mAP_0_5', 0) > best_metrics['mAP_0_5']:
                        best_metrics['mAP_0_5'] = metrics['mAP_0_5']
                    if metrics.get('precision', 0) > best_metrics['precision']:
                        best_metrics['precision'] = metrics['precision']
                    if metrics.get('recall', 0) > best_metrics['recall']:
                        best_metrics['recall'] = metrics['recall']
                    if metrics.get('loss', float('inf')) < best_metrics['loss']:
                        best_metrics['loss'] = metrics['loss']
                    
                    # Sauvegarder les métriques finales
                    if metrics['epoch'] == total_epochs:
                        final_metrics = metrics.copy()
                    
                    training_logs.put({
                        'type': 'progress',
                        'epoch': metrics['epoch'],
                        'total_epochs': total_epochs,
                        'metrics': metrics
                    })
    
    # Envoyer le résumé de l'entraînement
    training_logs.put({
        'type': 'summary',
        'best_metrics': best_metrics,
        'final_metrics': final_metrics or {}
    })
    
    # Signaler la fin de l'entraînement
    training_logs.put({
        'type': 'complete'
    })
    
    process.stdout.close()

def download_weights():
    """Télécharge les poids pré-entraînés si nécessaire"""
    weights_path = 'yolov5s.pt'
    if not os.path.exists(weights_path):
        print("Téléchargement des poids pré-entraînés...")
        url = "https://github.com/ultralytics/yolov5/releases/download/v7.0/yolov5s.pt"
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        with urllib.request.urlopen(url, context=ctx) as response, open(weights_path, 'wb') as out_file:
            out_file.write(response.read())
    return weights_path

def setup_yolov5():
    """Configure l'environnement YOLOv5"""
    if not os.path.exists('yolov5'):
        subprocess.run(['git', 'clone', 'https://github.com/ultralytics/yolov5.git'], check=True)
        subprocess.run(['pip', 'install', '-r', 'yolov5/requirements.txt'], check=True)

def start_training(yaml_path, hyp_path, epochs=300, batch_size=16, img_size=1280):
    """Démarre l'entraînement du modèle"""
    # Vider la queue des logs
    while not training_logs.empty():
        training_logs.get_nowait()
    
    # Configuration de l'environnement
    setup_yolov5()
    weights_path = download_weights()
    
    # Construire la commande d'entraînement
    cmd = [
        'python', 'yolov5/train.py',
        '--img', str(img_size),
        '--batch', str(batch_size),
        '--epochs', str(epochs),
        '--data', yaml_path,
        '--hyp', hyp_path,
        '--weights', weights_path,
        '--project', 'model',
        '--cache',
        '--exist-ok',
        '--workers', '8',
        '--label-smoothing', '0.1',
        '--multi-scale',
        '--optimizer', 'AdamW'
    ]
    
    # Exécuter l'entraînement avec redirection des sorties
    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True,
        bufsize=1
    )
    
    # Démarrer un thread pour traiter la sortie
    thread = threading.Thread(target=process_training_output, args=(process, epochs))
    thread.daemon = True
    thread.start()
    
    return process