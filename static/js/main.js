import { setupCanvasListeners } from './modules/canvas.js';
import { setupSmartSelectUI } from './modules/smartSelectUI.js';
import { loadClasses, addClass, deleteClass } from './modules/classes.js';
import { refreshImageGallery, uploadImages } from './modules/images.js';
import { saveAnnotations } from './modules/annotations.js';
import { trainModel } from './modules/training.js';
import { predict, loadModelVersions } from './modules/prediction.js';

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    // Charger les données initiales
    refreshImageGallery();
    setupCanvasListeners();
    setupSmartSelectUI();
    loadClasses();
    loadModelVersions();

    // Event listeners pour les boutons
    document.getElementById('uploadButton').addEventListener('click', uploadImages);
    document.getElementById('addClassButton').addEventListener('click', addClass);
    document.getElementById('deleteClassButton').addEventListener('click', deleteClass);
    document.getElementById('saveAnnotationsButton').addEventListener('click', saveAnnotations);
    document.getElementById('trainButton').addEventListener('click', trainModel);
    document.getElementById('predictButton').addEventListener('click', predict);

    // Event listeners pour les inputs de fichiers
    document.getElementById('imageUpload').addEventListener('change', () => {
        const uploadButton = document.getElementById('uploadButton');
        uploadButton.click();
    });

    document.getElementById('predictionUpload').addEventListener('change', () => {
        const predictButton = document.getElementById('predictButton');
        predictButton.click();
    });
});