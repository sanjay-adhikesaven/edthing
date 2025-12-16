'use client';

import Link from 'next/link';
import { Post } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { UserIcon, PaperClipIcon, ExternalLinkIcon, TagIcon } from '@heroicons/react/outline';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const truncateContent = (content: string, maxLength: number = 300) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <article className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <Link
            href={`/posts/${post.id}`}
            className="text-lg font-semibold text-gray-900 hover:text-primary-600 line-clamp-2"
          >
            {post.title}
          </Link>

          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
            {post.author && (
              <div className="flex items-center space-x-1">
                <UserIcon className="h-4 w-4" />
                <span>{post.author.display_name}</span>
              </div>
            )}

            <time dateTime={post.posted_at}>
              {formatDistanceToNow(new Date(post.posted_at), { addSuffix: true })}
            </time>

            {post.category && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                {post.category}
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
        <div className="flex flex-wrap gap-1 mb-3">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
            >
              <TagIcon className="h-3 w-3 mr-1" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Attachments */}
      {post.attachments.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
            <PaperClipIcon className="h-4 w-4" />
            <span>{post.attachments.length} attachment{post.attachments.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="space-y-1">
            {post.attachments.slice(0, 3).map((attachment) => (
              <div key={attachment.id} className="text-sm text-gray-600 flex items-center space-x-2">
                <span className="truncate">{attachment.filename}</span>
                {attachment.file_size && (
                  <span className="text-xs text-gray-400">
                    ({(attachment.file_size / 1024).toFixed(1)} KB)
                  </span>
                )}
              </div>
            ))}
            {post.attachments.length > 3 && (
              <div className="text-sm text-gray-500">
                +{post.attachments.length - 3} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Links */}
      {post.links.length > 0 && (
        <div className="mb-3">
          <div className="space-y-1">
            {post.links.slice(0, 2).map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-sm text-primary-600 hover:text-primary-700"
              >
                <ExternalLinkIcon className="h-4 w-4" />
                <span className="truncate">
                  {link.title || link.domain || link.url}
                </span>
              </a>
            ))}
            {post.links.length > 2 && (
              <div className="text-sm text-gray-500">
                +{post.links.length - 2} more links
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <Link
          href={`/posts/${post.id}`}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          Read more →
        </Link>

        {post.url && (
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            View on Ed →
          </a>
        )}
      </div>
    </article>
  );
}
