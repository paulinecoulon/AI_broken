from flask import Flask, request, jsonify, render_template, send_from_directory, Response, stream_with_context
from datetime import datetime
import os
import time
import queue
import json

from config import UPLOAD_FOLDER
from utils import load_classes, save_classes
from models import save_annotation, load_annotations, predict_image, get_model_versions
from dataset import prepare_yolo_dataset
from training import training_logs, start_training

app = Flask(__name__, static_folder='static', static_url_path='/static')

# Charger les classes au démarrage
classes = load_classes()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file:
        filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        return jsonify({'filename': filename, 'message': 'File uploaded successfully'})

@app.route('/images')
def list_images():
    files = os.listdir(UPLOAD_FOLDER)
    images = [f for f in files if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif'))]
    return jsonify({'images': images})

@app.route('/classes', methods=['GET', 'POST'])
def handle_classes():
    global classes
    if request.method == 'GET':
        return jsonify({'classes': list(classes)})
    else:
        data = request.json
        classes = set(data.get('classes', []))
        save_classes(classes)
        return jsonify({'message': 'Classes updated successfully'})

@app.route('/annotations/<filename>', methods=['GET'])
def get_annotations(filename):
    annotations = load_annotations(filename, classes)
    return jsonify({'annotations': annotations})

@app.route('/annotate', methods=['POST'])
def annotate_image():
    data = request.json
    filename = data.get('filename')
    annotations = data.get('annotations', [])
    
    if not filename:
        return jsonify({'error': 'Missing filename'}), 400
    
    save_annotation(filename, annotations, classes)
    return jsonify({'message': 'Annotation saved successfully'})

@app.route('/train/logs')
def stream_logs():
    def generate():
        while True:
            try:
                log_data = training_logs.get_nowait()
                yield f"data: {json.dumps(log_data)}\n\n"
            except queue.Empty:
                time.sleep(0.1)
    
    return Response(stream_with_context(generate()), mimetype='text/event-stream')

@app.route('/dataset/info', methods=['GET'])
def get_dataset_info():
    """Retourne les informations sur le dataset"""
    image_files = [f for f in os.listdir(UPLOAD_FOLDER) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    annotated_count = 0
    for img_file in image_files:
        base_name = os.path.splitext(img_file)[0]
        ann_file = os.path.join(ANNOTATIONS_FOLDER, f"{base_name}.txt")
        if os.path.exists(ann_file):
            with open(ann_file, 'r') as f:
                if f.readlines():  # Vérifier que le fichier n'est pas vide
                    annotated_count += 1
    return jsonify({'annotated_images': annotated_count})

@app.route('/train', methods=['POST'])
def train_model():
    data = request.json
    epochs = data.get('epochs', 300)
    batch_size = data.get('batchSize', 16)
    img_size = data.get('imgSize', 1280)
    
    try:
        # Préparer le dataset
        yaml_path, hyp_path = prepare_yolo_dataset(classes)
        
        # Démarrer l'entraînement
        start_training(yaml_path, hyp_path, epochs, batch_size, img_size)
        
        return jsonify({'message': 'Training started successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/model/versions', methods=['GET'])
def list_model_versions():
    """Liste toutes les versions disponibles du modèle"""
    try:
        versions = get_model_versions()
        return jsonify({'versions': versions})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    try:
        # Récupérer la version spécifiée dans la requête
        version = request.form.get('version', None)
        predictions = predict_image(file, classes, version)
        return jsonify({'predictions': predictions})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

def start_server():
    debug = os.environ.get('FLASK_ENV') != 'production'
    app.run(host='0.0.0.0', debug=debug, port=5001)