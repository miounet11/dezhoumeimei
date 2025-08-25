import type { Metadata } from 'next'

// 基础SEO配置
const BASE_URL = 'https://pokeriq.pro'
const SITE_NAME = 'PokerIQ Pro'
const DEFAULT_TITLE = 'PokerIQ Pro - 专业德州扑克AI训练平台'
const DEFAULT_DESCRIPTION = '通过AI对手和GTO策略提升你的德州扑克技能。专业的训练环境，实时数据分析，个性化陪伴系统。'

// 生成基础元数据
export function generateBaseMetadata(
  title?: string,
  description?: string,
  path?: string
): Metadata {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE
  const fullDescription = description || DEFAULT_DESCRIPTION
  const url = path ? `${BASE_URL}${path}` : BASE_URL

  return {
    title: fullTitle,
    description: fullDescription,
    applicationName: SITE_NAME,
    authors: [{ name: 'PokerIQ Team' }],
    generator: 'Next.js',
    keywords: [
      '德州扑克',
      '扑克训练',
      'AI对手',
      'GTO策略',
      '扑克技能',
      '数据分析',
      '扑克学习',
      '在线扑克',
      '扑克软件',
      '扑克助手'
    ],
    creator: 'PokerIQ Team',
    publisher: 'PokerIQ Pro',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    
    // Open Graph
    openGraph: {
      type: 'website',
      locale: 'zh_CN',
      url,
      siteName: SITE_NAME,
      title: fullTitle,
      description: fullDescription,
      images: [
        {
          url: `${BASE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: SITE_NAME,
        },
      ],
    },
    
    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      site: '@PokerIQPro',
      creator: '@PokerIQPro',
      title: fullTitle,
      description: fullDescription,
      images: [`${BASE_URL}/twitter-image.png`],
    },
    
    // App相关
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: SITE_NAME,
      startupImage: [
        {
          url: '/apple-touch-startup-image-768x1004.png',
          media: '(device-width: 768px) and (device-height: 1024px)',
        },
      ],
    },
    
    // Manifest
    manifest: '/manifest.json',
    
    // 其他SEO
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    
    // 结构化数据
    other: {
      'application-name': SITE_NAME,
      'mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
      'theme-color': '#1a1a2e',
      'msapplication-navbutton-color': '#1a1a2e',
      'msapplication-TileColor': '#1a1a2e',
    },
  }
}

// 游戏页面元数据
export function generateGameMetadata(gameType?: string): Metadata {
  const title = gameType ? `${gameType} - 开始游戏` : '开始游戏'
  const description = '在专业的德州扑克环境中与AI对手对战，提升你的实战技能和决策能力。'
  
  return {
    ...generateBaseMetadata(title, description, '/game'),
    openGraph: {
      ...generateBaseMetadata().openGraph,
      type: 'website',
      images: [
        {
          url: `${BASE_URL}/game-og-image.png`,
          width: 1200,
          height: 630,
          alt: '德州扑克游戏界面',
        },
      ],
    },
  }
}

// 训练页面元数据
export function generateTrainingMetadata(trainingType?: string): Metadata {
  const title = trainingType ? `${trainingType} - AI训练` : 'AI训练'
  const description = '通过AI对手训练提升扑克技能，学习GTO策略，分析手牌历史，成为扑克专家。'
  
  return {
    ...generateBaseMetadata(title, description, '/ai-training'),
    keywords: [
      '扑克训练',
      'AI对手',
      'GTO策略',
      '扑克学习',
      '技能提升',
      '手牌分析',
      '扑克教学',
      '策略训练'
    ],
  }
}

// 分析页面元数据
export function generateAnalyticsMetadata(): Metadata {
  const title = '数据分析'
  const description = '深入分析你的扑克表现，查看详细统计数据，识别优势和弱点，制定改进策略。'
  
  return {
    ...generateBaseMetadata(title, description, '/analytics'),
    keywords: [
      '扑克统计',
      '数据分析',
      '性能分析',
      'VPIP',
      'PFR',
      '胜率分析',
      '扑克指标',
      '成长追踪'
    ],
  }
}

// 用户档案元数据
export function generateProfileMetadata(userName?: string): Metadata {
  const title = userName ? `${userName} 的档案` : '个人档案'
  const description = userName 
    ? `查看 ${userName} 的扑克统计数据、成就和游戏历史。`
    : '管理你的个人档案，查看统计数据和成就记录。'
  
  return {
    ...generateBaseMetadata(title, description, '/profile'),
    openGraph: {
      ...generateBaseMetadata().openGraph,
      type: 'profile',
    },
  }
}

// JSON-LD结构化数据生成器
export function generateWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: 'PokerIQ Professional',
    url: BASE_URL,
    description: DEFAULT_DESCRIPTION,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function generateSoftwareApplicationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'Game',
    operatingSystem: 'Web Browser',
    url: BASE_URL,
    description: DEFAULT_DESCRIPTION,
    softwareVersion: '1.1.0',
    offers: {
      '@type': 'Offer',
      category: 'Free',
      price: '0',
      priceCurrency: 'CNY',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1250',
      bestRating: '5',
      worstRating: '1',
    },
  }
}

// 组织信息JSON-LD
export function generateOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    sameAs: [
      'https://twitter.com/PokerIQPro',
      'https://github.com/pokeriq-pro',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      url: `${BASE_URL}/contact`,
    },
  }
}