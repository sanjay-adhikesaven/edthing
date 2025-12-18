import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { parse } from 'csv-parse/sync';

// Topic definitions based on optimizer and keyword mentions
const TOPIC_DEFINITIONS = [
  { tag: 'Muon', patterns: ['muon'] },
  { tag: 'MuP', patterns: ['mup', 'μp'] },
  { tag: 'Shampoo', patterns: ['shampoo'] },
  { tag: 'SOAP', patterns: ['soap '] },
  { tag: 'AdamW', patterns: ['adamw'] },
  { tag: 'Adam', patterns: [' adam', 'adam '] },
  { tag: 'SGD', patterns: ['sgd'] },
  { tag: 'Lion', patterns: ['lion optimizer', ' lion'] },
  { tag: 'Polar Express', patterns: ['polar express'] },
  { tag: 'Adafactor', patterns: ['adafactor'] },
];

const extractTopics = (title: string | undefined, content: string | undefined): string[] => {
  const text = `${title || ''} ${content || ''}`.toLowerCase();
  const tags: string[] = [];
  for (const def of TOPIC_DEFINITIONS) {
    if (def.patterns.some((p) => text.includes(p))) {
      tags.push(def.tag);
    }
  }
  return tags;
};

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
      const homeworkFilter = searchParams.get('homework') || '';
      const page = parseInt(searchParams.get('page') || '1');
      const pageSize = parseInt(searchParams.get('page_size') || '20');
      const sortBy = searchParams.get('sort_by') || 'newest';
      const tagsParam = searchParams.get('tags') || '';
      const tagsFilter = tagsParam
        ? tagsParam.split(',').map((t) => t.toLowerCase()).filter(Boolean)
        : [];

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

      // Filter by homework number(s) (supports multiple like "6,12")
      if (homeworkFilter) {
        const homeworkNums = homeworkFilter
          .split(',')
          .map((v) => parseInt(v, 10))
          .filter((v) => !Number.isNaN(v));

        if (homeworkNums.length > 0) {
          filtered = filtered.filter((post: any) => {
            if (!post.title) return false;
            const match = post.title.match(/(?:HW|Homework)\s*0*(\d+)/i);
            if (!match) return false;
            const num = parseInt(match[1], 10);
            if (Number.isNaN(num)) return false;
            return homeworkNums.includes(num);
          });
        }
      }

      // Filter by topics/tags if provided
      if (tagsFilter.length > 0) {
        filtered = filtered.filter((post: any) => {
          const postTags = extractTopics(post.title, post.content);
          if (postTags.length === 0) return false;
          const lower = postTags.map((t) => t.toLowerCase());
          return tagsFilter.some((tag) => lower.includes(tag));
        });
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
        posts: paginated.map((post: any) => {
          const tags = extractTopics(post.title, post.content);
          return {
            id: post.id,
            ed_post_id: post.id,
            title: post.title,
            content: post.content,
            author: {
              display_name: post.author,
            },
            posted_at: post.posted_at,
            url: post.url,
            links: post.links
              ? post.links
                  .split('; ')
                  .filter((l: string) => l)
                  .map((url: string) => {
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
                  })
              : [],
            attachments: post.attachments
              ? post.attachments
                  .split('; ')
                  .filter((a: string) => a)
                  .map((filename: string) => ({
                    id: filename,
                    filename: filename,
                  }))
              : [],
            tags,
          };
        }),
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