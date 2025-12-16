import { Pool } from 'pg';
import { Post, Student, Attachment, Link, SearchResult, SearchFilters, SiteConfig } from '@/types';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function getPosts(filters: SearchFilters = {}, page = 1, pageSize = 20): Promise<SearchResult> {
  const client = await pool.connect();

  try {
    let whereConditions = ['p.is_hidden = false'];
    let params: any[] = [];
    let paramIndex = 1;

    // Search query
    if (filters.query) {
      whereConditions.push(`p.search_vector @@ plainto_tsquery('english', $${paramIndex})`);
      params.push(filters.query);
      paramIndex++;
    }

    // Student filter
    if (filters.student_id) {
      whereConditions.push(`p.author_id = $${paramIndex}`);
      params.push(filters.student_id);
      paramIndex++;
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      whereConditions.push(`p.tags && $${paramIndex}`);
      params.push(filters.tags);
      paramIndex++;
    }

    // Has attachments filter
    if (filters.has_attachments) {
      whereConditions.push(`EXISTS (SELECT 1 FROM attachments a WHERE a.post_id = p.id)`);
    }

    // Date filters
    if (filters.date_from) {
      whereConditions.push(`p.posted_at >= $${paramIndex}`);
      params.push(filters.date_from);
      paramIndex++;
    }

    if (filters.date_to) {
      whereConditions.push(`p.posted_at <= $${paramIndex}`);
      params.push(filters.date_to);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Sorting
    let orderBy = 'p.posted_at DESC';
    if (filters.sort_by === 'oldest') {
      orderBy = 'p.posted_at ASC';
    } else if (filters.sort_by === 'most_referenced') {
      orderBy = 'array_length(p.tags, 1) DESC, p.posted_at DESC';
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM posts p ${whereClause}`;
    const countResult = await client.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Get posts with pagination
    const offset = (page - 1) * pageSize;
    const postsQuery = `
      SELECT
        p.*,
        s.display_name as author_name,
        s.email as author_email,
        COALESCE(json_agg(DISTINCT a.*) FILTER (WHERE a.id IS NOT NULL), '[]') as attachments,
        COALESCE(json_agg(DISTINCT l.*) FILTER (WHERE l.id IS NOT NULL), '[]') as links
      FROM posts p
      LEFT JOIN students s ON p.author_id = s.id
      LEFT JOIN attachments a ON p.id = a.post_id
      LEFT JOIN links l ON p.id = l.post_id
      ${whereClause}
      GROUP BY p.id, s.id
      ORDER BY ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(pageSize, offset);
    const postsResult = await client.query(postsQuery, params);

    const posts = postsResult.rows.map(row => ({
      ...row,
      attachments: row.attachments || [],
      links: row.links || [],
      author: row.author_id ? {
        id: row.author_id,
        display_name: row.author_name,
        email: row.author_email,
      } : undefined,
    }));

    return {
      posts,
      total,
      page,
      page_size: pageSize,
    };
  } finally {
    client.release();
  }
}

export async function getPostById(id: string): Promise<Post | null> {
  const client = await pool.connect();

  try {
    const query = `
      SELECT
        p.*,
        s.display_name as author_name,
        s.email as author_email,
        COALESCE(json_agg(DISTINCT a.*) FILTER (WHERE a.id IS NOT NULL), '[]') as attachments,
        COALESCE(json_agg(DISTINCT l.*) FILTER (WHERE l.id IS NOT NULL), '[]') as links
      FROM posts p
      LEFT JOIN students s ON p.author_id = s.id
      LEFT JOIN attachments a ON p.id = a.post_id
      LEFT JOIN links l ON p.id = l.post_id
      WHERE p.id = $1 AND p.is_hidden = false
      GROUP BY p.id, s.id
    `;

    const result = await client.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      ...row,
      attachments: row.attachments || [],
      links: row.links || [],
      author: row.author_id ? {
        id: row.author_id,
        display_name: row.author_name,
        email: row.author_email,
      } : undefined,
    };
  } finally {
    client.release();
  }
}

export async function getStudents(): Promise<Student[]> {
  const client = await pool.connect();

  try {
    const query = `
      SELECT s.*, COUNT(p.id) as post_count
      FROM students s
      LEFT JOIN posts p ON s.id = p.author_id AND p.is_hidden = false
      WHERE s.is_hidden = false
      GROUP BY s.id
      ORDER BY s.display_name
    `;

    const result = await client.query(query);
    return result.rows;
  } finally {
    client.release();
  }
}

export async function getTags(): Promise<string[]> {
  const client = await pool.connect();

  try {
    const query = `
      SELECT DISTINCT unnest(tags) as tag
      FROM posts
      WHERE is_hidden = false
      ORDER BY tag
    `;

    const result = await client.query(query);
    return result.rows.map(row => row.tag);
  } finally {
    client.release();
  }
}

export async function getSiteConfig(): Promise<SiteConfig> {
  const client = await pool.connect();

  try {
    const query = "SELECT value FROM site_config WHERE key = 'site_settings'";
    const result = await client.query(query);

    if (result.rows.length === 0) {
      return {
        public_site: false,
        require_auth: true,
        site_title: 'Student Participation Documentation',
        site_description: 'Browse and search student submissions for extra credit participation',
      };
    }

    return result.rows[0].value;
  } finally {
    client.release();
  }
}

export { pool };
