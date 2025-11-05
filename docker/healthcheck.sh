#!/bin/sh

# Health check script for ranbo-play container
# Checks if nginx is running and responding

# Test nginx process
if ! pgrep nginx > /dev/null; then
    echo "Nginx is not running"
    exit 1
fi

# Test HTTP endpoint
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/health)

if [ "$response" -eq 200 ]; then
    echo "Health check passed"
    exit 0
else
    echo "Health check failed (HTTP $response)"
    exit 1
fi