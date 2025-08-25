'use client';

import { useState } from 'react';
import { Card, Row, Col, Avatar, Typography, Statistic, Progress, Tag, Button, Tabs, List, Badge, Divider } from 'antd';
import {
  UserOutlined,
  TrophyOutlined,
  FireOutlined,
  StarOutlined,
  CrownOutlined,
  RiseOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  EditOutlined,
  ShareAltOutlined,
  BarChartOutlined,
  TeamOutlined,
  PlayCircleOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import Link from 'next/link';

const { Title, Text, Paragraph } = Typography;

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('overview');

  // 用户数据
  const userData = {
    username: 'DemoUser',
    email: 'demo@example.com',
    joinDate: '2024-01-01',
    level: 15,
    rank: '白金大师',
    exp: 3250,
    expToNext: 4000,
    avatar: '🎮',
    bio: '热爱德州扑克的玩家，正在努力提升技术水平。专注于GTO策略学习，希望成为职业玩家。',
    location: '中国',
    status: '在线'
  };

  // 统计数据
  const stats = {
    totalGames: 1234,
    winRate: 68.5,
    totalWinnings: 45280,
    bestStreak: 12,
    totalHours: 186,
    handsPlayed: 15432,
    vpip: 24.5,
    pfr: 18.2,
    af: 3.2,
    wtsd: 28.5
  };

  // 成就展示
  const achievements = [
    { id: 1, name: '新手上路', icon: '🎯', rarity: 'common', date: '2024-01-02' },
    { id: 2, name: '百场老手', icon: '💯', rarity: 'rare', date: '2024-01-15' },
    { id: 3, name: '连胜之王', icon: '🔥', rarity: 'epic', date: '2024-02-01' },
    { id: 4, name: 'GTO大师', icon: '🧠', rarity: 'legendary', date: '2024-02-20' },
    { id: 5, name: '财富积累者', icon: '💰', rarity: 'epic', date: '2024-03-01' },
    { id: 6, name: '夜猫子', icon: '🦉', rarity: 'rare', date: '2024-03-10' }
  ];

  const rarityColors: Record<string, string> = {
    common: '#52c41a',
    rare: '#1890ff',
    epic: '#722ed1',
    legendary: '#f5222d'
  };

  const tabItems = [
    {
      key: 'overview',
      label: '总览',
      children: (
        <div className="space-y-6">
          {/* 个人简介 */}
          <Card>
            <Title level={4}>个人简介</Title>
            <Paragraph>{userData.bio}</Paragraph>
            <div className="flex gap-4 mt-4">
              <Tag icon={<EnvironmentOutlined />}>{userData.location}</Tag>
              <Tag icon={<ClockCircleOutlined />}>加入于 {userData.joinDate}</Tag>
              <Tag icon={<TeamOutlined />} color="green">在线</Tag>
            </div>
          </Card>

          {/* 关键数据 */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="总游戏数"
                  value={stats.totalGames}
                  prefix={<PlayCircleOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="胜率"
                  value={stats.winRate}
                  suffix="%"
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="总盈利"
                  value={stats.totalWinnings}
                  prefix={<DollarOutlined />}
                  formatter={(value) => `$${value}`}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="最长连胜"
                  value={stats.bestStreak}
                  suffix="场"
                  prefix={<FireOutlined />}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
          </Row>

          {/* 技术指标 */}
          <Card title="技术指标">
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <div className="text-center">
                  <Progress type="circle" percent={stats.vpip} size={80} />
                  <div className="mt-2">
                    <Text strong>VPIP</Text>
                    <div className="text-sm text-gray-500">入池率</div>
                  </div>
                </div>
              </Col>
              <Col span={6}>
                <div className="text-center">
                  <Progress type="circle" percent={stats.pfr} size={80} />
                  <div className="mt-2">
                    <Text strong>PFR</Text>
                    <div className="text-sm text-gray-500">翻前加注率</div>
                  </div>
                </div>
              </Col>
              <Col span={6}>
                <div className="text-center">
                  <Progress type="circle" percent={stats.af * 10} size={80} />
                  <div className="mt-2">
                    <Text strong>AF</Text>
                    <div className="text-sm text-gray-500">激进度 {stats.af}</div>
                  </div>
                </div>
              </Col>
              <Col span={6}>
                <div className="text-center">
                  <Progress type="circle" percent={stats.wtsd} size={80} />
                  <div className="mt-2">
                    <Text strong>WTSD</Text>
                    <div className="text-sm text-gray-500">摊牌率</div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </div>
      )
    },
    {
      key: 'achievements',
      label: '成就',
      children: (
        <Card>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {achievements.map(achievement => (
              <div
                key={achievement.id}
                className="text-center p-4 border rounded-lg hover:shadow-lg transition-shadow cursor-pointer"
                style={{ borderColor: rarityColors[achievement.rarity] }}
              >
                <div className="text-4xl mb-2">{achievement.icon}</div>
                <div className="font-semibold">{achievement.name}</div>
                <Tag color={rarityColors[achievement.rarity]} className="mt-2">
                  {achievement.rarity === 'common' && '普通'}
                  {achievement.rarity === 'rare' && '稀有'}
                  {achievement.rarity === 'epic' && '史诗'}
                  {achievement.rarity === 'legendary' && '传说'}
                </Tag>
                <div className="text-xs text-gray-500 mt-1">{achievement.date}</div>
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/achievements">
              <Button type="primary">查看所有成就</Button>
            </Link>
          </div>
        </Card>
      )
    },
    {
      key: 'statistics',
      label: '统计',
      children: (
        <Card>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Statistic title="总手数" value={stats.handsPlayed} />
            </Col>
            <Col span={12}>
              <Statistic title="游戏时长" value={stats.totalHours} suffix="小时" />
            </Col>
            <Col span={12}>
              <Statistic title="平均盈利" value={(stats.totalWinnings / stats.totalGames).toFixed(2)} prefix="$" />
            </Col>
            <Col span={12}>
              <Statistic title="每小时盈利" value={(stats.totalWinnings / stats.totalHours).toFixed(2)} prefix="$" />
            </Col>
          </Row>
          <Divider />
          <div className="text-center">
            <Link href="/analytics">
              <Button type="primary" icon={<BarChartOutlined />}>
                查看详细分析
              </Button>
            </Link>
          </div>
        </Card>
      )
    }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <div className="max-w-7xl mx-auto">
        {/* 个人信息头部 */}
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Avatar size={100} style={{ backgroundColor: '#722ed1', fontSize: '48px' }}>
                {userData.avatar}
              </Avatar>
              <div>
                <Title level={2} style={{ marginBottom: 8 }}>
                  {userData.username}
                </Title>
                <div className="flex items-center gap-4 mb-3">
                  <Tag color="purple" icon={<CrownOutlined />}>
                    {userData.rank}
                  </Tag>
                  <Tag color="blue">Lv.{userData.level}</Tag>
                  <Badge status="success" text="在线" />
                </div>
                <Progress
                  percent={(userData.exp / userData.expToNext) * 100}
                  size="small"
                  format={() => `${userData.exp} / ${userData.expToNext} EXP`}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/settings">
                <Button icon={<EditOutlined />}>编辑资料</Button>
              </Link>
              <Button icon={<ShareAltOutlined />}>分享</Button>
            </div>
          </div>
        </Card>

        {/* 内容标签页 */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </div>
    </div>
  );
}