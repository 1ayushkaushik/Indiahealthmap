/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@prisma/client', 'prisma'],
  experimental: {
    // Any experimental features you need
  },
}

module.exports = nextConfig 