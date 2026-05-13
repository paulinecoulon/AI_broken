# Use official Python runtime as a parent image
FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libglib2.0-0 \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy application files
COPY requirements.txt .
COPY app.py .
COPY config.py .
COPY dataset.py .
COPY models.py .
COPY routes.py .
COPY utils.py .
COPY training.py .
COPY classes.json .
COPY setup.sh .
COPY static/ static/
COPY templates/ templates/
COPY yolo_config/ yolo_config/

# Clone YOLOv5 repository
RUN git clone https://github.com/ultralytics/yolov5.git yolov5 && \
    cd yolov5 && \
    git checkout v7.0 && \
    cd /app

# Download YOLOv5s pre-trained weights (cached as a layer)
RUN cd /app && \
    python3 -c "import urllib.request; urllib.request.urlretrieve('https://github.com/ultralytics/yolov5/releases/download/v7.0/yolov5s.pt', 'yolov5s.pt')"

# Create necessary directories for data persistence
RUN mkdir -p /app/dataset \
    && mkdir -p /app/model \
    && mkdir -p /app/uploads \
    && mkdir -p /app/annotations

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose port
EXPOSE 5000

# Set environment variables
ENV FLASK_APP=app.py
ENV DATASET_PATH=/app/dataset
ENV MODEL_PATH=/app/model

# Run the application
CMD ["python3", "app.py"]