/** @type {import('next').NextConfig} */
const nextConfig = {
  // NOTE: 'output: export' was removed so the App Router API routes
  // (app/api/lead, app/api/razorpay-order) run as server functions.
  // Static export drops /api entirely. Deploy as a Next.js server (Vercel).
  // 'trailingSlash' was also removed: it 308-redirected the no-trailing-slash
  // /api/* fetches and internal links the app actually uses.
  images: {
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
}

module.exports = nextConfig