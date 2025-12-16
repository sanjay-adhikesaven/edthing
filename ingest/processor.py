"""
Post processing and filtering for EdThing ingestion
"""
import re
import logging
from typing import Dict, List, Any, Optional, Set
from urllib.parse import urlparse
from datetime import datetime
import requests
from bs4 import BeautifulSoup, NavigableString

logger = logging.getLogger(__name__)

class PostProcessor:
    def __init__(self, rules: Dict[str, Any]):
        self.rules = rules

    def is_participation_post(self, post: Dict[str, Any]) -> bool:
        """Check if a post qualifies for Participation D - MUST have 'Participation D' in title"""
        # Get title from various possible field names
        title = (post.get('title') or post.get('subject') or '').strip()
        
        # Strict filter: title must contain "Participation D" (case-insensitive)
        if not title:
            return False
            
        title_lower = title.lower()
        if 'participation d' in title_lower:
            return True

        return False

    def extract_tags(self, title: str, content: str) -> List[str]:
        """Extract tags like Muon, MuP, etc. from post content"""
        tags = []
        text = f"{title} {content}".lower()

        tag_mappings = self.rules.get('tag_mappings', {})

        for tag_name, keywords in tag_mappings.items():
            for keyword in keywords:
                if keyword.lower() in text:
                    tags.append(tag_name)
                    break

        return list(set(tags))  # Remove duplicates

    def extract_links(self, content: str) -> List[Dict[str, Any]]:
        """Extract and classify links from post content"""
        links = []

        # Find all URLs using regex
        url_pattern = r'https?://[^\s<>"]+|www\.[^\s<>"]+'
        urls = re.findall(url_pattern, content)

        for url in urls:
            if not url.startswith('http'):
                url = f'https://{url}'

            try:
                parsed = urlparse(url)
                domain = parsed.netloc.lower()

                # Classify link type
                link_type = self._classify_link(url, domain)

                links.append({
                    'url': url,
                    'domain': domain,
                    'link_type': link_type,
                    'title': self._extract_link_title(url) if link_type in ['github', 'personal'] else None
                })
            except Exception as e:
                logger.warning(f"Failed to process URL {url}: {e}")

        return links

    def _classify_link(self, url: str, domain: str) -> str:
        """Classify the type of link"""
        if 'github.com' in domain:
            return 'github'
        elif any(ext in domain for ext in ['.github.io', 'vercel.app', 'netlify.app']):
            return 'personal'
        elif any(term in url.lower() for term in ['docs', 'documentation', 'readme', 'wiki']):
            return 'documentation'
        else:
            return 'other'

    def _extract_link_title(self, url: str) -> Optional[str]:
        """Try to extract a title from a URL (for GitHub repos, etc.)"""
        try:
            # Only attempt for GitHub repos to avoid rate limits
            if 'github.com' in url and '/blob/' not in url and '/tree/' not in url:
                response = requests.get(url, timeout=5, headers={
                    'User-Agent': 'EdThing-Bot/1.0'
                })
                if response.status_code == 200:
                    soup = BeautifulSoup(response.content, 'html.parser')
                    title_tag = soup.find('title')
                    if title_tag:
                        return title_tag.get_text().strip()
        except Exception as e:
            logger.debug(f"Failed to extract title from {url}: {e}")

        return None

    def process_attachments(self, attachments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Process and enhance attachment metadata"""
        processed = []

        for att in attachments:
            filename = att.get('filename', '')
            file_type = att.get('file_type', '')

            processed_att = {
                'filename': filename,
                'file_type': file_type,
                'file_size': att.get('size'),
                'ed_attachment_id': att.get('id'),
                'download_url': att.get('download_url'),
                'preview_url': att.get('preview_url'),
                'is_image': file_type.startswith('image/'),
                'is_pdf': file_type == 'application/pdf' or filename.lower().endswith('.pdf')
            }

            processed.append(processed_att)

        return processed

    def process_post(self, post: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Process a complete post for ingestion"""
        if not self.is_participation_post(post):
            return None

        # Normalize commonly used fields from Ed API
        raw_title = post.get('title') or post.get('subject') or ''
        raw_content_xml = (
            post.get('content')
            or post.get('body')
            or post.get('text')
            or ''
        )
        # Convert Ed XML document into markdown for nicer rendering
        raw_content = self._convert_ed_document_to_markdown(raw_content_xml)
        raw_category = post.get('category') or post.get('folder') or post.get('type')
        raw_attachments = post.get('attachments') or post.get('files') or []

        # Extract basic post data
        processed_post = {
            'ed_post_id': post['id'],
            'ed_thread_id': post.get('thread_id'),
            'title': raw_title,
            'content': raw_content,
            'posted_at': self._parse_datetime(
                post.get('created_at')
                or post.get('createdAt')
                or post.get('created')
            ),
            'updated_at': self._parse_datetime(
                post.get('updated_at')
                or post.get('updatedAt')
                or post.get('edited_at')
            ),
            'url': post.get('url') or (f"https://edstem.org/us/courses/{post.get('course_id', '')}/discussion/{post['id']}" if post.get('id') else None),
            'category': raw_category if isinstance(raw_category, str) else (raw_category.get('name') if isinstance(raw_category, dict) else ''),
            'tags': self.extract_tags(raw_title, raw_content),
            'attachments': self.process_attachments(raw_attachments),
            'links': self.extract_links(raw_content)
        }

        # Handle author
        author_data = post.get('author') or post.get('user') or post.get('creator')
        if author_data:
            processed_post['author_id'] = author_data.get('id')
            processed_post['author_info'] = {
                'ed_user_id': author_data.get('id'),
                'display_name': author_data.get('name', 'Anonymous'),
                'email': author_data.get('email')
            }

        return processed_post

    def _parse_datetime(self, dt_str: Optional[str]) -> Optional[datetime]:
        """Parse datetime string from EdStem API"""
        if not dt_str:
            return None

        try:
            # EdStem typically returns ISO format
            return datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
        except Exception as e:
            logger.warning(f"Failed to parse datetime {dt_str}: {e}")
            return None

    def _convert_ed_document_to_markdown(self, content: str) -> str:
        """
        Convert Ed's XML document format into a rough Markdown representation.
        This is not perfect but makes posts readable and preserves LaTeX/math.
        """
        if not content or not content.lstrip().startswith("<document"):
            return content

        try:
            soup = BeautifulSoup(content, "xml")
            document = soup.find("document")
            if not document:
                return content

            def render(node) -> str:
                if isinstance(node, NavigableString):
                    return str(node)

                children_text = "".join(render(child) for child in node.children)

                name = node.name
                if name == "paragraph":
                    return children_text + "\n\n"
                if name == "bold":
                    return f"**{children_text}**"
                if name == "italic":
                    return f"*{children_text}*"
                if name == "code":
                    return f"`{children_text}`"
                if name in ("pre", "snippet"):
                    return f"\n```text\n{children_text}\n```\n\n"
                if name == "math":
                    # Wrap LaTeX so remark-math / KaTeX can render it
                    inner = children_text.strip()
                    return f"\\({inner}\\)"
                if name == "link":
                    href = node.get("href", "").strip()
                    text = children_text.strip() or href
                    return f"[{text}]({href})"
                if name == "list":
                    # Flatten list items; we don't distinguish bullet vs number here
                    return children_text + "\n"
                if name == "list-item":
                    return f"- {children_text.strip()}\n"
                # Fallback: just render children
                return children_text

            markdown = "".join(render(child) for child in document.children)
            return markdown.strip()
        except Exception as e:
            logger.warning(f"Failed to convert Ed document to markdown: {e}")
            return content
