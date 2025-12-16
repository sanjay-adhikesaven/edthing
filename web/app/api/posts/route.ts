import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { parse } from 'csv-parse/sync';

export async function GET(request: NextRequest) {
  try {
    // Read CSV file
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

      // Parse query params
      const { searchParams } = new URL(request.url);
      const query = searchParams.get('q')?.toLowerCase() || '';
      const studentFilter = searchParams.get('student_id') || '';
      const page = parseInt(searchParams.get('page') || '1');
      const pageSize = parseInt(searchParams.get('page_size') || '20');
      const sortBy = searchParams.get('sort_by') || 'newest';

      // Filter by search query
      let filtered = records;
      if (query) {
        filtered = records.filter((post: any) => 
          post.title?.toLowerCase().includes(query) ||
          post.content?.toLowerCase().includes(query) ||
          post.author?.toLowerCase().includes(query)
        );
      }

      // Filter by student (author name match)
      if (studentFilter) {
        filtered = filtered.filter((post: any) => 
          post.author?.toLowerCase() === studentFilter.toLowerCase()
        );
      }

      // Sort
      if (sortBy === 'oldest') {
        filtered.sort((a: any, b: any) => 
          new Date(a.posted_at).getTime() - new Date(b.posted_at).getTime()
        );
      } else if (sortBy === 'newest') {
        filtered.sort((a: any, b: any) => 
          new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime()
        );
      }

      // Paginate
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginated = filtered.slice(start, end);

      return NextResponse.json({
        posts: paginated.map((post: any) => ({
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
        })),
        total: filtered.length,
        page,
        page_size: pageSize,
      });
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return NextResponse.json({
          posts: [],
          total: 0,
          page: 1,
          page_size: 20,
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error reading CSV:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}