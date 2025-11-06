# Docker Deployment

## Quick Start

### Using Docker directly

```bash
# Build the image
docker build -t ranbo-play:local .

# Run the container
docker run -d -p 8080:80 --name ranbo-play ranbo-play:local

# Access the application
open http://localhost:8080
```

### Using Docker Compose (recommended for local development)

```bash
# Start the service
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f

# Stop the service
docker compose down
```

## Features

- **Multi-stage Docker build**: Optimized image size (~90MB)
- **Nginx Alpine**: Lightweight and secure runtime
- **SPA routing**: Deep links work correctly with `try_files` fallback
- **Gzip compression**: Automatic compression for text-based assets
- **Security headers**: X-Content-Type-Options, X-Frame-Options, XSS protection
- **Asset caching**: Long-term cache for static assets, no-cache for HTML
- **Health checks**: Built-in health endpoint at `/health`
- **Non-root user**: Runs as nginx user for security

## Health Check

The container includes a health check endpoint:

```bash
curl http://localhost:8080/health
# Response: healthy
```

## Environment Variables

This is a static SPA and doesn't require any environment variables at runtime. If you need to add environment-specific configuration in the future, you can add them to the `docker-compose.yml` file.

## Production Considerations

For production deployment:

1. **Version tagging**: Use semantic version tags instead of `local`
2. **Registry**: Push to a container registry (Docker Hub, GHCR, etc.)
3. **HTTPS**: Place behind a reverse proxy with SSL termination
4. **Rate limiting**: Consider adding rate limiting at the proxy level
5. **Monitoring**: Add logging and monitoring as needed

## Build Arguments

The Dockerfile supports build arguments for CI/CD:

```bash
docker build \
  --build-arg VERSION=1.0.0 \
  --build-arg BUILD_TIMESTAMP=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
  -t ranbo-play:1.0.0 .
```