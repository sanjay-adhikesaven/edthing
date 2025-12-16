#!/bin/bash

# Script to update CSV for Vercel deployment
# This copies the latest CSV from ingest to web/data

set -e

echo "🔄 Updating CSV for Vercel deployment..."

# Check if CSV exists in ingest
if [ ! -f "ingest/participation_d_posts.csv" ]; then
    echo "❌ Error: ingest/participation_d_posts.csv not found"
    echo "   Run ./export_csv.sh first to generate the CSV"
    exit 1
fi

# Ensure web/data directory exists
mkdir -p web/data

# Copy CSV to web/data
cp ingest/participation_d_posts.csv web/data/participation_d_posts.csv

echo "✅ CSV copied to web/data/participation_d_posts.csv"
echo ""
echo "📝 Next steps:"
echo "   1. Review the changes: git diff web/data/participation_d_posts.csv"
echo "   2. Commit: git add web/data/participation_d_posts.csv"
echo "   3. Push: git push"
echo "   4. Vercel will automatically redeploy with the new CSV"
