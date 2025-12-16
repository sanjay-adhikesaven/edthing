#!/bin/bash

# Stop EdThing services

echo "🛑 Stopping EdThing services..."

docker stop edthing-web edthing-db 2>/dev/null || true
docker rm edthing-web edthing-db 2>/dev/null || true

echo "✅ Services stopped!"
