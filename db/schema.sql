-- Database schema for EdThing - Student Participation Documentation System

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ed_user_id BIGINT UNIQUE,
    display_name TEXT NOT NULL,
    email TEXT,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts table (main submissions)
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ed_post_id BIGINT UNIQUE NOT NULL,
    ed_thread_id BIGINT,
    title TEXT NOT NULL,
    content TEXT,
    author_id UUID REFERENCES students(id),
    posted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE,
    is_hidden BOOLEAN DEFAULT FALSE,
    url TEXT,
    category TEXT, -- Participation D, etc.
    tags TEXT[], -- ['Muon', 'MuP', 'Shampoo', etc.]
    search_vector TSVECTOR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attachments table
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    ed_attachment_id TEXT UNIQUE,
    download_url TEXT,
    preview_url TEXT,
    is_image BOOLEAN DEFAULT FALSE,
    is_pdf BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extracted links table
CREATE TABLE links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    link_type TEXT, -- 'github', 'personal', 'documentation', 'other'
    domain TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, url)
);

-- Ingestion tracking
CREATE TABLE ingestion_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    posts_processed INTEGER DEFAULT 0,
    posts_created INTEGER DEFAULT 0,
    posts_updated INTEGER DEFAULT 0,
    errors TEXT[],
    status TEXT DEFAULT 'running' -- 'running', 'completed', 'failed'
);

-- Site configuration
CREATE TABLE site_config (
    key TEXT PRIMARY KEY,
    value JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Search indexes
CREATE INDEX idx_posts_search_vector ON posts USING GIN(search_vector);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_posted_at ON posts(posted_at DESC);
CREATE INDEX idx_posts_tags ON posts USING GIN(tags);
CREATE INDEX idx_attachments_post_id ON attachments(post_id);
CREATE INDEX idx_links_post_id ON links(post_id);
CREATE INDEX idx_students_display_name ON students(display_name);
CREATE INDEX idx_students_ed_user_id ON students(ed_user_id);

-- Full-text search trigger function
CREATE OR REPLACE FUNCTION update_search_vector() RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.content, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update search vector
CREATE TRIGGER trigger_update_search_vector
    BEFORE INSERT OR UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- Insert default site configuration
INSERT INTO site_config (key, value) VALUES
('participation_rules', '{
    "keywords": ["Muon", "MuP", "Shampoo", "uP", "participation"],
    "allowed_categories": ["Participation D"],
    "tag_mappings": {
        "Muon": ["Muon", "MUON"],
        "MuP": ["MuP", "MUP", "μP"],
        "Shampoo": ["Shampoo", "SHAMPOO"],
        "uP": ["uP", "UP", "μP"]
    }
}'::jsonb),
('site_settings', '{
    "public_site": false,
    "require_auth": true,
    "site_title": "Student Participation Documentation",
    "site_description": "Browse and search student submissions for extra credit participation"
}'::jsonb);
