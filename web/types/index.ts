export interface Student {
  id: string;
  ed_user_id: number;
  display_name: string;
  email?: string;
  is_hidden: boolean;
  post_count?: number; // Number of posts by this student
  created_at?: string;
  updated_at?: string;
}

export interface Attachment {
  id: string;
  post_id: string;
  filename: string;
  file_type?: string;
  file_size?: number;
  ed_attachment_id?: string;
  download_url?: string;
  preview_url?: string;
  is_image: boolean;
  is_pdf: boolean;
  created_at: string;
}

export interface Link {
  id: string;
  post_id: string;
  url: string;
  title?: string;
  link_type: 'github' | 'personal' | 'documentation' | 'other';
  domain: string;
  created_at: string;
}

export interface Post {
  id: string;
  ed_post_id: number;
  ed_thread_id?: number;
  title: string;
  content?: string;
  author_id?: string;
  author?: Student;
  posted_at: string;
  updated_at?: string;
  is_hidden: boolean;
  url?: string;
  category?: string;
  tags: string[];
  attachments: Attachment[];
  links: Link[];
  search_vector?: string;
  created_at: string;
}

export interface SearchFilters {
  query?: string;
  student_id?: string;
  tags?: string[];
  has_attachments?: boolean;
  date_from?: string;
  date_to?: string;
  sort_by?: 'newest' | 'oldest' | 'most_referenced';
  homework?: string; // Homework number filter
}

export interface SearchResult {
  posts: Post[];
  total: number;
  page: number;
  page_size: number;
}

export interface SiteConfig {
  public_site: boolean;
  require_auth: boolean;
  site_title: string;
  site_description: string;
}
