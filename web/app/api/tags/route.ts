import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { parse } from 'csv-parse/sync';

// Keep topic extraction consistent with /api/posts
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
    const csvPath = join(process.cwd(), 'data', 'participation_d_posts.csv');
    const fileContent = await readFile(csvPath, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      relax_quotes: true,
      quote: '"',
      escape: '\\',
    });

    const tagSet = new Set<string>();
    records.forEach((post: any) => {
      extractTopics(post.title, post.content).forEach((tag) => tagSet.add(tag));
    });

    const tags = Array.from(tagSet).sort((a, b) => a.localeCompare(b));
    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
