import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Prisma 复杂类型会导致 tsc 栈溢出,build 跳过类型检查
  // 需要严格检查时运行 npm run typecheck
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
