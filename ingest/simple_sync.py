#!/usr/bin/env python3
"""
Simple CSV-based ingestion - collect posts, filter for "Special Participation D", export to CSV
"""
import csv
import os
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from edapi import EdAPI

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def convert_xml_to_markdown(content: str) -> str:
    """Convert Ed XML content to markdown with proper LaTeX handling"""
    if not content:
        return ""
    
    try:
        from bs4 import BeautifulSoup, NavigableString
        
        # Try lxml-xml first, fallback to html.parser if XML fails
        try:
            soup = BeautifulSoup(content, 'lxml-xml')
        except:
            soup = BeautifulSoup(content, 'html.parser')
        
        # Find document tag
        doc = soup.find('document')
        if not doc:
            return content
        
        def process_element(elem):
            """Recursively process XML elements to markdown"""
            if isinstance(elem, NavigableString):
                return elem.string.strip() if elem.string else ""
            
            if not hasattr(elem, 'name') or not elem.name:
                return ""
            
            if elem.name == 'paragraph':
                parts = []
                for child in elem.children:
                    part = process_element(child)
                    if part:
                        parts.append(part)
                return "".join(parts)
            
            elif elem.name == 'bold':
                text = "".join(process_element(c) for c in elem.children)
                return f"**{text}**"
            
            elif elem.name == 'italic':
                text = "".join(process_element(c) for c in elem.children)
                return f"*{text}*"
            
            elif elem.name == 'underline':
                text = "".join(process_element(c) for c in elem.children)
                return f"__{text}__"
            
            elif elem.name == 'code':
                text = elem.get_text()
                return f"`{text}`"
            
            elif elem.name == 'math':
                latex = elem.get_text().strip()
                # Use inline math syntax for KaTeX
                return f"\\( {latex} \\)"
            
            elif elem.name == 'link':
                href = elem.get('href', '')
                text = "".join(process_element(c) for c in elem.children)
                return f"[{text}]({href})"
            
            elif elem.name == 'heading':
                level = int(elem.get('level', 1))
                text = "".join(process_element(c) for c in elem.children)
                return f"{'#' * level} {text}"
            
            elif elem.name == 'list':
                style = elem.get('style', 'bullet')
                items = []
                for item in elem.find_all('list-item', recursive=False):
                    item_text = "".join(process_element(c) for c in item.children)
                    prefix = "- " if style == 'bullet' else "1. "
                    items.append(f"{prefix}{item_text}")
                return "\n".join(items)
            
            elif elem.name == 'pre':
                text = elem.get_text()
                return f"```\n{text}\n```"
            
            elif elem.name == 'snippet':
                language = elem.get('language', '')
                text = elem.get_text()
                return f"```{language}\n{text}\n```"
            
            elif elem.name == 'image':
                src = elem.get('src', '')
                return f"![Image]({src})"
            
            elif elem.name == 'figure':
                img = elem.find('image')
                if img:
                    src = img.get('src', '')
                    return f"![Image]({src})"
                return ""
            
            else:
                # Default: process children
                return "".join(process_element(c) for c in elem.children)
        
        # Process all top-level elements in document
        markdown_parts = []
        for child in doc.children:
            if hasattr(child, 'name') and child.name:
                part = process_element(child)
                if part:
                    markdown_parts.append(part)
        
        return "\n\n".join(markdown_parts).strip()
    except Exception as e:
        logger.warning(f"Failed to convert XML to markdown: {e}")
        return content

def extract_links(content: str) -> List[str]:
    """Extract URLs from content"""
    import re
    url_pattern = r'https?://[^\s<>"]+|www\.[^\s<>"]+'
    urls = re.findall(url_pattern, content)
    return [url if url.startswith('http') else f'https://{url}' for url in urls]

def main():
    # Initialize Ed API
    ed = EdAPI()
    ed.login()
    
    course_id = int(os.getenv('ED_COURSE_ID', '84647'))
    logger.info(f"Fetching threads from course {course_id}")
    
    # Get all threads with pagination (edapi limits to 100 per request)
    all_threads = []
    offset = 0
    limit = 100  # Maximum allowed by edapi
    
    while True:
        batch = ed.list_threads(course_id=course_id, limit=limit, offset=offset, sort="new")
        if not batch:
            break
        all_threads.extend(batch)
        logger.info(f"Fetched {len(batch)} threads (offset {offset}, total so far: {len(all_threads)})")
        
        if len(batch) < limit:
            break  # Last page
        
        offset += limit
    
    logger.info(f"Fetched {len(all_threads)} total threads")
    
    # Filter for "Participation D" in title
    filtered_posts = []
    for thread in all_threads:
        title = (thread.get('title') or '').strip()
        if title and 'participation d' in title.lower():
            filtered_posts.append(thread)
    
    logger.info(f"Filtered to {len(filtered_posts)} posts with 'Participation D' in title")
    
    # Convert to CSV format
    csv_data = []
    for post in filtered_posts:
        title = post.get('title', '')
        content_xml = post.get('content', '')
        content_markdown = convert_xml_to_markdown(content_xml)
        
        # Extract author info
        author = post.get('user') or {}
        author_name = author.get('name', 'Unknown')
        
        # Extract links
        links = extract_links(content_markdown)
        
        # Extract attachments/files
        files = post.get('files', [])
        attachments = [f.get('filename', '') for f in files if f.get('filename')]
        
        csv_data.append({
            'id': post.get('id'),
            'title': title,
            'author': author_name,
            'content': content_markdown,
            'posted_at': post.get('created_at', ''),
            'url': f"https://edstem.org/us/courses/{course_id}/discussion/{post.get('id')}",
            'links': '; '.join(links),
            'attachments': '; '.join(attachments),
        })
    
    # Write to CSV (use /app directory in container, which maps to ingest/ locally)
    output_file = '/app/participation_d_posts.csv'
    # Ensure it's a file, not a directory
    if os.path.exists(output_file):
        if os.path.isdir(output_file):
            import shutil
            shutil.rmtree(output_file)
        else:
            os.remove(output_file)
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        if csv_data:
            # Use QUOTE_MINIMAL (default) - Python csv module automatically quotes fields with newlines/commas
            writer = csv.DictWriter(f, fieldnames=csv_data[0].keys())
            writer.writeheader()
            writer.writerows(csv_data)
    
    logger.info(f"Exported {len(csv_data)} posts to {output_file}")

if __name__ == "__main__":
    main()
