# Quick Start Script for Load Testing

# Install Artillery globally
Write-Host "Installing Artillery globally..." -ForegroundColor Green
npm install -g artillery

# Navigate to load-tests directory
Set-Location -Path "load-tests"

# Install test dependencies
Write-Host "Installing test dependencies..." -ForegroundColor Green
npm install

# Run quick connectivity test
Write-Host "Running connectivity test..." -ForegroundColor Yellow
artillery quick --count 5 --num 10 https://learniinstitute.live

# Run authentication load test
Write-Host "Running authentication load test..." -ForegroundColor Cyan
artillery run auth-load-test.yml

Write-Host "Load testing setup complete!" -ForegroundColor Green
Write-Host "Available commands:" -ForegroundColor White
Write-Host "  npm run test:auth         - Test authentication service" -ForegroundColor Gray
Write-Host "  npm run test:workspace    - Test workspace management" -ForegroundColor Gray
Write-Host "  npm run test:ai          - Test AI services" -ForegroundColor Gray
Write-Host "  npm run test:communication - Test chat and notifications" -ForegroundColor Gray
Write-Host "  npm run test:interactive - Test quiz and whiteboard" -ForegroundColor Gray
Write-Host "  npm run test:storage     - Test file operations" -ForegroundColor Gray
Write-Host "  npm run test:comprehensive - Full system test" -ForegroundColor Gray
Write-Host "  npm run test:all         - Run all individual tests" -ForegroundColor Gray