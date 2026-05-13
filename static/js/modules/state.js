// État global de l'application
export const state = {
    currentImage: null,
    currentImageElement: null,
    classes: new Set(),
    annotations: {},
    isDrawing: false,
    startX: 0,
    startY: 0,
    currentClass: '',
    trainingEventSource: null,
    smartSelectMode: false,
    selectedColony: null,
    adjustingRadius: false
};

// Canvas contexts
export const canvas = document.getElementById('annotationCanvas');
export const ctx = canvas.getContext('2d');
export const predictionCanvas = document.getElementById('predictionCanvas');
export const predCtx = predictionCanvas.getContext('2d');
