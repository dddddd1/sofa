/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@harper/core'],
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;