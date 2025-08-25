'use client';

import { useState } from 'react';
import { Card, Tabs, List, Avatar, Button, Space, Tag, Input, Badge, Row, Col, Statistic, message, Modal, Empty } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  TrophyOutlined,
  MessageOutlined,
  SearchOutlined,
  UserAddOutlined,
  CrownOutlined,
  FireOutlined,
  RiseOutlined,
  StarOutlined,
  SendOutlined,
  BellOutlined,
  HeartOutlined
} from '@ant-design/icons';
import AppLayout from '@/src/components/layout/AppLayout';

const { Search } = Input;
const { TextArea } = Input;

export default function SocialPage() {
  const [activeTab, setActiveTab] = useState('friends');
  const [searchValue, setSearchValue] = useState('');
  const [messageModal, setMessageModal] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [messageText, setMessageText] = useState('');

  // 模拟好友数据
  const friends = [
    { 
      id: 1, 
      name: '扑克大师', 
      avatar: '🎯', 
      status: 'online', 
      level: 42,
      winRate: 68.5,
      lastSeen: '在线',
      tags: ['高手', 'GTO玩家']
    },
    { 
      id: 2, 
      name: '幸运女神', 
      avatar: '🍀', 
      status: 'online', 
      level: 38,
      winRate: 62.3,
      lastSeen: '在线',
      tags: ['激进型']
    },
    { 
      id: 3, 
      name: '沉默杀手', 
      avatar: '🗡️', 
      status: 'offline', 
      level: 51,
      winRate: 71.2,
      lastSeen: '3小时前',
      tags: ['紧凶型', '专家']
    },
    { 
      id: 4, 
      name: '筹码收割机', 
      avatar: '💰', 
      status: 'busy', 
      level: 45,
      winRate: 66.8,
      lastSeen: '游戏中',
      tags: ['松凶型']
    }
  ];

  // 模拟排行榜数据
  const leaderboard = [
    { rank: 1, name: '传奇玩家', avatar: '👑', score: 98500, winRate: 78.5, hands: 12580, profit: 458000, change: 'up' },
    { rank: 2, name: '扑克之神', avatar: '⭐', score: 95200, winRate: 75.3, hands: 10890, profit: 425000, change: 'up' },
    { rank: 3, name: '德州霸主', avatar: '🏆', score: 92100, winRate: 73.8, hands: 11200, profit: 398000, change: 'down' },
    { rank: 4, name: '筹码猎人', avatar: '🎯', score: 88900, winRate: 72.1, hands: 9850, profit: 365000, change: 'up' },
    { rank: 5, name: '心理大师', avatar: '🧠', score: 85600, winRate: 70.5, hands: 8920, profit: 342000, change: 'same' },
    { rank: 6, name: '概率专家', avatar: '📊', score: 82300, winRate: 69.8, hands: 9100, profit: 318000, change: 'up' },
    { rank: 7, name: '读牌高手', avatar: '👁️', score: 79800, winRate: 68.2, hands: 8500, profit: 295000, change: 'down' },
    { rank: 8, name: '诈唬王者', avatar: '🃏', score: 76500, winRate: 67.5, hands: 7800, profit: 272000, change: 'up' }
  ];

  // 模拟俱乐部数据
  const clubs = [
    { 
      id: 1, 
      name: '精英俱乐部', 
      members: 128, 
      level: 'legendary',
      description: '汇聚顶尖玩家的专业俱乐部',
      requirements: '胜率>65%'
    },
    { 
      id: 2, 
      name: 'GTO研究所', 
      members: 256, 
      level: 'epic',
      description: '专注于博弈论最优策略研究',
      requirements: '等级>30'
    },
    { 
      id: 3, 
      name: '新手训练营', 
      members: 512, 
      level: 'common',
      description: '帮助新手快速成长的友好社区',
      requirements: '无'
    }
  ];

  const handleAddFriend = (userId: number) => {
    message.success('好友请求已发送');
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) {
      message.warning('请输入消息内容');
      return;
    }
    message.success('消息发送成功');
    setMessageText('');
    setMessageModal(false);
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <CrownOutlined style={{ color: '#ffd700' }} />;
    if (rank === 2) return <CrownOutlined style={{ color: '#c0c0c0' }} />;
    if (rank === 3) return <CrownOutlined style={{ color: '#cd7f32' }} />;
    return <span>#{rank}</span>;
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'online': return '#52c41a';
      case 'busy': return '#faad14';
      case 'offline': return '#d9d9d9';
      default: return '#d9d9d9';
    }
  };

  const tabItems = [
    {
      key: 'friends',
      label: (
        <span>
          <TeamOutlined />
          好友列表
          <Badge count={3} style={{ marginLeft: 8 }} />
        </span>
      ),
      children: (
        <div>
          <Search
            placeholder="搜索好友"
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            style={{ marginBottom: 24 }}
            onSearch={setSearchValue}
          />
          
          <List
            itemLayout="horizontal"
            dataSource={friends.filter(f => 
              !searchValue || f.name.includes(searchValue)
            )}
            renderItem={(friend) => (
              <List.Item
                actions={[
                  <Button 
                    type="primary" 
                    ghost 
                    icon={<MessageOutlined />}
                    onClick={() => {
                      setSelectedFriend(friend);
                      setMessageModal(true);
                    }}
                  >
                    私信
                  </Button>,
                  <Button icon={<TrophyOutlined />}>对战</Button>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Badge dot status={friend.status === 'online' ? 'success' : 'default'}>
                      <Avatar size={48} style={{ fontSize: 24 }}>
                        {friend.avatar}
                      </Avatar>
                    </Badge>
                  }
                  title={
                    <Space>
                      <span>{friend.name}</span>
                      <Tag color="purple">Lv.{friend.level}</Tag>
                      {friend.tags.map(tag => (
                        <Tag key={tag} color="blue">{tag}</Tag>
                      ))}
                    </Space>
                  }
                  description={
                    <Space>
                      <span>胜率: {friend.winRate}%</span>
                      <span>•</span>
                      <span style={{ color: getStatusColor(friend.status) }}>
                        {friend.lastSeen}
                      </span>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      ),
    },
    {
      key: 'leaderboard',
      label: (
        <span>
          <TrophyOutlined />
          排行榜
        </span>
      ),
      children: (
        <div>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="我的排名"
                  value={156}
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="积分"
                  value={42580}
                  prefix={<FireOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="排名变化"
                  value={12}
                  prefix={<RiseOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>

          <Card title="全服排行榜 TOP 100">
            <List
              itemLayout="horizontal"
              dataSource={leaderboard}
              renderItem={(player) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Space>
                        <div style={{ width: 40, textAlign: 'center', fontSize: 18, fontWeight: 'bold' }}>
                          {getRankIcon(player.rank)}
                        </div>
                        <Avatar size={48} style={{ fontSize: 24 }}>
                          {player.avatar}
                        </Avatar>
                      </Space>
                    }
                    title={
                      <Space>
                        <span style={{ fontSize: 16, fontWeight: 'bold' }}>{player.name}</span>
                        {player.rank <= 3 && <Tag color="gold">大师</Tag>}
                        {player.change === 'up' && <RiseOutlined style={{ color: '#52c41a' }} />}
                        {player.change === 'down' && <RiseOutlined style={{ color: '#f5222d', transform: 'rotate(180deg)' }} />}
                      </Space>
                    }
                    description={
                      <Row gutter={16}>
                        <Col span={6}>积分: <span style={{ fontWeight: 'bold' }}>{player.score}</span></Col>
                        <Col span={6}>胜率: <span style={{ color: '#52c41a' }}>{player.winRate}%</span></Col>
                        <Col span={6}>手数: {player.hands}</Col>
                        <Col span={6}>盈利: <span style={{ color: '#fa8c16' }}>¥{player.profit}</span></Col>
                      </Row>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'clubs',
      label: (
        <span>
          <HeartOutlined />
          俱乐部
        </span>
      ),
      children: (
        <div>
          <Row gutter={[16, 16]}>
            {clubs.map(club => (
              <Col xs={24} md={8} key={club.id}>
                <Card
                  hoverable
                  actions={[
                    <Button type="primary" icon={<UserAddOutlined />}>
                      申请加入
                    </Button>
                  ]}
                >
                  <Card.Meta
                    avatar={
                      <Avatar size={64} style={{ 
                        backgroundColor: club.level === 'legendary' ? '#ffd700' :
                                       club.level === 'epic' ? '#9c27b0' : '#52c41a'
                      }}>
                        {club.name[0]}
                      </Avatar>
                    }
                    title={
                      <Space>
                        <span>{club.name}</span>
                        <Tag color={
                          club.level === 'legendary' ? 'gold' :
                          club.level === 'epic' ? 'purple' : 'green'
                        }>
                          {club.level === 'legendary' ? '传奇' :
                           club.level === 'epic' ? '史诗' : '普通'}
                        </Tag>
                      </Space>
                    }
                    description={club.description}
                  />
                  <div style={{ marginTop: 16 }}>
                    <Row justify="space-between">
                      <Col>
                        <TeamOutlined /> 成员: {club.members}
                      </Col>
                      <Col>
                        要求: {club.requirements}
                      </Col>
                    </Row>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ),
    },
    {
      key: 'discover',
      label: (
        <span>
          <SearchOutlined />
          发现玩家
        </span>
      ),
      children: (
        <div>
          <Search
            placeholder="搜索玩家ID或昵称"
            allowClear
            enterButton="搜索"
            size="large"
            style={{ marginBottom: 24 }}
          />
          
          <Card title="推荐玩家">
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
              dataSource={[
                { id: 101, name: '高手玩家A', level: 45, winRate: 68 },
                { id: 102, name: '活跃玩家B', level: 32, winRate: 58 },
                { id: 103, name: '新星玩家C', level: 28, winRate: 62 },
                { id: 104, name: '稳健玩家D', level: 40, winRate: 65 }
              ]}
              renderItem={player => (
                <List.Item>
                  <Card style={{ textAlign: 'center' }}>
                    <Avatar size={64} icon={<UserOutlined />} />
                    <h3 style={{ marginTop: 16 }}>{player.name}</h3>
                    <p>
                      <Tag color="purple">Lv.{player.level}</Tag>
                      <Tag color="green">胜率 {player.winRate}%</Tag>
                    </p>
                    <Button 
                      type="primary" 
                      icon={<UserAddOutlined />}
                      onClick={() => handleAddFriend(player.id)}
                      block
                    >
                      添加好友
                    </Button>
                  </Card>
                </List.Item>
              )}
            />
          </Card>
        </div>
      ),
    }
  ];

  return (
    <AppLayout>
      <div style={{ padding: '24px' }}>
      {/* 页面标题 */}
      <Card style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <h1 style={{ margin: 0, fontSize: 24 }}>社交中心</h1>
            <p style={{ margin: '8px 0 0', color: '#666' }}>
              与好友一起享受扑克乐趣
            </p>
          </Col>
          <Col>
            <Space>
              <Badge count={5}>
                <Button icon={<BellOutlined />} size="large">
                  消息通知
                </Button>
              </Badge>
              <Button type="primary" icon={<UserAddOutlined />} size="large">
                添加好友
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

      {/* 私信模态框 */}
      <Modal
        title={`发送私信给 ${selectedFriend?.name}`}
        open={messageModal}
        onOk={handleSendMessage}
        onCancel={() => setMessageModal(false)}
        okText="发送"
        cancelText="取消"
      >
        <TextArea
          rows={4}
          placeholder="输入消息内容..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          maxLength={200}
          showCount
        />
      </Modal>
      </div>
    </AppLayout>
  );
}