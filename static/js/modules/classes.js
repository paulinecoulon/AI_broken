import { state } from './state.js';
import { updateAnnotationList } from './annotations.js';
import { redrawCanvas } from './canvas.js';

export async function loadClasses() {
    try {
        const response = await fetch('/classes');
        const data = await response.json();
        state.classes = new Set(data.classes);
        updateClassSelect();
    } catch (error) {
        console.error('Erreur lors du chargement des classes:', error);
    }
}

export async function saveClasses() {
    try {
        await fetch('/classes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                classes: Array.from(state.classes)
            })
        });
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des classes:', error);
    }
}

export function addClass() {
    const newClassInput = document.getElementById('newClass');
    const className = newClassInput.value.trim();
    
    if (className) {
        state.classes.add(className);
        updateClassSelect();
        newClassInput.value = '';
        
        // Sauvegarder les classes
        saveClasses();
    }
}

export function deleteClass() {
    const select = document.getElementById('classSelect');
    const selectedClass = select.value;
    
    if (selectedClass && confirm(`Voulez-vous vraiment supprimer la classe "${selectedClass}" ?`)) {
        state.classes.delete(selectedClass);
        updateClassSelect();
        saveClasses();
        
        // Supprimer les annotations de cette classe
        Object.keys(state.annotations).forEach(image => {
            state.annotations[image] = state.annotations[image].filter(ann => ann.class !== selectedClass);
        });
        
        // Mettre à jour l'affichage
        updateAnnotationList();
        redrawCanvas();
    }
}

export function updateClassSelect() {
    const select = document.getElementById('classSelect');
    select.innerHTML = '';
    
    Array.from(state.classes).sort().forEach(className => {
        const option = document.createElement('option');
        option.value = className;
        option.textContent = className;
        select.appendChild(option);
    });
}