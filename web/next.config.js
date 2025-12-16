/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['avatars.githubusercontent.com', 'github.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/ed/download/:attachmentId',
        destination: '/api/ed/download/:attachmentId',
      },
    ]
  },
}

module.exports = nextConfig
