import { state } from './state.js';

// Gestionnaire d'observation pour le défilement automatique
let scrollObserver = null;

function initScrollObserver(logsDiv) {
    // Créer un élément sentinelle pour l'observation
    const sentinel = document.createElement('div');
    sentinel.className = 'scroll-sentinel';
    logsDiv.appendChild(sentinel);

    // Configurer l'observateur
    scrollObserver = new IntersectionObserver((entries) => {
        if (autoScrollEnabled && entries[0].intersectionRatio < 1) {
            smoothScrollToBottom(logsDiv);
        }
    }, {
        root: logsDiv,
        threshold: 1.0
    });

    scrollObserver.observe(sentinel);
}

function smoothScrollToBottom(logsDiv) {
    const targetScrollTop = logsDiv.scrollHeight - logsDiv.clientHeight;
    if (Math.abs(logsDiv.scrollTop - targetScrollTop) > 1) {
        logsDiv.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth'
        });
    }
}

async function initTrainingParams() {
    try {
        const response = await fetch('/dataset/info');
        const data = await response.json();
        const batchSizeInput = document.getElementById('batchSize');
        batchSizeInput.value = Math.min(data.annotated_images, 16); // Maximum de 16 par défaut
    } catch (error) {
        console.error('Erreur lors de la récupération des informations du dataset:', error);
    }
}

function updateMetrics(epoch, totalEpochs, metrics) {
    const metricsDiv = document.getElementById('currentMetrics');
    metricsDiv.innerHTML = `
        <div class="metrics-grid">
            <div class="metric-item">
                <div class="metric-label">Progression</div>
                <div class="metric-value">${epoch + 1}/${totalEpochs}</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Perte</div>
                <div class="metric-value">${metrics.loss?.toFixed(4) || 'N/A'}</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">mAP@0.5</div>
                <div class="metric-value">${metrics.mAP_0_5?.toFixed(2) || 'N/A'}</div>
            </div>
        </div>
    `;
}

// État du défilement automatique
let autoScrollEnabled = true;

// Initialiser les paramètres au chargement
document.addEventListener('DOMContentLoaded', initTrainingParams);

export async function trainModel() {
    const trainButton = document.getElementById('trainButton');
    const statusDiv = document.getElementById('trainingStatus');
    const logsDiv = document.getElementById('trainingLogs');
    const autoScrollToggle = document.getElementById('autoScrollToggle');
    
    // Initialiser l'observateur de défilement
    initScrollObserver(logsDiv);
    
    // Configuration du bouton de défilement automatique
    autoScrollToggle.addEventListener('click', () => {
        autoScrollEnabled = !autoScrollEnabled;
        autoScrollToggle.classList.toggle('active');
        if (autoScrollEnabled) {
            smoothScrollToBottom(logsDiv);
        }
    });
    
    const epochs = document.getElementById('epochs').value;
    const batchSize = document.getElementById('batchSize').value;
    const imgSize = document.getElementById('imgSize').value;
    
    trainButton.disabled = true;
    statusDiv.style.display = 'block';
    logsDiv.textContent = '';
    
    try {
        const response = await fetch('/train', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                epochs,
                batchSize,
                imgSize
            })
        });
        
        if (!response.ok) {
            throw new Error(await response.text());
        }
        
        if (state.trainingEventSource) {
            state.trainingEventSource.close();
        }
        
        state.trainingEventSource = new EventSource('/train/logs');
        state.trainingEventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
                case 'progress':
                    updateMetrics(data.epoch, epochs, data.metrics);
                    break;
                    
                case 'log':
                    const logLine = document.createElement('div');
                    logLine.className = 'log-line';
                    logLine.textContent = data.message;
                    logsDiv.appendChild(logLine);
                    break;
                    
                case 'summary':
                    const summaryDiv = document.createElement('div');
                    summaryDiv.className = 'training-summary';
                    summaryDiv.innerHTML = `
                        <h3>Résumé de l'entraînement</h3>
                        <div class="summary-section">
                            <h4>Meilleures métriques</h4>
                            <div class="metrics-grid">
                                <div class="metric-item">
                                    <div class="metric-label">mAP@0.5</div>
                                    <div class="metric-value">${data.best_metrics.mAP_0_5?.toFixed(2) || 'N/A'}</div>
                                </div>
                                <div class="metric-item">
                                    <div class="metric-label">Perte min.</div>
                                    <div class="metric-value">${data.best_metrics.loss?.toFixed(4) || 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                    `;
                    logsDiv.appendChild(summaryDiv);
                    break;
                    
                case 'complete':
                    state.trainingEventSource.close();
                    trainButton.disabled = false;
                    if (scrollObserver) {
                        scrollObserver.disconnect();
                    }
                    break;
            }
        };
        
        state.trainingEventSource.onerror = () => {
            state.trainingEventSource.close();
            trainButton.disabled = false;
            if (scrollObserver) {
                scrollObserver.disconnect();
            }
            alert('Erreur lors de l\'entraînement');
        };
        
    } catch (error) {
        console.error('Erreur lors de l\'entraînement:', error);
        trainButton.disabled = false;
        if (scrollObserver) {
            scrollObserver.disconnect();
        }
        alert('Erreur lors de l\'entraînement: ' + error.message);
    }
}