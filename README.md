# Special Participation D Website

A simple web application for documenting and displaying student participation submissions from **EdStem course 84647**, specifically filtering for "Participation D" posts.

## 🚀 Features

- **CSV-Based Storage**: Simple CSV file storage - no database required
- **EdStem Integration**: Fetches posts using the `edapi` library
- **Smart Filtering**: Only shows posts with "Participation D" in the title
- **LaTeX Rendering**: Full LaTeX support via KaTeX
- **Student Filtering**: Filter posts by student authors
- **Search**: Keyword search across post titles and content
- **Markdown Support**: Rich markdown rendering with GFM support
- **Authentication**: Password-based access control
- **Vercel Ready**: Deploy directly to Vercel

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     EdStem      │    │   CSV Export    │    │   CSV File      │
│     API         │◄──►│   (Python)      │───►│   (Data)        │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │   Web App       │
                                              │   (Next.js)     │
                                              │                 │
                                              └─────────────────┘
```

## 📋 Prerequisites

- Docker and Docker Compose (for local development)
- EdStem API token
- Node.js 18+ (for local development)
- Python 3.11+ (for CSV export)

## 🛠️ Quick Start

### 1. Setup Environment

```bash
git clone <repository-url>
cd edthing
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` with your EdStem credentials:

```env
# EdStem API
ED_API_TOKEN=your-api-token-here
ED_COURSE_ID=84647

# Site Configuration
SITE_PASSWORD=cs182
NEXTAUTH_SECRET=100
NEXTAUTH_URL=http://localhost:3000
```

**Getting Your EdStem API Token**:
1. Go to https://edstem.org/us/settings/api-tokens
2. Create a new API token
3. Copy it to `ED_API_TOKEN` in your `.env` file

### 3. Export Posts to CSV

```bash
./export_csv.sh
```

This will:
- Fetch all posts from EdStem course 84647
- Filter for posts with "Participation D" in the title
- Export to `ingest/participation_d_posts.csv`

### 4. Copy CSV to Web Directory

```bash
./update-csv-for-vercel.sh
```

This copies the CSV to `web/data/participation_d_posts.csv` for the web app to read.

### 5. Start Development Server

```bash
cd web
npm install
npm run dev
```

Or use Docker:

```bash
docker-compose up -d web
```

### 6. Access the Application

- Web UI: http://localhost:3000
- Sign in with your configured `SITE_PASSWORD` (default: `cs182`)

## 📖 How It Works

### Data Flow

1. **Export CSV**: Run `./export_csv.sh` to fetch posts from EdStem
2. **Filter**: Only posts with "Participation D" in the title are kept
3. **Convert**: Ed XML content is converted to Markdown with LaTeX support
4. **Store**: CSV is saved to `ingest/participation_d_posts.csv`
5. **Deploy**: CSV is copied to `web/data/` for the web app to read
6. **Display**: Web app reads from CSV and displays posts with filters

### CSV Structure

The CSV contains the following columns:
- `id` - Post ID from EdStem
- `title` - Post title
- `author` - Author name
- `content` - Post content (Markdown with LaTeX)
- `posted_at` - Post timestamp
- `url` - Link to original EdStem post
- `links` - Semicolon-separated list of URLs
- `attachments` - Semicolon-separated list of attachment filenames

## 🚀 Deployment to Vercel

### Quick Deploy

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push
   ```

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - **Set Root Directory to `web`** (important!)

3. **Configure Environment Variables**:
   In Vercel dashboard → Settings → Environment Variables:
   - `ED_API_TOKEN` - Your EdStem API token
   - `ED_COURSE_ID` - `84647`
   - `NEXTAUTH_SECRET` - Random secret (or use `100`)
   - `NEXTAUTH_URL` - Your Vercel URL (auto-set)
   - `SITE_PASSWORD` - Password for site access

4. **Deploy**: Vercel will automatically build and deploy

### Updating CSV Data

When you want to update the displayed posts:

```bash
# 1. Export fresh data from EdStem
./export_csv.sh

# 2. Copy to web directory
./update-csv-for-vercel.sh

# 3. Commit and push
git add web/data/participation_d_posts.csv
git commit -m "Update CSV data"
git push
```

Vercel will automatically redeploy with the new CSV.

## 🔧 Local Development

### Using Docker

```bash
# Start web app
docker-compose up -d web

# View logs
docker-compose logs -f web

# Stop
docker-compose down
```

### Without Docker

```bash
# Web app
cd web
npm install
npm run dev

# Export CSV (requires Python)
cd ingest
pip install -r requirements.txt
python simple_sync.py
```

## 📁 Project Structure

```
edthing/
├── ingest/                    # CSV export scripts
│   ├── simple_sync.py        # Main CSV export script
│   ├── participation_d_posts.csv  # Exported CSV data
│   └── requirements.txt      # Python dependencies
├── web/                       # Next.js web application
│   ├── app/                  # Next.js app directory
│   │   ├── api/             # API routes (read CSV)
│   │   └── page.tsx         # Main page
│   ├── components/           # React components
│   ├── data/                # CSV file location
│   └── package.json         # Node.js dependencies
├── export_csv.sh            # Export script wrapper
├── update-csv-for-vercel.sh # Copy CSV for deployment
└── docker-compose.yml       # Docker configuration
```

## 🎨 Features

### Filtering

- **Search**: Keyword search in titles and content
- **Student Filter**: Filter by student author (only shows students who authored filtered posts)
- **Sort**: Sort by newest, oldest, or most referenced

### LaTeX Support

Posts with LaTeX math render correctly using KaTeX:
- Inline math: `\( ... \)`
- Block math: Automatically detected
- Full LaTeX syntax support

### Markdown Rendering

- GitHub Flavored Markdown (GFM)
- Code blocks with syntax highlighting
- Links and images
- Tables, lists, and more

## 🔍 API Endpoints

- `GET /api/posts` - List and search posts (reads from CSV)
- `GET /api/posts/[id]` - Get individual post
- `GET /api/students` - List all student authors

## 🛡️ Security

- **Password Protection**: Site requires password to access
- **CSV in Repository**: CSV is committed to git (ensure no sensitive data)
- **Environment Variables**: Never commit `.env` file (already in `.gitignore`)

## 🐛 Troubleshooting

### CSV Not Found

If you see "No posts found":
1. Make sure CSV exists: `ls web/data/participation_d_posts.csv`
2. Run `./export_csv.sh` to generate it
3. Copy to web: `./update-csv-for-vercel.sh`

### LaTeX Not Rendering

- Ensure KaTeX CSS is loaded (already included in `globals.css`)
- Check that content uses `\( ... \)` syntax for inline math
- Verify `remark-math` and `rehype-katex` are installed

### Filter Not Working

- Ensure filter matches exactly: "Participation D" (case-insensitive) in title
- Re-export CSV if you changed filtering logic: `./export_csv.sh`

### Vercel Deployment Issues

- Make sure Root Directory is set to `web` in Vercel settings
- Verify all environment variables are set
- Check build logs for errors

## 📝 Updating Posts

To refresh the displayed posts:

1. **Fetch from EdStem**:
   ```bash
   ./export_csv.sh
   ```

2. **Copy to web directory**:
   ```bash
   ./update-csv-for-vercel.sh
   ```

3. **For Vercel**: Commit and push the updated CSV
4. **For local**: Restart the dev server or refresh browser

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [edapi](https://pypi.org/project/edapi/) - EdStem API Python library
- [Next.js](https://nextjs.org/) - React framework
- [KaTeX](https://katex.org/) - LaTeX rendering
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS