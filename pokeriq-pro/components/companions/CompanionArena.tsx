'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Table, Tag, Progress, Tooltip, Badge, Alert, Row, Col, Statistic } from 'antd';
import { 
  TrophyOutlined, 
  FireOutlined, 
  CrownOutlined, 
  ThunderboltOutlined,
  HeartBrokenOutlined,
  TeamOutlined,
  DollarOutlined,
  WarningOutlined,
  StarFilled
} from '@ant-design/icons';

interface CompanionArenaProps {
  userCompanions: any[];
  wisdomCoins: number;
  onStartArena: (mode: string) => void;
  onRedeemCompanion: (companionId: string) => void;
}

const tierColors: Record<string, string> = {
  'S': '#ff4d4f',
  'A': '#fa8c16',
  'B': '#fadb14',
  'C': '#52c41a',
  'D': '#8c8c8c'
};

const modeIcons: Record<string, React.ReactNode> = {
  classic_elimination: <TrophyOutlined />,
  survival_challenge: <FireOutlined />,
  companion_defense: <TeamOutlined />,
  fate_reversal: <ThunderboltOutlined />
};

export const CompanionArena: React.FC<CompanionArenaProps> = ({
  userCompanions,
  wisdomCoins,
  onStartArena,
  onRedeemCompanion
}) => {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [showRedemption, setShowRedemption] = useState(false);
  const [lostCompanions, setLostCompanions] = useState<any[]>([]);
  const [arenaStats, setArenaStats] = useState({
    totalWins: 0,
    currentStreak: 0,
    bestStreak: 0,
    sCompanionsEarned: 0
  });

  // 检查是否可以开启竞技场
  const canStartArena = userCompanions.length >= 6;
  const hasSTierCompanion = userCompanions.some(c => c.tier === 'S');

  // 计算团队评级
  const calculateTeamRating = () => {
    if (userCompanions.length === 0) return 'D';
    const avgScore = userCompanions.reduce((sum, c) => {
      const tierScores = { 'S': 100, 'A': 80, 'B': 60, 'C': 40, 'D': 20 };
      return sum + (tierScores[c.tier] || 20);
    }, 0) / userCompanions.length;
    
    if (avgScore >= 90) return 'S';
    if (avgScore >= 70) return 'A';
    if (avgScore >= 50) return 'B';
    if (avgScore >= 30) return 'C';
    return 'D';
  };

  const teamRating = calculateTeamRating();

  // 竞技场模式列表
  const arenaModes = [
    {
      key: 'classic_elimination',
      name: '经典淘汰赛',
      description: '8人桌生存战，输掉筹码失去陪伴',
      difficulty: '⭐⭐⭐',
      rewards: '赢1000BB获得S级陪伴',
      risk: '失去评级最低的陪伴',
      recommended: teamRating >= 'B'
    },
    {
      key: 'survival_challenge',
      name: '生存挑战',
      description: '坚持100手牌，定期淘汰弱者',
      difficulty: '⭐⭐⭐⭐',
      rewards: '全员评级提升',
      risk: '每20手失去一个陪伴',
      recommended: teamRating >= 'A'
    },
    {
      key: 'companion_defense',
      name: '陪伴保卫战',
      description: '抵御AI猎手的进攻',
      difficulty: '⭐⭐⭐⭐',
      rewards: '防守成功获得专属皮肤',
      risk: 'AI优先攻击最强陪伴',
      recommended: hasSTierCompanion
    },
    {
      key: 'fate_reversal',
      name: '逆转命运',
      description: 'D级挑战S级，以弱胜强',
      difficulty: '⭐⭐⭐⭐⭐',
      rewards: '立即升级为S级',
      risk: '极高难度，失败率95%',
      recommended: userCompanions.every(c => c.tier === 'D')
    }
  ];

  return (
    <div className="companion-arena">
      {/* 竞技场状态栏 */}
      <Card style={{ marginBottom: 20, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title={<span style={{ color: '#fff' }}>团队评级</span>}
              value={teamRating}
              prefix={<CrownOutlined />}
              valueStyle={{ color: tierColors[teamRating], fontSize: 32 }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={<span style={{ color: '#fff' }}>竞技场胜场</span>}
              value={arenaStats.totalWins}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#fff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={<span style={{ color: '#fff' }}>当前连胜</span>}
              value={arenaStats.currentStreak}
              prefix={<FireOutlined />}
              valueStyle={{ color: '#ffa940' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={<span style={{ color: '#fff' }}>S级陪伴</span>}
              value={arenaStats.sCompanionsEarned}
              prefix={<StarFilled />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Col>
        </Row>
      </Card>

      {/* 开启条件提示 */}
      {!canStartArena && (
        <Alert
          message="竞技场未解锁"
          description={`需要至少6个陪伴才能开启竞技场模式。当前：${userCompanions.length}/6`}
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 20 }}
        />
      )}

      {/* 隐藏属性提示 */}
      {canStartArena && (
        <Alert
          message="🎯 隐藏属性已激活：8人桌模式"
          description="你 + 5个陪伴 + 2个AI对手，输家失去陪伴，赢1000BB获得S级陪伴！"
          type="success"
          showIcon
          style={{ marginBottom: 20 }}
        />
      )}

      {/* 竞技场模式选择 */}
      <Row gutter={[16, 16]}>
        {arenaModes.map(mode => (
          <Col key={mode.key} xs={24} sm={12} lg={6}>
            <Badge.Ribbon 
              text={mode.recommended ? '推荐' : ''} 
              color={mode.recommended ? 'red' : 'transparent'}
            >
              <Card
                hoverable
                className={`arena-mode-card ${selectedMode === mode.key ? 'selected' : ''}`}
                onClick={() => canStartArena && setSelectedMode(mode.key)}
                style={{
                  height: '100%',
                  opacity: canStartArena ? 1 : 0.5,
                  border: selectedMode === mode.key ? '2px solid #722ed1' : '1px solid #d9d9d9'
                }}
              >
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 48, color: '#722ed1' }}>
                    {modeIcons[mode.key]}
                  </div>
                  <h3 style={{ marginTop: 8 }}>{mode.name}</h3>
                  <div style={{ color: '#666' }}>{mode.difficulty}</div>
                </div>
                
                <p style={{ minHeight: 60 }}>{mode.description}</p>
                
                <div style={{ marginTop: 16 }}>
                  <div style={{ marginBottom: 8 }}>
                    <Tag color="green">奖励</Tag>
                    <span style={{ fontSize: 12 }}>{mode.rewards}</span>
                  </div>
                  <div>
                    <Tag color="red">风险</Tag>
                    <span style={{ fontSize: 12 }}>{mode.risk}</span>
                  </div>
                </div>
              </Card>
            </Badge.Ribbon>
          </Col>
        ))}
      </Row>

      {/* 开始按钮 */}
      {selectedMode && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Button
            type="primary"
            size="large"
            icon={<ThunderboltOutlined />}
            onClick={() => onStartArena(selectedMode)}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              height: 48,
              paddingLeft: 32,
              paddingRight: 32,
              fontSize: 18
            }}
          >
            进入竞技场
          </Button>
        </div>
      )}

      {/* 失去的陪伴（赎回区） */}
      {lostCompanions.length > 0 && (
        <Card 
          title={
            <span>
              <HeartBrokenOutlined style={{ marginRight: 8 }} />
              失去的陪伴（{lostCompanions.length}）
            </span>
          }
          extra={
            <Button onClick={() => setShowRedemption(true)}>
              查看赎回选项
            </Button>
          }
          style={{ marginTop: 24 }}
        >
          <Row gutter={[16, 16]}>
            {lostCompanions.map(companion => (
              <Col key={companion.id} span={4}>
                <Tooltip title={`${companion.name} - 失去时间：${companion.lostTime}`}>
                  <div style={{ textAlign: 'center' }}>
                    <img
                      src={companion.imageUrl}
                      alt={companion.name}
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        filter: 'grayscale(100%)',
                        opacity: 0.6
                      }}
                    />
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      <Tag color={tierColors[companion.tier]}>{companion.tier}</Tag>
                    </div>
                    <div style={{ fontSize: 10, color: '#999' }}>
                      💎 {companion.redemptionCost}
                    </div>
                  </div>
                </Tooltip>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* 赎回模态框 */}
      <Modal
        title="陪伴赎回"
        open={showRedemption}
        onCancel={() => setShowRedemption(false)}
        footer={null}
        width={800}
      >
        <Table
          dataSource={lostCompanions}
          columns={[
            {
              title: '陪伴',
              key: 'companion',
              render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img
                    src={record.imageUrl}
                    alt={record.name}
                    style={{ width: 40, height: 40, borderRadius: '50%' }}
                  />
                  <div>
                    <div>{record.name}</div>
                    <Tag color={tierColors[record.tier]}>{record.tier}级</Tag>
                  </div>
                </div>
              )
            },
            {
              title: '失去时间',
              dataIndex: 'lostTime',
              key: 'lostTime'
            },
            {
              title: '赎回成本',
              key: 'cost',
              render: (_, record) => (
                <span style={{ fontWeight: 'bold' }}>
                  💎 {record.redemptionCost}
                </span>
              )
            },
            {
              title: '其他方式',
              key: 'alternatives',
              render: () => (
                <div>
                  <Tooltip title="完成救赎任务">
                    <Button size="small" style={{ marginRight: 4 }}>任务</Button>
                  </Tooltip>
                  <Tooltip title="献祭同级陪伴">
                    <Button size="small" style={{ marginRight: 4 }}>交换</Button>
                  </Tooltip>
                  <Tooltip title="赢得下场竞技">
                    <Button size="small" danger>竞技</Button>
                  </Tooltip>
                </div>
              )
            },
            {
              title: '操作',
              key: 'action',
              render: (_, record) => (
                <Button
                  type="primary"
                  disabled={wisdomCoins < record.redemptionCost}
                  onClick={() => onRedeemCompanion(record.id)}
                >
                  赎回
                </Button>
              )
            }
          ]}
          pagination={false}
        />
      </Modal>
    </div>
  );
};