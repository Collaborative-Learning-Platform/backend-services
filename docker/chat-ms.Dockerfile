# -------- STAGE 1: Build --------
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy global configs
COPY package*.json ./
COPY tsconfig.json ./
COPY nest-cli.json ./

# Install dependencies
RUN npm install

# Copy only this service and shared libs
COPY apps/chat-ms ./apps/chat-ms
COPY libs ./libs

# Build the project
RUN npm run build:chat-ms

# -------- STAGE 2: Run --------
FROM node:20-alpine

WORKDIR /app

# Only copy compiled output
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# If using config files or public assets
# .env files are mounted via docker-compose volumes
# Optional, depending on deployment strategy

# Run the app
CMD ["node", "dist/apps/chat-ms/main.js"]