'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Avatar, Tag, Progress, Statistic, List, Tabs, Badge, Space, Button, Divider } from 'antd';
import {
  UserOutlined,
  TrophyOutlined,
  CrownOutlined,
  FireOutlined,
  StarOutlined,
  RiseOutlined,
  HistoryOutlined,
  HeartOutlined,
  TeamOutlined,
  SettingOutlined,
  EditOutlined
} from '@ant-design/icons';
import { Settings, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/src/components/layout/AppLayout';

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // 首先从localStorage获取token
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        // 调用API获取完整的用户profile数据
        const response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUser(data.data);
            setUserStats(data.data.stats);
          } else {
            console.error('Failed to fetch profile:', data.error);
            // 回退到localStorage
            const userStr = localStorage.getItem('user');
            if (userStr) {
              const userData = JSON.parse(userStr);
              setUser(userData);
              setUserStats(userData.stats);
            }
          }
        } else {
          // 回退到localStorage
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const userData = JSON.parse(userStr);
            setUser(userData);
            setUserStats(userData.stats);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        // 回退到localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const userData = JSON.parse(userStr);
            setUser(userData);
            setUserStats(userData.stats);
          } catch (parseError) {
            console.error('Failed to parse user data:', parseError);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen max-w-full flex justify-center items-center">
        <div className="text-center">
          <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen max-w-full flex justify-center items-center">
        <div className="text-center">
          <div className="text-lg text-gray-600 dark:text-gray-400">请先登录</div>
        </div>
      </div>
    );
  }

  // 使用真实用户数据
  const userData = {
    username: user.username || user.name,
    avatar: user.avatar || '🎯',
    level: user.level || 1,
    vipLevel: user.isVip ? 'gold' : 'bronze',
    experience: user.xp || 0,
    nextLevelExp: (user.level || 1) * 1000, // 简单的升级公式
    joinDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '未知',
    lastLogin: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : '未知',
    bio: '热爱德州扑克的玩家',
    badges: user.isVip ? ['VIP用户', '早期用户'] : ['新手玩家'],
    stats: {
      totalGames: userStats?.totalGames || 0,
      winRate: userStats?.winRate || 0,
      totalWinnings: userStats?.totalEarnings || 0,
      bestRank: user.ladderRank?.currentRank || '未排名',
      avgBB100: ((userStats?.totalEarnings || 0) / Math.max((userStats?.totalHands || 1), 1) * 100).toFixed(1),
      totalHands: userStats?.totalHands || 0
    },
    recentAchievements: user.recentAchievements || [
      { id: 1, name: '新手入门', icon: '🎯', date: '2025-01-10', rarity: 'common' }
    ],
    gameHistory: user.recentGames?.map((game: any) => {
      const profit = (game.finalStack || 0) - (game.buyIn || 0);
      return {
        id: game.id,
        type: game.gameType === 'CASH' ? '现金桌' : game.gameType === 'TOURNAMENT' ? '锦标赛' : '训练',
        result: profit > 0 ? `+$${profit}` : profit < 0 ? `-$${Math.abs(profit)}` : '$0',
        time: new Date(game.createdAt).toLocaleString(),
        status: profit > 0 ? 'win' : profit < 0 ? 'loss' : 'draw'
      };
    }) || [
      { id: 1, type: '现金桌', result: '暂无记录', time: '最近', status: 'neutral' }
    ],
    companions: user.companions?.map((companion: any) => ({
      name: companion.name,
      level: companion.relationshipLevel,
      avatar: companion.avatar
    })) || []
  };

  const getVipColor = (level: string) => {
    switch(level) {
      case 'diamond': return '#b9f2ff';
      case 'gold': return '#ffd700';
      case 'silver': return '#c0c0c0';
      default: return '#cd7f32';
    }
  };

  const getRarityColor = (rarity: string) => {
    switch(rarity) {
      case 'legendary': return 'gold';
      case 'epic': return 'purple';
      case 'rare': return 'blue';
      default: return 'green';
    }
  };

  const tabItems = [
    {
      key: 'overview',
      label: (
        <span>
          <UserOutlined />
          总览
        </span>
      ),
      children: (
        <div>
          {/* 个人信息卡片 */}
          <Card style={{ marginBottom: 24 }}>
            <Row gutter={24} align="middle">
              <Col flex="none">
                <Badge count={<CrownOutlined style={{ color: getVipColor(userData.vipLevel) }} />}>
                  <Avatar size={100} style={{ fontSize: 48 }}>
                    {userData.avatar}
                  </Avatar>
                </Badge>
              </Col>
              <Col flex="auto">
                <h2 style={{ margin: 0, marginBottom: 8 }}>
                  {userData.username}
                  <Tag color="gold" style={{ marginLeft: 12 }}>VIP</Tag>
                  <Tag color="purple">Lv.{userData.level}</Tag>
                </h2>
                <p style={{ color: '#666', marginBottom: 16 }}>{userData.bio}</p>
                <Space wrap>
                  {userData.badges.map(badge => (
                    <Tag key={badge} color="blue">{badge}</Tag>
                  ))}
                </Space>
                <div style={{ marginTop: 16 }}>
                  <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>
                    经验值: {userData.experience}/{userData.nextLevelExp}
                  </div>
                  <Progress 
                    percent={userData.experience / userData.nextLevelExp * 100} 
                    showInfo={false}
                    strokeColor="#722ed1"
                  />
                </div>
              </Col>
              <Col flex="none">
                <Space direction="vertical" style={{ textAlign: 'right' }}>
                  <Button 
                    type="primary" 
                    icon={<EditOutlined />}
                    onClick={() => router.push('/settings')}
                  >
                    编辑资料
                  </Button>
                  <div style={{ color: '#666' }}>加入时间: {userData.joinDate}</div>
                  <div style={{ color: '#666' }}>最后登录: {userData.lastLogin}</div>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* 统计数据 */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="总对局数"
                  value={userData.stats.totalGames}
                  prefix={<FireOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="胜率"
                  value={userData.stats.winRate}
                  suffix="%"
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="总盈利"
                  value={userData.stats.totalWinnings}
                  prefix="$"
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="最佳排名"
                  value={userData.stats.bestRank}
                  valueStyle={{ fontSize: 20 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="BB/100"
                  value={userData.stats.avgBB100}
                  prefix={<RiseOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="总手数"
                  value={userData.stats.totalHands}
                  valueStyle={{ color: '#666' }}
                />
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'achievements',
      label: (
        <span>
          <TrophyOutlined />
          成就
        </span>
      ),
      children: (
        <Card title="最近获得的成就">
          <List
            itemLayout="horizontal"
            dataSource={userData.recentAchievements}
            renderItem={achievement => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Avatar size={48} style={{ fontSize: 24 }}>
                      {achievement.icon}
                    </Avatar>
                  }
                  title={
                    <Space>
                      <span>{achievement.name}</span>
                      <Tag color={getRarityColor(achievement.rarity)}>
                        {achievement.rarity === 'legendary' ? '传奇' :
                         achievement.rarity === 'epic' ? '史诗' :
                         achievement.rarity === 'rare' ? '稀有' : '普通'}
                      </Tag>
                    </Space>
                  }
                  description={`获得时间: ${achievement.date}`}
                />
              </List.Item>
            )}
          />
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Button type="link" onClick={() => router.push('/achievements')}>
              查看全部成就 →
            </Button>
          </div>
        </Card>
      ),
    },
    {
      key: 'history',
      label: (
        <span>
          <HistoryOutlined />
          游戏记录
        </span>
      ),
      children: (
        <Card title="最近游戏记录">
          <List
            itemLayout="horizontal"
            dataSource={userData.gameHistory}
            renderItem={game => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      style={{ 
                        backgroundColor: game.status === 'win' ? '#52c41a' : '#ff4d4f' 
                      }}
                    >
                      {game.status === 'win' ? '赢' : '输'}
                    </Avatar>
                  }
                  title={game.type}
                  description={game.time}
                />
                <div style={{ 
                  fontSize: 18, 
                  fontWeight: 'bold',
                  color: game.status === 'win' ? '#52c41a' : '#ff4d4f'
                }}>
                  {game.result}
                </div>
              </List.Item>
            )}
          />
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Button type="link">
              查看完整历史 →
            </Button>
          </div>
        </Card>
      ),
    },
    {
      key: 'companions',
      label: (
        <span>
          <HeartOutlined />
          我的陪伴
        </span>
      ),
      children: (
        <Card title="虚拟陪伴">
          <Row gutter={[16, 16]}>
            {userData.companions.map((companion, index) => (
              <Col xs={24} sm={12} md={8} key={index}>
                <Card hoverable style={{ textAlign: 'center' }}>
                  <Avatar size={64} style={{ fontSize: 32, marginBottom: 16 }}>
                    {companion.avatar}
                  </Avatar>
                  <h3>{companion.name}</h3>
                  <Tag color="pink">亲密度 {companion.level}</Tag>
                  <Progress 
                    percent={companion.level} 
                    strokeColor="#ff1493"
                    style={{ marginTop: 16 }}
                  />
                </Card>
              </Col>
            ))}
          </Row>
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Button type="primary" onClick={() => router.push('/companion-center')}>
              前往陪伴中心
            </Button>
          </div>
        </Card>
      ),
    }
  ];


  return (
    <AppLayout>
      <div className="min-h-screen max-w-full">
        {/* 页面头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                个人中心
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                查看您的游戏数据和成就
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <Globe className="w-5 h-5" />
                <span className="font-medium">中文</span>
              </button>
              
              <button className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* 快捷操作 */}
        <Card className="mb-6">
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <Button icon={<TeamOutlined />}>
                  我的好友
                </Button>
                <Button icon={<SettingOutlined />} onClick={() => router.push('/settings')}>
                  账号设置
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 主要内容 */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </div>
    </AppLayout>
  );
}