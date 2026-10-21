import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
    serverActions: {
      bodySizeLimit: '25mb',
    },
    // CHANGES: подавляем ошибку Date.now() в Supabase Auth (proxy.ts)
    instantInsights: {
      validationLevel: 'manual-warning',
    },
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
}

export default nextConfig
