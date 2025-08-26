/** @type {import('next').NextConfig} */
const { withBundleOptimization } = require('./lib/performance/bundle-optimizer');

const nextConfig = {
  // 启用React严格模式
  reactStrictMode: true,
  
  // 跳过ESLint检查
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // 跳过TypeScript检查
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // 输出配置 - 使用standalone模式优化构建
  output: 'standalone',
  
  // 图片优化 - Next.js 15 增强版
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'pokeriq.pro',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: false,
    loader: 'default',
  },
  
  // PWA配置（用于移动端Web App）
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Next.js 15 性能优化头部
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // Performance optimizations
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          // Resource hints
          {
            key: 'Link',
            value: '</fonts/inter.woff2>; rel=preload; as=font; type=font/woff2; crossorigin=anonymous',
          },
        ],
      },
    ];
  },
  
  // 环境变量
  env: {
    APP_VERSION: '1.1.0',
    APP_NAME: 'PokerIQ Pro',
  },
  
  // Next.js 15 性能优化配置
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Next.js 15 服务器外部包配置
  serverExternalPackages: ['canvas', 'sharp'],
  
  // 实验性功能 - Next.js 15 增强版
  experimental: {
    // 启用服务器动作
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: ['localhost:3000', 'pokeriq.pro'],
    },
    // Next.js 15 稳定功能
    serverComponentsHmrCache: true, // 服务端组件热更新缓存
    staleTimes: {
      dynamic: 30, // 动态页面缓存时间
      static: 180, // 静态页面缓存时间
    },
    // 优化打包
    optimizePackageImports: ['antd', 'lodash', 'socket.io-client', 'lucide-react', 'framer-motion', 'recharts', '@heroicons/react'],
    // 启用并发特性
    concurrentFeatures: true,
    // 启用应用目录
    appDir: true,
    // 边缘运行时优化
    allowedRevalidateHeaderKeys: ['x-revalidate-tag'],
    // 优化客户端导航
    optimisticClientCache: true,
  },
  
  // Turbopack 配置 (Next.js 15 稳定版)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // Webpack优化配置
  webpack: (config, { dev, isServer }) => {
    // 生产环境优化
    if (!dev) {
      config.optimization.splitChunks.chunks = 'all';
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },
        antd: {
          test: /[\\/]node_modules[\\/]antd[\\/]/,
          name: 'antd',
          chunks: 'all',
          priority: 20,
        },
        socket: {
          test: /[\\/]node_modules[\\/]socket\.io-client[\\/]/,
          name: 'socket',
          chunks: 'all',
          priority: 20,
        },
        lucide: {
          test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
          name: 'lucide',
          chunks: 'all',
          priority: 20,
        },
        motion: {
          test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
          name: 'motion',
          chunks: 'all',
          priority: 20,
        },
        recharts: {
          test: /[\\/]node_modules[\\/]recharts[\\/]/,
          name: 'recharts',
          chunks: 'all',
          priority: 20,
        },
        // 分离React相关包
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 30,
        },
      };

      // 压缩优化
      config.optimization.minimize = true;
      
      // 模块联邦优化
      config.optimization.moduleIds = 'deterministic';
      config.optimization.chunkIds = 'deterministic';
    }

    // 开发环境优化
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }

    // 通用优化
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname),
    };

    // 忽略特定文件的变化
    config.watchOptions = {
      ...config.watchOptions,
      ignored: /node_modules/,
    };
    
    return config;
  },
};

// Apply advanced bundle optimization
module.exports = withBundleOptimization(nextConfig);