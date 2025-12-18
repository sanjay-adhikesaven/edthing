'use client';

import { Post } from '@/types';
import { formatDistanceToNow, format, differenceInDays } from 'date-fns';
import {
  UserIcon,
  PaperClipIcon,
  ExternalLinkIcon,
  TagIcon,
  CalendarIcon,
  LinkIcon,
  ClockIcon,
  ShareIcon,
  BookmarkIcon,
  CheckCircleIcon
} from '@heroicons/react/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/solid';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PostDetailProps {
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

export function PostDetail({ post }: PostDetailProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    // Check if post is bookmarked
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    setIsBookmarked(bookmarks.includes(post.id));
  }, [post.id]);

  const toggleBookmark = () => {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    let newBookmarks;
    if (isBookmarked) {
      newBookmarks = bookmarks.filter((id: string) => id !== post.id);
      showToastMessage('Bookmark removed');
    } else {
      newBookmarks = [...bookmarks, post.id];
      showToastMessage('Bookmarked!');
    }
    localStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
    setIsBookmarked(!isBookmarked);
  };

  const sharePost = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          url: url,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(url);
      showToastMessage('Link copied to clipboard!');
    }
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const isNew = differenceInDays(new Date(), new Date(post.posted_at)) <= 7;
  const readingTime = post.content ? getReadingTime(post.content) : 0;
  const homeworkNumber = getHomeworkNumber(post.title);

  return (
    <>
      <article className="card relative">
      {/* Action Buttons */}
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <button
          onClick={sharePost}
          className="btn-icon"
          aria-label="Share post"
        >
          <ShareIcon className="h-5 w-5 text-gray-600" />
        </button>
        <button
          onClick={toggleBookmark}
          className="btn-icon"
          aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
        >
          {isBookmarked ? (
            <BookmarkSolidIcon className="h-5 w-5 text-yellow-500" />
          ) : (
            <BookmarkIcon className="h-5 w-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Header */}
      <header className="mb-8 pr-24">
        {/* Badges row */}
        <div className="flex items-center gap-2 mb-4">
          {isNew && (
            <span className="badge-new">
              New
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

        <h1 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-base text-gray-600">
          {post.author && (
            <Link
              href={`/students/${encodeURIComponent(post.author.display_name)}`}
              className="flex items-center gap-2 hover:text-primary-600 transition-colors font-medium"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                {post.author.display_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div>{post.author.display_name}</div>
                {post.author.email && (
                  <div className="text-xs text-gray-400">{post.author.email}</div>
                )}
              </div>
            </Link>
          )}

          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            <div>
              <time dateTime={post.posted_at} className="font-medium">
                {format(new Date(post.posted_at), 'PPP')}
              </time>
              <div className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(post.posted_at), { addSuffix: true })}
              </div>
            </div>
          </div>

          {readingTime > 0 && (
            <div className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5" />
              <span className="font-medium">{readingTime} min read</span>
            </div>
          )}
        </div>
      </header>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {post.tags.map((tag) => (
            <Link
              key={tag}
              href={`/?tags=${encodeURIComponent(tag)}`}
              className={`badge ${getTagColorClass(tag)} border transition-all hover:scale-105 hover:shadow-sm text-sm px-3 py-1.5`}
            >
              <TagIcon className="h-4 w-4 mr-1.5" />
              {tag}
            </Link>
          ))}
        </div>
      )}

      {/* Content */}
      {post.content && (
        <div className="prose prose-lg max-w-none mb-8">
          {/* Cast plugins to any to avoid type mismatches between unified versions */}
          <ReactMarkdown
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            remarkPlugins={[remarkGfm as any, remarkMath as any]}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            rehypePlugins={[rehypeKatex as any]}
          >
            {post.content}
          </ReactMarkdown>
        </div>
      )}

      {/* Attachments */}
      {post.attachments.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-5 flex items-center">
            <PaperClipIcon className="h-6 w-6 mr-3 text-primary-600" />
            Attachments ({post.attachments.length})
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {post.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-5 border-2 border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4">
                  {attachment.is_image && (
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-700">IMG</span>
                    </div>
                  )}
                  {attachment.is_pdf && (
                    <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-red-200 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-bold text-red-700">PDF</span>
                    </div>
                  )}
                  {!attachment.is_image && !attachment.is_pdf && (
                    <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                      <PaperClipIcon className="h-7 w-7 text-gray-600" />
                    </div>
                  )}

                  <div>
                    <div className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {attachment.filename}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      {attachment.file_type && (
                        <span className="font-medium">{attachment.file_type}</span>
                      )}
                      {attachment.file_size && (
                        <span>
                          {attachment.file_type && '•'}
                          {(attachment.file_size / 1024).toFixed(1)} KB
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {attachment.download_url && (
                  <a
                    href={attachment.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary text-sm"
                  >
                    Download
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Links */}
      {post.links.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-5 flex items-center">
            <LinkIcon className="h-6 w-6 mr-3 text-primary-600" />
            Links ({post.links.length})
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {post.links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-5 border-2 border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ExternalLinkIcon className="h-6 w-6 text-primary-600" />
                  </div>

                  <div>
                    <div className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {link.title || link.domain || 'External Link'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {link.domain} • {link.link_type}
                    </div>
                  </div>
                </div>

                <ExternalLinkIcon className="h-5 w-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="pt-8 border-t-2 border-gray-200 mt-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {post.url && (
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              <ExternalLinkIcon className="h-4 w-4" />
              View original on EdStem
            </a>
          )}

          <div className="text-sm text-gray-500 font-medium">
            Post ID: {post.ed_post_id}
          </div>
        </div>
      </footer>
    </article>

    {/* Toast Notification */}
    {showToast && (
      <div className="toast-success animate-slide-up">
        <div className="flex items-center gap-2">
          <CheckCircleIcon className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium text-gray-900">{toastMessage}</span>
        </div>
      </div>
    )}
    </>
  );
}
