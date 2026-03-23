# Tech Challenge - Gateway Application

This is a backend application designed as an API Gateway, that acts as single entry point for all requests. Right now the Gateway is configured to redirect requests to the Auth Microservice (AUTH_SERVICE_URL), but it is possible to add more microservices.


## Quick setup

* Clone the repo
* run `npm install`
* set the .env file as follows (**IMPORTANT**: a MongoDB Atlas instance is required)

```bash
PORT=<the port you prefer, if omitted the default will be 8080>
MONGODB_URI=mongodb+srv://<user_username>:<user_password>@<your_cluster>.mongodb.net/<database_name>
JWT_SECRET=<put a secret key for JWT validation>
AUTH_SERVICE_URL=<the URL assigned to the auth microservice>
```

* run `npm run start:dev` for local/development environment, or `npm run build && npm run start:prod` for production build


## Techonologies

* Nestjs to build the app
* MongoDB for data persistence


## Key Features

### Request Flow:
Client -->  API Gateway -->  Auth Microservice -->  Database

### API Gateway Features:
- **Request Routing**: Automatically routes requests to appropriate microservices
- **Authentication Middleware**: JWT verification at gateway level
- **Health Monitoring**: Check health of all microservices
- **Error Handling**: Unified error handling and responses
- **Request Forwarding**: Forwards headers and request context to microservices
- **Service Discovery**: Configurable service registry

### Security Features:
- **JWT Authentication**: Verified at gateway level
- **Public Routes**: Register/login endpoints are publicly accessible
- **User Context**: User information passed to microservices via headers
- **Rate Limiting Ready**: Infrastructure prepared for rate limiting

### Microservice Benefits:
- **Independent Deployment**: Each service can be deployed separately
- **Scalability**: Scale services independently based on load
- **Technology Agnostic**: Each service can use different technologies
- **Fault Isolation**: Failure in one service doesn't crash the entire system
- **Team Independence**: Different teams can own different services


## Adding New Microservices

1. **Update Service Registry** (src/gateway/service-registry.service.ts):
```typescript
// Add new service configuration
users: {
  name: 'Users Service',
  baseUrl: this.configService.get<string>('USERS_SERVICE_URL', '<url of the new service>'),
  healthCheck: '/health',
  timeout: 5000,
}

// Add route mapping
if (path.startsWith('/users')) {
  return 'users';
}
```

2. **Update Environment Variables**:
```bash
USERS_SERVICE_URL=<url of the new service>
```

3. **Create New Microservice**: Copy the Auth-microservice structure and modify accordingly


## Monitoring

### Gateway Health Check Response:
```json
{
  "status": "ok", 
  "timestamp": "2026-03-21T14:30:00.000Z",
  "gateway": "healthy",
  "services": {
    "auth": true
  }
}
```

### Service Registry Info:
```json
{
  "name": "API Gateway",
  "version": "1.0.0", 
  "services": {
    "auth": {
      "name": "Auth Service",
      "baseUrl": "http://localhost:8080",
      "healthCheck": "/health",
      "timeout": 5000
    }
  }
}
```


## Development Notes

### Gateway Request Flow:
1. Client sends request to gateway
2. Gateway validates JWT (if required)
3. Gateway determines target service by route
4. Gateway forwards request to microservice
5. Microservice processes request
6. Gateway returns microservice response to client

### Error Handling:
- **503 Bad Gateway**: Service unavailable
- **504 Gateway Timeout**: Service timeout
- **401 Unauthorized**: Invalid/missing JWT
- **404 Not Found**: Route not mapped to any service