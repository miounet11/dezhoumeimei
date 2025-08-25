'use client';

import { useState } from 'react';
import { Card, Tabs, Row, Col, Button, Tag, Progress, Space, List, Badge, Statistic, Avatar, Timeline, message, Modal } from 'antd';
import {
  TrophyOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  GiftOutlined,
  FireOutlined,
  CrownOutlined,
  RocketOutlined,
  StarOutlined,
  ThunderboltOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  RightOutlined
} from '@ant-design/icons';
import AppLayout from '@/src/components/layout/AppLayout';

const { confirm } = Modal;

export default function EventsPage() {
  const [activeTab, setActiveTab] = useState('tournaments');

  // 模拟锦标赛数据
  const tournaments = [
    {
      id: 1,
      name: '周冠军赛',
      type: 'weekly',
      status: 'registering',
      startTime: Date.now() + 3600000 * 2,
      buyIn: 100,
      prizePool: 50000,
      players: 128,
      maxPlayers: 256,
      level: 'all',
      description: '每周日晚8点准时开赛'
    },
    {
      id: 2,
      name: '大师挑战赛',
      type: 'special',
      status: 'running',
      startTime: Date.now() - 1800000,
      buyIn: 500,
      prizePool: 200000,
      players: 64,
      maxPlayers: 64,
      level: 'master',
      description: '仅限等级40以上玩家参加'
    },
    {
      id: 3,
      name: '新手友谊赛',
      type: 'beginner',
      status: 'upcoming',
      startTime: Date.now() + 3600000 * 24,
      buyIn: 0,
      prizePool: 10000,
      players: 0,
      maxPlayers: 512,
      level: 'beginner',
      description: '免费参加，新手专属'
    },
    {
      id: 4,
      name: '百万大奖赛',
      type: 'grand',
      status: 'upcoming',
      startTime: Date.now() + 3600000 * 72,
      buyIn: 1000,
      prizePool: 1000000,
      players: 256,
      maxPlayers: 1024,
      level: 'all',
      description: '年度最大奖池锦标赛'
    }
  ];

  // 模拟每日任务
  const dailyTasks = [
    { id: 1, name: '完成5局游戏', progress: 3, total: 5, reward: 100, type: 'chips' },
    { id: 2, name: '赢得3局胜利', progress: 1, total: 3, reward: 200, type: 'chips' },
    { id: 3, name: '使用诈唬赢得1局', progress: 0, total: 1, reward: 50, type: 'exp' },
    { id: 4, name: '累计下注1000筹码', progress: 650, total: 1000, reward: 150, type: 'chips' }
  ];

  // 模拟周任务
  const weeklyTasks = [
    { id: 1, name: '完成30局游戏', progress: 12, total: 30, reward: 1000, type: 'chips' },
    { id: 2, name: '达到60%胜率', progress: 58, total: 60, reward: 500, type: 'exp' },
    { id: 3, name: '参加1次锦标赛', progress: 0, total: 1, reward: 300, type: 'chips' },
    { id: 4, name: '获得10000筹码盈利', progress: 4500, total: 10000, reward: 2000, type: 'chips' }
  ];

  // 模拟成就任务
  const achievementTasks = [
    { 
      id: 1, 
      name: '扑克新星', 
      description: '完成100局游戏', 
      progress: 45, 
      total: 100, 
      reward: '专属头像框',
      rarity: 'common'
    },
    { 
      id: 2, 
      name: '连胜之王', 
      description: '连续赢得10局游戏', 
      progress: 6, 
      total: 10, 
      reward: '称号：常胜将军',
      rarity: 'rare'
    },
    { 
      id: 3, 
      name: '百万富翁', 
      description: '累计赢得1000000筹码', 
      progress: 285000, 
      total: 1000000, 
      reward: '限定皮肤',
      rarity: 'epic'
    },
    { 
      id: 4, 
      name: '传奇玩家', 
      description: '达到100级', 
      progress: 42, 
      total: 100, 
      reward: '永久VIP',
      rarity: 'legendary'
    }
  ];

  // 模拟活动日历
  const eventCalendar = [
    { date: '今天', events: ['每日签到', '幸运转盘', '限时双倍'] },
    { date: '明天', events: ['周冠军赛', '充值返利'] },
    { date: '后天', events: ['新手训练营', '好友邀请赛'] },
    { date: '本周日', events: ['百万大奖赛', '赛季结算'] }
  ];

  const handleJoinTournament = (tournament: any) => {
    confirm({
      title: '确认报名',
      content: `确定要报名${tournament.name}吗？报名费：${tournament.buyIn}筹码`,
      icon: <TrophyOutlined />,
      okText: '确认报名',
      cancelText: '取消',
      onOk: () => {
        message.success('报名成功！比赛开始前会通知您');
      }
    });
  };

  const getStatusTag = (status: string) => {
    const statusMap: any = {
      'registering': { color: 'green', text: '报名中' },
      'running': { color: 'red', text: '进行中' },
      'upcoming': { color: 'blue', text: '即将开始' },
      'finished': { color: 'default', text: '已结束' }
    };
    return statusMap[status] || { color: 'default', text: '未知' };
  };

  const getRarityColor = (rarity: string) => {
    const rarityMap: any = {
      'common': '#52c41a',
      'rare': '#1890ff',
      'epic': '#722ed1',
      'legendary': '#faad14'
    };
    return rarityMap[rarity] || '#666';
  };

  const tabItems = [
    {
      key: 'tournaments',
      label: (
        <span>
          <TrophyOutlined />
          锦标赛
        </span>
      ),
      children: (
        <div>
          <Row gutter={[16, 16]}>
            {tournaments.map(tournament => (
              <Col xs={24} md={12} key={tournament.id}>
                <Card
                  hoverable
                  actions={[
                    tournament.status === 'registering' ? (
                      <Button 
                        type="primary" 
                        onClick={() => handleJoinTournament(tournament)}
                      >
                        立即报名
                      </Button>
                    ) : tournament.status === 'running' ? (
                      <Button type="primary" danger>观看直播</Button>
                    ) : (
                      <Button disabled>即将开始</Button>
                    )
                  ]}
                >
                  <Card.Meta
                    avatar={<TrophyOutlined style={{ fontSize: 32, color: '#faad14' }} />}
                    title={
                      <Space>
                        <span>{tournament.name}</span>
                        <Tag color={getStatusTag(tournament.status).color}>
                          {getStatusTag(tournament.status).text}
                        </Tag>
                      </Space>
                    }
                    description={tournament.description}
                  />
                  
                  <div style={{ marginTop: 16 }}>
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <Statistic 
                          title="奖池" 
                          value={tournament.prizePool}
                          prefix="¥"
                          valueStyle={{ color: '#faad14' }}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic 
                          title="报名费" 
                          value={tournament.buyIn}
                          suffix="筹码"
                        />
                      </Col>
                      <Col span={12}>
                        <div>
                          <div style={{ marginBottom: 4, color: '#666' }}>参赛人数</div>
                          <Progress 
                            percent={Math.round(tournament.players / tournament.maxPlayers * 100)}
                            format={() => `${tournament.players}/${tournament.maxPlayers}`}
                          />
                        </div>
                      </Col>
                      <Col span={12}>
                        <div>
                          <div style={{ marginBottom: 4, color: '#666' }}>开始时间</div>
                          {tournament.status === 'running' ? (
                            <Tag color="red">进行中</Tag>
                          ) : (
                            <Tag color="blue">
                              {new Date(tournament.startTime).toLocaleTimeString()}
                            </Tag>
                          )}
                        </div>
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
      key: 'tasks',
      label: (
        <span>
          <CalendarOutlined />
          任务中心
        </span>
      ),
      children: (
        <div>
          <Row gutter={[16, 16]}>
            {/* 每日任务 */}
            <Col xs={24} lg={8}>
              <Card 
                title={
                  <Space>
                    <FireOutlined style={{ color: '#fa8c16' }} />
                    每日任务
                    <Tag color="orange">刷新: 5小时</Tag>
                  </Space>
                }
              >
                <List
                  dataSource={dailyTasks}
                  renderItem={task => (
                    <List.Item>
                      <div style={{ width: '100%' }}>
                        <div style={{ marginBottom: 8 }}>
                          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <span>{task.name}</span>
                            <Tag color="gold">+{task.reward} {task.type === 'chips' ? '筹码' : '经验'}</Tag>
                          </Space>
                        </div>
                        <Progress 
                          percent={Math.round(task.progress / task.total * 100)}
                          format={() => `${task.progress}/${task.total}`}
                          strokeColor="#52c41a"
                        />
                      </div>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>

            {/* 周任务 */}
            <Col xs={24} lg={8}>
              <Card 
                title={
                  <Space>
                    <CalendarOutlined style={{ color: '#1890ff' }} />
                    周任务
                    <Tag color="blue">刷新: 3天</Tag>
                  </Space>
                }
              >
                <List
                  dataSource={weeklyTasks}
                  renderItem={task => (
                    <List.Item>
                      <div style={{ width: '100%' }}>
                        <div style={{ marginBottom: 8 }}>
                          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <span>{task.name}</span>
                            <Tag color="gold">+{task.reward} {task.type === 'chips' ? '筹码' : '经验'}</Tag>
                          </Space>
                        </div>
                        <Progress 
                          percent={Math.round(task.progress / task.total * 100)}
                          format={() => `${task.progress}/${task.total}`}
                          strokeColor="#1890ff"
                        />
                      </div>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>

            {/* 成就任务 */}
            <Col xs={24} lg={8}>
              <Card 
                title={
                  <Space>
                    <StarOutlined style={{ color: '#722ed1' }} />
                    成就任务
                  </Space>
                }
              >
                <List
                  dataSource={achievementTasks}
                  renderItem={task => (
                    <List.Item>
                      <div style={{ width: '100%' }}>
                        <div style={{ marginBottom: 8 }}>
                          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <span style={{ color: getRarityColor(task.rarity) }}>
                              {task.name}
                            </span>
                            <Tag color={task.rarity === 'legendary' ? 'gold' : task.rarity}>
                              {task.reward}
                            </Tag>
                          </Space>
                          <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                            {task.description}
                          </div>
                        </div>
                        <Progress 
                          percent={Math.round(task.progress / task.total * 100)}
                          format={() => `${task.progress}/${task.total}`}
                          strokeColor={getRarityColor(task.rarity)}
                        />
                      </div>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'calendar',
      label: (
        <span>
          <GiftOutlined />
          活动日历
        </span>
      ),
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Card title="本周活动">
              <Timeline mode="left">
                {eventCalendar.map((day, index) => (
                  <Timeline.Item 
                    key={index}
                    color={index === 0 ? 'green' : 'blue'}
                    label={day.date}
                  >
                    <div>
                      {day.events.map((event, idx) => (
                        <Tag key={idx} color="purple" style={{ marginBottom: 4 }}>
                          {event}
                        </Tag>
                      ))}
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>
          </Col>
          
          <Col xs={24} md={8}>
            <Card title="限时活动" extra={<Tag color="red">HOT</Tag>}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Card size="small" style={{ backgroundColor: '#fff1f0' }}>
                  <Space>
                    <FireOutlined style={{ color: '#ff4d4f', fontSize: 24 }} />
                    <div>
                      <div style={{ fontWeight: 'bold' }}>双倍经验</div>
                      <div style={{ fontSize: 12, color: '#999' }}>剩余2小时</div>
                    </div>
                  </Space>
                </Card>
                
                <Card size="small" style={{ backgroundColor: '#f6ffed' }}>
                  <Space>
                    <GiftOutlined style={{ color: '#52c41a', fontSize: 24 }} />
                    <div>
                      <div style={{ fontWeight: 'bold' }}>充值返利</div>
                      <div style={{ fontSize: 12, color: '#999' }}>充100送50</div>
                    </div>
                  </Space>
                </Card>
                
                <Card size="small" style={{ backgroundColor: '#e6f7ff' }}>
                  <Space>
                    <TeamOutlined style={{ color: '#1890ff', fontSize: 24 }} />
                    <div>
                      <div style={{ fontWeight: 'bold' }}>好友邀请</div>
                      <div style={{ fontSize: 12, color: '#999' }}>邀请得好礼</div>
                    </div>
                  </Space>
                </Card>
              </Space>
            </Card>
            
            <Card title="我的奖励" style={{ marginTop: 16 }}>
              <List
                dataSource={[
                  { name: '待领取筹码', value: 1500 },
                  { name: '待领取经验', value: 800 },
                  { name: '活动积分', value: 2350 }
                ]}
                renderItem={item => (
                  <List.Item>
                    <span>{item.name}</span>
                    <Tag color="gold">{item.value}</Tag>
                  </List.Item>
                )}
              />
              <Button type="primary" block style={{ marginTop: 16 }}>
                一键领取
              </Button>
            </Card>
          </Col>
        </Row>
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
            <h1 style={{ margin: 0, fontSize: 24 }}>活动中心</h1>
            <p style={{ margin: '8px 0 0', color: '#666' }}>
              参加活动赢取丰厚奖励
            </p>
          </Col>
          <Col>
            <Space>
              <Statistic 
                title="活动积分" 
                value={2350}
                prefix={<StarOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
              <Statistic 
                title="本周排名" 
                value={28}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
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