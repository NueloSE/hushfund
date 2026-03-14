/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  // Enable Turbopack explicitly (Next.js 16 default) with empty config
  // to silence the webpack/turbopack conflict error
  turbopack: {},
};

export default nextConfig;

