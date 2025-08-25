import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 性能优化
  reactStrictMode: true,
  swcMinify: true,
  
  // 图片优化
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: ['localhost', 'pokeriq.com'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // 实验性功能
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
  
  // 压缩
  compress: true,
  
  // PWA支持
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/:path*.svg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, immutable, max-age=31536000',
          },
        ],
      },
      {
        source: '/:path*.{jpg,jpeg,png,gif,webp,avif,ico}',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*.{js,css,woff,woff2,ttf,otf}',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // 重定向
  redirects: async () => {
    return [
      {
        source: '/home',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },
  
  // Webpack配置
  webpack: (config, { isServer }) => {
    // 优化打包
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            name: 'framework',
            chunks: 'all',
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|use-sync-external-store|next)[\\/]/,
            priority: 40,
            enforce: true,
          },
          lib: {
            test(module: any) {
              return module.size() > 160000 &&
                /node_modules[/\\]/.test(module.identifier());
            },
            name(module: any) {
              const hash = require('crypto')
                .createHash('sha256')
                .update(module.identifier())
                .digest('hex');
              return `lib-${hash.substring(0, 8)}`;
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
            priority: 20,
          },
          shared: {
            name(module: any, chunks: any) {
              const hash = require('crypto')
                .createHash('sha256')
                .update(chunks.reduce((acc: string, chunk: any) => acc + chunk.name, ''))
                .digest('hex');
              return `shared-${hash.substring(0, 8)}`;
            },
            priority: 10,
            minChunks: 2,
            reuseExistingChunk: true,
          },
        },
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
      };
    }
    
    return config;
  },
  
  // 输出配置
  output: 'standalone',
  
  // TypeScript
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
