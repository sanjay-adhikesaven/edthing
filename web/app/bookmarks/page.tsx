'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookmarkIcon as BookmarkSolidIcon, XIcon } from '@heroicons/react/solid';
import { BookmarkIcon, ArrowLeftIcon } from '@heroicons/react/outline';
import { Post } from '@/types';
import { PostCard } from '@/components/PostCard';

export default function BookmarksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (status !== 'loading') {
      loadBookmarks();
    }
  }, [status, router]);

  const loadBookmarks = async () => {
    setLoading(true);
    try {
      // Get bookmark IDs from localStorage
      const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
      
      if (bookmarks.length === 0) {
        setLoading(false);
        return;
      }

      // Load all posts to filter bookmarked ones
      const response = await fetch('/api/posts?page_size=1000');
      if (response.status === 401) {
        router.push('/auth/signin');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        const posts = data.posts || [];
        const bookmarkedPostsData = posts.filter((p: Post) => bookmarks.includes(p.id));
        setBookmarkedPosts(bookmarkedPostsData);
      }
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearAllBookmarks = () => {
    if (confirm('Are you sure you want to clear all bookmarks?')) {
      localStorage.setItem('bookmarks', JSON.stringify([]));
      setBookmarkedPosts([]);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="skeleton h-10 w-64 mb-2"></div>
          <div className="skeleton h-6 w-96"></div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card">
              <div className="skeleton h-48"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Dashboard
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <BookmarkSolidIcon className="h-10 w-10 text-amber-500" />
              Your Bookmarks
            </h1>
            <p className="text-lg text-gray-600">
              {bookmarkedPosts.length} {bookmarkedPosts.length === 1 ? 'post' : 'posts'} saved for later
            </p>
          </div>
          
          {bookmarkedPosts.length > 0 && (
            <button
              onClick={clearAllBookmarks}
              className="btn btn-secondary text-sm flex items-center gap-2"
            >
              <XIcon className="h-4 w-4" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Bookmarked Posts */}
      {bookmarkedPosts.length > 0 ? (
        <div className="space-y-6">
          {bookmarkedPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <BookmarkIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No bookmarks yet
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Start bookmarking posts you want to read later or reference again. Click the bookmark icon on any post to save it here.
          </p>
          <Link href="/" className="btn btn-primary inline-flex items-center gap-2">
            Browse Posts
          </Link>
        </div>
      )}
    </div>
  );
}
