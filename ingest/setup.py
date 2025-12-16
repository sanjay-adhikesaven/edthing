#!/usr/bin/env python3
"""
Setup script for EdThing - Initialize site configuration and passwords
"""
import os
import bcrypt
import psycopg2
from psycopg2.extras import RealDictCursor
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_db_connection():
    """Get database connection"""
    db_url = os.getenv('DATABASE_URL', 'postgresql://edthing:edthing@localhost:5432/edthing')
    return psycopg2.connect(db_url)

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def setup_site():
    """Initialize site configuration"""
    site_password = os.getenv('SITE_PASSWORD')
    admin_password = os.getenv('ADMIN_PASSWORD')

    if not site_password:
        logger.error("SITE_PASSWORD environment variable is required")
        return False

    try:
        conn = get_db_connection()

        # Hash passwords
        hashed_site_password = hash_password(site_password)
        hashed_admin_password = hash_password(admin_password) if admin_password else None

        # Update or insert site configuration
        with conn.cursor() as cursor:
            # Insert default configuration
            cursor.execute("""
                INSERT INTO site_config (key, value)
                VALUES ('site_settings', %s)
                ON CONFLICT (key) DO UPDATE SET
                    value = EXCLUDED.value
            """, [f'''
{{
  "public_site": false,
  "require_auth": true,
  "site_title": "Student Participation Documentation",
  "site_description": "Browse and search student submissions for extra credit participation"
}}
            '''.strip()])

            cursor.execute("""
                INSERT INTO site_config (key, value)
                VALUES ('auth_config', %s)
                ON CONFLICT (key) DO UPDATE SET
                    value = EXCLUDED.value
            """, [f'''
{{
  "site_password_hash": "{hashed_site_password}",
  "admin_password_hash": "{hashed_admin_password or ""}"
}}
            '''.strip()])

        conn.commit()
        logger.info("Site configuration initialized successfully")

        # Test the setup
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("SELECT value FROM site_config WHERE key = 'site_settings'")
            result = cursor.fetchone()
            if result:
                logger.info("Configuration verified successfully")

        return True

    except Exception as e:
        logger.error(f"Setup failed: {e}")
        return False
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    success = setup_site()
    exit(0 if success else 1)
