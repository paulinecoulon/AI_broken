import { state, predictionCanvas, predCtx } from './state.js';

// Charger les versions disponibles du modèle
export async function loadModelVersions() {
    try {
        const response = await fetch('/model/versions');
        const data = await response.json();
        
        const select = document.getElementById('modelVersion');
        // Garder l'option "Dernière version"
        select.innerHTML = '<option value="">Dernière version</option>';
        
        // Ajouter les versions disponibles
        data.versions.forEach(version => {
            const option = document.createElement('option');
            option.value = version.version;
            option.textContent = `${version.version} (${version.date})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des versions:', error);
    }
}

export async function predict() {
    const input = document.getElementById('predictionUpload');
    const resultDiv = document.getElementById('predictionResult');
    
    if (!input.files || input.files.length === 0) {
        alert('Veuillez sélectionner une image');
        return;
    }

    const file = input.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    // Ajouter la version sélectionnée si elle existe
    const versionSelect = document.getElementById('modelVersion');
    if (versionSelect.value) {
        formData.append('version', versionSelect.value);
    }

    try {
        resultDiv.textContent = 'Prédiction en cours...';
        
        const response = await fetch('/predict', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors de la prédiction');
        }

        // Afficher l'image avec les prédictions
        const img = new Image();
        img.onload = function() {
            predictionCanvas.width = this.width;
            predictionCanvas.height = this.height;
            predCtx.drawImage(this, 0, 0);
            
            // Dessiner les boîtes de prédiction
            data.predictions.forEach((pred, index) => {
                const [x, y, w, h] = pred.box;
                const confidence = pred.confidence;
                
                // Utiliser une couleur différente pour chaque classe
                const hue = Array.from(state.classes).indexOf(pred.class) * (360 / state.classes.size);
                predCtx.strokeStyle = `hsl(${hue}, 100%, 40%)`;
                predCtx.fillStyle = `hsl(${hue}, 100%, 40%, 0.8)`;
                
                // Dessiner la boîte
                predCtx.lineWidth = 2;
                predCtx.strokeRect(
                    x * predictionCanvas.width,
                    y * predictionCanvas.height,
                    w * predictionCanvas.width,
                    h * predictionCanvas.height
                );
                
                // Afficher la classe et la confiance
                const label = `${index + 1}: ${pred.class} (${(confidence * 100).toFixed(1)}%)`;
                predCtx.font = '12px Arial';
                const textWidth = predCtx.measureText(label).width;
                
                // Fond pour le texte
                predCtx.fillRect(
                    x * predictionCanvas.width,
                    y * predictionCanvas.height - 20,
                    textWidth + 6,
                    16
                );
                
                // Texte
                predCtx.fillStyle = 'white';
                predCtx.fillText(
                    label,
                    x * predictionCanvas.width + 3,
                    y * predictionCanvas.height - 8
                );
            });
        };
        // Utiliser le fichier d'origine plutôt que de créer une URL
        const reader = new FileReader();
        reader.onload = function(e) {
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
        
        // Afficher les résultats
        resultDiv.innerHTML = `
            <div>Détection terminée: ${data.predictions.length} objets trouvés</div>
            ${data.predictions.map((p, i) => 
                `<div>${i + 1}: ${p.class} (${(p.confidence * 100).toFixed(1)}%)</div>`
            ).join('')}
        `;
    } catch (error) {
        console.error('Erreur lors de la prédiction:', error);
        resultDiv.textContent = 'Erreur lors de la prédiction: ' + error.message;
    }
    
    input.value = '';
}