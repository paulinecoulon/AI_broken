import { state, canvas } from './state.js';
import { loadImageAnnotations } from './annotations.js';

export async function uploadImages() {
    const input = document.getElementById('imageUpload');
    const files = input.files;
    
    if (files.length === 0) {
        alert('Veuillez sélectionner au moins une image');
        return;
    }

    for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Erreur lors de l\'upload');
            }
        } catch (error) {
            console.error('Erreur lors de l\'upload:', error);
            alert(`Erreur lors de l'upload de ${file.name}`);
        }
    }

    refreshImageGallery();
    input.value = '';
}

export async function refreshImageGallery() {
    try {
        const response = await fetch('/images');
        const data = await response.json();
        
        const gallery = document.getElementById('imageGallery');
        gallery.innerHTML = '';
        
        data.images.forEach(filename => {
            const img = document.createElement('img');
            img.src = `/uploads/${filename}`;
            img.alt = filename;
            img.onclick = () => selectImage(filename);
            if (filename === state.currentImage) {
                img.classList.add('selected');
            }
            gallery.appendChild(img);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des images:', error);
    }
}

export async function selectImage(filename) {
    state.currentImage = filename;
    
    // Charger l'image dans le canvas
    state.currentImageElement = new Image();
    state.currentImageElement.onload = function() {
        // Ajuster la taille du canvas à l'image
        canvas.width = this.width;
        canvas.height = this.height;
        
        // Charger les annotations existantes
        loadImageAnnotations(filename);
    };
    state.currentImageElement.src = `/uploads/${filename}`;
    
    // Mettre à jour la sélection dans la galerie
    document.querySelectorAll('#imageGallery img').forEach(img => {
        img.classList.toggle('selected', img.alt === filename);
    });
}