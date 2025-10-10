# Docker Compose Services Status Check
Write-Host "=== Docker Compose Services Status ===" -ForegroundColor Green
docker-compose ps

Write-Host "`n=== Health Check - Gateway ===" -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -ErrorAction SilentlyContinue
    Write-Host "Gateway is responding: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "Gateway health endpoint not available" -ForegroundColor Yellow
}

Write-Host "`n=== Service Logs (Last 3 lines each) ===" -ForegroundColor Green

$services = @(
    "gateway",
    "auth-ms",
    "user-ms", 
    "notification-ms",
    "workspace-ms",
    "chat-ms",
    "quiz-ms",
    "document-ms",
    "storage-ms",
    "ai-ms",
    "whiteboard-ms",
    "analytics-ms"
)

foreach ($service in $services) {
    Write-Host "--- $service ---" -ForegroundColor Cyan
    try {
        docker-compose logs $service --tail=3 2>$null
    } catch {
        Write-Host "Service $service not found" -ForegroundColor Red
    }
    Write-Host ""
}