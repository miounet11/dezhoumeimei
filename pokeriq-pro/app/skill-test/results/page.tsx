'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Progress, Typography, Space, Tag, Statistic, Alert, Rate, Divider, List } from 'antd';
import {
  TrophyOutlined,
  FireOutlined,
  ClockCircleOutlined,
  StarOutlined,
  BarChartOutlined,
  ReloadOutlined,
  HomeOutlined,
  BookOutlined,
  ArrowUpOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import AppLayout from '@/src/components/layout/AppLayout';

const { Title, Text, Paragraph } = Typography;

interface TestResult {
  testType: 'quick' | 'standard' | 'deep';
  result: {
    totalScore: number;
    correctDecisions: number;
    avgTimePerDecision: number;
    dimensionScores: Record<string, number>;
  };
  timestamp: number;
}

export default function SkillTestResultsPage() {
  const router = useRouter();
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [rank, setRank] = useState<string>('');
  const [rankColor, setRankColor] = useState<string>('');

  useEffect(() => {
    const savedResult = localStorage.getItem('skillTestResult');
    if (!savedResult) {
      router.push('/skill-test');
      return;
    }

    const result: TestResult = JSON.parse(savedResult);
    setTestResult(result);

    // 计算段位
    const score = result.result.totalScore;
    if (score >= 90) {
      setRank('传奇');
      setRankColor('#ffd700');
    } else if (score >= 85) {
      setRank('宗师');
      setRankColor('#c41e3a');
    } else if (score >= 80) {
      setRank('大师');
      setRankColor('#ff6b6b');
    } else if (score >= 75) {
      setRank('钻石');
      setRankColor('#b9f2ff');
    } else if (score >= 70) {
      setRank('铂金');
      setRankColor('#e5e4e2');
    } else if (score >= 60) {
      setRank('黄金');
      setRankColor('#ffd700');
    } else if (score >= 50) {
      setRank('白银');
      setRankColor('#c0c0c0');
    } else {
      setRank('青铜');
      setRankColor('#cd7f32');
    }

    // 更新历史记录
    const history = {
      bestScore: score,
      currentRank: rank,
      testCount: 1,
      lastTestDate: new Date().toLocaleDateString()
    };
    localStorage.setItem('skillTestHistory', JSON.stringify(history));
  }, [router, rank]);

  const skillDimensionNames = {
    aggression: '激进度',
    tightness: '紧凶度',
    position: '位置意识',
    handReading: '读牌能力',
    mathematical: '数学思维',
    psychological: '心理博弈'
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return '#52c41a';
    if (score >= 70) return '#faad14';
    if (score >= 50) return '#fa8c16';
    return '#f5222d';
  };

  const getRecommendations = (scores: Record<string, number>) => {
    const weakestSkill = Object.entries(scores).reduce((a, b) => a[1] < b[1] ? a : b);
    const strongestSkill = Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b);

    const recommendations = [
      {
        type: 'improvement',
        skill: skillDimensionNames[weakestSkill[0] as keyof typeof skillDimensionNames],
        description: `你的${skillDimensionNames[weakestSkill[0] as keyof typeof skillDimensionNames]}相对较弱，建议加强相关训练`,
        action: '前往GTO训练模块'
      },
      {
        type: 'strength',
        skill: skillDimensionNames[strongestSkill[0] as keyof typeof skillDimensionNames],
        description: `你的${skillDimensionNames[strongestSkill[0] as keyof typeof skillDimensionNames]}表现优秀，继续保持`,
        action: '挑战更高难度'
      }
    ];

    if (scores.mathematical < 60) {
      recommendations.push({
        type: 'critical',
        skill: '数学计算',
        description: '建议重点学习底池赔率和期望值计算',
        action: '查看数学教程'
      });
    }

    return recommendations;
  };

  if (!testResult) {
    return <div>Loading...</div>;
  }

  const { result } = testResult;
  const testTypeNames = {
    quick: '快速测试',
    standard: '标准测试',
    deep: '深度测试'
  };

  const questions = {
    quick: 20,
    standard: 50,
    deep: 100
  }[testResult.testType];

  return (
    <AppLayout>
      <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      {/* 头部成绩展示 */}
      <Card
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          marginBottom: 24,
          textAlign: 'center'
        }}
      >
        <Row gutter={[32, 16]} align="middle" justify="center">
          <Col xs={24} md={8}>
            <div style={{ color: 'white' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>
                <TrophyOutlined />
              </div>
              <Title level={2} style={{ color: 'white', margin: 0 }}>
                测试完成！
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16 }}>
                {testTypeNames[testResult.testType]}
              </Text>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>总分</span>}
              value={result.totalScore}
              suffix="分"
              valueStyle={{ color: 'white', fontSize: 48 }}
            />
          </Col>
          <Col xs={24} md={8}>
            <div style={{ color: 'white' }}>
              <Title level={4} style={{ color: 'white', marginBottom: 8 }}>
                段位评级
              </Title>
              <Tag
                color={rankColor}
                style={{
                  fontSize: 20,
                  padding: '8px 16px',
                  border: `2px solid ${rankColor}`,
                  fontWeight: 'bold'
                }}
              >
                {rank}
              </Tag>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 详细统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="正确决策"
              value={result.correctDecisions}
              suffix={`/ ${questions}`}
              prefix={<FireOutlined />}
              valueStyle={{ color: getScoreColor((result.correctDecisions / questions) * 100) }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="平均决策时间"
              value={result.avgTimePerDecision}
              suffix="秒"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: result.avgTimePerDecision < 10 ? '#52c41a' : '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="正确率"
              value={Math.round((result.correctDecisions / questions) * 100)}
              suffix="%"
              prefix={<BarChartOutlined />}
              valueStyle={{ color: getScoreColor((result.correctDecisions / questions) * 100) }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="测试日期"
              value={new Date(testResult.timestamp).toLocaleDateString()}
              prefix={<StarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 六维技能雷达图 */}
      <Card title="技能维度分析" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          {Object.entries(result.dimensionScores).map(([key, score]) => (
            <Col xs={24} md={8} key={key}>
              <Card size="small">
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ fontSize: 16 }}>
                    {skillDimensionNames[key as keyof typeof skillDimensionNames]}
                  </Text>
                  <div style={{ float: 'right' }}>
                    <Text style={{ color: getScoreColor(score), fontWeight: 'bold', fontSize: 18 }}>
                      {score}分
                    </Text>
                  </div>
                </div>
                <Progress
                  percent={score}
                  strokeColor={getScoreColor(score)}
                  trailColor="#f0f0f0"
                  strokeWidth={8}
                />
                <div style={{ marginTop: 8 }}>
                  <Rate
                    disabled
                    value={Math.round(score / 20)}
                    style={{ fontSize: 14 }}
                  />
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 个性化建议 */}
      <Card title="个性化训练建议" style={{ marginBottom: 24 }}>
        <List
          dataSource={getRecommendations(result.dimensionScores)}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: item.type === 'improvement' ? '#faad14' : 
                                 item.type === 'strength' ? '#52c41a' : '#f5222d',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}
                  >
                    {item.type === 'improvement' ? <ArrowUpOutlined /> :
                     item.type === 'strength' ? <StarOutlined /> : <FireOutlined />}
                  </div>
                }
                title={<Text strong>{item.skill}</Text>}
                description={item.description}
              />
              <Button type="link">{item.action}</Button>
            </List.Item>
          )}
        />
      </Card>

      {/* 成绩解析 */}
      <Card title="成绩解析" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Alert
              message={`你的水平：${rank}`}
              description={
                <div>
                  <Paragraph>
                    你的总分为 {result.totalScore} 分，在所有测试者中排名前{' '}
                    {result.totalScore >= 85 ? '5%' : 
                     result.totalScore >= 75 ? '15%' : 
                     result.totalScore >= 65 ? '35%' : '65%'}。
                  </Paragraph>
                  <Paragraph>
                    {result.totalScore >= 80 ? '你已经具备了高级玩家的水平！' :
                     result.totalScore >= 70 ? '你的基础很扎实，继续加油！' :
                     result.totalScore >= 60 ? '还需要更多练习来提升水平。' :
                     '建议从基础知识开始学习。'}
                  </Paragraph>
                </div>
              }
              type={result.totalScore >= 75 ? 'success' : 
                   result.totalScore >= 60 ? 'info' : 'warning'}
              showIcon
            />
          </Col>
          <Col xs={24} md={12}>
            <Alert
              message="下一步训练建议"
              description={
                <ul>
                  <li>针对弱项进行专项训练</li>
                  <li>多练习实战场景模拟</li>
                  <li>学习GTO基础理论</li>
                  <li>定期重测验证进步</li>
                </ul>
              }
              type="info"
              showIcon
            />
          </Col>
        </Row>
      </Card>

      {/* 操作按钮 */}
      <Card>
        <Row gutter={[16, 16]} justify="center">
          <Col xs={24} sm={8} md={6}>
            <Button
              type="primary"
              size="large"
              block
              icon={<ReloadOutlined />}
              onClick={() => router.push('/skill-test')}
            >
              重新测试
            </Button>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Button
              size="large"
              block
              icon={<BookOutlined />}
              onClick={() => router.push('/gto-training')}
            >
              开始训练
            </Button>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Button
              size="large"
              block
              icon={<BarChartOutlined />}
              onClick={() => router.push('/analytics')}
            >
              查看分析
            </Button>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Button
              size="large"
              block
              icon={<HomeOutlined />}
              onClick={() => router.push('/dashboard')}
            >
              返回首页
            </Button>
          </Col>
        </Row>
      </Card>
      </div>
    </AppLayout>
  );
}