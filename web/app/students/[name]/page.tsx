'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, UserIcon, DocumentTextIcon, TagIcon, CalendarIcon, TrendingUpIcon } from '@heroicons/react/outline';
import { Post } from '@/types';
import { PostCard } from '@/components/PostCard';
import { formatDistanceToNow } from 'date-fns';

interface StudentProfilePageProps {
  params: {
    name: string;
  };
}

export default function StudentProfilePage({ params }: StudentProfilePageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  
  const studentName = decodeURIComponent(params.name);

  useEffect(() => {
    if (status !== 'loading') {
      loadStudentPosts();
    }
  }, [status, router, sortBy]);

  const loadStudentPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/posts?student_id=${encodeURIComponent(studentName)}&page_size=1000&sort_by=${sortBy}`);
      if (response.status === 401) {
        router.push('/auth/signin');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Failed to load student posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="skeleton h-10 w-64 mb-4"></div>
          <div className="skeleton h-8 w-96"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card">
              <div className="skeleton h-24"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalPosts = posts.length;
  const tags = new Set<string>();
  const homeworkNumbers = new Set<string>();
  
  posts.forEach(post => {
    post.tags.forEach(tag => tags.add(tag));
    const hwMatch = post.title.match(/HW\s*(\d+)/i);
    if (hwMatch) homeworkNumbers.add(hwMatch[1]);
  });

  const firstPost = posts.length > 0 ? posts[posts.length - 1] : null;
  const lastPost = posts.length > 0 ? posts[0] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Posts
      </Link>

      {/* Student Header */}
      <div className="card mb-8">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-purple-500 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg">
            {studentName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {studentName}
            </h1>
            <p className="text-lg text-gray-600">
              Student Profile
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="stat-card bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <DocumentTextIcon className="h-8 w-8 text-blue-600" />
          </div>
          <div className="stat-value text-blue-900">{totalPosts}</div>
          <div className="stat-label text-blue-700">Total Posts</div>
        </div>

        <div className="stat-card bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <TagIcon className="h-8 w-8 text-purple-600" />
          </div>
          <div className="stat-value text-purple-900">{tags.size}</div>
          <div className="stat-label text-purple-700">Topics Covered</div>
        </div>

        <div className="stat-card bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
          <div className="flex items-center justify-between mb-3">
            <UserIcon className="h-8 w-8 text-green-600" />
          </div>
          <div className="stat-value text-green-900">{homeworkNumbers.size}</div>
          <div className="stat-label text-green-700">Homework Count</div>
        </div>

        <div className="stat-card bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200">
          <div className="flex items-center justify-between mb-3">
            <TrendingUpIcon className="h-8 w-8 text-amber-600" />
          </div>
          <div className="stat-value text-amber-900">
            {lastPost ? formatDistanceToNow(new Date(lastPost.posted_at), { addSuffix: false }) : 'N/A'}
          </div>
          <div className="stat-label text-amber-700">Last Active</div>
        </div>
      </div>

      {/* Topics & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Topics Covered */}
        {tags.size > 0 && (
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <TagIcon className="h-6 w-6 text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900">Topics Covered</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from(tags).map((tag) => (
                <Link
                  key={tag}
                  href={`/?tags=${encodeURIComponent(tag)}`}
                  className="badge badge-tag border hover:scale-105 transition-transform"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Homework Timeline */}
        {homeworkNumbers.size > 0 && (
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <CalendarIcon className="h-6 w-6 text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900">Homework Submissions</h2>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {Array.from(homeworkNumbers)
                .sort((a, b) => parseInt(a) - parseInt(b))
                .map((hwNum) => (
                  <Link
                    key={hwNum}
                    href={`/?homework=${hwNum}`}
                    className="px-3 py-2 bg-primary-100 text-primary-800 rounded-lg text-center font-semibold hover:bg-primary-200 hover:scale-105 transition-all"
                  >
                    {hwNum}
                  </Link>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Posts List */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            All Posts ({totalPosts})
          </h2>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
            className="input text-sm w-auto"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>

      {posts.length > 0 ? (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <UserIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No posts found
          </h2>
          <p className="text-gray-600">
            This student hasn't posted anything yet.
          </p>
        </div>
      )}
    </div>
  );
}
