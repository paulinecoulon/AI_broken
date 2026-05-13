import os

# Configuration
UPLOAD_FOLDER = 'uploads'
ANNOTATIONS_FOLDER = 'annotations'
MODEL_FOLDER = 'model'
CLASSES_FILE = 'classes.json'
YOLO_CONFIG = 'yolo_config'
DATASET_FOLDER = 'dataset'
FONT_DIR = os.path.expanduser('~/Library/Application Support/Ultralytics')

# Créer les dossiers nécessaires
for folder in [UPLOAD_FOLDER, ANNOTATIONS_FOLDER, MODEL_FOLDER, YOLO_CONFIG, DATASET_FOLDER, FONT_DIR]:
    os.makedirs(folder, exist_ok=True)
    if folder == DATASET_FOLDER:
        for split in ['train', 'val', 'test']:
            os.makedirs(os.path.join(DATASET_FOLDER, split, 'images'), exist_ok=True)
            os.makedirs(os.path.join(DATASET_FOLDER, split, 'labels'), exist_ok=True)