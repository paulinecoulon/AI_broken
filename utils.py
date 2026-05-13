import re
import json
import os
from config import CLASSES_FILE

def parse_training_metrics(line):
    """Parse les métriques depuis une ligne de log d'entraînement"""
    metrics = {}
    
    # Extraire l'époque
    epoch_match = re.search(r'epoch (\d+)/', line)
    if epoch_match:
        metrics['epoch'] = int(epoch_match.group(1))
    
    # Extraire les métriques
    metrics_match = re.findall(r'(\w+)=([\d.]+)', line)
    for name, value in metrics_match:
        try:
            metrics[name] = float(value)
        except ValueError:
            continue
    
    return metrics

def load_classes():
    """Charge ou crée le fichier des classes"""
    if os.path.exists(CLASSES_FILE):
        with open(CLASSES_FILE, 'r') as f:
            return set(json.load(f))
    else:
        classes = set()
        with open(CLASSES_FILE, 'w') as f:
            json.dump(list(classes), f)
        return classes

def save_classes(classes):
    """Sauvegarde les classes dans le fichier"""
    with open(CLASSES_FILE, 'w') as f:
        json.dump(list(classes), f)