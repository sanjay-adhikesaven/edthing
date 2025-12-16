#!/usr/bin/env python3
"""
Database migration script for EdThing
"""
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_db_connection():
    """Get database connection from environment"""
    db_url = os.getenv('DATABASE_URL', 'postgresql://edthing:edthing@localhost:5432/edthing')
    return psycopg2.connect(db_url)

def run_migration():
    """Run database migrations"""
    try:
        conn = get_db_connection()
        conn.autocommit = True

        with conn.cursor() as cursor:
            # Check if schema exists
            cursor.execute("""
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_name = 'posts'
                );
            """)

            if not cursor.fetchone()[0]:
                logger.info("Initializing database schema...")
                with open('/Users/sanjayadhikesaven/edthing/db/schema.sql', 'r') as f:
                    schema_sql = f.read()

                cursor.execute(schema_sql)
                logger.info("Database schema initialized successfully")
            else:
                logger.info("Database schema already exists")

        conn.close()
        logger.info("Migration completed successfully")

    except Exception as e:
        logger.error(f"Migration failed: {e}")
        raise

if __name__ == "__main__":
    run_migration()
