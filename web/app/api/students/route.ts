import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { parse } from 'csv-parse/sync';

export async function GET(request: NextRequest) {
  try {
    // Read CSV file to get unique authors
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

      // Get unique authors from filtered posts
      const authors = new Map<string, number>();
      records.forEach((post: any) => {
        const authorName = post.author?.trim();
        if (authorName) {
          authors.set(authorName, (authors.get(authorName) || 0) + 1);
        }
      });

      // Convert to student list format
      const students = Array.from(authors.entries())
        .map(([name, postCount], index) => ({
          id: `student-${index}`,
          ed_user_id: index,
          display_name: name,
          email: undefined,
          is_hidden: false,
          post_count: postCount,
        }))
        .sort((a, b) => a.display_name.localeCompare(b.display_name));

      return NextResponse.json(students);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return NextResponse.json([]);
      }
      throw error;
    }
  } catch (error) {
    console.error('Error reading CSV:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
