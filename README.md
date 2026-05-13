# PoPoAI - Plateforme d'Annotation et de Détection d'Objets

PoPoAI est une application web permettant l'annotation d'images, l'entraînement de modèles de détection d'objets basés sur YOLOv5, et la prédiction sur de nouvelles images.

## Fonctionnalités

- Interface d'annotation d'images intuitive
- Gestion des classes d'objets personnalisables
- Entraînement de modèles YOLOv5
- Prédiction sur de nouvelles images
- Visualisation des résultats
- Export des annotations

## Prérequis

- Python 3.9+ (si vous installez localement)
- **Docker** (si vous utilisez Docker - très recommandé)
- GPU compatible CUDA (recommandé pour l'entraînement)

## Installation

### 🐳 Avec Docker (La Façon Facile - RECOMMANDÉE)

Docker est comme une boîte magique qui contient tout ce dont vous avez besoin. Vous n'avez pas besoin d'installer Python, MinIO, ou quoi que ce soit d'autre sur votre ordinateur.

**Prérequis :**
- Docker Desktop installé et en cours d'exécution

**Étapes :**

1. **Cloner le dépôt :**
```bash
git clone https://github.com/kriegmaster56/popoAI.git
cd popoAI
```

2. **Copier le fichier `docker-compose.yml`**

Assurez-vous que `docker-compose.yml` se trouve dans le dossier `popoAI` (il doit être fourni avec le projet).

3. **Démarrer tout automatiquement :**
```bash
docker-compose up -d
```

C'est tout ! Docker va automatiquement :
- ✅ Télécharger MinIO (pour stocker vos images et annotations)
- ✅ Lancer le serveur backend (la partie qui fait fonctionner l'app)
- ✅ Lancer le serveur frontend (ce que vous voyez dans votre navigateur)

4. **Vérifier que tout fonctionne :**
```bash
docker-compose ps
```

Vous devriez voir trois services avec le statut **Up** :
- `popoai-minio-1` (stockage)
- `popoai-backend-1` (serveur)
- `popoai-frontend-1` (interface web)

5. **Ouvrir l'application :**

Ouvrez votre navigateur et allez à :
```
http://localhost
```

L'application est prête à utiliser !

### Commandes Docker Utiles

**Voir ce qui se passe :**
```bash
docker-compose logs -f backend     # Messages du serveur (appuyez sur Ctrl+C pour arrêter)
docker-compose logs minio          # Messages du stockage
```

**Arrêter l'application :**
```bash
docker-compose down
```

Vos données sont sauvegardées automatiquement.

**Redémarrer l'application :**
```bash
docker-compose up -d
```

**Redémarrer un seul service :**
```bash
docker-compose restart backend
```

**Voir l'état des services :**
```bash
docker-compose ps
```

### ⚙️ Accéder à MinIO (Stockage des Images)

MinIO est le système de stockage. Vous pouvez voir vos images et annotations directement :

**URL :** http://localhost:9001

**Identifiants :**
- Utilisateur : `minioadmin`
- Mot de passe : `minioadmin`

---

### Installation locale (Pour les Développeurs)

Si vous préférez ne pas utiliser Docker :

1. **Cloner le dépôt :**
```bash
git clone git@github.com:kriegmaster56/popoAI.git
cd popoAI
```

2. **Créer un environnement virtuel Python :**
```bash
python3 -m venv venv
source venv/bin/activate
```

3. **Installer les dépendances :**
```bash
# Important : modifier numpy dans requirements.txt
# Remplacer "numpy>=1.19.0" par "numpy>=1.19.0,<2.0.0"
pip install -r requirements.txt
```

4. **Lancer l'application :**
```bash
python3 app.py
```

L'application sera accessible sur `http://localhost:5001`

**Note :** Vous devez installer et configurer MinIO séparément pour que le stockage fonctionne.

---

## Structure du Projet

```
popoAI/
├── app.py                  # Point d'entrée de l'application
├── config.py               # Configuration de l'application
├── dataset.py              # Gestion des datasets
├── models.py               # Modèles de données
├── routes.py               # Routes de l'application
├── utils.py                # Fonctions utilitaires
├── training.py             # Gestion de l'entraînement
├── storage.py              # Gestion du stockage MinIO
├── dataset_minio.py        # Gestion des datasets avec MinIO
├── classes.json            # Configuration des classes
├── docker-compose.yml      # Configuration Docker (utiliser avec docker-compose)
├── Dockerfile              # Instructions pour construire l'image Docker
├── requirements.txt        # Dépendances Python
├── static/                 # Fichiers statiques (CSS, JS)
├── templates/              # Templates HTML
├── uploads/                # Dossier des images uploadées (persistant)
├── annotations/            # Dossier des annotations (persistant)
├── dataset/                # Données d'entraînement (persistant)
├── model/                  # Modèles entraînés (persistant)
└── yolov5/                 # Sous-module YOLOv5
```

## Utilisation

1. Accéder à l'application via `http://localhost`
2. Uploader des images à annoter
3. Créer et gérer les classes d'objets
4. Annoter les images (tracer des boîtes autour des objets)
5. Lancer l'entraînement du modèle
6. Effectuer des prédictions sur de nouvelles images

## Configuration

Les paramètres de configuration peuvent être modifiés dans :
- `config.py` : Configuration générale de l'application
- `classes.json` : Définition des classes d'objets
- `yolo_config/` : Configuration de YOLOv5
- `docker-compose.yml` : Configuration des services Docker (MinIO, backend, frontend)

### Variables d'Environnement (Docker)

Si vous utilisez Docker, les variables sont déjà configurées dans `docker-compose.yml` :
- `MINIO_HOST` : Nom d'hôte de MinIO (par défaut : `minio`)
- `MINIO_PORT` : Port de MinIO (par défaut : `9000`)
- `MINIO_ACCESS_KEY` : Clé d'accès MinIO (par défaut : `minioadmin`)
- `MINIO_SECRET_KEY` : Clé secrète MinIO (par défaut : `minioadmin`)

Vous pouvez les modifier dans `docker-compose.yml` si nécessaire.

## Dépannage

### Le backend refuse de démarrer

**Vérifier les logs :**
```bash
docker-compose logs backend
```

**Solutions courantes :**
- MinIO n'est pas en cours d'exécution → `docker-compose up -d` redémarre tout
- Port 5001 déjà utilisé → modifier le port dans `docker-compose.yml`

### MinIO n'est pas accessible

```bash
docker-compose logs minio
```

### Les données disparaissent après redémarrage

Les données sont sauvegardées dans les volumes Docker. Pour les conserver :
```bash
docker-compose down    # N'effacera pas les données
docker-compose up -d   # Les données sont restaurées
```

Pour effacer tous les données et recommencer à zéro :
```bash
docker-compose down -v  # Le -v supprime aussi les volumes
```

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
1. Fork le projet
2. Créer une branche (`git checkout -b feature/amelioration`)
3. Commit vos changements (`git commit -m 'Ajout d'une fonctionnalité'`)
4. Push sur la branche (`git push origin feature/amelioration`)
5. Ouvrir une Pull Request

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.