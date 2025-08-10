#!/bin/bash
# Build all services

echo "Building all microservices..."

echo "Building Gateway..."
npm run build gateway

echo "Building User Microservice..."
npm run build user-ms

echo "Building Auth Microservice..."
npm run build auth-ms

echo "All services built successfully!"
