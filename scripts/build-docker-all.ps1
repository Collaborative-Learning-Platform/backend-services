# Build all Docker images for microservices
Write-Host "Building all Docker images for microservices..." -ForegroundColor Green

# Array of services
$services = @(
    "gateway",
    "user-ms",
    "auth-ms",
    "notification-ms",
    "workspace-ms",
    "chat-ms",
    "quiz-ms",
    "whiteboard-ms",
    "ai-ms",
    "analytics-ms",
    "document-ms",
    "storage-ms"
)

# Build each service
foreach ($service in $services) {
    Write-Host "Building $service..." -ForegroundColor Yellow
    $result = docker build -f "docker\$service.Dockerfile" -t "backend-services-$service`:latest" .
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Successfully built $service" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to build $service" -ForegroundColor Red
        exit 1
    }
}

Write-Host "All Docker images built successfully!" -ForegroundColor Green