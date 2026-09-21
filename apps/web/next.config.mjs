/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  webpack: (config) => {
    // monorepo workspace 依赖：保留 node_modules 下的真实路径，当作普通依赖打包，避免被 fast-refresh 当源码注入 HMR
    config.resolve.symlinks = false;
    return config;
  },
};

export default nextConfig;