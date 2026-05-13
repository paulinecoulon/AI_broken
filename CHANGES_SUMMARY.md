# Changements pour Annotations en Cercles + Détection Intelligente

## Fichiers Modifiés

### 1. **canvas.js**
**Changements majeurs:**
- Remplacement du système de rectangles par des cercles
- Nouvelle fonction `drawCircle()` pour tracer les cercles
- Fonction `startDrawing()` modifiée pour tracer des cercles
- Ajout de `handleSmartSelectClick()` pour la détection intelligente
- Ajout de `adjustColonyRadius()` pour ajuster le rayon lors de la sélection intelligente
- Ajout de `confirmColonySelection()` pour valider une sélection
- Conversion YOLO mise à jour pour les cercles: `[centerX, centerY, radius]`
- Redessinage du canvas adapté pour les cercles

### 2. **state.js**
**Ajouts:**
- `smartSelectMode: false` - Bascule entre mode manuel et intelligent
- `selectedColony: null` - Stocke la colonie sélectionnée lors du mode intelligent
- `adjustingRadius: false` - Indique si on est en train d'ajuster le rayon

### 3. **annotations.js**
**Changements mineurs:**
- Ajout de symbole `●` pour les annotations de type cercle dans la liste
- Stockage de `type: 'circle'` dans les annotations

### 4. **index.html**
**Ajouts:**
- Section `.draw-mode-selector` avec deux boutons:
  - `manualDrawButton` pour le dessin manuel
  - `smartSelectToggle` pour la détection intelligente
- Description du mode actuel avec `modeDescription`
- Boutons de confirmation/annulation (créés dynamiquement lors de l'ajustement)

## Nouveaux Fichiers

### 1. **smartSelect.js**
**Fonctions principales:**
- `detectColonyBoundary()` - Détecte une colonie par contraste
- `floodFill()` - Algorithme de remplissage par inondation
- `colorSimilarity()` - Compare les couleurs de pixels
- `fitCircleToPixels()` - Calcule le cercle englobant minimal

**Fonctionnement:**
1. L'utilisateur clique sur une colonie
2. `floodFill()` trouve tous les pixels similaires (même teinte)
3. `fitCircleToPixels()` calcule le cercle qui englobe tous ces pixels
4. Le rayon peut être ajusté manuellement avant confirmation

### 2. **smartSelectUI.js**
**Gère:**
- Basculement entre mode manuel et intelligent
- Messages d'aide (modeDescription)
- Validation de la classe avant d'activer le mode intelligent

## Flux d'Utilisation

### Mode Dessin Manuel (Défaut)
1. Sélectionner une classe
2. Cliquer et glisser sur l'image pour tracer un cercle
3. Le cercle est automatiquement sauvegardé
4. Les annotations apparaissent dans la liste

### Mode Détection Intelligente
1. Sélectionner une classe
2. Cliquer sur le bouton 🎯 "Détection Intelligente"
3. Cliquer sur une colonie dans l'image
4. Le système détecte automatiquement les limites de la colonie
5. Un cercle violet s'affiche avec deux boutons:
   - ✓ Confirmer - Valide et sauvegarde
   - ✕ Annuler - Rejette la détection
6. Vous pouvez ajuster le rayon en déplaçant la souris AVANT de confirmer

## Format des Annotations

**Avant (Rectangles):**
```json
{
  "class": "nom_classe",
  "coordinates": [centerX, centerY, width, height]
}
```

**Après (Cercles):**
```json
{
  "class": "nom_classe",
  "coordinates": [centerX, centerY, radius],
  "type": "circle"
}
```

Toutes les coordonnées sont normalisées (0-1).

## Installation

1. **Copier les fichiers dans votre projet:**
   ```bash
   cp canvas.js static/js/modules/
   cp annotations.js static/js/modules/
   cp state.js static/js/modules/
   cp smartSelect.js static/js/modules/
   cp smartSelectUI.js static/js/modules/
   cp index.html templates/
   ```

2. **Modifier main.js pour importer les nouveaux modules:**
   ```javascript
   import { setupSmartSelectUI } from './modules/smartSelectUI.js';
   
   // Dans la fonction d'initialisation:
   setupSmartSelectUI();
   ```

3. **Ajouter du CSS** (optionnel, améliore l'UX):
   ```css
   .draw-mode-selector {
       margin: 15px 0;
       padding: 10px;
       background: #f0f0f0;
       border-radius: 4px;
   }
   
   .mode-buttons {
       display: flex;
       gap: 10px;
       margin: 10px 0;
   }
   
   .mode-button {
       flex: 1;
       padding: 8px 12px;
       border: 2px solid #ddd;
       background: white;
       cursor: pointer;
       border-radius: 4px;
       transition: all 0.2s;
   }
   
   .mode-button.active {
       border-color: #27ae60;
       background: #27ae60;
       color: white;
       font-weight: bold;
   }
   
   .mode-description {
       font-size: 0.85em;
       color: #666;
       margin: 5px 0 0 0;
   }
   ```

## Paramètres de Détection

Vous pouvez ajuster la sensibilité dans **smartSelect.js** ligne 30:
```javascript
const colorThreshold = 30;  // Augmenter = plus de tolérance aux variations de couleur
```

## Limitations Connues

- La détection par contraste fonctionne mieux sur des images claires
- Les colonies très proches peuvent être détectées comme une seule
- Les bactéries avec bords flous peuvent nécessiter un ajustement manuel du rayon

## Prochaines Étapes Possibles

1. Améliorer la détection par contraste avec des algorithmes plus sophistiqués (Canny edge detection)
2. Détecter automatiquement plusieurs colonies avec un clic
3. Exporter au format YOLO OBB (Oriented Bounding Box) pour les cercles
4. Ajouter un paramètre de seuil de sensibilité ajustable dans l'UI
