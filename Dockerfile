# Multi-stage build for ranbo-play React/Vite app
# Stage 1: Build stage
FROM node:20-alpine AS builder

# Build arguments for metadata
ARG VERSION=1.0.0
ARG BUILD_TIMESTAMP

# Set working directory
WORKDIR /app

# Ensure node_modules/.bin is in PATH
ENV PATH=/app/node_modules/.bin:$PATH

# Copy package files
COPY mvu-generator/package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy source code
COPY mvu-generator/ ./

# Build the application
RUN npm run build

# Stage 2: Runtime stage
FROM nginx:alpine AS runtime

# Build arguments for metadata
ARG VERSION=1.0.0
ARG BUILD_TIMESTAMP

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create necessary nginx temp directories with proper permissions
RUN mkdir -p /var/cache/nginx/client_temp \
    /var/cache/nginx/proxy_temp \
    /var/cache/nginx/fastcgi_temp \
    /var/cache/nginx/uwsgi_temp \
    /var/cache/nginx/scgi_temp && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Run as root (nginx drops privileges automatically for worker processes)
# This is required for nginx to manage PID file and bind to privileged ports

# Add labels for metadata
LABEL org.opencontainers.title="ranbo-play" \
      org.opencontainers.description="MVU 状态栏生成器 - React/Vite application" \
      org.opencontainers.version=${VERSION} \
      org.opencontainers.created=${BUILD_TIMESTAMP} \
      org.opencontainers.source="https://github.com/your-org/ranbo-play"

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]