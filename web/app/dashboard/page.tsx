'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  DocumentTextIcon, 
  TagIcon,
  TrendingUpIcon,
  ClockIcon,
  BookmarkIcon,
  FireIcon
} from '@heroicons/react/outline';
import { Post, Student } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface DashboardStats {
  totalPosts: number;
  totalStudents: number;
  recentPosts: number;
  popularTags: { tag: string; count: number }[];
  topStudents: { student: Student; count: number }[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (status !== 'loading') {
      loadDashboardData();
    }
  }, [status, router]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load posts
      const postsResponse = await fetch('/api/posts?page_size=100');
      if (postsResponse.status === 401) {
        router.push('/auth/signin');
        return;
      }

      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        const posts = postsData.posts || [];

        // Calculate stats
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentPostsCount = posts.filter((p: Post) => 
          new Date(p.posted_at) > thirtyDaysAgo
        ).length;

        // Count tags
        const tagCounts: { [key: string]: number } = {};
        posts.forEach((post: Post) => {
          post.tags.forEach((tag: string) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        });
        const popularTags = Object.entries(tagCounts)
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        // Count students
        const studentCounts: { [key: string]: { student: Student; count: number } } = {};
        posts.forEach((post: Post) => {
          if (post.author) {
            const name = post.author.display_name;
            if (!studentCounts[name]) {
              studentCounts[name] = { student: post.author, count: 0 };
            }
            studentCounts[name].count++;
          }
        });
        const topStudents = Object.values(studentCounts)
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        const uniqueStudents = new Set(posts.map((p: Post) => p.author?.display_name).filter(Boolean));

        setStats({
          totalPosts: posts.length,
          totalStudents: uniqueStudents.size,
          recentPosts: recentPostsCount,
          popularTags,
          topStudents,
        });

        // Get recent posts (last 5)
        setRecentPosts(posts.slice(0, 5));

        // Load bookmarked posts
        const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
        const bookmarkedPostsData = posts.filter((p: Post) => bookmarks.includes(p.id));
        setBookmarkedPosts(bookmarkedPostsData.slice(0, 5));
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="skeleton h-10 w-64 mb-2"></div>
          <div className="skeleton h-6 w-96"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card">
              <div className="skeleton h-32"></div>
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
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Dashboard
        </h1>
        <p className="text-lg text-gray-600">
          Overview of student participation and activity
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stat-card bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <DocumentTextIcon className="h-8 w-8 text-blue-600" />
            <TrendingUpIcon className="h-5 w-5 text-blue-500" />
          </div>
          <div className="stat-value text-blue-900">{stats?.totalPosts || 0}</div>
          <div className="stat-label text-blue-700">Total Posts</div>
        </div>

        <div className="stat-card bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <UserGroupIcon className="h-8 w-8 text-purple-600" />
            <FireIcon className="h-5 w-5 text-purple-500" />
          </div>
          <div className="stat-value text-purple-900">{stats?.totalStudents || 0}</div>
          <div className="stat-label text-purple-700">Active Students</div>
        </div>

        <div className="stat-card bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
          <div className="flex items-center justify-between mb-3">
            <ClockIcon className="h-8 w-8 text-green-600" />
            <div className="badge bg-green-200 text-green-800 text-xs">30 days</div>
          </div>
          <div className="stat-value text-green-900">{stats?.recentPosts || 0}</div>
          <div className="stat-label text-green-700">Recent Posts</div>
        </div>

        <div className="stat-card bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200">
          <div className="flex items-center justify-between mb-3">
            <BookmarkIcon className="h-8 w-8 text-amber-600" />
          </div>
          <div className="stat-value text-amber-900">{bookmarkedPosts.length}</div>
          <div className="stat-label text-amber-700">Bookmarked</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Popular Topics */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <TagIcon className="h-6 w-6 text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-900">Popular Topics</h2>
          </div>
          <div className="space-y-3">
            {stats?.popularTags.slice(0, 8).map((item, index) => {
              const percentage = Math.round((item.count / (stats?.totalPosts || 1)) * 100);
              return (
                <div key={item.tag}>
                  <div className="flex items-center justify-between mb-1">
                    <Link
                      href={`/?tags=${encodeURIComponent(item.tag)}`}
                      className="text-sm font-semibold text-gray-900 hover:text-primary-600 transition-colors"
                    >
                      {item.tag}
                    </Link>
                    <span className="text-sm font-medium text-gray-600">
                      {item.count} posts
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-primary-500 to-purple-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Contributors */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <ChartBarIcon className="h-6 w-6 text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-900">Top Contributors</h2>
          </div>
          <div className="space-y-3">
            {stats?.topStudents.slice(0, 8).map((item, index) => (
              <Link
                key={item.student.id}
                href={`/students/${encodeURIComponent(item.student.display_name)}`}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                    {item.student.display_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.count} {item.count === 1 ? 'post' : 'posts'}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className="badge bg-primary-100 text-primary-800 border-primary-200">
                    {Math.round((item.count / (stats?.totalPosts || 1)) * 100)}%
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Posts */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <ClockIcon className="h-6 w-6 text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900">Recent Posts</h2>
            </div>
            <Link href="/" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
              View all →
            </Link>
          </div>
          <div className="space-y-4">
            {recentPosts.map((post) => (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                className="block p-4 border-2 border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all group"
              >
                <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 line-clamp-2 mb-2">
                  {post.title}
                </h3>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  {post.author && (
                    <span className="font-medium">{post.author.display_name}</span>
                  )}
                  <span>•</span>
                  <time>{formatDistanceToNow(new Date(post.posted_at), { addSuffix: true })}</time>
                </div>
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="badge badge-tag text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Bookmarked Posts */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BookmarkIcon className="h-6 w-6 text-amber-600" />
              <h2 className="text-2xl font-bold text-gray-900">Your Bookmarks</h2>
            </div>
            <Link href="/bookmarks" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
              View all →
            </Link>
          </div>
          {bookmarkedPosts.length > 0 ? (
            <div className="space-y-4">
              {bookmarkedPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/posts/${post.id}`}
                  className="block p-4 border-2 border-gray-200 rounded-lg hover:border-amber-300 hover:shadow-md transition-all group"
                >
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 line-clamp-2 mb-2">
                    {post.title}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    {post.author && (
                      <span className="font-medium">{post.author.display_name}</span>
                    )}
                    <span>•</span>
                    <time>{formatDistanceToNow(new Date(post.posted_at), { addSuffix: true })}</time>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookmarkIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">No bookmarks yet</p>
              <Link href="/" className="btn btn-primary text-sm">
                Browse Posts
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
