# Deploying to Vercel

## Quick Setup

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set the **Root Directory** to `web` (important!)

3. **Configure Environment Variables**
   In Vercel dashboard → Settings → Environment Variables, add:
   - `ED_API_TOKEN` - Your EdStem API token
   - `ED_COURSE_ID` - Your course ID (e.g., `84647`)
   - `NEXTAUTH_SECRET` - A random secret (e.g., `100` or generate one)
   - `NEXTAUTH_URL` - Your Vercel URL (e.g., `https://your-app.vercel.app`)
   - `SITE_PASSWORD` - Password for site access (e.g., `cs182`)
   - `SYNC_SECRET` (optional) - Secret token for `/api/sync` endpoint

4. **Deploy**
   - Vercel will automatically build and deploy
   - The CSV file in `web/data/participation_d_posts.csv` will be included

## Updating the CSV

### Option 1: Manual Update (Recommended for now)
1. Run locally: `./export_csv.sh`
2. Copy the CSV: `cp ingest/participation_d_posts.csv web/data/participation_d_posts.csv`
3. Commit and push:
   ```bash
   git add web/data/participation_d_posts.csv
   git commit -m "Update CSV data"
   git push
   ```
4. Vercel will automatically redeploy

### Option 2: Automated Sync (Future)
- Set up a GitHub Action or Vercel Cron Job
- Call the `/api/sync` endpoint periodically
- Or use a separate service to regenerate CSV and commit it

## Vercel Cron Jobs (Optional)

To auto-sync CSV daily, add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/sync",
    "schedule": "0 0 * * *"
  }]
}
```

## Troubleshooting

- **CSV not found**: Make sure `web/data/participation_d_posts.csv` exists and is committed to git
- **Build fails**: Check that all environment variables are set
- **API errors**: Verify `ED_API_TOKEN` is correct and has access to the course
