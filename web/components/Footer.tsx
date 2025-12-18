import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-auto bg-[#f9f7f5]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-center md:text-left">
          {/* Left column */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold tracking-wide text-gray-900">
              EECS 182
            </h2>
            <nav className="space-y-2 text-sm text-gray-700">
              <div>
                <Link href="/" className="hover:text-gray-900 transition-colors">
                  Weekly Schedule
                </Link>
              </div>
              <div>
                <Link href="/dashboard" className="hover:text-gray-900 transition-colors">
                  Office Hours
                </Link>
              </div>
              <div>
                <Link href="/bookmarks" className="hover:text-gray-900 transition-colors">
                  Staff
                </Link>
              </div>
            </nav>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold tracking-wide text-gray-900">
              Policies
            </h2>
            <nav className="space-y-2 text-sm text-gray-700">
              <div>
                <Link href="/" className="hover:text-gray-900 transition-colors">
                  Assignments
                </Link>
              </div>
              <div>
                <Link href="/" className="hover:text-gray-900 transition-colors">
                  Exam
                </Link>
              </div>
              <div>
                <Link href="/" className="hover:text-gray-900 transition-colors">
                  Grading
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
