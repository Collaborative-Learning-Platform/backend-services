# Load Testing Suite for learniinstitute.live

This directory contains comprehensive load testing configurations for your backend services using Artillery.

## Setup

1. **Install Artillery globally** (if not already installed):
   ```bash
   npm install -g artillery
   ```

2. **Install dependencies for load tests**:
   ```bash
   cd load-tests
   npm install
   ```

## Test Configurations

### Individual Service Tests

1. **Authentication Service** (`auth-load-test.yml`)
   - Tests login/logout flows
   - Password reset functionality
   - User profile operations
   - Load pattern: 5-50 users over 8 minutes

2. **Workspace Management** (`workspace-load-test.yml`)
   - Workspace creation and management
   - Group operations
   - Bulk user additions
   - Load pattern: 5-30 users over 10 minutes

3. **AI Service** (`ai-load-test.yml`)
   - AI chat interactions
   - Content generation
   - Analytics and insights
   - Load pattern: 2-10 users over 6 minutes (AI operations are resource-intensive)

4. **Communication Services** (`communication-load-test.yml`)
   - Chat operations
   - Notifications
   - Real-time document collaboration
   - Load pattern: 8-60 users with burst testing

5. **Interactive Features** (`interactive-load-test.yml`)
   - Quiz operations
   - Whiteboard collaboration
   - Load pattern: 3-40 users simulating class sessions

6. **Storage Service** (`storage-load-test.yml`)
   - File upload/download
   - File sharing and permissions
   - Load pattern: 6-35 users over 6.5 minutes

### Comprehensive Test

**Full System Test** (`comprehensive-load-test.yml`)
- Simulates realistic user journeys
- Tests all services simultaneously
- Load pattern: 5-80 users over 11 minutes with stress testing

## Running Tests

### Individual Tests
```bash
# Test authentication service
npm run test:auth

# Test workspace functionality
npm run test:workspace

# Test AI services
npm run test:ai

# Test communication features
npm run test:communication

# Test interactive features (quiz/whiteboard)
npm run test:interactive

# Test storage services
npm run test:storage
```

### Comprehensive Testing
```bash
# Run full system load test
npm run test:comprehensive

# Run all individual tests sequentially
npm run test:all

# Quick smoke test
npm run test:quick

# Spike test (sudden high load)
npm run test:spike
```

### Advanced Usage

#### Custom Load Patterns
```bash
# Override configuration for custom load
artillery run comprehensive-load-test.yml --overrides '{
  "config": {
    "phases": [
      {"duration": 60, "arrivalRate": 100}
    ]
  }
}'
```

#### Environment-Specific Testing
```bash
# Test against different environments
artillery run auth-load-test.yml --environment staging
```

## Test Scenarios

### User Journey Simulations

1. **Student Journey**:
   - Login → Check profile → View workspaces → Take quiz → Check notifications → Access chat

2. **Teacher Journey**:
   - Login → Create workspace → Create quiz → Use AI for content → Check analytics

3. **Mixed Load**:
   - Random API calls across all services
   - Simulates diverse usage patterns

### Load Patterns

- **Warm-up Phase**: Gradual increase to baseline load
- **Ramp-up Phase**: Steady increase to peak load
- **Sustained Load**: Maintain peak load for extended period
- **Spike Test**: Sudden burst to test system resilience
- **Wind-down**: Gradual decrease to normal levels

## Monitoring and Metrics

### Key Metrics Tracked

1. **Response Times**:
   - Per-service response time histograms
   - P95, P99 percentiles

2. **Error Rates**:
   - HTTP status code distribution
   - Service-specific error tracking

3. **Throughput**:
   - Requests per second per service
   - Successful transactions per minute

4. **Custom Metrics**:
   - Authentication success/failure rates
   - File upload/download success rates
   - AI service response quality

### Viewing Results

Artillery automatically generates detailed reports including:
- Request/response statistics
- Error analysis
- Performance graphs
- Custom metric summaries

## Test Data

The tests use realistic data generation including:
- Random user credentials
- Varied file sizes and types
- Realistic quiz questions and answers
- Educational content topics
- Diverse workspace configurations

## Processor Functions

Custom JavaScript processors provide:
- Dynamic data generation using Faker.js
- Response validation and tracking
- Performance monitoring
- Error handling and reporting

## Best Practices

1. **Start Small**: Begin with lower loads and gradually increase
2. **Monitor Resources**: Watch server CPU, memory, and database performance
3. **Baseline Testing**: Establish performance baselines before major changes
4. **Regular Testing**: Include load testing in your CI/CD pipeline
5. **Realistic Scenarios**: Use patterns that match actual user behavior

## Troubleshooting

### Common Issues

1. **Connection Errors**: Check network connectivity and server status
2. **Authentication Failures**: Verify test credentials and token handling
3. **Rate Limiting**: Adjust arrival rates if hitting API limits
4. **Memory Issues**: Reduce concurrent users or test duration

### Debug Mode
```bash
# Enable debug logging
DEBUG=* artillery run your-test.yml
```

## Integration with CI/CD

Add to your pipeline:
```yaml
# Example GitHub Actions step
- name: Run Load Tests
  run: |
    cd load-tests
    npm install
    npm run test:comprehensive
```

## Performance Targets

Suggested performance criteria:
- **Response Time**: 95% of requests < 500ms
- **Error Rate**: < 1% for normal operations
- **Throughput**: Support planned concurrent users
- **AI Services**: Allow higher response times (2-10 seconds)
- **File Operations**: Scale with file size

## Customization

To modify tests for your specific needs:
1. Update target URLs in configuration files
2. Adjust user credentials and test data
3. Modify load patterns in phase configurations
4. Add custom metrics in processor files
5. Create scenario-specific test flows

## Support

For issues or questions:
1. Check Artillery documentation: https://artillery.io/docs
2. Review test logs for error details
3. Monitor server logs during test execution
4. Adjust test parameters based on system capacity