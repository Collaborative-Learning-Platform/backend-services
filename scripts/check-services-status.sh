#!/bin/bash

echo "=== Docker Compose Services Status ==="
docker-compose ps

echo ""
echo "=== Health Check - Gateway ==="
curl -f http://localhost:3000/health 2>/dev/null || echo "Gateway health endpoint not available"

echo ""
echo "=== Service Logs (Last 3 lines each) ==="

services=(
    "gateway"
    "auth-ms"
    "user-ms"
    "notification-ms"
    "workspace-ms"
    "chat-ms"
    "quiz-ms"
    "document-ms"
    "storage-ms"
    "ai-ms"
    "whiteboard-ms"
    "analytics-ms"
)

for service in "${services[@]}"; do
    echo "--- $service ---"
    docker-compose logs "$service" --tail=3 2>/dev/null || echo "Service $service not found"
    echo ""
done