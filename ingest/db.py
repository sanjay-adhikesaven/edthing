"""
Database operations for EdThing ingestion
"""
import psycopg2
from psycopg2.extras import RealDictCursor, execute_values
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)

class Database:
    def __init__(self, connection_string: str):
        self.connection_string = connection_string
        self._connection = None

    def connect(self):
        """Get database connection"""
        if self._connection is None or self._connection.closed:
            self._connection = psycopg2.connect(self.connection_string)
        return self._connection

    def close(self):
        """Close database connection"""
        if self._connection:
            self._connection.close()
            self._connection = None

    def get_last_ingestion_time(self) -> Optional[datetime]:
        """Get the timestamp of the last successful ingestion"""
        conn = self.connect()
        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT completed_at
                    FROM ingestion_runs
                    WHERE status = 'completed'
                    ORDER BY completed_at DESC
                    LIMIT 1
                """)
                result = cursor.fetchone()
                return result[0] if result else None
        except Exception as e:
            logger.error(f"Failed to get last ingestion time: {e}")
            return None

    def start_ingestion_run(self) -> str:
        """Start a new ingestion run and return its ID"""
        conn = self.connect()
        run_id = str(uuid.uuid4())
        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO ingestion_runs (id, status)
                    VALUES (%s, 'running')
                """, (run_id,))
            conn.commit()
            return run_id
        except Exception as e:
            logger.error(f"Failed to start ingestion run: {e}")
            conn.rollback()
            raise

    def complete_ingestion_run(self, run_id: str, stats: Dict[str, Any], errors: List[str] = None):
        """Complete an ingestion run with statistics"""
        conn = self.connect()
        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE ingestion_runs
                    SET completed_at = NOW(),
                        status = 'completed',
                        posts_processed = %s,
                        posts_created = %s,
                        posts_updated = %s,
                        errors = %s
                    WHERE id = %s
                """, (
                    stats.get('processed', 0),
                    stats.get('created', 0),
                    stats.get('updated', 0),
                    errors or [],
                    run_id
                ))
            conn.commit()
        except Exception as e:
            logger.error(f"Failed to complete ingestion run: {e}")
            conn.rollback()

    def upsert_student(self, ed_user_id: int, display_name: str, email: str = None) -> str:
        """Upsert a student and return their ID"""
        conn = self.connect()
        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO students (ed_user_id, display_name, email)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (ed_user_id) DO UPDATE SET
                        display_name = EXCLUDED.display_name,
                        email = EXCLUDED.email,
                        updated_at = NOW()
                    RETURNING id
                """, (ed_user_id, display_name, email))
                result = cursor.fetchone()
                conn.commit()
                return str(result[0]) if result else None
        except Exception as e:
            logger.error(f"Failed to upsert student {ed_user_id}: {e}")
            conn.rollback()
            return None

    def upsert_post(self, post_data: Dict[str, Any]) -> bool:
        """Upsert a post"""
        conn = self.connect()
        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO posts (
                        ed_post_id, ed_thread_id, title, content, author_id,
                        posted_at, updated_at, url, category, tags
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (ed_post_id) DO UPDATE SET
                        title = EXCLUDED.title,
                        content = EXCLUDED.content,
                        updated_at = EXCLUDED.updated_at,
                        url = EXCLUDED.url,
                        category = EXCLUDED.category,
                        tags = EXCLUDED.tags
                    RETURNING id
                """, (
                    post_data['ed_post_id'],
                    post_data.get('ed_thread_id'),
                    post_data['title'],
                    post_data.get('content'),
                    post_data.get('author_id'),
                    post_data['posted_at'],
                    post_data.get('updated_at'),
                    post_data.get('url'),
                    post_data.get('category'),
                    post_data.get('tags', [])
                ))
                result = cursor.fetchone()
                post_id = str(result[0]) if result else None

                if post_id:
                    # Handle attachments
                    if post_data.get('attachments'):
                        self._upsert_attachments(post_id, post_data['attachments'])

                    # Handle links
                    if post_data.get('links'):
                        self._upsert_links(post_id, post_data['links'])

                conn.commit()
                return True
        except Exception as e:
            logger.error(f"Failed to upsert post {post_data.get('ed_post_id')}: {e}")
            conn.rollback()
            return False

    def _upsert_attachments(self, post_id: str, attachments: List[Dict[str, Any]]):
        """Upsert attachments for a post"""
        if not attachments:
            return

        conn = self.connect()
        try:
            with conn.cursor() as cursor:
                # Delete existing attachments for this post
                cursor.execute("DELETE FROM attachments WHERE post_id = %s", (post_id,))

                # Insert new attachments
                values = []
                for att in attachments:
                    values.append((
                        post_id,
                        att['filename'],
                        att.get('file_type'),
                        att.get('file_size'),
                        att.get('ed_attachment_id'),
                        att.get('download_url'),
                        att.get('preview_url'),
                        att.get('is_image', False),
                        att.get('is_pdf', False)
                    ))

                execute_values(cursor, """
                    INSERT INTO attachments (
                        post_id, filename, file_type, file_size, ed_attachment_id,
                        download_url, preview_url, is_image, is_pdf
                    ) VALUES %s
                """, values)
        except Exception as e:
            logger.error(f"Failed to upsert attachments for post {post_id}: {e}")

    def _upsert_links(self, post_id: str, links: List[Dict[str, Any]]):
        """Upsert links for a post"""
        if not links:
            return

        conn = self.connect()
        try:
            with conn.cursor() as cursor:
                # Delete existing links for this post
                cursor.execute("DELETE FROM links WHERE post_id = %s", (post_id,))

                # Insert new links
                values = []
                for link in links:
                    values.append((
                        post_id,
                        link['url'],
                        link.get('title'),
                        link.get('link_type'),
                        link.get('domain')
                    ))

                execute_values(cursor, """
                    INSERT INTO links (
                        post_id, url, title, link_type, domain
                    ) VALUES %s
                """, values)
        except Exception as e:
            logger.error(f"Failed to upsert links for post {post_id}: {e}")

    def get_hidden_posts(self) -> set:
        """Get set of hidden post IDs"""
        conn = self.connect()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT ed_post_id FROM posts WHERE is_hidden = true")
                return {row[0] for row in cursor.fetchall()}
        except Exception as e:
            logger.error(f"Failed to get hidden posts: {e}")
            return set()

    def get_hidden_students(self) -> set:
        """Get set of hidden student IDs"""
        conn = self.connect()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT ed_user_id FROM students WHERE is_hidden = true")
                return {row[0] for row in cursor.fetchall()}
        except Exception as e:
            logger.error(f"Failed to get hidden students: {e}")
            return set()
