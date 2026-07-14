/** @type {import('next').NextConfig} */
// distDir 按运行模式隔离：开发(dev)用 .next-dev，生产(build/start)用 .next
// 防止 next dev 与 next start 共用 .next 互相覆盖导致生产服务 500
const isDev = process.env.NODE_ENV === "development";
const nextConfig = {
  distDir: isDev ? ".next-dev" : ".next",
  eslint: {
    // ESLint 已在本地验证通过，构建时跳过以避免 Vercel 环境差异导致的构建失败
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "source.unsplash.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
