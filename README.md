# EdThing - Student Participation Documentation System

A production-ready web application for documenting and crediting student participation submissions from **EdStem course 84647**, specifically designed for tracking Muon and MuP updates.

## 🚀 Features

- **EdStem Integration**: Automatically sync posts using the `edpy` library
- **Smart Filtering**: Identifies Participation D posts with keyword-based and category-based filtering
- **Full-Text Search**: PostgreSQL-powered search across titles, content, attachments, and links
- **Rich UI**: Clean, Ed-like interface with markdown rendering and attachment previews
- **Authentication**: Configurable password-based access control
- **Link Extraction**: Automatically detects and categorizes GitHub repos, personal sites, and documentation
- **Attachment Handling**: Metadata storage with download links for files
- **Docker Ready**: Complete containerized setup for development and deployment

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     EdStem      │    │   Ingestion     │    │   Database      │
│     API         │◄──►│   Service       │◄──►│   (Postgres)    │
│                 │    │   (Python)      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                ▲
                                │
                       ┌─────────────────┐
                       │   Web App       │
                       │   (Next.js)     │
                       │                 │
                       └─────────────────┘
```

## 📋 Prerequisites

- Docker and Docker Compose
- EdStem course access with API credentials
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

## 🛠️ Quick Start

1. **Clone and setup environment**:
   ```bash
   git clone <repository-url>
   cd edthing
   cp env.example .env
   ```

2. **Configure environment variables**:
   Edit `.env` with your EdStem credentials and settings:
   ```env
   # Database
   DATABASE_URL=postgresql://edthing:edthing@localhost:5432/edthing

   # EdStem API Credentials (UC Berkeley SSO)
   ED_USERNAME=sanjay.adhikesaven@berkeley.edu
   ED_PASSWORD=your-edstem-password  # May not be needed for SSO
   ED_COURSE_ID=84647

   # Site Configuration
   SITE_PASSWORD=cs182
   NEXTAUTH_SECRET=100
   ```

3. **Start the development environment**:
   ```bash
   docker-compose up -d
   ```

4. **Initialize the database**:
   ```bash
   docker-compose exec ingest python -m ingest.sync --manual
   ```

5. **Access the application**:
   - Web UI: http://localhost:3000
   - Sign in with your configured `SITE_PASSWORD`

## 🛠️ Alternative Setup (Without Docker Compose)

If you don't have Docker Compose installed, use the manual setup scripts:

1. **Run manual setup**:
   ```bash
   ./setup-manual.sh
   ```

2. **Run data ingestion**:
   ```bash
   ./run-ingest.sh
   ```

3. **Stop services**:
   ```bash
   ./stop-services.sh
   ```

## 📖 Detailed Setup

### 1. EdStem Configuration

To get your EdStem credentials:

1. Navigate to your specific course: https://edstem.org/us/courses/84647/
2. Verify you're on the correct course (the course ID `84647` is already configured)
3. Use your UC Berkeley SSO credentials

**SSO Users (UC Berkeley)**: If your organization uses SSO, you may not need to set `ED_PASSWORD`. The `edpy` library should handle SSO authentication automatically with just your username.

**Username**: `sanjay.adhikesaven@berkeley.edu` (already configured)

**Important**: The system is configured to pull from course ID `84647`. If you need to change this, update the `ED_COURSE_ID` in your `.env` file.

**Security Note**: Store credentials securely and never commit them to version control.

### 2. Database Setup

The application uses PostgreSQL with the following key features:
- Full-text search on posts (titles, content)
- JSON storage for flexible metadata
- Automatic search vector updates via triggers
- Indexed queries for performance

### 3. Ingestion Service

The ingestion service:
- Uses `edpy` to fetch EdStem posts
- Filters for Participation D content using configurable rules
- Extracts attachments, links, and metadata
- Runs incremental syncs to avoid re-processing

**Participation D Filtering Rules**:
- Keywords: "Muon", "MuP", "Shampoo", "uP", "participation"
- Categories: "Participation D"
- Configurable via `site_config` table

### 4. Web Application

Built with Next.js 14 and features:
- **Search**: Full-text search with instant results
- **Filters**: By student, tags, date range, attachments
- **Browse**: Posts by recency, reference count, student
- **Authentication**: Password-based with session management
- **Responsive**: Mobile-friendly design

## 🔧 Configuration

### Site Settings

Configure via database `site_config` table:

```sql
-- Update site settings
UPDATE site_config
SET value = '{
  "public_site": false,
  "require_auth": true,
  "site_title": "Student Participation Documentation",
  "site_description": "Browse and search student submissions"
}'::jsonb
WHERE key = 'site_settings';
```

### Participation Rules

Customize filtering rules:

```sql
UPDATE site_config
SET value = '{
  "keywords": ["Muon", "MuP", "Shampoo", "uP"],
  "allowed_categories": ["Participation D"],
  "tag_mappings": {
    "Muon": ["Muon", "MUON"],
    "MuP": ["MuP", "MUP", "μP"],
    "Shampoo": ["Shampoo", "SHAMPOO"],
    "uP": ["uP", "UP", "μP"]
  }
}'::jsonb
WHERE key = 'participation_rules';
```

## 🚀 Deployment

### Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f web

# Run ingestion manually
docker-compose exec ingest python -m ingest.sync --manual

# Stop services
docker-compose down
```

### Production

For production deployment, consider:

1. **Vercel + Railway/PlanetScale**:
   - Deploy web app to Vercel
   - Use Railway or PlanetScale for PostgreSQL
   - Set environment variables in Vercel dashboard

2. **Fly.io**:
   - Full stack deployment with Fly Postgres
   - Zero-config deployments

3. **Railway**:
   - Deploy both web and ingestion service
   - Managed PostgreSQL database

### Environment Variables for Production

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# EdStem (UC Berkeley SSO)
ED_USERNAME=sanjay.adhikesaven@berkeley.edu
ED_PASSWORD=your-edstem-password
ED_COURSE_ID=84647

# Auth
NEXTAUTH_SECRET=100
NEXTAUTH_URL=https://your-domain.com
SITE_PASSWORD=cs182

# Ingestion
SYNC_INTERVAL_MINUTES=60
```

## 🔍 API Endpoints

### Posts
- `GET /api/posts` - Search and filter posts
- `GET /api/posts/[id]` - Get individual post

### Metadata
- `GET /api/students` - List all students
- `GET /api/tags` - List all tags

### Authentication
- `POST /api/auth/signin` - Sign in endpoint

## 🛡️ Privacy & Security

- **No Public Data**: Private by default, requires authentication
- **Credential Security**: EdStem credentials encrypted at rest
- **Access Control**: Configurable authentication requirements
- **Data Redaction**: Admin controls to hide sensitive posts/users

## 🐛 Troubleshooting

### Common Issues

1. **Ingestion fails with auth error**:
   - Verify EdStem credentials
   - Check course ID is correct
   - Ensure account has API access

2. **Database connection fails**:
   - Check `DATABASE_URL` format
   - Verify PostgreSQL is running
   - Run migrations: `docker-compose exec db psql -U edthing -d edthing -f /docker-entrypoint-initdb.d/schema.sql`

3. **Search not working**:
   - Ensure search vectors are updated
   - Check PostgreSQL trigram extension is installed

### Logs

```bash
# View web app logs
docker-compose logs web

# View ingestion logs
docker-compose logs ingest

# View database logs
docker-compose logs db
```

## 📊 Data Model

### Core Tables

- **students**: User information and display names
- **posts**: Main content with full-text search
- **attachments**: File metadata and download links
- **links**: Extracted URLs with categorization
- **ingestion_runs**: Sync tracking and error logging
- **site_config**: Application configuration

### Search Indexing

Posts are automatically indexed for full-text search on:
- Title (weighted high)
- Content (weighted medium)
- Tags and categories
- Student names

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [edpy](https://github.com/bachtran02/edpy) - EdStem API wrapper
- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [PostgreSQL](https://postgresql.org/) - Advanced database
