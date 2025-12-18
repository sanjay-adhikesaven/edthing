'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { 
  SearchIcon, 
  UserIcon, 
  LogoutIcon, 
  HomeIcon, 
  ChartBarIcon, 
  BookmarkIcon,
  AcademicCapIcon
} from '@heroicons/react/outline';

export function Header() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMenuOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest('.user-menu')) {
          setIsMenuOpen(false);
        }
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMenuOpen]);

  const navLinks = [
    { href: '/', label: 'Posts', icon: HomeIcon },
    { href: '/dashboard', label: 'Dashboard', icon: ChartBarIcon },
    { href: '/bookmarks', label: 'Bookmarks', icon: BookmarkIcon },
  ];

  return (
    <header 
      className={`sticky top-0 z-50 bg-[#CFCBD4] border-b border-gray-300 transition-all duration-200 ${
        scrolled ? 'shadow-sm' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="hidden sm:block">
                <div className="text-lg font-semibold text-[#212529]">
                  Participation D
                </div>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`font-medium text-sm transition-colors ${
                      isActive
                        ? 'text-[#212529]'
                        : 'text-[#212529]/70 hover:text-[#212529]'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right side - User menu */}
          <div className="flex items-center gap-4">
            {status === 'loading' ? (
              <div className="skeleton h-10 w-10 rounded-full"></div>
            ) : session ? (
              <div className="relative user-menu">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center text-white font-semibold">
                    {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {session.user?.name || 'User'}
                  </span>
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg border border-gray-300 py-2 animate-scale-in">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-900">
                        {session.user?.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {session.user?.email}
                      </div>
                    </div>

                    {/* Mobile nav links */}
                    <div className="md:hidden py-2 border-b border-gray-200">
                      {navLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <Icon className="h-4 w-4" />
                            {link.label}
                          </Link>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => signOut()}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <LogoutIcon className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="btn btn-primary text-sm"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
