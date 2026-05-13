import { state } from './state.js';
import { redrawCanvas } from './canvas.js';

export function setupSmartSelectUI() {
    const manualBtn = document.getElementById('manualDrawButton');
    const smartBtn = document.getElementById('smartSelectToggle');
    const modeDesc = document.getElementById('modeDescription');
    
    if (!manualBtn || !smartBtn) return;
    
    manualBtn.addEventListener('click', () => {
        state.smartSelectMode = false;
        state.selectedColony = null;
        state.adjustingRadius = false;
        
        manualBtn.classList.add('active');
        smartBtn.classList.remove('active');
        modeDesc.textContent = '✋ Dessin Manuel: Cliquez et déplacez pour tracer des cercles autour des colonies.';
        
        // Retirer l'UI de confirmation s'il existe
        const confirmUI = document.getElementById('confirmationUI');
        if (confirmUI) confirmUI.remove();
        
        redrawCanvas();
    });
    
    smartBtn.addEventListener('click', () => {
        const selectedClass = document.getElementById('classSelect').value;
        if (!selectedClass) {
            alert('Veuillez d\'abord sélectionner une classe pour utiliser la détection intelligente.');
            return;
        }
        
        state.smartSelectMode = true;
        state.selectedColony = null;
        state.adjustingRadius = false;
        
        manualBtn.classList.remove('active');
        smartBtn.classList.add('active');
        modeDesc.textContent = '🎯 Détection Intelligente: Cliquez sur une colonie. Le système détectera automatiquement ses limites. Vous pourrez ensuite ajuster le rayon en déplaçant la souris.';
        
        // Retirer l'UI de confirmation s'il existe
        const confirmUI = document.getElementById('confirmationUI');
        if (confirmUI) confirmUI.remove();
        
        redrawCanvas();
    });
}
