import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { parse } from 'csv-parse/sync';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const csvPath = join(process.cwd(), 'data', 'participation_d_posts.csv');
    
    try {
      const fileContent = await readFile(csvPath, 'utf-8');
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true, // Allow inconsistent column counts
        relax_quotes: true, // Handle unquoted fields
        quote: '"',
        escape: '\\',
      });

      const post = records.find((p: any) => p.id === params.id);

      if (!post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }

      return NextResponse.json({
        id: post.id,
        ed_post_id: post.id,
        title: post.title,
        content: post.content,
        author: {
          display_name: post.author,
        },
        posted_at: post.posted_at,
        url: post.url,
        links: post.links ? post.links.split('; ').filter((l: string) => l).map((url: string) => {
          try {
            return {
              id: url,
              url: url,
              link_type: 'other',
              domain: new URL(url).hostname,
            };
          } catch {
            return {
              id: url,
              url: url,
              link_type: 'other',
              domain: url,
            };
          }
        }) : [],
        attachments: post.attachments ? post.attachments.split('; ').filter((a: string) => a).map((filename: string) => ({
          id: filename,
          filename: filename,
        })) : [],
        tags: [],
      });
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return NextResponse.json({ error: 'CSV file not found' }, { status: 404 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error reading CSV:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}