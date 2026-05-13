#!/bin/bash

echo "Configuration de l'environnement Vision Annotator..."

# Création de l'environnement virtuel
python3 -m venv venv
source venv/bin/activate

# Installation des dépendances
pip install --upgrade pip
pip install -r requirements.txt

# Création des dossiers nécessaires avec les bonnes permissions
mkdir -p uploads annotations model yolo_config dataset
mkdir -p dataset/train/images dataset/train/labels
mkdir -p dataset/val/images dataset/val/labels
mkdir -p dataset/test/images dataset/test/labels

# Attribution des permissions
chmod -R 755 uploads annotations model yolo_config dataset
chmod -R 755 static templates

# Clone de YOLOv5
if [ ! -d "yolov5" ]; then
    git clone https://github.com/ultralytics/yolov5.git
    cd yolov5
    pip install -r requirements.txt
    cd ..
fi

echo "Configuration terminée. Pour lancer l'application :"
echo "1. source venv/bin/activate"
echo "2. python app.py"