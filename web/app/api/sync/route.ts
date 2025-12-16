import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

/**
 * API route to regenerate CSV from EdStem
 * This can be called manually or via a cron job
 * 
 * To use: POST /api/sync with ED_API_TOKEN and ED_COURSE_ID in env vars
 */
export async function POST(request: NextRequest) {
  try {
    // Check for authorization token (optional, but recommended)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.SYNC_SECRET;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const edApiToken = process.env.ED_API_TOKEN;
    const courseId = process.env.ED_COURSE_ID;

    if (!edApiToken || !courseId) {
      return NextResponse.json(
        { error: 'ED_API_TOKEN and ED_COURSE_ID must be set in environment variables' },
        { status: 500 }
      );
    }

    // This would need to run the sync logic
    // For now, return instructions
    return NextResponse.json({
      message: 'CSV sync endpoint',
      note: 'This endpoint needs to be implemented with the sync logic from ingest/simple_sync.py',
      instructions: [
        '1. Install edapi: npm install edapi (or use a serverless function)',
        '2. Run the sync logic to fetch posts from EdStem',
        '3. Write the CSV to web/data/participation_d_posts.csv',
        '4. Or use Vercel Cron Jobs to call this endpoint periodically'
      ]
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Allow GET for status check
export async function GET() {
  const csvPath = join(process.cwd(), 'data', 'participation_d_posts.csv');
  try {
    const { readFile } = await import('fs/promises');
    const stats = await import('fs/promises').then(m => m.stat(csvPath));
    return NextResponse.json({
      exists: true,
      lastModified: stats.mtime,
      size: stats.size,
    });
  } catch {
    return NextResponse.json({ exists: false });
  }
}
