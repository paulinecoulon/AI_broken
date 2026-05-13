import { state, canvas, ctx } from './state.js';
import { updateAnnotationList } from './annotations.js';
import { detectColonyBoundary } from './smartSelect.js';

// Obtenir les coordonnées relatives au canvas
function getCanvasCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

// Dessiner un cercle sur le canvas
function drawCircle(centerX, centerY, radius, strokeColor = '#00ff00', fillColor = null, lineWidth = 2) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
    
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
}

// Calculer la distance entre deux points
function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// Mode dessin manuel (cercles)
export function startDrawing(e) {
    if (state.smartSelectMode) return; // Smart select a son propre handler
    
    const coords = getCanvasCoordinates(e);
    state.startX = coords.x;
    state.startY = coords.y;
    state.isDrawing = true;
}

export function drawing(e) {
    if (!state.isDrawing || state.smartSelectMode) return;
    
    const coords = getCanvasCoordinates(e);
    const radius = distance(state.startX, state.startY, coords.x, coords.y);
    
    // Redessiner le canvas avec le cercle en cours
    redrawCanvas();
    
    // Dessiner le cercle en cours (prévisualisation)
    drawCircle(state.startX, state.startY, radius, '#00ff00', 'rgba(0, 255, 0, 0.1)', 2);
}

export function endDrawing(e) {
    if (!state.isDrawing || state.smartSelectMode) return;
    
    const coords = getCanvasCoordinates(e);
    const radius = distance(state.startX, state.startY, coords.x, coords.y);
    
    // Ne pas créer d'annotation si le rayon est trop petit
    if (radius < 5) {
        state.isDrawing = false;
        return;
    }
    
    // Convertir en coordonnées normalisées YOLO
    const circle = calculateYoloCircle(state.startX, state.startY, radius);
    
    // Ajouter l'annotation si une classe est sélectionnée
    const selectedClass = document.getElementById('classSelect').value;
    if (selectedClass && state.currentImage) {
        if (!state.annotations[state.currentImage]) {
            state.annotations[state.currentImage] = [];
        }
        
        state.annotations[state.currentImage].push({
            class: selectedClass,
            coordinates: circle,
            type: 'circle'
        });
        
        updateAnnotationList();
        redrawCanvas();
    }
    
    state.isDrawing = false;
}

// Smart Select Mode
export function handleSmartSelectClick(e) {
    if (!state.smartSelectMode) return;
    
    const coords = getCanvasCoordinates(e);
    const selectedClass = document.getElementById('classSelect').value;
    
    if (!selectedClass) {
        alert('Veuillez sélectionner une classe avant d\'utiliser la détection intelligente');
        return;
    }
    
    if (!state.currentImageElement) {
        alert('Aucune image chargée');
        return;
    }
    
    // Détecter la colonie
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const colony = detectColonyBoundary(imageData, coords.x, coords.y, canvas.width, canvas.height);
    
    if (colony) {
        // Entrer en mode d'ajustement
        state.selectedColony = colony;
        state.adjustingRadius = true;
        redrawCanvas();
    } else {
        alert('Impossible de détecter une colonie à cet endroit. Essayez un autre point.');
    }
}

// Ajuster le rayon lors de la détection intelligente
export function adjustColonyRadius(e) {
    if (!state.adjustingRadius || !state.selectedColony) return;
    
    const coords = getCanvasCoordinates(e);
    const newRadius = distance(state.selectedColony.centerX, state.selectedColony.centerY, coords.x, coords.y);
    
    state.selectedColony.radius = newRadius;
    redrawCanvas();
}

// Confirmer et sauvegarder la colonie sélectionnée
export function confirmColonySelection() {
    if (!state.selectedColony || !state.currentImage) return;
    
    const selectedClass = document.getElementById('classSelect').value;
    if (!selectedClass) return;
    
    // Convertir en coordonnées normalisées
    const circle = calculateYoloCircle(
        state.selectedColony.centerX,
        state.selectedColony.centerY,
        state.selectedColony.radius
    );
    
    if (!state.annotations[state.currentImage]) {
        state.annotations[state.currentImage] = [];
    }
    
    state.annotations[state.currentImage].push({
        class: selectedClass,
        coordinates: circle,
        type: 'circle'
    });
    
    // Réinitialiser
    state.selectedColony = null;
    state.adjustingRadius = false;
    
    updateAnnotationList();
    redrawCanvas();
}

// Annuler la sélection en cours
export function cancelColonySelection() {
    state.selectedColony = null;
    state.adjustingRadius = false;
    redrawCanvas();
}

// Conversion en coordonnées YOLO (cercle)
function calculateYoloCircle(centerX, centerY, radius) {
    const imageWidth = canvas.width;
    const imageHeight = canvas.height;
    
    const normalizedCenterX = centerX / imageWidth;
    const normalizedCenterY = centerY / imageHeight;
    const normalizedRadius = radius / Math.max(imageWidth, imageHeight);
    
    return [normalizedCenterX, normalizedCenterY, normalizedRadius];
}

// Redessiner le canvas
export function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dessiner l'image
    if (state.currentImageElement) {
        ctx.drawImage(state.currentImageElement, 0, 0, canvas.width, canvas.height);
    }
    
    // Dessiner les annotations existantes
    if (state.currentImage && state.annotations[state.currentImage]) {
        state.annotations[state.currentImage].forEach((annotation, index) => {
            const [centerX, centerY, radius] = annotation.coordinates;
            
            // Convertir les coordonnées normalisées en pixels
            const pixelCenterX = centerX * canvas.width;
            const pixelCenterY = centerY * canvas.height;
            const pixelRadius = radius * Math.max(canvas.width, canvas.height);
            
            // Utiliser une couleur différente pour chaque classe
            const hue = Array.from(state.classes).indexOf(annotation.class) * (360 / state.classes.size);
            const strokeColor = `hsl(${hue}, 100%, 40%)`;
            const fillColor = `hsl(${hue}, 100%, 40%, 0.2)`;
            
            // Dessiner le cercle
            drawCircle(pixelCenterX, pixelCenterY, pixelRadius, strokeColor, fillColor, 2);
            
            // Afficher la classe et l'index
            ctx.font = 'bold 12px Arial';
            const label = `${index + 1}: ${annotation.class}`;
            const textWidth = ctx.measureText(label).width;
            
            // Fond pour le texte
            ctx.fillStyle = `hsl(${hue}, 100%, 40%)`;
            ctx.fillRect(pixelCenterX - textWidth / 2 - 4, pixelCenterY - pixelRadius - 20, textWidth + 8, 18);
            
            // Texte
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(label, pixelCenterX, pixelCenterY - pixelRadius - 6);
            ctx.textAlign = 'left';
        });
        
        document.getElementById('annotationCount').textContent = state.annotations[state.currentImage].length;
    }
    
    // Dessiner la colonie en cours d'ajustement (smart select)
    if (state.adjustingRadius && state.selectedColony) {
        const hue = Array.from(state.classes).indexOf(document.getElementById('classSelect').value) * (360 / state.classes.size);
        drawCircle(
            state.selectedColony.centerX,
            state.selectedColony.centerY,
            state.selectedColony.radius,
            `hsl(${hue}, 100%, 60%)`,
            `hsl(${hue}, 100%, 60%, 0.3)`,
            3
        );
        
        // Afficher les boutons de confirmation
        showConfirmationUI();
    }
}

// Afficher l'UI de confirmation
function showConfirmationUI() {
    let confirmUI = document.getElementById('confirmationUI');
    if (!confirmUI) {
        confirmUI = document.createElement('div');
        confirmUI.id = 'confirmationUI';
        confirmUI.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            padding: 10px 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            display: flex;
            gap: 10px;
            z-index: 1000;
        `;
        
        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = '✓ Confirmer';
        confirmBtn.style.cssText = `
            background: #27ae60;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
        `;
        confirmBtn.onclick = confirmColonySelection;
        
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '✕ Annuler';
        cancelBtn.style.cssText = `
            background: #e74c3c;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
        `;
        cancelBtn.onclick = cancelColonySelection;
        
        confirmUI.appendChild(confirmBtn);
        confirmUI.appendChild(cancelBtn);
        
        const container = document.querySelector('.image-container');
        container.style.position = 'relative';
        container.appendChild(confirmUI);
    }
}

// Configuration des événements du canvas
export function setupCanvasListeners() {
    canvas.addEventListener('mousedown', (e) => {
        if (state.smartSelectMode) {
            handleSmartSelectClick(e);
        } else {
            startDrawing(e);
        }
    });
    
    canvas.addEventListener('mousemove', (e) => {
        if (state.adjustingRadius) {
            adjustColonyRadius(e);
        } else if (!state.smartSelectMode) {
            drawing(e);
        }
    });
    
    canvas.addEventListener('mouseup', (e) => {
        if (!state.adjustingRadius) {
            endDrawing(e);
        }
    });
    
    canvas.addEventListener('mouseleave', (e) => {
        if (!state.adjustingRadius) {
            endDrawing(e);
        }
    });
}
