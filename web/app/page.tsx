'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { SearchBar } from '@/components/SearchBar';
import { PostList } from '@/components/PostList';
import { Filters } from '@/components/Filters';
import { Post, SearchFilters } from '@/types';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<SearchFilters>({});

  // Check authentication on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/posts');
        if (response.status === 401) {
          router.push('/auth/signin');
          return;
        }
        await loadPosts();
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    }

    if (status !== 'loading') {
      checkAuth();
    }
  }, [status, router]);

  const loadPosts = async (newFilters: SearchFilters = filters, pageNum = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (newFilters.query) params.append('q', newFilters.query);
      if (newFilters.student_id) params.append('student_id', newFilters.student_id);
      if (newFilters.tags?.length) params.append('tags', newFilters.tags.join(','));
      if (newFilters.has_attachments) params.append('has_attachments', 'true');
      if (newFilters.date_from) params.append('date_from', newFilters.date_from);
      if (newFilters.date_to) params.append('date_to', newFilters.date_to);
      if (newFilters.sort_by) params.append('sort_by', newFilters.sort_by);
      if (newFilters.homework) params.append('homework', newFilters.homework);

      params.append('page', pageNum.toString());
      params.append('page_size', '20');

      const response = await fetch(`/api/posts?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts);
        setTotal(data.total);
        setPage(pageNum);
        setFilters(newFilters);
      }
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    loadPosts({ ...filters, query }, 1);
  };

  const handleFiltersChange = (newFilters: SearchFilters) => {
    loadPosts(newFilters, 1);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Student Participation Documentation
        </h1>
        <p className="text-gray-600">
          Browse and search student submissions for extra credit participation, including Muon and MuP updates.
        </p>
      </div>

      <div className="space-y-6">
        <SearchBar onSearch={handleSearch} />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Filters
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
          </div>

          <div className="lg:col-span-3">
            <PostList
              posts={posts}
              loading={loading}
              total={total}
              page={page}
              onPageChange={(newPage) => loadPosts(filters, newPage)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
