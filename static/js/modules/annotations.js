import { state } from './state.js';
import { redrawCanvas } from './canvas.js';

export function updateAnnotationList() {
    const list = document.getElementById('annotationList');
    list.innerHTML = '';
    
    if (state.currentImage && state.annotations[state.currentImage]) {
        state.annotations[state.currentImage].forEach((annotation, index) => {
            const li = document.createElement('li');
            const annotationType = annotation.type === 'circle' ? '●' : '■';
            li.textContent = `${annotationType} ${index + 1}: ${annotation.class}`;
            
            const deleteButton = document.createElement('button');
            deleteButton.textContent = '×';
            deleteButton.onclick = () => deleteAnnotation(index);
            
            li.appendChild(deleteButton);
            list.appendChild(li);
        });
        
        // Mettre à jour le compteur
        document.getElementById('annotationCount').textContent = state.annotations[state.currentImage].length;
    }
}

export function deleteAnnotation(index) {
    if (state.currentImage && state.annotations[state.currentImage]) {
        state.annotations[state.currentImage].splice(index, 1);
        updateAnnotationList();
        redrawCanvas();
    }
}

export async function saveAnnotations() {
    if (!state.currentImage) return;
    
    try {
        const response = await fetch('/annotate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filename: state.currentImage,
                annotations: state.annotations[state.currentImage]
            })
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de la sauvegarde');
        }
        
        alert('Annotations sauvegardées avec succès');
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des annotations:', error);
        alert('Erreur lors de la sauvegarde des annotations');
    }
}

export async function loadImageAnnotations(filename) {
    try {
        const response = await fetch(`/annotations/${filename}`);
        if (response.ok) {
            const data = await response.json();
            state.annotations[filename] = data.annotations;
        } else {
            state.annotations[filename] = [];
        }
        updateAnnotationList();
        redrawCanvas();
    } catch (error) {
        console.error('Erreur lors du chargement des annotations:', error);
        state.annotations[filename] = [];
        updateAnnotationList();
        redrawCanvas();
    }
}
