#!/bin/bash

# Simple CSV export script
# Collects posts, filters for "Special Participation D", exports to CSV

set -a
source .env
set +a

echo "🔄 Collecting and filtering posts..."

docker-compose exec ingest python simple_sync.py

echo "✅ Export complete! CSV saved to ingest/participation_d_posts.csv"
echo "📊 Refresh your browser to see the updated posts"
