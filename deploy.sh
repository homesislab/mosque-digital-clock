#!/bin/bash

# Configuration
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
IMAGE_TAG="v-${TIMESTAMP}"

echo "=========================================="
echo "Mosque Digital Clock Deployment (In-Place)"
echo "=========================================="
echo "Version: ${IMAGE_TAG}"
echo "=========================================="

# Create/Update .env file for the tag
# We append or replace the IMAGE_TAG in .env if it exists
if [ -f .env ]; then
    # Remove existing IMAGE_TAG if any to avoid duplicates
    sed -i '/^IMAGE_TAG=/d' .env
else
    touch .env
fi
echo "IMAGE_TAG=${IMAGE_TAG}" >> .env

echo "[INFO] Building and deploying containers with tag: ${IMAGE_TAG}..."
docker compose up -d --build

echo "=========================================="
echo "Deployment Complete!"
echo "Images created:"
echo "  - mosque-digital-clock-admin:${IMAGE_TAG}"
echo "  - mosque-digital-clock-client:${IMAGE_TAG}"
echo "=========================================="
