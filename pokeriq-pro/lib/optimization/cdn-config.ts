/**
 * CDN优化配置
 * 为PokerIQ Pro提供全球CDN加速和静态资源优化
 */

// CDN配置选项
export const CDN_CONFIG = {
  // 主要CDN域名
  primaryDomain: 'cdn.pokeriq.pro',
  
  // 区域CDN节点
  regions: {
    'us-east': 'us-east-cdn.pokeriq.pro',
    'us-west': 'us-west-cdn.pokeriq.pro',
    'eu-west': 'eu-west-cdn.pokeriq.pro',
    'asia-pacific': 'ap-cdn.pokeriq.pro',
    'china': 'cn-cdn.pokeriq.pro',
  },
  
  // 资源类型配置
  assetTypes: {
    images: {
      formats: ['webp', 'avif', 'jpg', 'png'],
      qualities: {
        high: 85,
        medium: 70,
        low: 50,
        thumbnail: 30,
      },
      sizes: [320, 640, 768, 1024, 1280, 1920, 2560],
      cacheTtl: 31536000, // 1年
    },
    
    scripts: {
      compression: ['gzip', 'brotli'],
      minification: true,
      bundling: true,
      cacheTtl: 86400, // 1天
    },
    
    styles: {
      compression: ['gzip', 'brotli'],
      minification: true,
      prefixing: true,
      purging: true,
      cacheTtl: 86400, // 1天
    },
    
    fonts: {
      formats: ['woff2', 'woff', 'ttf'],
      preload: ['Inter-Regular', 'Inter-Bold'],
      cacheTtl: 31536000, // 1年
    },
    
    videos: {
      formats: ['mp4', 'webm'],
      qualities: ['480p', '720p', '1080p'],
      cacheTtl: 2592000, // 30天
    },
  },
  
  // 缓存策略
  cacheStrategies: {
    static: {
      pattern: /\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/,
      maxAge: 31536000, // 1年
      immutable: true,
    },
    
    dynamic: {
      pattern: /\.(html|json)$/,
      maxAge: 300, // 5分钟
      staleWhileRevalidate: 86400, // 1天
    },
    
    api: {
      pattern: /^\/api\//,
      maxAge: 60, // 1分钟
      staleWhileRevalidate: 300, // 5分钟
    },
  },
};

/**
 * CDN资源优化器
 */
export class CDNOptimizer {
  private static instance: CDNOptimizer;
  private config = CDN_CONFIG;

  private constructor() {}

  static getInstance(): CDNOptimizer {
    if (!CDNOptimizer.instance) {
      CDNOptimizer.instance = new CDNOptimizer();
    }
    return CDNOptimizer.instance;
  }

  /**
   * 获取最优CDN节点
   */
  getOptimalCDNNode(userLocation?: {
    country?: string;
    region?: string;
    latitude?: number;
    longitude?: number;
  }): string {
    if (!userLocation) {
      return this.config.primaryDomain;
    }

    // 根据用户位置选择最近的CDN节点
    const { country, region } = userLocation;

    if (country === 'CN') {
      return this.config.regions['china'];
    }

    if (country === 'US') {
      return region?.includes('west') 
        ? this.config.regions['us-west']
        : this.config.regions['us-east'];
    }

    if (['GB', 'DE', 'FR', 'IT', 'ES', 'NL'].includes(country || '')) {
      return this.config.regions['eu-west'];
    }

    if (['JP', 'KR', 'SG', 'AU', 'IN'].includes(country || '')) {
      return this.config.regions['asia-pacific'];
    }

    return this.config.primaryDomain;
  }

  /**
   * 生成响应式图片URL
   */
  generateResponsiveImageUrl(
    imagePath: string,
    options: {
      width?: number;
      quality?: 'high' | 'medium' | 'low' | 'thumbnail';
      format?: 'webp' | 'avif' | 'jpg' | 'png';
      userLocation?: any;
    } = {}
  ): string {
    const cdnNode = this.getOptimalCDNNode(options.userLocation);
    const { width, quality = 'medium', format = 'webp' } = options;
    
    const qualityValue = this.config.assetTypes.images.qualities[quality];
    
    let url = `https://${cdnNode}/images${imagePath}`;
    const params: string[] = [];

    if (width) {
      params.push(`w=${width}`);
    }
    
    params.push(`q=${qualityValue}`);
    params.push(`f=${format}`);

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    return url;
  }

  /**
   * 生成响应式图片srcSet
   */
  generateResponsiveImageSrcSet(
    imagePath: string,
    options: {
      quality?: 'high' | 'medium' | 'low';
      format?: 'webp' | 'avif' | 'jpg' | 'png';
      userLocation?: any;
    } = {}
  ): string {
    const sizes = this.config.assetTypes.images.sizes;
    
    return sizes
      .map(width => {
        const url = this.generateResponsiveImageUrl(imagePath, {
          ...options,
          width,
        });
        return `${url} ${width}w`;
      })
      .join(', ');
  }

  /**
   * 获取优化的静态资源URL
   */
  getOptimizedAssetUrl(
    assetPath: string,
    assetType: 'scripts' | 'styles' | 'fonts' | 'images',
    userLocation?: any
  ): string {
    const cdnNode = this.getOptimalCDNNode(userLocation);
    
    // 添加版本控制和缓存破坏
    const version = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
    const versionHash = this.generateVersionHash(version);
    
    return `https://${cdnNode}/${assetType}${assetPath}?v=${versionHash}`;
  }

  /**
   * 预加载关键资源
   */
  generatePreloadLinks(criticalResources: Array<{
    href: string;
    type: 'script' | 'style' | 'font' | 'image';
    crossorigin?: boolean;
  }>): string[] {
    return criticalResources.map(resource => {
      const optimizedUrl = this.getOptimizedAssetUrl(resource.href, 
        resource.type === 'script' ? 'scripts' :
        resource.type === 'style' ? 'styles' :
        resource.type === 'font' ? 'fonts' : 'images'
      );

      let link = `<link rel="preload" href="${optimizedUrl}" as="${resource.type}"`;
      
      if (resource.type === 'font') {
        link += ' type="font/woff2" crossorigin';
      } else if (resource.crossorigin) {
        link += ' crossorigin';
      }
      
      link += '>';
      return link;
    });
  }

  /**
   * 生成Cache-Control头
   */
  generateCacheHeaders(assetPath: string): {
    'Cache-Control': string;
    'Vary'?: string;
    'ETag'?: string;
  } {
    const isStatic = this.config.cacheStrategies.static.pattern.test(assetPath);
    const isDynamic = this.config.cacheStrategies.dynamic.pattern.test(assetPath);
    const isApi = this.config.cacheStrategies.api.pattern.test(assetPath);

    if (isStatic) {
      return {
        'Cache-Control': `public, max-age=${this.config.cacheStrategies.static.maxAge}, immutable`,
        'Vary': 'Accept-Encoding',
      };
    }

    if (isDynamic) {
      const { maxAge, staleWhileRevalidate } = this.config.cacheStrategies.dynamic;
      return {
        'Cache-Control': `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
        'Vary': 'Accept-Encoding',
        'ETag': this.generateETag(assetPath),
      };
    }

    if (isApi) {
      const { maxAge, staleWhileRevalidate } = this.config.cacheStrategies.api;
      return {
        'Cache-Control': `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
        'Vary': 'Accept-Encoding, Authorization',
      };
    }

    // 默认无缓存
    return {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    };
  }

  /**
   * 生成版本哈希
   */
  private generateVersionHash(version: string): string {
    // 简化版本，实际应用中应使用文件内容哈希
    return Buffer.from(version).toString('base64').substring(0, 8);
  }

  /**
   * 生成ETag
   */
  private generateETag(content: string): string {
    // 简化版本，实际应用中应使用文件内容哈希
    return `"${Buffer.from(content).toString('base64').substring(0, 16)}"`;
  }
}

/**
 * Next.js CDN配置
 */
export const nextjsCDNConfig = {
  images: {
    domains: [
      'cdn.pokeriq.pro',
      'us-east-cdn.pokeriq.pro',
      'us-west-cdn.pokeriq.pro',
      'eu-west-cdn.pokeriq.pro',
      'ap-cdn.pokeriq.pro',
      'cn-cdn.pokeriq.pro',
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1年
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  assetPrefix: process.env.NODE_ENV === 'production' 
    ? `https://${CDN_CONFIG.primaryDomain}`
    : '',
    
  compress: true,
  
  headers: async () => [
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
      ],
    },
    {
      source: '/api/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=60, stale-while-revalidate=300',
        },
      ],
    },
    {
      source: '/_next/static/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
};

/**
 * CloudFlare CDN配置
 */
export const cloudflareConfig = {
  // Page Rules
  pageRules: [
    {
      url: '*.pokeriq.pro/_next/static/*',
      settings: {
        cacheLevel: 'cache_everything',
        edgeCacheTtl: 31536000, // 1年
        browserCacheTtl: 31536000,
      },
    },
    {
      url: '*.pokeriq.pro/api/*',
      settings: {
        cacheLevel: 'bypass',
        disablePerformance: false,
        disableRailgun: false,
      },
    },
    {
      url: 'pokeriq.pro/*',
      settings: {
        cacheLevel: 'standard',
        edgeCacheTtl: 300, // 5分钟
        browserCacheTtl: 300,
        alwaysOnline: true,
      },
    },
  ],
  
  // 优化设置
  optimization: {
    minification: {
      css: true,
      html: true,
      js: true,
    },
    autominify: true,
    brotli: true,
    earlyHints: true,
    http2ServerPush: true,
    imageOptimization: true,
    rocketLoader: false, // 可能与React冲突
  },
  
  // 安全设置
  security: {
    ssl: 'full_strict',
    alwaysUseHttps: true,
    automaticHttpsRewrites: true,
    opportunisticEncryption: true,
    tls13: true,
    universalSSL: true,
    hsts: {
      enabled: true,
      maxAge: 63072000,
      includeSubdomains: true,
      preload: true,
    },
  },
  
  // 性能设置
  performance: {
    polish: 'lossy',
    webp: true,
    mirage: true,
    ipv6: true,
    http2: true,
    http3: true,
    quic: true,
    '0rtt': true,
  },
};

// 导出CDN优化器实例
export const cdnOptimizer = CDNOptimizer.getInstance();

export default cdnOptimizer;