'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Post } from '@/types';
import { PostDetail } from '@/components/PostDetail';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/outline';

interface PostPageProps {
  params: {
    id: string;
  };
}

export default function PostPage({ params }: PostPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPost() {
      try {
        const response = await fetch(`/api/posts/${params.id}`);
        if (response.status === 401) {
          router.push('/auth/signin');
          return;
        }

        if (!response.ok) {
          if (response.status === 404) {
            setError('Post not found');
          } else {
            setError('Failed to load post');
          }
          return;
        }

        const postData = await response.json();
        setPost(postData);

        // Load all posts to find related ones
        const allPostsResponse = await fetch('/api/posts?page_size=1000');
        if (allPostsResponse.ok) {
          const allPostsData = await allPostsResponse.json();
          const posts = allPostsData.posts || [];
          
          // Find related posts
          const related = findRelatedPosts(postData, posts, 5);
          setRelatedPosts(related);
        }
      } catch (err) {
        setError('Failed to load post');
        console.error('Error loading post:', err);
      } finally {
        setLoading(false);
      }
    }

    if (status !== 'loading') {
      loadPost();
    }
  }, [params.id, status, router]);

  function findRelatedPosts(currentPost: Post, allPosts: Post[], limit: number = 5): Post[] {
    const related: { post: Post; score: number }[] = [];
    const currentHw = currentPost.title.match(/HW\s*(\d+)/i)?.[1];

    allPosts.forEach((post) => {
      if (post.id === currentPost.id) return;

      let score = 0;
      const postHw = post.title.match(/HW\s*(\d+)/i)?.[1];
      
      if (postHw && currentHw && postHw === currentHw) score += 10;
      
      const sharedTags = post.tags?.filter((tag) => currentPost.tags?.includes(tag)) || [];
      score += sharedTags.length * 3;
      
      if (post.author?.display_name === currentPost.author?.display_name) score += 2;

      if (score > 0) {
        related.push({ post, score });
      }
    });

    return related
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.post);
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/"
            className="btn btn-primary"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to posts
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <PostDetail post={post} />
        </div>

        {/* Related Posts Sidebar */}
        {relatedPosts.length > 0 && (
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="card">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Related Posts
                </h3>
                <div className="space-y-4">
                  {relatedPosts.map((relatedPost) => (
                    <Link
                      key={relatedPost.id}
                      href={`/posts/${relatedPost.id}`}
                      className="block p-3 border-2 border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all group"
                    >
                      <h4 className="font-semibold text-sm text-gray-900 group-hover:text-primary-600 line-clamp-2 mb-2">
                        {relatedPost.title}
                      </h4>
                      {relatedPost.author && (
                        <p className="text-xs text-gray-600 mb-1">
                          by {relatedPost.author.display_name}
                        </p>
                      )}
                      {relatedPost.tags && relatedPost.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {relatedPost.tags.slice(0, 2).map((tag) => (
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
