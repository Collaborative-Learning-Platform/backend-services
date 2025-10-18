#!/usr/bin/env powershell

# Artillery Load Testing Script for learniinstitute.live
# Quick test runner for different scenarios

Write-Host "🚀 Artillery Load Testing Suite for learniinstitute.live" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

# Function to run a test and display results
function Run-LoadTest {
    param(
        [string]$TestFile,
        [string]$TestName
    )
    
    Write-Host "`n🎯 Running $TestName..." -ForegroundColor Cyan
    Write-Host "Test file: $TestFile" -ForegroundColor Gray
    
    $startTime = Get-Date
    try {
        npx artillery run $TestFile
        $endTime = Get-Date
        $duration = $endTime - $startTime
        Write-Host "✅ $TestName completed in $($duration.TotalSeconds) seconds" -ForegroundColor Green
    } catch {
        Write-Host "❌ $TestName failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Menu options
Write-Host "`nAvailable Tests:" -ForegroundColor Yellow
Write-Host "1. Quick Auth Test (1 min)" -ForegroundColor White
Write-Host "2. Comprehensive System Test (4 min)" -ForegroundColor White  
Write-Host "3. Storage Operations Test (1 min)" -ForegroundColor White
Write-Host "4. Basic Connectivity Test (1 min)" -ForegroundColor White
Write-Host "5. Run All Tests (7+ min)" -ForegroundColor White
Write-Host "6. Custom Quick Test (30 sec)" -ForegroundColor White

$choice = Read-Host "`nEnter your choice (1-6)"

switch ($choice) {
    "1" {
        Run-LoadTest "auth-load-test.yml" "Authentication Load Test"
    }
    "2" {
        Run-LoadTest "comprehensive-load-test.yml" "Comprehensive System Test"
    }
    "3" {
        Run-LoadTest "storage-quick-test.yml" "Storage Operations Test"
    }
    "4" {
        Run-LoadTest "basic-test.yml" "Basic Connectivity Test"
    }
    "5" {
        Write-Host "`n🔥 Running ALL tests..." -ForegroundColor Magenta
        Run-LoadTest "basic-test.yml" "Basic Connectivity Test"
        Run-LoadTest "auth-load-test.yml" "Authentication Load Test"
        Run-LoadTest "storage-quick-test.yml" "Storage Operations Test"
        Run-LoadTest "comprehensive-load-test.yml" "Comprehensive System Test"
        Write-Host "`n🎉 All tests completed!" -ForegroundColor Green
    }
    "6" {
        Write-Host "`n⚡ Running quick connectivity test..." -ForegroundColor Yellow
        npx artillery quick --count 5 --num 10 https://learniinstitute.live
    }
    default {
        Write-Host "❌ Invalid choice. Please run the script again." -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n📊 Test Summary:" -ForegroundColor Cyan
Write-Host "- Check the terminal output above for detailed metrics" -ForegroundColor Gray
Write-Host "- Key metrics: Response times, throughput, error rates" -ForegroundColor Gray
Write-Host "- All tests target: https://learniinstitute.live" -ForegroundColor Gray

Write-Host "`n🎯 Need more info?" -ForegroundColor Yellow
Write-Host "- View performance-report-2025-10-18.md for detailed analysis" -ForegroundColor Gray
Write-Host "- Check individual .yml files to understand test scenarios" -ForegroundColor Gray
Write-Host "- Modify test parameters in the .yml files as needed" -ForegroundColor Gray

Write-Host "`n✨ Happy load testing!" -ForegroundColor Green