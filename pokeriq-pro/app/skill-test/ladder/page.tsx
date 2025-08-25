'use client';

import { useState, useEffect } from 'react';
import { Card, Table, Tag, Avatar, Progress, Statistic, Row, Col, Button, Space, Typography, Tabs, Spin } from 'antd';
import {
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  StarOutlined,
  CrownOutlined,
  FireOutlined,
  UserOutlined,
  RocketOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import AppLayout from '@/src/components/layout/AppLayout';

const { Title, Text } = Typography;

interface LadderPlayer {
  rank: number;
  userId: string;
  username: string;
  avatar: string | null;
  rankPoints: number;
  currentRank: string;
  playerType: string;
  totalTests: number;
  avgScore: number;
}

export default function LadderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rankings, setRankings] = useState<LadderPlayer[]>([]);
  const [activeTab, setActiveTab] = useState('global');
  const [myRanking, setMyRanking] = useState<any>(null);

  useEffect(() => {
    loadLadderData();
  }, []);

  const loadLadderData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/skill-test/ladder');
      const data = await response.json();
      
      if (data.success) {
        setRankings(data.data);
      }
      
      // 模拟用户自己的排名数据
      setMyRanking({
        rank: 156,
        rankPoints: 2850,
        currentRank: 'gold',
        playerType: 'TAMS',
        totalTests: 12,
        avgScore: 78.5,
        recentChange: +85
      });
    } catch (error) {
      console.error('Error loading ladder data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: string) => {
    const icons: Record<string, { icon: string; color: string }> = {
      'bronze': { icon: '🥉', color: '#cd7f32' },
      'silver': { icon: '🥈', color: '#c0c0c0' },
      'gold': { icon: '🥇', color: '#ffd700' },
      'platinum': { icon: '💎', color: '#e5e4e2' },
      'diamond': { icon: '💠', color: '#b9f2ff' },
      'master': { icon: '🎯', color: '#ff6b6b' },
      'grandmaster': { icon: '👑', color: '#c41e3a' },
      'legend': { icon: '🏆', color: '#ffd700' }
    };
    return icons[rank] || icons['bronze'];
  };

  const getRankName = (rank: string) => {
    const names: Record<string, string> = {
      'bronze': '青铜',
      'silver': '白银',
      'gold': '黄金',
      'platinum': '铂金',
      'diamond': '钻石',
      'master': '大师',
      'grandmaster': '宗师',
      'legend': '传奇'
    };
    return names[rank] || '未知';
  };

  const columns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (rank: number) => (
        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>
          {rank <= 3 ? (
            <span style={{ fontSize: 24 }}>
              {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
            </span>
          ) : (
            `#${rank}`
          )}
        </div>
      ),
    },
    {
      title: '玩家',
      key: 'player',
      render: (record: LadderPlayer) => (
        <Space>
          <Avatar 
            size="large" 
            icon={<UserOutlined />}
            style={{ backgroundColor: '#722ed1' }}
          >
            {record.username[0]?.toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.username}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.playerType || 'UNKN'}型玩家
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '段位',
      dataIndex: 'currentRank',
      key: 'currentRank',
      render: (rank: string) => {
        const { icon, color } = getRankIcon(rank);
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24 }}>{icon}</div>
            <Text style={{ color, fontWeight: 'bold' }}>
              {getRankName(rank)}
            </Text>
          </div>
        );
      },
    },
    {
      title: '积分',
      dataIndex: 'rankPoints',
      key: 'rankPoints',
      sorter: (a: LadderPlayer, b: LadderPlayer) => b.rankPoints - a.rankPoints,
      render: (points: number) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#722ed1' }}>
            {points.toLocaleString()}
          </div>
        </div>
      ),
    },
    {
      title: '测试次数',
      dataIndex: 'totalTests',
      key: 'totalTests',
      render: (tests: number) => (
        <div style={{ textAlign: 'center' }}>
          <Text>{tests}次</Text>
        </div>
      ),
    },
    {
      title: '平均分',
      dataIndex: 'avgScore',
      key: 'avgScore',
      render: (score: number) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold' }}>{score?.toFixed(1)}</div>
          <Progress
            percent={score}
            size="small"
            strokeColor={{
              '0%': '#ff4d4f',
              '50%': '#faad14',
              '100%': '#52c41a',
            }}
            showInfo={false}
          />
        </div>
      ),
    },
  ];

  const rankDistribution = [
    { rank: '传奇', count: 12, percentage: 0.1, color: '#ffd700' },
    { rank: '宗师', count: 85, percentage: 0.8, color: '#c41e3a' },
    { rank: '大师', count: 234, percentage: 2.2, color: '#ff6b6b' },
    { rank: '钻石', count: 567, percentage: 5.4, color: '#b9f2ff' },
    { rank: '铂金', count: 1234, percentage: 11.7, color: '#e5e4e2' },
    { rank: '黄金', count: 2345, percentage: 22.3, color: '#ffd700' },
    { rank: '白银', count: 3456, percentage: 32.8, color: '#c0c0c0' },
    { rank: '青铜', count: 2567, percentage: 24.7, color: '#cd7f32' },
  ];

  const tabItems = [
    {
      key: 'global',
      label: (
        <span>
          <TrophyOutlined />
          全球排行
        </span>
      ),
      children: (
        <div>
          {myRanking && (
            <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <Row align="middle" justify="space-between">
                <Col>
                  <Space size="large">
                    <div style={{ color: 'white', textAlign: 'center' }}>
                      <div style={{ fontSize: 28, fontWeight: 'bold' }}>#{myRanking.rank}</div>
                      <Text style={{ color: 'rgba(255,255,255,0.8)' }}>我的排名</Text>
                    </div>
                    <div style={{ color: 'white', textAlign: 'center' }}>
                      <div style={{ fontSize: 24 }}>{getRankIcon(myRanking.currentRank).icon}</div>
                      <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
                        {getRankName(myRanking.currentRank)}
                      </Text>
                    </div>
                    <div style={{ color: 'white', textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 'bold' }}>{myRanking.rankPoints}</div>
                      <Text style={{ color: 'rgba(255,255,255,0.8)' }}>积分</Text>
                    </div>
                  </Space>
                </Col>
                <Col>
                  <Space direction="vertical" align="end">
                    <Tag color="green" style={{ fontSize: 14, padding: '4px 8px' }}>
                      <RiseOutlined /> +{myRanking.recentChange}
                    </Tag>
                    <Button type="primary" ghost onClick={() => router.push('/skill-test')}>
                      开始测试
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Card>
          )}

          <Card>
            <Table
              columns={columns}
              dataSource={rankings}
              rowKey="userId"
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 名玩家`,
              }}
              loading={loading}
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'distribution',
      label: (
        <span>
          <StarOutlined />
          段位分布
        </span>
      ),
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card title="段位分布统计">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {rankDistribution.map(item => (
                  <div key={item.rank} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ minWidth: 60, textAlign: 'center' }}>
                      <Text strong style={{ color: item.color }}>{item.rank}</Text>
                    </div>
                    <div style={{ flex: 1 }}>
                      <Progress
                        percent={item.percentage * 10}
                        strokeColor={item.color}
                        format={() => `${item.percentage}%`}
                      />
                    </div>
                    <div style={{ minWidth: 80, textAlign: 'right' }}>
                      <Text type="secondary">{item.count.toLocaleString()}人</Text>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Card>
                <Statistic
                  title="总玩家数"
                  value={10500}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
              <Card>
                <Statistic
                  title="今日活跃"
                  value={1234}
                  prefix={<FireOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
              <Card>
                <Statistic
                  title="平均积分"
                  value={2150}
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Space>
          </Col>
        </Row>
      ),
    },
    {
      key: 'recent',
      label: (
        <span>
          <RocketOutlined />
          最近上榜
        </span>
      ),
      children: (
        <Card title="本周进步最快的玩家">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { username: 'PokerGod', gain: +450, newRank: 'diamond' },
              { username: 'BluffMaster', gain: +380, newRank: 'platinum' },
              { username: 'GTOWiz', gain: +320, newRank: 'gold' },
              { username: 'CardShark', gain: +285, newRank: 'gold' },
              { username: 'ChipLeader', gain: +250, newRank: 'silver' },
            ].map((player, index) => (
              <Card key={index} size="small" style={{ backgroundColor: index < 3 ? '#f6ffed' : undefined }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Space>
                    <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#722ed1' }}>
                      {player.username[0]}
                    </Avatar>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{player.username}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        晋升至{getRankName(player.newRank)}
                      </div>
                    </div>
                  </Space>
                  <Tag color="green" style={{ fontSize: 14 }}>
                    <RiseOutlined /> +{player.gain}
                  </Tag>
                </Space>
              </Card>
            ))}
          </div>
        </Card>
      ),
    }
  ];

  return (
    <AppLayout>
      <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      {/* 页面头部 */}
      <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={2} style={{ color: 'white', margin: 0 }}>
              <TrophyOutlined /> 天梯排行榜
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
              与全球玩家竞技，展示你的德州扑克实力
            </Text>
          </Col>
          <Col>
            <Space>
              <Button 
                type="primary" 
                size="large"
                ghost
                icon={<ThunderboltOutlined />}
                onClick={() => router.push('/skill-test')}
              >
                立即测试
              </Button>
              <Button 
                ghost
                onClick={() => window.location.reload()}
              >
                刷新排名
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