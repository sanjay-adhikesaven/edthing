#!/usr/bin/env python3
"""
Main ingestion sync script for EdThing
"""
import time
import logging
import click
from datetime import datetime, timedelta
import schedule
from typing import Optional

# Note: this file is executed as a top-level module inside the container,
# so we use absolute imports instead of package-relative imports.
from config import config
from db import Database
from processor import PostProcessor

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class EdStemIngestor:
    def __init__(self):
        self.db = Database(config.database_url)
        self.processor = None
        self.last_sync = None

    def initialize(self):
        """Initialize the ingestor with current rules"""
        conn = self.db.connect()
        try:
            rules = config.get_participation_rules(conn)
            self.processor = PostProcessor(rules)
            self.last_sync = self.db.get_last_ingestion_time()
            logger.info(f"Initialized with last sync: {self.last_sync}")
        finally:
            conn.close()

    def sync_posts(self, since: Optional[datetime] = None, manual: bool = False) -> dict:
        """Sync posts from EdStem"""
        if not self.processor:
            self.initialize()

        run_id = self.db.start_ingestion_run()
        stats = {'processed': 0, 'created': 0, 'updated': 0}
        errors = []

        try:
            # Use the official edapi client for Ed API integration
            from edapi import EdAPI

            # Get posts since last sync or specified time
            since_time = since or self.last_sync
            if since_time:
                # Convert to timestamp for Ed API (kept for future incremental filtering)
                since_timestamp = int(since_time.timestamp())
            else:
                # Default to last 30 days for initial sync (not yet passed to edapi)
                since_timestamp = int((datetime.now() - timedelta(days=30)).timestamp())

            logger.info(f"Syncing posts since {since_time or '30 days ago'}")

            # Initialize Ed API using ED_API_TOKEN from environment
            ed = EdAPI()
            ed.login()

            course_id = int(config.ed_course_id)
            logger.info(f"Fetching threads from EdAPI for course {course_id}")
            threads = ed.list_threads(course_id=course_id, limit=100, offset=0, sort="new")
            logger.info(f"Fetched {len(threads)} threads from EdAPI for course {course_id}")

            hidden_posts = self.db.get_hidden_posts()
            hidden_students = self.db.get_hidden_students()

            participation_candidates = 0
            stored_posts = 0

            for thread in threads:
                try:
                    stats['processed'] += 1

                    # Skip hidden posts
                    if thread['id'] in hidden_posts:
                        continue

                    # Process the post
                    processed_post = self.processor.process_post(thread)
                    if not processed_post:
                        # Debug: log a small sample of skipped threads for visibility
                        if stats['processed'] <= 5:
                            logger.info(
                                "Thread %s skipped by participation filter; title=%r",
                                thread.get('id'),
                                thread.get('title') or thread.get('subject')
                            )
                        continue

                    participation_candidates += 1

                    # Skip posts by hidden students
                    if processed_post.get('author_info', {}).get('ed_user_id') in hidden_students:
                        continue

                    # Upsert author if present
                    author_info = processed_post.get('author_info')
                    if author_info:
                        author_id = self.db.upsert_student(
                            author_info['ed_user_id'],
                            author_info['display_name'],
                            author_info.get('email')
                        )
                        processed_post['author_id'] = author_id

                    # Upsert the post
                    if self.db.upsert_post(processed_post):
                        stats['created'] += 1
                        stored_posts += 1
                    else:
                        stats['updated'] += 1

                    # Rate limiting
                    time.sleep(0.1)

                except Exception as e:
                    error_msg = f"Failed to process thread {thread.get('id')}: {str(e)}"
                    logger.error(error_msg)
                    errors.append(error_msg)

            logger.info(
                "Sync completed: %s, participation_candidates=%d, stored_posts=%d",
                stats,
                participation_candidates,
                stored_posts,
            )

        except Exception as e:
            error_msg = f"Sync failed: {str(e)}"
            logger.error(error_msg)
            errors.append(error_msg)
            raise
        finally:
            self.db.complete_ingestion_run(run_id, stats, errors)

        return stats

    def run_continuous(self):
        """Run continuous ingestion"""
        logger.info("Starting continuous ingestion...")

        def sync_job():
            try:
                self.sync_posts()
            except Exception as e:
                logger.error(f"Sync job failed: {e}")

        # Schedule sync every configured interval
        schedule.every(config.sync_interval_minutes).minutes.do(sync_job)

        # Run initial sync
        sync_job()

        # Keep running
        while True:
            schedule.run_pending()
            time.sleep(60)

@click.group()
def cli():
    pass

@cli.command()
@click.option('--since', type=click.DateTime(), help='Sync posts since this datetime')
@click.option('--manual', is_flag=True, help='Manual sync (ignore last sync time)')
def sync(since, manual):
    """Sync posts from EdStem"""
    ingestor = EdStemIngestor()
    try:
        ingestor.initialize()
        stats = ingestor.sync_posts(since=since, manual=manual)
        click.echo(f"Sync completed: {stats}")
    except Exception as e:
        click.echo(f"Sync failed: {e}", err=True)
        raise click.Abort()
    finally:
        ingestor.db.close()

@cli.command()
def continuous():
    """Run continuous ingestion"""
    ingestor = EdStemIngestor()
    try:
        ingestor.initialize()
        ingestor.run_continuous()
    except KeyboardInterrupt:
        click.echo("Continuous ingestion stopped")
    except Exception as e:
        click.echo(f"Continuous ingestion failed: {e}", err=True)
        raise click.Abort()
    finally:
        ingestor.db.close()

if __name__ == "__main__":
    cli()
