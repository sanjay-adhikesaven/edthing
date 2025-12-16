#!/bin/bash

# Run EdThing ingestion manually

set -a
source .env
set +a

echo "🔄 Running EdThing data ingestion..."

docker run --rm \
  -v $(pwd)/ingest:/app \
  --link edthing-db:db \
  -e DATABASE_URL=postgresql://edthing:edthing@db:5432/edthing \
  -e ED_USERNAME=$ED_USERNAME \
  -e ED_PASSWORD=$ED_PASSWORD \
  -e ED_COURSE_ID=$ED_COURSE_ID \
  python:3.11-slim \
  sh -c "cd /app && pip install -r requirements.txt && python -m ingest.sync --manual"

echo "✅ Ingestion completed!"
