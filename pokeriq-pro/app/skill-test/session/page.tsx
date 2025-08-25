'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Button, Progress, Typography, Row, Col, Tag, Space, Modal, Statistic, Alert, App } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import AppLayout from '@/src/components/layout/AppLayout';
import {
  ClockCircleOutlined,
  FireOutlined,
  DashboardOutlined,
  TrophyOutlined,
  WarningOutlined,
  CaretRightOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface TestSession {
  id: string;
  testType: 'quick' | 'standard' | 'deep';
  currentScenario: number;
  totalScenarios: number;
  timeRemaining: number;
  scenarios: TestScenario[];
  isCompleted: boolean;
}

interface TestScenario {
  id: string;
  category: string;
  difficulty: number;
  position: string;
  stackSize: number;
  situation: {
    holeCards: string[];
    communityCards: string[];
    potSize: number;
    currentBet: number;
    stackSize: number;
    position: string;
    actionHistory: any[];
  };
  gtoSolution: {
    actions: Array<{
      action: string;
      frequency: number;
      size?: number;
    }>;
    ev: Record<string, number>;
    reasoning: string;
  };
  tags: string[];
}

interface TestAnswer {
  scenarioId: string;
  action: 'fold' | 'check' | 'call' | 'raise';
  amount?: number;
  timeSpent: number;
}

export default function SessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const testType = searchParams?.get('type') as 'quick' | 'standard' | 'deep' || 'quick';
  const { message } = App.useApp();

  const [session, setSession] = useState<TestSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentScenario, setCurrentScenario] = useState<TestScenario | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [raiseAmount, setRaiseAmount] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);

  // 初始化测试会话
  useEffect(() => {
    initializeSession();
  }, [testType]);

  // 计时器
  useEffect(() => {
    if (!session || session.isCompleted) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session]);

  const initializeSession = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/skill-test/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testType })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || '创建测试会话失败');
      }

      const sessionData = data.data;
      // 初始化 currentScenario 为 1（第一题）
      const initialSession = {
        ...sessionData,
        currentScenario: 1,
        totalScenarios: sessionData.scenarios?.length || 0
      };
      setSession(initialSession);
      setCurrentScenarioIndex(0);
      
      if (sessionData.scenarios && sessionData.scenarios.length > 0) {
        setCurrentScenario(sessionData.scenarios[0]);
        setTimeRemaining(getTimeLimit(testType));
        setQuestionStartTime(Date.now());
      }

    } catch (error) {
      console.error('Error initializing session:', error);
      message.error('初始化测试失败，请重试');
      router.push('/skill-test');
    } finally {
      setLoading(false);
    }
  };

  const getTimeLimit = (type: string): number => {
    switch (type) {
      case 'quick': return 30;
      case 'standard': return 45;
      case 'deep': return 60;
      default: return 45;
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAction || !session || !currentScenario) {
      message.warning('请选择一个决策');
      return;
    }

    try {
      setSubmitting(true);
      const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
      
      const answer: TestAnswer = {
        scenarioId: currentScenario.id,
        action: selectedAction as 'fold' | 'check' | 'call' | 'raise',
        amount: selectedAction === 'raise' ? raiseAmount : undefined,
        timeSpent
      };

      const response = await fetch('/api/skill-test/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          ...answer
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || '提交答案失败');
      }

      // 移动到下一个场景
      const nextIndex = currentScenarioIndex + 1;
      if (nextIndex < session.scenarios.length) {
        setCurrentScenario(session.scenarios[nextIndex]);
        setCurrentScenarioIndex(nextIndex);
        setSession(prev => prev ? { ...prev, currentScenario: nextIndex + 1 } : null);
        setSelectedAction('');
        setRaiseAmount(0);
        setQuestionStartTime(Date.now());
        setTimeRemaining(getTimeLimit(testType));
      } else {
        // 测试完成
        await completeTest();
      }

    } catch (error) {
      console.error('Error submitting answer:', error);
      message.error('提交答案失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const completeTest = async () => {
    try {
      const response = await fetch('/api/skill-test/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session?.id })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || '完成测试失败');
      }

      // 跳转到结果页面
      router.push(`/skill-test/result?sessionId=${session?.id}`);

    } catch (error) {
      console.error('Error completing test:', error);
      message.error('完成测试失败，请重试');
    }
  };

  const handleTimeout = () => {
    message.warning('时间到！自动提交当前决策');
    if (selectedAction) {
      handleSubmitAnswer();
    } else {
      // 如果没有选择，默认弃牌
      setSelectedAction('fold');
      setTimeout(handleSubmitAnswer, 100);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderCard = (card: string) => {
    const suit = card.slice(-1);
    const rank = card.slice(0, -1);
    const isRed = suit === 'h' || suit === 'd';
    
    const suitSymbol: Record<string, string> = {
      'h': '♥', 'd': '♦', 'c': '♣', 's': '♠'
    };

    return (
      <div
        key={card}
        className={`inline-block bg-white border rounded-lg p-2 m-1 min-w-[40px] text-center font-bold ${
          isRed ? 'text-red-500' : 'text-black'
        }`}
      >
        <div className="text-sm">{rank}</div>
        <div className="text-lg">{suitSymbol[suit]}</div>
      </div>
    );
  };

  const getActionButtons = () => {
    if (!currentScenario) return [];

    const buttons = [
      { action: 'fold', label: '弃牌', color: '#ff4d4f' },
      { action: 'check', label: '过牌', color: '#52c41a' },
      { action: 'call', label: '跟注', color: '#1890ff' },
      { action: 'raise', label: '加注', color: '#fa8c16' }
    ];

    // 根据情况过滤可用动作
    return buttons.filter(btn => {
      if (btn.action === 'check' && currentScenario.situation.currentBet > 0) return false;
      if (btn.action === 'call' && currentScenario.situation.currentBet === 0) return false;
      return true;
    });
  };

  if (loading) {
    return (
      <AppLayout>
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <Card>
            <Statistic
              title="正在初始化测试..."
              value={0}
              prefix={<CaretRightOutlined />}
              suffix="准备就绪"
            />
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (!session || !currentScenario) {
    return (
      <AppLayout>
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <Card>
            <Alert
              message="测试会话无效"
              description="请返回重新开始测试"
              type="error"
              action={
                <Button onClick={() => router.push('/skill-test')}>
                  返回
                </Button>
              }
            />
          </Card>
        </div>
      </AppLayout>
    );
  }

  const progress = session.totalScenarios > 0 
    ? Math.round(((currentScenarioIndex + 1) / session.totalScenarios) * 100) 
    : 0;

  return (
    <AppLayout>
      <App>
        <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh', maxWidth: '100%', overflow: 'hidden' }}>
      {/* 顶部状态栏 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="进度"
              value={progress}
              suffix="%"
              prefix={<DashboardOutlined />}
            />
            <Progress percent={progress} size="small" />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="题目"
              value={currentScenarioIndex + 1}
              suffix={`/ ${session.totalScenarios || 0}`}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="剩余时间"
              value={formatTime(timeRemaining)}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: timeRemaining <= 10 ? '#ff4d4f' : '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="难度等级"
              value={currentScenario.difficulty}
              suffix="星"
              prefix={<FireOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 主要游戏区域 */}
      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card title={`${currentScenario.category.toUpperCase()} - ${currentScenario.position}位`}>
            {/* 场景描述 */}
            <div style={{ marginBottom: 16 }}>
              <Text strong>底池大小：</Text>
              <Tag color="blue">{currentScenario.situation.potSize} BB</Tag>
              <Text strong>当前下注：</Text>
              <Tag color="orange">{currentScenario.situation.currentBet} BB</Tag>
              <Text strong>筹码量：</Text>
              <Tag color="green">{currentScenario.situation.stackSize} BB</Tag>
            </div>

            {/* 手牌 */}
            <div style={{ marginBottom: 16 }}>
              <Text strong>你的手牌：</Text>
              <div style={{ marginTop: 8 }}>
                {currentScenario.situation.holeCards.map(card => renderCard(card))}
              </div>
            </div>

            {/* 公共牌 */}
            {currentScenario.situation.communityCards.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>公共牌：</Text>
                <div style={{ marginTop: 8 }}>
                  {currentScenario.situation.communityCards.map(card => renderCard(card))}
                </div>
              </div>
            )}

            {/* 行动历史 */}
            {currentScenario.situation.actionHistory.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>行动历史：</Text>
                <div style={{ marginTop: 8 }}>
                  {currentScenario.situation.actionHistory.map((action, index) => (
                    <Tag key={index} style={{ margin: '2px' }}>
                      {action.player}: {action.action} {action.amount ? `${action.amount}BB` : ''}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </Col>

        <Col span={8}>
          <Card title="做出你的决策">
            <Space direction="vertical" style={{ width: '100%' }}>
              {getActionButtons().map(btn => (
                <Button
                  key={btn.action}
                  type={selectedAction === btn.action ? 'primary' : 'default'}
                  size="large"
                  block
                  onClick={() => setSelectedAction(btn.action)}
                  style={{
                    backgroundColor: selectedAction === btn.action ? btn.color : undefined,
                    borderColor: btn.color
                  }}
                >
                  {btn.label}
                </Button>
              ))}

              {selectedAction === 'raise' && (
                <div>
                  <Text>加注金额 (BB):</Text>
                  <Row gutter={8} style={{ marginTop: 8 }}>
                    {[
                      currentScenario.situation.currentBet * 2,
                      Math.round(currentScenario.situation.potSize * 0.5),
                      currentScenario.situation.potSize,
                      currentScenario.situation.potSize * 2
                    ].map(amount => (
                      <Col span={12} key={amount}>
                        <Button
                          size="small"
                          block
                          type={raiseAmount === amount ? 'primary' : 'default'}
                          onClick={() => setRaiseAmount(amount)}
                        >
                          {amount}BB
                        </Button>
                      </Col>
                    ))}
                  </Row>
                </div>
              )}

              <Button
                type="primary"
                size="large"
                block
                loading={submitting}
                disabled={!selectedAction}
                onClick={handleSubmitAnswer}
                style={{ marginTop: 16 }}
              >
                确认决策
              </Button>
            </Space>
          </Card>

          {/* 标签 */}
          <Card size="small" style={{ marginTop: 16 }}>
            <Text strong>场景标签：</Text>
            <div style={{ marginTop: 8 }}>
              {(Array.isArray(currentScenario.tags) ? currentScenario.tags : []).map((tag: string) => (
                <Tag key={tag} color="blue">{tag}</Tag>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
        </div>
      </App>
    </AppLayout>
  );
}