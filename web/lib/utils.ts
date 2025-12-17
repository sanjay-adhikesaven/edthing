import { Post } from '@/types';

// Calculate reading time from content
export function getReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

// Get homework number from title
export function getHomeworkNumber(title: string): string | null {
  const match = title.match(/HW\s*(\d+)/i);
  return match ? match[1] : null;
}

// Get accent border color based on primary tag
export function getAccentBorderClass(tags: string[]): string {
  if (tags.length === 0) return 'border-l-gray-300';
  const firstTag = tags[0].toLowerCase();
  if (firstTag.includes('muon')) return 'border-l-purple-400';
  if (firstTag.includes('mup')) return 'border-l-blue-400';
  if (firstTag.includes('shampoo')) return 'border-l-pink-400';
  if (firstTag.includes('adam')) return 'border-l-orange-400';
  if (firstTag.includes('lion')) return 'border-l-amber-400';
  if (firstTag.includes('soap')) return 'border-l-teal-400';
  return 'border-l-primary-400';
}

// Get tag color class
export function getTagColorClass(tag: string): string {
  const tagLower = tag.toLowerCase();
  if (tagLower.includes('muon')) return 'tag-muon';
  if (tagLower.includes('mup') || tagLower.includes('μp')) return 'tag-mup';
  if (tagLower.includes('shampoo')) return 'tag-shampoo';
  if (tagLower.includes('adam')) return 'tag-adam';
  if (tagLower.includes('lion')) return 'tag-lion';
  if (tagLower.includes('soap')) return 'tag-soap';
  return 'badge-tag';
}

// Find related posts based on tags, author, and homework
export function findRelatedPosts(currentPost: Post, allPosts: Post[], limit: number = 5): Post[] {
  const related: { post: Post; score: number }[] = [];

  const currentHw = getHomeworkNumber(currentPost.title);

  allPosts.forEach((post) => {
    if (post.id === currentPost.id) return;

    let score = 0;

    // Same homework gets highest score
    const postHw = getHomeworkNumber(post.title);
    if (postHw && currentHw && postHw === currentHw) {
      score += 10;
    }

    // Shared tags
    const sharedTags = post.tags.filter((tag) => currentPost.tags.includes(tag));
    score += sharedTags.length * 3;

    // Same author
    if (post.author?.display_name === currentPost.author?.display_name) {
      score += 2;
    }

    // Recency bonus (posts within 7 days)
    const daysDiff = Math.abs(
      new Date(post.posted_at).getTime() - new Date(currentPost.posted_at).getTime()
    ) / (1000 * 60 * 60 * 24);
    if (daysDiff <= 7) {
      score += 1;
    }

    if (score > 0) {
      related.push({ post, score });
    }
  });

  // Sort by score and return top posts
  return related
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.post);
}

// Generate table of contents from markdown content
export function generateTableOfContents(content: string): { id: string; text: string; level: number }[] {
  const headings: { id: string; text: string; level: number }[] = [];
  const lines = content.split('\n');

  lines.forEach((line) => {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      headings.push({ id, text, level });
    }
  });

  return headings;
}
