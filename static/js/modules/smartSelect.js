// Détection intelligente des colonies basée sur le contraste
// Utilise un algorithme de remplissage par inondation (flood fill) avec détection de contraste

export function detectColonyBoundary(imageData, clickX, clickY, canvasWidth, canvasHeight) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // Convertir les coordonnées du clic en index de pixel
    const clickIndex = (Math.floor(clickY) * width + Math.floor(clickX)) * 4;
    
    // Obtenir la couleur au point cliqué
    const targetColor = {
        r: data[clickIndex],
        g: data[clickIndex + 1],
        b: data[clickIndex + 2],
        a: data[clickIndex + 3]
    };
    
    // Si le clic est sur une zone complètement transparente, retourner null
    if (targetColor.a === 0) {
        return null;
    }
    
    // Utiliser le flood fill pour trouver tous les pixels de la colonie
    const pixels = floodFill(data, width, height, clickX, clickY, targetColor);
    
    if (pixels.length === 0) {
        return null;
    }
    
    // Calculer le cercle englobant (bounding circle)
    const circle = fitCircleToPixels(pixels);
    
    return circle;
}

// Algorithme de remplissage par inondation (flood fill) avec détection de contraste
function floodFill(data, width, height, startX, startY, targetColor) {
    const visited = new Set();
    const pixels = [];
    const queue = [[startX, startY]];
    
    // Seuil de similarité de couleur (0-255)
    const colorThreshold = 30;
    
    while (queue.length > 0) {
        const [x, y] = queue.shift();
        const key = `${Math.floor(x)},${Math.floor(y)}`;
        
        if (visited.has(key)) continue;
        if (x < 0 || x >= width || y < 0 || y >= height) continue;
        
        visited.add(key);
        
        const index = (Math.floor(y) * width + Math.floor(x)) * 4;
        const color = {
            r: data[index],
            g: data[index + 1],
            b: data[index + 2],
            a: data[index + 3]
        };
        
        // Vérifier la similarité de couleur
        if (colorSimilarity(color, targetColor) > colorThreshold) {
            continue;
        }
        
        pixels.push({ x: Math.floor(x), y: Math.floor(y) });
        
        // Ajouter les voisins à la queue (4-connectivité)
        queue.push([x + 1, y]);
        queue.push([x - 1, y]);
        queue.push([x, y + 1]);
        queue.push([x, y - 1]);
    }
    
    return pixels;
}

// Calculer la distance de couleur entre deux pixels
function colorSimilarity(color1, color2) {
    const dr = color1.r - color2.r;
    const dg = color1.g - color2.g;
    const db = color1.b - color2.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
}

// Calculer le cercle englobant minimal pour un ensemble de pixels
function fitCircleToPixels(pixels) {
    if (pixels.length === 0) return null;
    
    // Calculer le centre de gravité
    let sumX = 0, sumY = 0;
    pixels.forEach(p => {
        sumX += p.x;
        sumY += p.y;
    });
    
    const centerX = sumX / pixels.length;
    const centerY = sumY / pixels.length;
    
    // Trouver le rayon maximum depuis le centre
    let maxRadius = 0;
    pixels.forEach(p => {
        const dx = p.x - centerX;
        const dy = p.y - centerY;
        const radius = Math.sqrt(dx * dx + dy * dy);
        maxRadius = Math.max(maxRadius, radius);
    });
    
    // Augmenter légèrement le rayon pour engloober tous les pixels
    const radius = maxRadius * 1.1;
    
    return {
        centerX: centerX,
        centerY: centerY,
        radius: radius
    };
}
