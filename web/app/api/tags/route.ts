import { NextRequest, NextResponse } from 'next/server';
import { getTags } from '@/lib/db';
import { requiresAuth } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication if required
    const authRequired = await requiresAuth();
    if (authRequired) {
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
    }

    const tags = await getTags();
    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
