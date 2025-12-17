'use client';

import Link from 'next/link';
import { Post } from '@/types';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { UserIcon, PaperClipIcon, ExternalLinkIcon, TagIcon, ClockIcon, BookmarkIcon } from '@heroicons/react/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/solid';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { useState, useEffect } from 'react';

interface PostCardProps {
  post: Post;
}

// Utility function to get tag color classes
const getTagColorClass = (tag: string): string => {
  const tagLower = tag.toLowerCase();
  if (tagLower.includes('muon')) return 'tag-muon';
  if (tagLower.includes('mup') || tagLower.includes('μp')) return 'tag-mup';
  if (tagLower.includes('shampoo')) return 'tag-shampoo';
  if (tagLower.includes('adam')) return 'tag-adam';
  if (tagLower.includes('lion')) return 'tag-lion';
  if (tagLower.includes('soap')) return 'tag-soap';
  return 'badge-tag';
};

// Calculate reading time
const getReadingTime = (content: string): number => {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
};

// Get homework number from title
const getHomeworkNumber = (title: string): string | null => {
  const match = title.match(/HW\s*(\d+)/i);
  return match ? match[1] : null;
};

// Get accent border color based on primary tag
const getAccentBorderClass = (tags: string[]): string => {
  if (tags.length === 0) return 'border-l-gray-300';
  const firstTag = tags[0].toLowerCase();
  if (firstTag.includes('muon')) return 'border-l-purple-400';
  if (firstTag.includes('mup')) return 'border-l-blue-400';
  if (firstTag.includes('shampoo')) return 'border-l-pink-400';
  if (firstTag.includes('adam')) return 'border-l-orange-400';
  if (firstTag.includes('lion')) return 'border-l-amber-400';
  if (firstTag.includes('soap')) return 'border-l-teal-400';
  return 'border-l-primary-400';
};

export function PostCard({ post }: PostCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    // Check if post is bookmarked
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    setIsBookmarked(bookmarks.includes(post.id));
  }, [post.id]);

  const toggleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    let newBookmarks;
    if (isBookmarked) {
      newBookmarks = bookmarks.filter((id: string) => id !== post.id);
    } else {
      newBookmarks = [...bookmarks, post.id];
    }
    localStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
    setIsBookmarked(!isBookmarked);
  };

  const truncateContent = (content: string, maxLength: number = 300) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const isNew = differenceInDays(new Date(), new Date(post.posted_at)) <= 7;
  const readingTime = post.content ? getReadingTime(post.content) : 0;
  const homeworkNumber = getHomeworkNumber(post.title);
  const accentBorderClass = getAccentBorderClass(post.tags);

  return (
    <article className={`card-hover border-l-4 ${accentBorderClass} group relative overflow-hidden`}>
      {/* Bookmark Button */}
      <button
        onClick={toggleBookmark}
        className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors z-10"
        aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
      >
        {isBookmarked ? (
          <BookmarkSolidIcon className="h-5 w-5 text-yellow-500" />
        ) : (
          <BookmarkIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
        )}
      </button>

      <div className="flex items-start justify-between mb-3 pr-10">
        <div className="flex-1">
          {/* Badges row */}
          <div className="flex items-center gap-2 mb-2">
            {isNew && (
              <span className="badge-new">
                ✨ New
              </span>
            )}
            {homeworkNumber && (
              <span className="badge bg-indigo-100 text-indigo-800 border border-indigo-200">
                HW {homeworkNumber}
              </span>
            )}
            {post.category && (
              <span className="badge bg-gray-100 text-gray-800 border border-gray-200">
                {post.category}
              </span>
            )}
          </div>

          <Link
            href={`/posts/${post.id}`}
            className="text-xl font-bold text-gray-900 hover:text-primary-600 line-clamp-2 transition-colors"
          >
            {post.title}
          </Link>

          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
            {post.author && (
              <Link
                href={`/students/${encodeURIComponent(post.author.display_name)}`}
                className="flex items-center gap-1 hover:text-primary-600 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <UserIcon className="h-4 w-4" />
                <span className="font-medium">{post.author.display_name}</span>
              </Link>
            )}

            <time dateTime={post.posted_at} className="flex items-center gap-1">
              <ClockIcon className="h-4 w-4" />
              {formatDistanceToNow(new Date(post.posted_at), { addSuffix: true })}
            </time>

            {readingTime > 0 && (
              <span className="text-gray-500">
                {readingTime} min read
              </span>
            )}
          </div>
        </div>
      </div>

      {post.content && (
        <div className="text-gray-700 mb-4 prose prose-sm max-w-none">
          <ReactMarkdown
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            remarkPlugins={[remarkGfm as any, remarkMath as any]}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            rehypePlugins={[rehypeKatex as any]}
          >
            {truncateContent(post.content)}
          </ReactMarkdown>
        </div>
      )}

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag) => (
            <Link
              key={tag}
              href={`/?tags=${encodeURIComponent(tag)}`}
              onClick={(e) => e.stopPropagation()}
              className={`badge ${getTagColorClass(tag)} border transition-all hover:scale-105 hover:shadow-sm`}
            >
              <TagIcon className="h-3 w-3 mr-1" />
              {tag}
            </Link>
          ))}
        </div>
      )}

      {/* Attachments */}
      {post.attachments.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <PaperClipIcon className="h-4 w-4" />
            <span>{post.attachments.length} attachment{post.attachments.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="space-y-1.5">
            {post.attachments.slice(0, 2).map((attachment) => (
              <div key={attachment.id} className="text-sm text-gray-600 flex items-center gap-2">
                <span className="w-2 h-2 bg-primary-400 rounded-full flex-shrink-0"></span>
                <span className="truncate font-medium">{attachment.filename}</span>
                {attachment.file_size && (
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {(attachment.file_size / 1024).toFixed(1)} KB
                  </span>
                )}
              </div>
            ))}
            {post.attachments.length > 2 && (
              <div className="text-sm text-gray-500 pl-4">
                +{post.attachments.length - 2} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Links */}
      {post.links.length > 0 && (
        <div className="mb-4">
          <div className="space-y-2">
            {post.links.slice(0, 2).map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 hover:underline group/link"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLinkIcon className="h-4 w-4 flex-shrink-0 group-hover/link:translate-x-0.5 transition-transform" />
                <span className="truncate font-medium">
                  {link.title || link.domain || 'External link'}
                </span>
              </a>
            ))}
            {post.links.length > 2 && (
              <div className="text-sm text-gray-500 pl-6">
                +{post.links.length - 2} more links
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <Link
          href={`/posts/${post.id}`}
          className="text-primary-600 hover:text-primary-700 text-sm font-semibold inline-flex items-center gap-1 group/read"
        >
          Read more 
          <span className="group-hover/read:translate-x-1 transition-transform">→</span>
        </Link>

        {post.url && (
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-700 text-sm font-medium inline-flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            View on Ed
            <ExternalLinkIcon className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </article>
  );
}
