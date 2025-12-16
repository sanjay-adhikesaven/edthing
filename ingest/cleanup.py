#!/usr/bin/env python3
"""
Cleanup script to remove posts that don't match "Special Participation D" filter
"""
import psycopg2
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def cleanup_non_participation_posts():
    """Remove posts that don't have 'Special Participation D' in title"""
    db_url = os.getenv('DATABASE_URL', 'postgresql://edthing:edthing@localhost:5432/edthing')
    
    conn = psycopg2.connect(db_url)
    try:
        with conn.cursor() as cursor:
            # Find posts that don't match the filter
            cursor.execute("""
                SELECT id, title FROM posts
                WHERE LOWER(title) NOT LIKE '%participation d%'
            """)
            
            non_matching = cursor.fetchall()
            logger.info(f"Found {len(non_matching)} posts that don't match filter")
            
            if non_matching:
                # Delete them
                cursor.execute("""
                    DELETE FROM posts
                    WHERE LOWER(title) NOT LIKE '%participation d%'
                """)
                conn.commit()
                logger.info(f"Deleted {len(non_matching)} non-matching posts")
            else:
                logger.info("All posts match the filter")
                
    finally:
        conn.close()

if __name__ == "__main__":
    cleanup_non_participation_posts()
