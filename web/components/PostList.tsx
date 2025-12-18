'use client';

import { Post } from '@/types';
import { PostCard } from './PostCard';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/outline';

interface PostListProps {
  posts: Post[];
  loading: boolean;
  total: number;
  page: number;
  onPageChange: (page: number) => void;
}

export function PostList({ posts, loading, total, page, onPageChange }: PostListProps) {
  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="card border-l-4 border-l-gray-300">
            <div className="flex items-start gap-4 mb-4">
              <div className="skeleton h-10 w-10 rounded-full"></div>
              <div className="flex-1">
                <div className="skeleton h-5 w-3/4 mb-3"></div>
                <div className="skeleton h-4 w-1/2 mb-2"></div>
                <div className="skeleton h-4 w-2/3"></div>
              </div>
            </div>
            <div className="skeleton h-20 w-full mb-3"></div>
            <div className="flex gap-2">
              <div className="skeleton h-6 w-16 rounded-full"></div>
              <div className="skeleton h-6 w-20 rounded-full"></div>
              <div className="skeleton h-6 w-24 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="card text-center py-16 border-2 border-dashed border-gray-300">
        <div className="max-w-md mx-auto">
          <svg
            className="h-24 w-24 text-gray-300 mx-auto mb-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No posts found</h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your search or filters to find what you're looking for.
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <p className="font-medium">Suggestions:</p>
            <ul className="text-left space-y-1 inline-block">
              <li>• Clear your filters and try again</li>
              <li>• Search for different keywords</li>
              <li>• Browse all posts without filters</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="text-sm font-medium text-gray-700 bg-gray-100 px-4 py-2 rounded-lg">
          Showing <span className="text-gray-900 font-bold">{((page - 1) * pageSize) + 1}</span> to{' '}
          <span className="text-gray-900 font-bold">{Math.min(page * pageSize, total)}</span> of{' '}
          <span className="text-gray-900 font-bold">{total}</span> posts
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="btn btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Previous
            </button>

            <span className="text-sm font-medium text-gray-700 px-3">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="btn btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {/* Bottom pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center pt-6 border-t-2 border-gray-200">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(1)}
              disabled={page <= 1}
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              First
            </button>
            
            {[...Array(Math.min(7, totalPages))].map((_, i) => {
              let pageNum;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (page <= 4) {
                pageNum = i + 1;
              } else if (page >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = page - 3 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    pageNum === page
                      ? 'bg-gray-900 text-white shadow-md scale-110'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={page >= totalPages}
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
