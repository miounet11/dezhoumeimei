'use client';

import { useState, useEffect } from 'react';
import { Card, Tabs, Select, Button, Row, Col, Statistic, Progress, Tag, Space, Avatar, Spin, Typography } from 'antd';
import { 
  TrophyOutlined,
  StarOutlined,
  RiseOutlined,
  GiftOutlined,
  CheckCircleOutlined,
  LockOutlined,
  HeartOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  BookOutlined
} from '@ant-design/icons';
import { useUserData } from '@/hooks/useUserData';
import AppLayout from '@/src/components/layout/AppLayout';

const { Title, Text } = Typography;

interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: string;
  requirement: any;
  reward: any;
  userProgress: {
    progress: number;
    completed: boolean;
    unlockedAt: string | null;
  };
}

export default function AchievementsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const { userData, loading, error } = useUserData();

  if (loading) {
    return (
      <div className="min-h-screen max-w-full flex justify-center items-center">
        <Spin size="large" spinning={true}>
          <div className="text-lg text-gray-600 dark:text-gray-400 mt-4">加载成就数据...</div>
        </Spin>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="p-6 bg-gray-50 min-h-full">
        <div className="text-center">
          <Title level={3}>数据加载失败</Title>
          <Text type="secondary">请刷新页面重试</Text>
        </div>
      </div>
    );
  }

  const mockAchievements: any[] = [
    // 陪伴成就 - 新增类别
    {
      id: 'comp_1',
      name: '初次邂逅',
      description: '获得第一个虚拟陪伴',
      icon: '💝',
      category: 'companion',
      rarity: 'common',
      progress: 1,
      total: 1,
      unlocked: true,
      unlockedAt: '2024-01-01',
      rewards: { exp: 200, intimacy: 10 }
    },
    {
      id: 'comp_2',
      name: '陪伴收藏家',
      description: '拥有5个不同的陪伴',
      icon: '👥',
      category: 'companion',
      rarity: 'rare',
      progress: 3,
      total: 5,
      unlocked: false,
      rewards: { exp: 500, coins: 300 }
    },
    {
      id: 'comp_3',
      name: '灵魂伴侣',
      description: '任意陪伴达到100亲密度',
      icon: '💖',
      category: 'companion',
      rarity: 'epic',
      progress: 68,
      total: 100,
      unlocked: false,
      rewards: { exp: 1500, specialOutfit: '永恒之爱' }
    },
    {
      id: 'comp_4',
      name: 'S级驯服者',
      description: '获得一个S级陪伴',
      icon: '👑',
      category: 'companion',
      rarity: 'legendary',
      progress: 0,
      total: 1,
      unlocked: false,
      rewards: { exp: 3000, title: '传奇收藏家' }
    },
    {
      id: 'comp_5',
      name: '告别与重逢',
      description: '成功赎回失去的陪伴',
      icon: '🔄',
      category: 'companion',
      rarity: 'rare',
      progress: 0,
      total: 1,
      unlocked: false,
      rewards: { exp: 800, emotionValue: 100 }
    },

    // 时间成就
    {
      id: '1',
      name: '初来乍到',
      description: '完成第一次训练',
      icon: '🌟',
      category: 'time',
      rarity: 'common',
      progress: 1,
      total: 1,
      unlocked: true,
      unlockedAt: '2024-01-01',
      rewards: { exp: 100 }
    },
    {
      id: '2',
      name: '七日游',
      description: '连续登录7天',
      icon: '📅',
      category: 'time',
      rarity: 'common',
      progress: 7,
      total: 7,
      unlocked: true,
      unlockedAt: '2024-01-07',
      rewards: { exp: 200, coins: 50 }
    },
    {
      id: '3',
      name: '月度玩家',
      description: '连续登录30天',
      icon: '🗓️',
      category: 'time',
      rarity: 'rare',
      progress: 28,
      total: 30,
      unlocked: false,
      rewards: { exp: 500, coins: 200 }
    },
    {
      id: '4',
      name: '百日征程',
      description: '累计训练100天',
      icon: '💯',
      category: 'time',
      rarity: 'epic',
      progress: 68,
      total: 100,
      unlocked: false,
      rewards: { exp: 1000, coins: 500, badge: '百日勇士' }
    },
    {
      id: '5',
      name: '年度大师',
      description: '累计训练365天',
      icon: '👑',
      category: 'time',
      rarity: 'legendary',
      progress: 68,
      total: 365,
      unlocked: false,
      rewards: { exp: 5000, coins: 2000, badge: '年度大师' }
    },

    // 技能成就
    {
      id: '6',
      name: '数学家',
      description: 'EV计算准确率达到90%',
      icon: '🧮',
      category: 'skill',
      rarity: 'rare',
      progress: 85,
      total: 90,
      unlocked: false,
      rewards: { exp: 300 }
    },
    {
      id: '7',
      name: 'GTO学者',
      description: '掌握100个GTO场景',
      icon: '🎓',
      category: 'skill',
      rarity: 'epic',
      progress: 42,
      total: 100,
      unlocked: false,
      rewards: { exp: 800, badge: 'GTO专家' }
    },
    {
      id: '8',
      name: '心理大师',
      description: '成功识别对手倾向500次',
      icon: '🧠',
      category: 'skill',
      rarity: 'epic',
      progress: 287,
      total: 500,
      unlocked: false,
      rewards: { exp: 1000 }
    },

    // 对战成就
    {
      id: '9',
      name: '首胜',
      description: '赢得第一场对局',
      icon: '🏆',
      category: 'battle',
      rarity: 'common',
      progress: 1,
      total: 1,
      unlocked: true,
      unlockedAt: '2024-01-01',
      rewards: { exp: 100 }
    },
    {
      id: '10',
      name: '连胜王',
      description: '连续获胜10场',
      icon: '🔥',
      category: 'battle',
      rarity: 'rare',
      progress: 7,
      total: 10,
      unlocked: false,
      rewards: { exp: 500, coins: 200 }
    },
    {
      id: '11',
      name: '百战百胜',
      description: '累计获胜100场',
      icon: '⚔️',
      category: 'battle',
      rarity: 'epic',
      progress: 68,
      total: 100,
      unlocked: false,
      rewards: { exp: 1000, badge: '战神' }
    },
    {
      id: '12',
      name: '专家猎手',
      description: '击败专家级AI 50次',
      icon: '🎯',
      category: 'battle',
      rarity: 'legendary',
      progress: 12,
      total: 50,
      unlocked: false,
      rewards: { exp: 3000, coins: 1000, badge: '屠龙者' }
    },

    // 收藏成就
    {
      id: '13',
      name: '收藏家',
      description: '解锁10个成就',
      icon: '📦',
      category: 'collection',
      rarity: 'common',
      progress: 3,
      total: 10,
      unlocked: false,
      rewards: { exp: 200 }
    },
    {
      id: '14',
      name: '勋章大师',
      description: '获得所有稀有勋章',
      icon: '🎖️',
      category: 'collection',
      rarity: 'legendary',
      progress: 2,
      total: 10,
      unlocked: false,
      rewards: { exp: 5000, badge: '传奇收藏家' }
    },
  ];

  // 使用真实用户数据生成成就进度
  const generateAchievementProgress = () => {
    const stats = userData.stats || {};
    const companions = userData.companions || [];
    const achievements = userData.recentAchievements || [];
    
    return mockAchievements.map(achievement => {
      // 基于真实数据计算进度
      switch (achievement.id) {
        case 'comp_1': // 初次邂逅
          return {
            ...achievement,
            unlocked: companions.length > 0,
            progress: companions.length > 0 ? 1 : 0
          };
        case 'comp_2': // 陪伴收藏家
          return {
            ...achievement,
            unlocked: companions.length >= 5,
            progress: companions.length,
            total: 5
          };
        case 'comp_3': // 灵魂伴侣
          const maxIntimacy = companions.length > 0 ? Math.max(...companions.map(c => c.intimacyPoints || 0)) : 0;
          return {
            ...achievement,
            unlocked: maxIntimacy >= 100,
            progress: maxIntimacy,
            total: 100
          };
        case '6': // 数学家 - EV计算准确率
          const accuracy = Math.min(95, 60 + (stats.winRate || 0) * 0.5);
          return {
            ...achievement,
            unlocked: accuracy >= 90,
            progress: Math.floor(accuracy),
            total: 90
          };
        case '9': // 首胜
          return {
            ...achievement,
            unlocked: (stats.totalGames || 0) > 0 && (stats.winRate || 0) > 0,
            progress: (stats.totalGames || 0) > 0 && (stats.winRate || 0) > 0 ? 1 : 0
          };
        case '10': // 连胜王
          return {
            ...achievement,
            unlocked: (stats.currentStreak || 0) >= 10,
            progress: stats.currentStreak || 0,
            total: 10
          };
        case '11': // 百战百胜
          const totalWins = Math.floor((stats.totalGames || 0) * ((stats.winRate || 0) / 100));
          return {
            ...achievement,
            unlocked: totalWins >= 100,
            progress: totalWins,
            total: 100
          };
        case '13': // 收藏家
          return {
            ...achievement,
            unlocked: achievements.length >= 10,
            progress: achievements.length,
            total: 10
          };
        default:
          return achievement;
      }
    });
  };

  const displayAchievements = generateAchievementProgress();

  const categories = [
    { id: 'all', name: '全部', icon: '📋' },
    { id: 'companion', name: '陪伴', icon: '💝' },
    { id: 'time', name: '时间', icon: '⏰' },
    { id: 'skill', name: '技能', icon: '💡' },
    { id: 'battle', name: '对战', icon: '⚔️' },
    { id: 'collection', name: '收藏', icon: '📦' },
  ];

  const rarities = [
    { id: 'all', name: '全部', color: 'gray' },
    { id: 'common', name: '普通', color: 'gray' },
    { id: 'rare', name: '稀有', color: 'blue' },
    { id: 'epic', name: '史诗', color: 'purple' },
    { id: 'legendary', name: '传说', color: 'orange' },
  ];

  const filteredAchievements = displayAchievements.filter(achievement => {
    const categoryMatch = selectedCategory === 'all' || achievement.category.toLowerCase() === selectedCategory;
    const rarityMatch = selectedRarity === 'all' || achievement.rarity.toLowerCase() === selectedRarity;
    return categoryMatch && rarityMatch;
  });

  const totalAchievements = displayAchievements.length;
  const unlockedAchievements = displayAchievements.filter(a => a.userProgress?.completed || a.unlocked).length;
  const totalExp = displayAchievements
    .filter(a => a.userProgress?.completed || a.unlocked)
    .reduce((sum, a) => {
      const xp = a.reward?.xp || a.rewards?.exp || 0;
      return sum + xp;
    }, 0);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
      case 'COMMON': return 'border-gray-300 bg-gray-50';
      case 'rare':
      case 'RARE': return 'border-blue-300 bg-blue-50';
      case 'epic':
      case 'EPIC': return 'border-purple-300 bg-purple-50';
      case 'legendary':
      case 'LEGENDARY': return 'border-orange-300 bg-orange-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getRarityBadgeColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
      case 'COMMON': return 'bg-gray-100 text-gray-700';
      case 'rare':
      case 'RARE': return 'bg-blue-100 text-blue-700';
      case 'epic':
      case 'EPIC': return 'bg-purple-100 text-purple-700';
      case 'legendary':
      case 'LEGENDARY': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen max-w-full">
        {/* 页面头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                成就系统
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                收集成就，见证你的成长历程
              </p>
            </div>
          </div>
        </div>

      {/* 整体进度统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="解锁进度"
              value={unlockedAchievements}
              suffix={`/ ${totalAchievements}`}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <Progress
              percent={(unlockedAchievements / totalAchievements) * 100}
              strokeColor="#52c41a"
              showInfo={false}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="获得经验"
              value={totalExp}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="当前等级"
              value={userData.level}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 筛选器 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col>
            <Text strong>分类:</Text>
          </Col>
          <Col flex="auto">
            <Space wrap>
              {categories.map(category => (
                <Button
                  key={category.id}
                  type={selectedCategory === category.id ? 'primary' : 'default'}
                  onClick={() => setSelectedCategory(category.id)}
                  icon={category.id === 'companion' ? <HeartOutlined /> :
                        category.id === 'time' ? <ClockCircleOutlined /> :
                        category.id === 'skill' ? <BookOutlined /> :
                        category.id === 'battle' ? <ThunderboltOutlined /> : <TrophyOutlined />}
                >
                  {category.name}
                </Button>
              ))}
            </Space>
          </Col>
        </Row>
        
        <Row gutter={[16, 16]} align="middle" style={{ marginTop: 16 }}>
          <Col>
            <Text strong>稀有度:</Text>
          </Col>
          <Col flex="auto">
            <Space wrap>
              {rarities.map(rarity => (
                <Button
                  key={rarity.id}
                  type={selectedRarity === rarity.id ? 'primary' : 'default'}
                  onClick={() => setSelectedRarity(rarity.id)}
                >
                  {rarity.name}
                </Button>
              ))}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 成就网格 */}
      <Row gutter={[16, 16]}>
        {filteredAchievements.map(achievement => (
          <Col xs={24} md={12} lg={8} key={achievement.id}>
            <Card
              className={`
                ${(achievement.userProgress?.completed || achievement.unlocked)
                  ? 'border-green-400 shadow-lg' 
                  : 'border-gray-200'
                }
              `}
              actions={[
                <div key="status">
                  {(achievement.userProgress?.completed || achievement.unlocked) ? (
                    <Tag color="success" icon={<CheckCircleOutlined />}>已解锁</Tag>
                  ) : (
                    <Tag color="default" icon={<LockOutlined />}>未解锁</Tag>
                  )}
                </div>
              ]}
            >
              <Card.Meta
                avatar={
                  <Avatar size={48} style={{ backgroundColor: '#f0f0f0', color: '#333', fontSize: '20px' }}>
                    {achievement.icon}
                  </Avatar>
                }
                title={achievement.name}
                description={achievement.description}
              />
              
              {/* 稀有度标签 */}
              <div style={{ marginTop: 12, marginBottom: 12 }}>
                <Tag color={
                  achievement.rarity === 'common' || achievement.rarity === 'COMMON' ? 'default' :
                  achievement.rarity === 'rare' || achievement.rarity === 'RARE' ? 'blue' :
                  achievement.rarity === 'epic' || achievement.rarity === 'EPIC' ? 'purple' :
                  'orange'
                }>
                  {(achievement.rarity === 'common' || achievement.rarity === 'COMMON') && '普通'}
                  {(achievement.rarity === 'rare' || achievement.rarity === 'RARE') && '稀有'}
                  {(achievement.rarity === 'epic' || achievement.rarity === 'EPIC') && '史诗'}
                  {(achievement.rarity === 'legendary' || achievement.rarity === 'LEGENDARY') && '传说'}
                </Tag>
              </div>

              {/* 进度条 */}
              {!(achievement.userProgress?.completed || achievement.unlocked) && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>进度</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {achievement.progress || 0}/{achievement.total || 100}
                    </Text>
                  </div>
                  <Progress
                    percent={Math.round((achievement.progress || 0) / (achievement.total || 100) * 100)}
                    strokeColor={{ '0%': '#722ed1', '100%': '#eb2f96' }}
                    size="small"
                  />
                </div>
              )}

              {/* 奖励 */}
              <div style={{ backgroundColor: '#fafafa', padding: 12, borderRadius: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <GiftOutlined style={{ color: '#faad14', marginRight: 4 }} />
                  <Text strong style={{ fontSize: 12 }}>奖励</Text>
                </div>
                <Space wrap>
                  <Tag color="gold">+{achievement.reward?.xp || achievement.rewards?.exp || 0} EXP</Tag>
                  {(achievement.reward?.coins || achievement.rewards?.coins) && (
                    <Tag color="orange">+{achievement.reward?.coins || achievement.rewards?.coins} 金币</Tag>
                  )}
                  {(achievement.reward?.title || achievement.rewards?.badge) && (
                    <Tag color="purple">{achievement.reward?.title || achievement.rewards?.badge}</Tag>
                  )}
                </Space>
              </div>

              {/* 解锁时间 */}
              {(achievement.userProgress?.completed || achievement.unlocked) && (achievement.userProgress?.unlockedAt || achievement.unlockedAt) && (
                <div style={{ marginTop: 12 }}>
                  <Text type="success" style={{ fontSize: 12 }}>
                    <CheckCircleOutlined style={{ marginRight: 4 }} />
                    解锁于 {new Date(achievement.userProgress?.unlockedAt || achievement.unlockedAt).toLocaleDateString()}
                  </Text>
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>

        {/* 空状态 */}
        {filteredAchievements.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <TrophyOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
            <Title level={4} style={{ marginTop: 16, color: '#999' }}>没有找到成就</Title>
            <Text type="secondary">尝试调整筛选条件查看更多成就</Text>
          </div>
        )}
      </div>
    </AppLayout>
  );
}