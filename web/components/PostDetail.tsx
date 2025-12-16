'use client';

import { Post } from '@/types';
import { formatDistanceToNow, format } from 'date-fns';
import {
  UserIcon,
  PaperClipIcon,
  ExternalLinkIcon,
  TagIcon,
  CalendarIcon,
  LinkIcon
} from '@heroicons/react/outline';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface PostDetailProps {
  post: Post;
}

export function PostDetail({ post }: PostDetailProps) {
  return (
    <article className="card">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          {post.author && (
            <div className="flex items-center space-x-2">
              <UserIcon className="h-5 w-5" />
              <span className="font-medium">{post.author.display_name}</span>
              {post.author.email && (
                <span className="text-gray-400">({post.author.email})</span>
              )}
            </div>
          )}

          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5" />
            <time dateTime={post.posted_at}>
              {format(new Date(post.posted_at), 'PPP')}
            </time>
            <span className="text-gray-400">
              ({formatDistanceToNow(new Date(post.posted_at), { addSuffix: true })})
            </span>
          </div>

          {post.category && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
              {post.category}
            </span>
          )}
        </div>
      </header>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
            >
              <TagIcon className="h-4 w-4 mr-1" />
              {tag}
            </span>
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
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <PaperClipIcon className="h-5 w-5 mr-2" />
            Attachments ({post.attachments.length})
          </h2>

          <div className="space-y-3">
            {post.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  {attachment.is_image && (
                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-500">IMG</span>
                    </div>
                  )}
                  {attachment.is_pdf && (
                    <div className="w-12 h-12 bg-red-100 rounded flex items-center justify-center">
                      <span className="text-xs text-red-600">PDF</span>
                    </div>
                  )}
                  {!attachment.is_image && !attachment.is_pdf && (
                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                      <PaperClipIcon className="h-6 w-6 text-gray-400" />
                    </div>
                  )}

                  <div>
                    <div className="font-medium text-gray-900">
                      {attachment.filename}
                    </div>
                    <div className="text-sm text-gray-500">
                      {attachment.file_type && (
                        <span>{attachment.file_type}</span>
                      )}
                      {attachment.file_size && (
                        <span>
                          {attachment.file_type && ' • '}
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
                    className="btn btn-secondary text-sm"
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
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <LinkIcon className="h-5 w-5 mr-2" />
            Links ({post.links.length})
          </h2>

          <div className="space-y-3">
            {post.links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded flex items-center justify-center group-hover:bg-primary-200">
                    <ExternalLinkIcon className="h-5 w-5 text-primary-600" />
                  </div>

                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-primary-600">
                      {link.title || link.domain || 'External Link'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {link.domain} • {link.link_type}
                    </div>
                  </div>
                </div>

                <ExternalLinkIcon className="h-5 w-5 text-gray-400 group-hover:text-primary-600" />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          {post.url && (
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
            >
              <ExternalLinkIcon className="h-4 w-4 mr-1" />
              View original on EdStem
            </a>
          )}

          <div className="text-sm text-gray-500">
            Post ID: {post.ed_post_id}
          </div>
        </div>
      </footer>
    </article>
  );
}
