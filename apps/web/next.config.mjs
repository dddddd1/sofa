/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  webpack: (config) => {
    // monorepo workspace 依赖：保留 node_modules 下的真实路径，当作普通依赖打包，避免被 fast-refresh 当源码注入 HMR
    config.resolve.symlinks = false;
    return config;
  },
  // 同域相对路径方案：前端始终请求同站 /v1·*，由这里反向代理到后端（API_UPSTREAM）。
  // 这样换域名时无需改任何前端代码/构建，只需改环境变量。
  async rewrites() {
    const upstream = process.env.API_UPSTREAM;
    if (!upstream) return [];
    return [
      {
        source: '/v1/:path*',
        destination: `${upstream}/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;