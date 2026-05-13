# PoPoAI Docker Compose Setup

## Quick Start

1. Copy `docker-compose.yml` to your popoAI directory:
```bash
cp docker-compose.yml /path/to/popoAI/
cd /path/to/popoAI
```

2. Stop the old containers:
```bash
docker stop popoai-frontend-1 popoai-backend-1
docker rm popoai-frontend-1 popoai-backend-1
```

3. Start the full stack:
```bash
docker-compose up -d
```

4. Verify all services are running:
```bash
docker-compose ps
```

You should see three containers: `popoai-minio`, `popoai-backend-1`, `popoai-frontend-1`, all with status "Up".

5. Access the app:
- Frontend: http://localhost
- MinIO console: http://localhost:9001 (login: minioadmin / minioadmin)

## What This Does

- **MinIO** (port 9000): Object storage for images, annotations, datasets
- **Backend** (port 5001): Flask API, waits for MinIO to be healthy before starting
- **Frontend** (port 80): Nginx web server, proxies to backend

All three services are on the same Docker network (`popoai-network`), so they can communicate by hostname (e.g., `minio:9000`).

## Stopping and Starting

Stop all services:
```bash
docker-compose down
```

Start again (data persists):
```bash
docker-compose up -d
```

Restart a single service:
```bash
docker-compose restart backend
```

View logs:
```bash
docker-compose logs -f backend  # Follow backend logs
docker-compose logs minio       # MinIO logs
```

## Troubleshooting

**Backend still crashing:**
```bash
docker-compose logs backend
```

**MinIO not accessible:**
```bash
docker-compose logs minio
```

**Port conflicts:**
If port 80 or 9000 is in use, edit docker-compose.yml and change the port mapping. For example:
```yaml
ports:
  - "8080:80"  # Use 8080 instead of 80
```

Then restart: `docker-compose up -d`

## Data Persistence

- MinIO data: `minio_data/` volume (preserved across restarts)
- Local datasets/models: `dataset/`, `model/`, `uploads/`, `annotations/` directories (mounted as volumes)

All data persists when you stop and restart with `docker-compose`.

## First Time Setup

The first time you start MinIO, it initializes automatically. The backend will wait for MinIO to be healthy before starting (see `depends_on` and `healthcheck`).

If backend still fails to connect after MinIO starts, check that MinIO credentials in docker-compose.yml match what's configured in your backend code.
