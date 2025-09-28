/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@canopyiq/shared', '@canopyiq/database', '@canopyiq/analytics'],
  experimental: {
    serverComponentsExternalPackages: ['@octokit/app', 'drizzle-orm', 'postgres'],
  },
}

module.exports = nextConfig