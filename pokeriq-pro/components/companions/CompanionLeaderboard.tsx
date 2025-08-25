'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Tabs, 
  Table, 
  Avatar, 
  Tag, 
  Progress, 
  Tooltip, 
  Button, 
  Modal, 
  Input, 
  Space,
  Row,
  Col,
  Statistic,
  Badge,
  message
} from 'antd';
import { 
  CrownOutlined, 
  StarOutlined, 
  HeartOutlined, 
  DollarOutlined,
  ThunderboltOutlined,
  EditOutlined,
  TrophyOutlined,
  FireOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons';

const { TabPane } = Tabs;

interface CompanionLeaderboardProps {
  userId: string;
  onNameCompanion?: (companionId: string, customName: string) => void;
}

const tierColors: Record<string, string> = {
  'S': '#ff4d4f',
  'A': '#fa8c16', 
  'B': '#fadb14',
  'C': '#52c41a',
  'D': '#8c8c8c'
};

export const CompanionLeaderboard: React.FC<CompanionLeaderboardProps> = ({
  userId,
  onNameCompanion
}) => {
  const [activeTab, setActiveTab] = useState('collector');
  const [showNamingModal, setShowNamingModal] = useState(false);
  const [selectedCompanion, setSelectedCompanion] = useState<any>(null);
  const [customName, setCustomName] = useState('');
  const [myRankings, setMyRankings] = useState({
    collector: 0,
    starPower: 0,
    charm: 0,
    value: 0,
    legend: 0
  });

  // 收藏家榜数据
  const collectorData = [
    {
      rank: 1,
      userId: 'user1',
      username: '陪伴收藏家',
      avatar: '👑',
      totalCompanions: 42,
      sRankCount: 3,
      completionRate: 85,
      trend: 'stable',
      title: '收藏皇帝'
    },
    {
      rank: 2,
      userId: 'user2',
      username: '德州小王子',
      avatar: '🎯',
      totalCompanions: 38,
      sRankCount: 2,
      completionRate: 76,
      trend: 'up',
      title: '收藏王'
    }
  ];

  // 星耀榜数据
  const starPowerData = [
    {
      rank: 1,
      username: '星辰大海',
      avatar: '⭐',
      averageRating: 'S',
      totalStarPower: 15280,
      teamComposition: { S: 3, A: 5, B: 2, C: 0, D: 0 },
      title: '星耀之王'
    },
    {
      rank: 2,
      username: '群星闪耀',
      avatar: '✨',
      averageRating: 'A',
      totalStarPower: 12650,
      teamComposition: { S: 2, A: 6, B: 3, C: 1, D: 0 },
      title: '星耀大师'
    }
  ];

  // 魅力榜数据（单个陪伴）
  const charmData = [
    {
      rank: 1,
      companionName: '九尾狐妖',
      customName: '小九',
      owner: '传奇玩家',
      charmLevel: 999,
      relationshipLevel: 100,
      intimacyPoints: 99999,
      charmScore: 158000,
      tier: 'S'
    },
    {
      rank: 2,
      companionName: '阿芙罗狄蒂',
      customName: '爱神',
      owner: '浪漫主义者',
      charmLevel: 888,
      relationshipLevel: 100,
      intimacyPoints: 88888,
      charmScore: 145000,
      tier: 'S'
    }
  ];

  // 身价榜数据
  const valueData = [
    {
      rank: 1,
      companionName: '瓦尔基里',
      customName: '战神',
      owner: '首富',
      baseValue: 1288,
      investmentValue: 50000,
      arenaWinnings: 100000,
      totalValue: 888888,
      trend: { direction: 'up', changePercent: 25.5 },
      tier: 'S'
    },
    {
      rank: 2,
      companionName: '索菲亚',
      customName: '优雅女神',
      owner: '投资大师',
      baseValue: 588,
      investmentValue: 30000,
      arenaWinnings: 50000,
      totalValue: 456789,
      trend: { direction: 'up', changePercent: 12.3 },
      tier: 'A'
    }
  ];

  // 传奇榜数据（S级专属）
  const legendData = [
    {
      rank: 1,
      originalName: '九尾狐妖',
      customName: '千年妖狐·幻',
      owner: '传奇缔造者',
      powerLevel: 9999,
      arenaVictories: 500,
      evolutionStage: 5,
      legendScore: 999999,
      title: '永恒传奇'
    },
    {
      rank: 2,
      originalName: '阿芙罗狄蒂',
      customName: '爱与美的女神',
      owner: '神话编织者',
      powerLevel: 8888,
      arenaVictories: 388,
      evolutionStage: 4,
      legendScore: 888888,
      title: '不朽传奇'
    }
  ];

  // 处理命名
  const handleNaming = () => {
    if (!customName || customName.length < 2 || customName.length > 12) {
      message.error('名字长度需要在2-12个字符之间');
      return;
    }
    
    if (onNameCompanion && selectedCompanion) {
      onNameCompanion(selectedCompanion.id, customName);
      message.success(`成功将${selectedCompanion.name}命名为"${customName}"`);
      setShowNamingModal(false);
      setCustomName('');
    }
  };

  // 渲染排名变化图标
  const renderTrend = (trend: string) => {
    if (trend === 'up') return <RiseOutlined style={{ color: '#52c41a' }} />;
    if (trend === 'down') return <FallOutlined style={{ color: '#ff4d4f' }} />;
    return <span style={{ color: '#8c8c8c' }}>-</span>;
  };

  // 渲染团队构成
  const renderTeamComposition = (composition: any) => {
    return (
      <Space size={4}>
        {Object.entries(composition).map(([tier, count]: [string, any]) => (
          count > 0 && (
            <Tag key={tier} color={tierColors[tier]}>
              {tier}×{count}
            </Tag>
          )
        ))}
      </Space>
    );
  };

  return (
    <div className="companion-leaderboard">
      {/* 我的排名概览 */}
      <Card style={{ marginBottom: 20 }}>
        <Row gutter={16}>
          <Col span={4}>
            <Statistic
              title="收藏家榜"
              value={myRankings.collector || '-'}
              prefix={<TrophyOutlined />}
              suffix={myRankings.collector <= 100 ? '名' : ''}
            />
          </Col>
          <Col span={5}>
            <Statistic
              title="星耀榜"
              value={myRankings.starPower || '-'}
              prefix={<StarOutlined />}
              suffix={myRankings.starPower <= 100 ? '名' : ''}
            />
          </Col>
          <Col span={5}>
            <Statistic
              title="魅力榜最高"
              value={myRankings.charm || '-'}
              prefix={<HeartOutlined />}
              suffix={myRankings.charm <= 100 ? '名' : ''}
            />
          </Col>
          <Col span={5}>
            <Statistic
              title="身价榜最高"
              value={myRankings.value || '-'}
              prefix={<DollarOutlined />}
              suffix={myRankings.value <= 100 ? '名' : ''}
            />
          </Col>
          <Col span={5}>
            <Statistic
              title="传奇榜"
              value={myRankings.legend || '-'}
              prefix={<ThunderboltOutlined />}
              suffix={myRankings.legend <= 20 ? '名' : ''}
            />
          </Col>
        </Row>
      </Card>

      {/* 排行榜标签页 */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* 收藏家榜 */}
          <TabPane 
            tab={<span><TrophyOutlined />收藏家榜</span>} 
            key="collector"
          >
            <Table
              dataSource={collectorData}
              pagination={false}
              columns={[
                {
                  title: '排名',
                  key: 'rank',
                  width: 80,
                  render: (_, record) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {record.rank <= 3 ? (
                        <CrownOutlined style={{ 
                          fontSize: 20,
                          color: record.rank === 1 ? '#ffd700' : 
                                 record.rank === 2 ? '#c0c0c0' : '#cd7f32'
                        }} />
                      ) : (
                        <span>{record.rank}</span>
                      )}
                      {renderTrend(record.trend)}
                    </div>
                  )
                },
                {
                  title: '玩家',
                  key: 'player',
                  render: (_, record) => (
                    <Space>
                      <Avatar>{record.avatar}</Avatar>
                      <div>
                        <div>{record.username}</div>
                        <Tag color="purple">{record.title}</Tag>
                      </div>
                    </Space>
                  )
                },
                {
                  title: '陪伴数量',
                  dataIndex: 'totalCompanions',
                  key: 'totalCompanions',
                  render: (val) => <span style={{ fontSize: 18, fontWeight: 'bold' }}>{val}</span>
                },
                {
                  title: 'S级数量',
                  dataIndex: 'sRankCount',
                  key: 'sRankCount',
                  render: (val) => (
                    <Tag color={tierColors['S']}>{val}</Tag>
                  )
                },
                {
                  title: '收集进度',
                  key: 'progress',
                  render: (_, record) => (
                    <Progress 
                      percent={record.completionRate} 
                      size="small"
                      strokeColor={{
                        '0%': '#108ee9',
                        '100%': '#87d068'
                      }}
                    />
                  )
                }
              ]}
            />
          </TabPane>

          {/* 星耀榜 */}
          <TabPane 
            tab={<span><StarOutlined />星耀榜</span>} 
            key="starPower"
          >
            <Table
              dataSource={starPowerData}
              pagination={false}
              columns={[
                {
                  title: '排名',
                  key: 'rank',
                  width: 80,
                  render: (_, record) => (
                    record.rank <= 3 ? (
                      <CrownOutlined style={{ 
                        fontSize: 20,
                        color: record.rank === 1 ? '#ffd700' : 
                               record.rank === 2 ? '#c0c0c0' : '#cd7f32'
                      }} />
                    ) : (
                      <span>{record.rank}</span>
                    )
                  )
                },
                {
                  title: '玩家',
                  key: 'player',
                  render: (_, record) => (
                    <Space>
                      <Avatar>{record.avatar}</Avatar>
                      <div>
                        <div>{record.username}</div>
                        <Tag color="gold">{record.title}</Tag>
                      </div>
                    </Space>
                  )
                },
                {
                  title: '平均评级',
                  dataIndex: 'averageRating',
                  key: 'averageRating',
                  render: (val) => (
                    <Tag color={tierColors[val]} style={{ fontSize: 16 }}>
                      {val}级
                    </Tag>
                  )
                },
                {
                  title: '星力值',
                  dataIndex: 'totalStarPower',
                  key: 'totalStarPower',
                  render: (val) => (
                    <span style={{ fontSize: 20, fontWeight: 'bold', color: '#faad14' }}>
                      ⭐ {val}
                    </span>
                  )
                },
                {
                  title: '团队构成',
                  key: 'team',
                  render: (_, record) => renderTeamComposition(record.teamComposition)
                }
              ]}
            />
          </TabPane>

          {/* 魅力榜 */}
          <TabPane 
            tab={<span><HeartOutlined />魅力榜</span>} 
            key="charm"
          >
            <Table
              dataSource={charmData}
              pagination={false}
              columns={[
                {
                  title: '排名',
                  key: 'rank',
                  width: 80,
                  render: (_, record) => (
                    record.rank <= 3 ? (
                      <CrownOutlined style={{ 
                        fontSize: 20,
                        color: record.rank === 1 ? '#ffd700' : 
                               record.rank === 2 ? '#c0c0c0' : '#cd7f32'
                      }} />
                    ) : (
                      <span>{record.rank}</span>
                    )
                  )
                },
                {
                  title: '陪伴',
                  key: 'companion',
                  render: (_, record) => (
                    <Space>
                      <Avatar style={{ backgroundColor: tierColors[record.tier] }}>
                        {record.tier}
                      </Avatar>
                      <div>
                        <div>{record.companionName}</div>
                        {record.customName && (
                          <Tag color="pink">"{record.customName}"</Tag>
                        )}
                      </div>
                    </Space>
                  )
                },
                {
                  title: '拥有者',
                  dataIndex: 'owner',
                  key: 'owner'
                },
                {
                  title: '魅力等级',
                  dataIndex: 'charmLevel',
                  key: 'charmLevel',
                  render: (val) => (
                    <span style={{ fontSize: 18, color: '#ff1493' }}>
                      Lv.{val}
                    </span>
                  )
                },
                {
                  title: '关系/亲密度',
                  key: 'relationship',
                  render: (_, record) => (
                    <div>
                      <div>关系: {record.relationshipLevel}/100</div>
                      <div>亲密: {record.intimacyPoints}</div>
                    </div>
                  )
                },
                {
                  title: '魅力总分',
                  dataIndex: 'charmScore',
                  key: 'charmScore',
                  render: (val) => (
                    <span style={{ fontSize: 20, fontWeight: 'bold', color: '#ff69b4' }}>
                      {val.toLocaleString()}
                    </span>
                  )
                }
              ]}
            />
          </TabPane>

          {/* 身价榜 */}
          <TabPane 
            tab={<span><DollarOutlined />身价榜</span>} 
            key="value"
          >
            <Table
              dataSource={valueData}
              pagination={false}
              columns={[
                {
                  title: '排名',
                  key: 'rank',
                  width: 80,
                  render: (_, record) => (
                    record.rank <= 3 ? (
                      <CrownOutlined style={{ 
                        fontSize: 20,
                        color: record.rank === 1 ? '#ffd700' : 
                               record.rank === 2 ? '#c0c0c0' : '#cd7f32'
                      }} />
                    ) : (
                      <span>{record.rank}</span>
                    )
                  )
                },
                {
                  title: '陪伴',
                  key: 'companion',
                  render: (_, record) => (
                    <Space>
                      <Avatar style={{ backgroundColor: tierColors[record.tier] }}>
                        {record.tier}
                      </Avatar>
                      <div>
                        <div>{record.companionName}</div>
                        {record.customName && (
                          <Tag color="gold">"{record.customName}"</Tag>
                        )}
                      </div>
                    </Space>
                  )
                },
                {
                  title: '拥有者',
                  dataIndex: 'owner',
                  key: 'owner'
                },
                {
                  title: '投资明细',
                  key: 'investment',
                  render: (_, record) => (
                    <div style={{ fontSize: 12 }}>
                      <div>基础: 💎{record.baseValue}</div>
                      <div>投资: 💎{record.investmentValue}</div>
                      <div>收益: 💎{record.arenaWinnings}</div>
                    </div>
                  )
                },
                {
                  title: '总身价',
                  dataIndex: 'totalValue',
                  key: 'totalValue',
                  render: (val, record) => (
                    <div>
                      <span style={{ fontSize: 20, fontWeight: 'bold', color: '#faad14' }}>
                        💎 {val.toLocaleString()}
                      </span>
                      <div>
                        {record.trend.direction === 'up' ? (
                          <span style={{ color: '#52c41a', fontSize: 12 }}>
                            <RiseOutlined /> +{record.trend.changePercent}%
                          </span>
                        ) : (
                          <span style={{ color: '#ff4d4f', fontSize: 12 }}>
                            <FallOutlined /> -{record.trend.changePercent}%
                          </span>
                        )}
                      </div>
                    </div>
                  )
                }
              ]}
            />
          </TabPane>

          {/* 传奇榜 */}
          <TabPane 
            tab={
              <span>
                <ThunderboltOutlined />
                传奇榜
                <Tag color="red" style={{ marginLeft: 8 }}>S级专属</Tag>
              </span>
            } 
            key="legend"
          >
            <Table
              dataSource={legendData}
              pagination={false}
              columns={[
                {
                  title: '排名',
                  key: 'rank',
                  width: 80,
                  render: (_, record) => (
                    <div style={{ textAlign: 'center' }}>
                      {record.rank === 1 ? (
                        <div style={{ 
                          fontSize: 24, 
                          background: 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          fontWeight: 'bold'
                        }}>
                          👑
                        </div>
                      ) : (
                        <CrownOutlined style={{ 
                          fontSize: 20,
                          color: record.rank === 2 ? '#c0c0c0' : '#cd7f32'
                        }} />
                      )}
                    </div>
                  )
                },
                {
                  title: '传奇陪伴',
                  key: 'companion',
                  render: (_, record) => (
                    <Space direction="vertical" size={0}>
                      <div style={{ fontSize: 16, fontWeight: 'bold' }}>
                        {record.customName}
                        <Tooltip title="点击修改名字">
                          <EditOutlined 
                            style={{ marginLeft: 8, cursor: 'pointer', color: '#1890ff' }}
                            onClick={() => {
                              setSelectedCompanion(record);
                              setShowNamingModal(true);
                            }}
                          />
                        </Tooltip>
                      </div>
                      <div style={{ fontSize: 12, color: '#999' }}>
                        原名: {record.originalName}
                      </div>
                      <Tag color="volcano">{record.title}</Tag>
                    </Space>
                  )
                },
                {
                  title: '拥有者',
                  dataIndex: 'owner',
                  key: 'owner',
                  render: (val) => (
                    <div>
                      <div>{val}</div>
                      <Badge 
                        count="VIP" 
                        style={{ backgroundColor: '#ff4d4f' }}
                      />
                    </div>
                  )
                },
                {
                  title: '力量等级',
                  dataIndex: 'powerLevel',
                  key: 'powerLevel',
                  render: (val) => (
                    <div style={{ 
                      fontSize: 20, 
                      fontWeight: 'bold',
                      color: val >= 9000 ? '#ff0000' : '#ff7f00'
                    }}>
                      ⚡ {val}
                    </div>
                  )
                },
                {
                  title: '进化阶段',
                  dataIndex: 'evolutionStage',
                  key: 'evolutionStage',
                  render: (val) => (
                    <div>
                      {[...Array(5)].map((_, i) => (
                        <StarOutlined 
                          key={i}
                          style={{ 
                            color: i < val ? '#ff4d4f' : '#d9d9d9',
                            fontSize: 16
                          }}
                        />
                      ))}
                      <div style={{ fontSize: 12, marginTop: 4 }}>
                        {val === 5 ? '神话形态' : 
                         val === 4 ? '究极形态' :
                         val === 3 ? '进化形态' :
                         val === 2 ? '觉醒形态' : '初始形态'}
                      </div>
                    </div>
                  )
                },
                {
                  title: '传奇分数',
                  dataIndex: 'legendScore',
                  key: 'legendScore',
                  render: (val) => (
                    <span style={{ 
                      fontSize: 22, 
                      fontWeight: 'bold',
                      background: 'linear-gradient(45deg, #ff0000, #ff7f00)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                      {val.toLocaleString()}
                    </span>
                  )
                }
              ]}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* S级陪伴命名模态框 */}
      <Modal
        title="为S级陪伴起名"
        open={showNamingModal}
        onOk={handleNaming}
        onCancel={() => {
          setShowNamingModal(false);
          setCustomName('');
        }}
        okText="确认命名"
        cancelText="取消"
      >
        <div style={{ marginBottom: 20 }}>
          <p>为你的S级陪伴起一个独特的名字！</p>
          <p style={{ color: '#999', fontSize: 12 }}>
            首次命名免费，之后改名需要500智慧币
          </p>
        </div>
        <Input
          placeholder="请输入2-12个字符的名字"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          maxLength={12}
          showCount
          prefix={<EditOutlined />}
        />
        <div style={{ marginTop: 20 }}>
          <Tag color="gold">原名: {selectedCompanion?.originalName}</Tag>
          <Tag color="red">S级传奇</Tag>
        </div>
      </Modal>
    </div>
  );
};