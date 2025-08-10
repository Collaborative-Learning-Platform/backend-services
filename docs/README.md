# Backend Services Monorepo

A microservices-based backend system built with NestJS, featuring a clean monorepo structure for scalable development.

## 🏗️ Architecture

```
backend-services/
├── apps/                    # Microservices
│   ├── gateway/            # API Gateway
│   ├── user-ms/            # User Management Service
│   └── auth-ms/            # Authentication Service
├── libs/                   # Shared Libraries
│   ├── config/             # Configuration utilities
│   ├── common/             # Shared utilities
│   ├── database/           # Database schemas/models
│   └── types/              # Shared TypeScript types
├── docker/                 # Docker configurations
│   ├── gateway.Dockerfile
│   ├── user-ms.Dockerfile
│   └── auth-ms.Dockerfile
├── env/                    # Environment configurations
│   ├── .gateway.env
│   ├── .user-ms.env
│   └── .auth-ms.env
├── scripts/                # Utility scripts
└── docker-compose.yml     # Local development setup
```

## 🚀 Services

### Gateway (Port 3000)
- API Gateway and routing
- Request validation and rate limiting
- Service orchestration

### User Microservice (Port 3001)
- User profile management
- User data operations
- User preferences

### Auth Microservice (Port 3002)
- User authentication and authorization
- JWT token management
- Password security

## 🛠️ Development

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (via Docker)
- Redis (via Docker)

### Local Development Setup

1. **Clone and install dependencies:**
```bash
git clone <repository>
cd backend-services
npm install
```

2. **Start infrastructure services:**
```bash
npm run docker:up
```

3. **Start individual services in development mode:**
```bash
# Start all services
npm run start:dev:gateway
npm run start:dev:user-ms
npm run start:dev:auth-ms

# Or start specific service
npm run start:dev:gateway
```

### Available Scripts

#### Build Commands
```bash
npm run build:all          # Build all services
npm run build:gateway      # Build gateway only
npm run build:user-ms      # Build user service only
npm run build:auth-ms      # Build auth service only
```

#### Development Commands
```bash
npm run start:dev:gateway  # Start gateway in watch mode
npm run start:dev:user-ms  # Start user service in watch mode
npm run start:dev:auth-ms  # Start auth service in watch mode
```

#### Testing Commands
```bash
npm run test:gateway       # Test gateway
npm run test:user-ms       # Test user service
npm run test:auth-ms       # Test auth service
npm test                   # Test all
```

#### Docker Commands
```bash
npm run docker:build       # Build all Docker images
npm run docker:up          # Start all services with Docker
npm run docker:down        # Stop all Docker services
npm run docker:logs        # View logs
```

## 🐳 Docker Development

The project includes a complete Docker Compose setup for local development:

```bash
# Start all services (database, redis, all microservices)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## 🔧 Configuration

Each service has its own environment configuration in the `env/` directory:

- `.gateway.env` - Gateway service configuration
- `.user-ms.env` - User service configuration  
- `.auth-ms.env` - Auth service configuration

## 📊 Database

The project uses PostgreSQL with separate databases for each service:
- `gateway_db` - Gateway service database
- `user_db` - User service database
- `auth_db` - Auth service database

## 🔄 Service Communication

Services communicate through:
- HTTP REST APIs
- Redis for caching and sessions
- Shared TypeScript types in `libs/types`

## 📁 Shared Libraries

- **libs/common** - Shared utilities and helpers
- **libs/config** - Configuration management
- **libs/database** - Database schemas and models
- **libs/types** - Shared TypeScript interfaces

## 🧪 Testing

Each service has its own test suite. Run tests individually or all together:

```bash
# Individual service tests
npm run test:gateway
npm run test:user-ms
npm run test:auth-ms

# All tests
npm test
```

## 🚢 Deployment

Each service can be deployed independently using its respective Dockerfile:

```bash
# Build production images
docker build -f docker/gateway.Dockerfile -t backend-gateway .
docker build -f docker/user-ms.Dockerfile -t backend-user-ms .
docker build -f docker/auth-ms.Dockerfile -t backend-auth-ms .
```

## 📝 Development Guidelines

1. **Service Independence**: Each service should be self-contained
2. **Shared Code**: Common functionality goes in `libs/`
3. **Environment Config**: Use service-specific environment files
4. **Database**: Each service has its own database
5. **Testing**: Maintain comprehensive test coverage for each service

## 🔒 Security

- JWT authentication with service-specific secrets
- Environment-based configuration
- Input validation and sanitization
- Password hashing with bcrypt
- CORS configuration

## 📈 Monitoring

Each service includes:
- Health check endpoints
- Structured logging
- Error handling and reporting
- Performance monitoring capabilities
