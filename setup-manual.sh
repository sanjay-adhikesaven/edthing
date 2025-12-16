#!/bin/bash

# Manual EdThing Setup Script (without docker-compose)
# This script runs Docker commands individually to avoid docker-compose dependency

set -e

echo "🚀 Manual EdThing Setup - Student Participation Documentation System"
echo

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found. Please copy env.example to .env and configure it."
    echo "   cp env.example .env"
    exit 1
fi

# Load environment variables
set -a
source .env
set +a

# Check required environment variables
required_vars=("ED_USERNAME" "ED_COURSE_ID" "SITE_PASSWORD")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: $var is not set in .env file"
        exit 1
    fi
done

# Warn about missing password (may be OK for SSO)
if [ -z "$ED_PASSWORD" ]; then
    echo "⚠️  Warning: ED_PASSWORD not set - this may be required for EdStem API access"
    echo "   If you use SSO, try running without it first"
fi

echo "✅ Environment configuration validated"
echo "👤 EdStem Username: $ED_USERNAME"
echo "📚 Course ID configured: $ED_COURSE_ID"
echo "🔐 Site Password: $SITE_PASSWORD"
echo "🔑 Auth Secret: $NEXTAUTH_SECRET"
echo

# Function to check if container is running
container_running() {
    docker ps --filter "name=$1" --filter "status=running" | grep -q "$1"
}

# Start PostgreSQL database
echo "🐳 Starting PostgreSQL database..."
docker run -d \
  --name edthing-db \
  -e POSTGRES_DB=edthing \
  -e POSTGRES_USER=edthing \
  -e POSTGRES_PASSWORD=edthing \
  -p 5432:5432 \
  -v edthing_postgres_data:/var/lib/postgresql/data \
  postgres:15

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 15

# Run database migrations
echo "🗄️  Running database migrations..."
docker run --rm \
  -v $(pwd)/db:/db \
  --link edthing-db:db \
  postgres:15 \
  sh -c "PGPASSWORD=edthing psql -h db -U edthing -d edthing -f /db/schema.sql"

# Start ingestion service for setup
echo "⚙️  Running initial setup..."
docker run -d \
  --name edthing-ingest-setup \
  -v $(pwd)/ingest:/app \
  --link edthing-db:db \
  -e DATABASE_URL=postgresql://edthing:edthing@db:5432/edthing \
  -e ED_USERNAME=$ED_USERNAME \
  -e ED_PASSWORD=$ED_PASSWORD \
  -e ED_COURSE_ID=$ED_COURSE_ID \
  -e SITE_PASSWORD=$SITE_PASSWORD \
  -e ADMIN_PASSWORD=$ADMIN_PASSWORD \
  python:3.11-slim \
  sh -c "cd /app && pip install -r requirements.txt && python setup.py"

# Wait for setup to complete
echo "⏳ Waiting for setup to complete..."
sleep 10

# Check if setup was successful
if docker logs edthing-ingest-setup 2>&1 | grep -q "Site configuration initialized successfully"; then
    echo "✅ Setup completed successfully!"
else
    echo "⚠️  Setup may have encountered issues. Check logs:"
    echo "   docker logs edthing-ingest-setup"
fi

# Clean up setup container
docker rm -f edthing-ingest-setup

# Start web application
echo "🌐 Starting web application..."
docker run -d \
  --name edthing-web \
  -p 3000:3000 \
  -v $(pwd)/web:/app \
  --link edthing-db:db \
  -e DATABASE_URL=postgresql://edthing:edthing@db:5432/edthing \
  -e NEXTAUTH_SECRET=$NEXTAUTH_SECRET \
  -e NEXTAUTH_URL=http://localhost:3000 \
  -e SITE_PASSWORD=$SITE_PASSWORD \
  node:18-alpine \
  sh -c "cd /app && npm install && npm run build && npm start"

echo
echo "🎉 EdThing is now running!"
echo
echo "📱 Access the application at: http://localhost:3000"
echo "🔐 Sign in with password: $SITE_PASSWORD"
echo
echo "📚 Next steps:"
echo "   1. Test data ingestion: ./run-ingest.sh"
echo "   2. View web logs: docker logs edthing-web"
echo "   3. View db logs: docker logs edthing-db"
echo "   4. Stop services: ./stop-services.sh"
echo
echo "📖 See README.md for detailed documentation"
