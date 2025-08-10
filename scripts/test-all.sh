#!/bin/bash
# Test all services

echo "Running tests for all microservices..."

echo "Testing Gateway..."
npm run test gateway

echo "Testing User Microservice..."
npm run test user-ms

echo "Testing Auth Microservice..."
npm run test auth-ms

echo "All tests completed!"
