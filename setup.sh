#!/bin/bash

# EdThing Setup Script
# This script initializes the EdThing application for first-time use

set -e

echo "🚀 Setting up EdThing - Student Participation Documentation System"
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
required_vars=("ED_API_TOKEN" "ED_COURSE_ID" "SITE_PASSWORD")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: $var is not set in .env file"
        exit 1
    fi
done

echo "✅ Environment configuration validated"
echo "🔑 EdStem API Token: ${ED_API_TOKEN:0:10}..." # Show first 10 chars only
echo "📚 Course ID configured: $ED_COURSE_ID"
echo "🔐 Site Password: $SITE_PASSWORD"
echo "🔑 Auth Secret: $NEXTAUTH_SECRET"

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d db

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Database schema is now applied automatically by Postgres init scripts
echo "🗄️  Database migrations handled by container init scripts"

# Start ingestion service to run setup
echo "⚙️  Running initial setup..."
docker-compose up -d ingest

# Wait for setup to complete
echo "⏳ Waiting for setup to complete..."
sleep 15

# Check if setup was successful
if docker compose logs ingest | grep -q "Site configuration initialized successfully"; then
    echo "✅ Setup completed successfully!"
else
    echo "⚠️  Setup may have encountered issues. Check logs:"
    echo "   docker compose logs ingest"
fi

# Start web service
echo "🌐 Starting web application..."
docker-compose up -d web

echo
echo "🎉 EdThing is now running!"
echo
echo "📱 Access the application at: http://localhost:3000"
echo "🔐 Sign in with password: $SITE_PASSWORD"
echo
echo "📚 Next steps:"
echo "   1. Run initial ingestion: docker compose exec ingest python -m ingest.sync --manual"
echo "   2. Monitor logs: docker compose logs -f"
echo "   3. Stop services: docker compose down"
echo
echo "📖 See README.md for detailed documentation"
