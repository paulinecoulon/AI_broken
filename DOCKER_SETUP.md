# Docker Build & Run Instructions

## Step 1: Replace files in your popoAI directory

```bash
cp Dockerfile /path/to/popoAI/Dockerfile
cp requirements.txt /path/to/popoAI/requirements.txt
```

## Step 2: Build the Docker image

```bash
cd /path/to/popoAI
docker build -t popoai .
```

This will:
- Clone the YOLOv5 v7.0 repository into `/app/yolov5/`
- Download `yolov5s.pt` weights (cached as a Docker layer, won't re-download on rebuilds)
- Create the required directories: `dataset/`, `model/`, `uploads/`, `annotations/`
- Install all Python dependencies

**First build will take 3-5 minutes** (downloading YOLOv5 code + weights). Subsequent builds use cached layers.

## Step 3: Run the container

**Without data persistence** (data lost when container stops):
```bash
docker run -p 5000:5000 popoai
```

**With data persistence** (recommended):
```bash
docker run -p 5000:5000 \
  -v $(pwd)/dataset:/app/dataset \
  -v $(pwd)/model:/app/model \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/annotations:/app/annotations \
  popoai
```

## Step 4: Access the app

Open your browser:
```
http://localhost:5000
```

## What Changed

1. **Dockerfile:**
   - Now clones YOLOv5 repository at build time (instead of copying a local version)
   - Pre-downloads `yolov5s.pt` weights during build (caches them)
   - Creates `dataset/`, `model/`, `uploads/`, `annotations/` directories
   - Installs dependencies after copying code (more efficient layer caching)

2. **requirements.txt:**
   - Added `yolov5>=7.0` package

## Troubleshooting

If the build fails:

1. **Network issue downloading YOLOv5:**
   ```bash
   docker build --progress=plain -t popoai .
   ```
   This shows detailed output. If it fails at "RUN git clone", your Docker container may not have internet access.

2. **Port 5000 already in use:**
   ```bash
   docker run -p 5001:5000 popoai  # Use port 5001 instead
   ```

3. **Need to rebuild without cache** (in case of corruption):
   ```bash
   docker build --no-cache -t popoai .
   ```

## Optional: numpy version

If you encounter numpy compatibility issues during training, modify requirements.txt:
```
numpy>=1.19.0,<2.0.0
```

Then rebuild:
```bash
docker build --no-cache -t popoai .
```
