# Deployment Guide

This guide covers deployment strategies, configuration, and operational considerations for running ranbo-play in production environments.

## 🐳 Docker Deployment

### Container Image Structure

The application is built as a multi-stage Docker container:

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Build and Run

```bash
# Build the image
docker build -t ranbo-play:latest .

# Run with default configuration
docker run -d \
  --name ranbo-play \
  -p 8080:80 \
  ranbo-play:latest

# Run with custom configuration
docker run -d \
  --name ranbo-play \
  -p 8080:80 \
  -v $(pwd)/nginx.conf:/etc/nginx/nginx.conf:ro \
  ranbo-play:latest
```

### Environment Variables

The application supports the following environment variables:

```bash
# Build-time variables
NODE_ENV=production          # Build mode
VITE_API_BASE_URL=           # Default API endpoint (optional)

# Runtime variables (via nginx)
NGINX_WORKER_PROCESSES=auto  # Nginx worker processes
NGINX_WORKER_CONNECTIONS=1024 # Worker connections
```

## 🌐 Nginx Configuration

### SPA Routing Rules

The application requires proper SPA routing configuration to handle client-side navigation:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # Handle Monaco Editor workers
    location /node_modules/monaco-editor/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # SPA fallback - all other routes serve index.html
    location / {
        try_files $uri $uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### Production Optimizations

```nginx
# HTTP/2 support
listen 443 ssl http2;
ssl_certificate /path/to/cert.pem;
ssl_certificate_key /path/to/key.pem;

# SSL configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req zone=api burst=20 nodelay;

# Large file uploads (if needed)
client_max_body_size 10M;
```

## ☁️ Cloud Deployment

### AWS ECS/Fargate

```json
{
  "family": "ranbo-play",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "ranbo-play",
      "image": "ghcr.io/ranbo12138/ranbo-play:latest",
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/ranbo-play",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Google Cloud Run

```bash
# Deploy to Cloud Run
gcloud run deploy ranbo-play \
  --image ghcr.io/ranbo12138/ranbo-play:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 100

# Set up custom domain
gcloud run domain-mappings create \
  --domain play.ranbo.ai \
  --service ranbo-play \
  --region us-central1
```

### Azure Container Instances

```bash
# Deploy to ACI
az container create \
  --resource-group ranbo-play-rg \
  --name ranbo-play \
  --image ghcr.io/ranbo12138/ranbo-play:latest \
  --dns-name-label ranbo-play-unique \
  --ports 80 \
  --cpu 1 \
  --memory 1
```

## 🔧 Kubernetes Deployment

### Deployment Manifest

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ranbo-play
  labels:
    app: ranbo-play
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ranbo-play
  template:
    metadata:
      labels:
        app: ranbo-play
    spec:
      containers:
      - name: ranbo-play
        image: ghcr.io/ranbo12138/ranbo-play:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: ranbo-play-service
spec:
  selector:
    app: ranbo-play
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
  type: ClusterIP

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ranbo-play-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - play.ranbo.ai
    secretName: ranbo-play-tls
  rules:
  - host: play.ranbo.ai
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ranbo-play-service
            port:
              number: 80
```

### Helm Chart

```yaml
# values.yaml
replicaCount: 3

image:
  repository: ghcr.io/ranbo12138/ranbo-play
  tag: latest
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: play.ranbo.ai
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: ranbo-play-tls
      hosts:
        - play.ranbo.ai

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 250m
    memory: 256Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
```

## 🚀 CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Kubernetes
        uses: azure/k8s-deploy@v1
        with:
          manifests: |
            k8s/deployment.yaml
            k8s/service.yaml
            k8s/ingress.yaml
          images: |
            ghcr.io/ranbo12138/ranbo-play:${{ github.sha }}
          kubeconfig: ${{ secrets.KUBE_CONFIG }}
```

### ArgoCD Application

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: ranbo-play
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/ranbo12138/ranbo-play.git
    targetRevision: HEAD
    path: k8s
  destination:
    server: https://kubernetes.default.svc
    namespace: ranbo-play
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

## 🔒 Security Configuration

### SSL/TLS Setup

```nginx
# Let's Encrypt certbot configuration
server {
    listen 80;
    server_name play.ranbo.ai;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name play.ranbo.ai;
    
    ssl_certificate /etc/letsencrypt/live/play.ranbo.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/play.ranbo.ai/privkey.pem;
    
    # SSL hardening
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

### Content Security Policy

```nginx
# CSP header for enhanced security
add_header Content-Security-Policy "
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self' data:;
    connect-src 'self' https://api.openai.com https://api.anthropic.com;
    frame-src 'none';
    object-src 'none';
" always;
```

## 📊 Monitoring and Logging

### Prometheus Metrics

```nginx
# Prometheus metrics endpoint
location /metrics {
    stub_status on;
    access_log off;
    allow 10.0.0.0/8;
    deny all;
}
```

### Log Configuration

```nginx
# Custom log format
log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                '$status $body_bytes_sent "$http_referer" '
                '"$http_user_agent" "$http_x_forwarded_for" '
                'rt=$request_time uct="$upstream_connect_time" '
                'uht="$upstream_header_time" urt="$upstream_response_time"';

access_log /var/log/nginx/access.log main;
error_log /var/log/nginx/error.log warn;
```

### Health Checks

```bash
# Simple health check script
#!/bin/bash
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80/health)
if [ $response -eq 200 ]; then
    echo "Service is healthy"
    exit 0
else
    echo "Service is unhealthy (HTTP $response)"
    exit 1
fi
```

## 🔧 Configuration Management

### Environment-Specific Configs

```bash
# Production environment
export NODE_ENV=production
export VITE_API_BASE_URL=https://api.ranbo.ai
export NGINX_WORKER_PROCESSES=auto
export NGINX_WORKER_CONNECTIONS=2048

# Staging environment  
export NODE_ENV=production
export VITE_API_BASE_URL=https://staging-api.ranbo.ai
export NGINX_WORKER_PROCESSES=2
export NGINX_WORKER_CONNECTIONS=1024
```

### ConfigMaps (Kubernetes)

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ranbo-play-config
data:
  nginx.conf: |
    server {
        listen 80;
        server_name _;
        root /usr/share/nginx/html;
        index index.html;
        
        # Production optimizations...
    }
  
  default.conf: |
    upstream backend {
        server api.ranbo.ai:443;
    }
```

## 🚨 Troubleshooting

### Common Issues

#### SPA Routing Problems
```bash
# Check if nginx is properly handling routes
curl -I http://localhost:80/nonexistent-route
# Should return 200 with index.html, not 404
```

#### Static Asset 404s
```bash
# Verify asset paths
find /usr/share/nginx/html -name "*.js" -o -name "*.css"
# Check nginx error logs for missing files
tail -f /var/log/nginx/error.log
```

#### Memory Issues
```bash
# Monitor container memory usage
docker stats ranbo-play
# Limit container memory
docker run -m 512m ranbo-play:latest
```

#### Performance Issues
```bash
# Enable nginx debugging
error_log /var/log/nginx/debug.log debug;
# Monitor response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:80
```

### Debug Commands

```bash
# Check container logs
docker logs ranbo-play

# Enter container for debugging
docker exec -it ranbo-play sh

# Test nginx configuration
docker exec ranbo-play nginx -t

# Reload nginx without downtime
docker exec ranbo-play nginx -s reload
```

## 📈 Performance Optimization

### Caching Strategy

```nginx
# Aggressive caching for static assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Vary Accept-Encoding;
}

# Cache API responses (if using proxy)
location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_key "$scheme$request_method$host$request_uri";
}
```

### Compression

```nginx
# Brotli compression (if available)
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Fallback to gzip
gzip on;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### CDN Integration

```nginx
# Serve static assets from CDN
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    return 301 https://cdn.ranbo.ai$uri;
}

# Or use CloudFront/S3 integration
location /static/ {
    proxy_pass https://ranbo-play-static.s3.amazonaws.com/;
    proxy_set_header Host ranbo-play-static.s3.amazonaws.com;
}
```

---

This deployment guide provides comprehensive instructions for running ranbo-play in various environments, from simple Docker containers to full Kubernetes clusters with monitoring and security considerations.