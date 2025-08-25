'use client';

import { useState } from 'react';
import { Card, Tabs, Row, Col, Statistic, Progress, Tag, Select, DatePicker, Button, Space, List, Avatar, Alert, Tooltip, Badge, Divider, Table } from 'antd';
import {
  BulbOutlined,
  RadarChartOutlined,
  BugOutlined,
  RobotOutlined,
  LineChartOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
  ExperimentOutlined,
  FundProjectionScreenOutlined,
  AimOutlined,
  SafetyCertificateOutlined,
  FileSearchOutlined,
  SolutionOutlined
} from '@ant-design/icons';
import {
  LineChart, Line, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, 
  Legend, ResponsiveContainer, ScatterChart, Scatter, Cell, PieChart, Pie
} from 'recharts';
import AppLayout from '@/src/components/layout/AppLayout';

const { RangePicker } = DatePicker;

export default function AdvancedAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('ai-suggestions');
  const [selectedOpponent, setSelectedOpponent] = useState('all');

  // AI决策建议数据
  const aiSuggestions = [
    {
      id: 1,
      situation: '翻前加注位置',
      current: '您在CO位置的开池范围过紧',
      suggestion: '建议扩大到28-30%的手牌范围',
      impact: '+2.3 BB/100',
      confidence: 92,
      priority: 'high'
    },
    {
      id: 2,
      situation: '河牌诈唬频率',
      current: '诈唬频率仅为15%，远低于GTO建议',
      suggestion: '提高到25-30%的诈唬频率',
      impact: '+1.8 BB/100',
      confidence: 88,
      priority: 'high'
    },
    {
      id: 3,
      situation: '3-bet防守',
      current: '面对3-bet的弃牌率过高(75%)',
      suggestion: '增加4-bet诈唬和跟注范围',
      impact: '+1.5 BB/100',
      confidence: 85,
      priority: 'medium'
    },
    {
      id: 4,
      situation: '转牌过牌-加注',
      current: '过牌-加注使用不足',
      suggestion: '在湿润牌面增加过牌-加注频率',
      impact: '+0.8 BB/100',
      confidence: 78,
      priority: 'low'
    }
  ];

  // 对手分析数据
  const opponentProfiles = [
    {
      name: '激进鲨鱼',
      avatar: '🦈',
      style: 'LAG',
      vpip: 32,
      pfr: 28,
      af: 4.2,
      weakness: '河牌过度诈唬',
      exploit: '用强牌抓诈唬',
      winRate: 45,
      danger: 'high'
    },
    {
      name: '岩石玩家',
      avatar: '🗿',
      style: 'NIT',
      vpip: 18,
      pfr: 12,
      af: 1.5,
      weakness: '范围过紧',
      exploit: '频繁偷盲',
      winRate: 62,
      danger: 'low'
    },
    {
      name: '跟注站',
      avatar: '📞',
      style: 'Calling Station',
      vpip: 45,
      pfr: 8,
      af: 0.8,
      weakness: '被动过度',
      exploit: '价值下注',
      winRate: 38,
      danger: 'medium'
    }
  ];

  // 漏洞检测数据
  const leakDetection = [
    {
      category: '翻前漏洞',
      leaks: [
        { name: 'UTG开池过松', severity: 'high', frequency: '35%', fix: '收紧到15%范围' },
        { name: 'SB防守不足', severity: 'medium', frequency: '28%', fix: '增加3-bet频率' },
        { name: '按钮位偷盲不足', severity: 'low', frequency: '18%', fix: '扩大偷盲范围' }
      ]
    },
    {
      category: '翻后漏洞',
      leaks: [
        { name: 'C-bet频率过高', severity: 'high', frequency: '42%', fix: '选择性持续下注' },
        { name: '转牌放弃过多', severity: 'medium', frequency: '31%', fix: '增加第二枪频率' },
        { name: '河牌跟注过松', severity: 'high', frequency: '38%', fix: '收紧跟注范围' }
      ]
    }
  ];

  // 决策树数据
  const decisionTreeData = [
    { node: '翻前', optimal: 85, actual: 72 },
    { node: '翻牌', optimal: 78, actual: 65 },
    { node: '转牌', optimal: 75, actual: 58 },
    { node: '河牌', optimal: 82, actual: 61 },
    { node: '摊牌', optimal: 70, actual: 55 }
  ];

  // 盈亏分析数据
  const profitAnalysis = [
    { position: 'BTN', profit: 12.5, hands: 3420 },
    { position: 'CO', profit: 8.2, hands: 2890 },
    { position: 'MP', profit: 4.5, hands: 2560 },
    { position: 'UTG', profit: 2.1, hands: 1890 },
    { position: 'SB', profit: -3.2, hands: 2100 },
    { position: 'BB', profit: -5.8, hands: 2200 }
  ];

  // 手牌强度分析
  const handStrengthData = [
    { range: 'AA-QQ', winRate: 82, ev: 4.5 },
    { range: 'AK-AQ', winRate: 65, ev: 2.1 },
    { range: 'JJ-99', winRate: 58, ev: 1.2 },
    { range: '88-66', winRate: 52, ev: 0.3 },
    { range: 'Suited Connectors', winRate: 48, ev: -0.2 },
    { range: 'Others', winRate: 42, ev: -0.8 }
  ];

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'high': return '#ff4d4f';
      case 'medium': return '#faad14';
      case 'low': return '#52c41a';
      default: return '#666';
    }
  };

  const getDangerColor = (danger: string) => {
    switch(danger) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'default';
    }
  };

  const tabItems = [
    {
      key: 'ai-suggestions',
      label: (
        <span>
          <BulbOutlined />
          AI决策建议
        </span>
      ),
      children: (
        <div>
          <Alert
            message="AI分析基于您最近1000手牌的数据"
            description="以下建议可帮助您提升约5.8 BB/100的盈利率"
            type="info"
            showIcon
            icon={<RobotOutlined />}
            style={{ marginBottom: 24 }}
          />

          <Row gutter={[16, 16]}>
            {aiSuggestions.map(suggestion => (
              <Col xs={24} lg={12} key={suggestion.id}>
                <Card
                  title={
                    <Space>
                      <Badge status={
                        suggestion.priority === 'high' ? 'error' : 
                        suggestion.priority === 'medium' ? 'warning' : 'success'
                      } />
                      {suggestion.situation}
                    </Space>
                  }
                  extra={
                    <Tag color={
                      suggestion.priority === 'high' ? 'red' : 
                      suggestion.priority === 'medium' ? 'orange' : 'green'
                    }>
                      {suggestion.priority === 'high' ? '高优先级' : 
                       suggestion.priority === 'medium' ? '中优先级' : '低优先级'}
                    </Tag>
                  }
                >
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ color: '#666', marginBottom: 8 }}>
                      <WarningOutlined style={{ marginRight: 8, color: '#faad14' }} />
                      当前问题
                    </div>
                    <div>{suggestion.current}</div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ color: '#666', marginBottom: 8 }}>
                      <CheckCircleOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                      改进建议
                    </div>
                    <div style={{ fontWeight: 'bold' }}>{suggestion.suggestion}</div>
                  </div>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="预期收益"
                        value={suggestion.impact}
                        valueStyle={{ color: '#52c41a', fontSize: 20 }}
                      />
                    </Col>
                    <Col span={12}>
                      <div>
                        <div style={{ color: '#666', marginBottom: 4 }}>置信度</div>
                        <Progress 
                          percent={suggestion.confidence} 
                          strokeColor="#722ed1"
                          format={percent => `${percent}%`}
                        />
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Col>
            ))}
          </Row>

          <Card title="决策准确度趋势" style={{ marginTop: 24 }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={decisionTreeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="node" />
                <YAxis />
                <ChartTooltip />
                <Legend />
                <Line type="monotone" dataKey="optimal" stroke="#52c41a" name="GTO最优" strokeWidth={2} />
                <Line type="monotone" dataKey="actual" stroke="#722ed1" name="实际表现" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      ),
    },
    {
      key: 'opponent-analysis',
      label: (
        <span>
          <RadarChartOutlined />
          对手分析
        </span>
      ),
      children: (
        <div>
          <Row gutter={[16, 16]}>
            {opponentProfiles.map((opponent, index) => (
              <Col xs={24} md={8} key={index}>
                <Card>
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <Avatar size={64} style={{ fontSize: 32 }}>
                      {opponent.avatar}
                    </Avatar>
                    <h3 style={{ marginTop: 8 }}>{opponent.name}</h3>
                    <Space>
                      <Tag color="blue">{opponent.style}</Tag>
                      <Tag color={getDangerColor(opponent.danger)}>
                        威胁等级: {
                          opponent.danger === 'high' ? '高' :
                          opponent.danger === 'medium' ? '中' : '低'
                        }
                      </Tag>
                    </Space>
                  </div>

                  <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
                    <Col span={8}>
                      <Statistic title="VPIP" value={opponent.vpip} suffix="%" />
                    </Col>
                    <Col span={8}>
                      <Statistic title="PFR" value={opponent.pfr} suffix="%" />
                    </Col>
                    <Col span={8}>
                      <Statistic title="AF" value={opponent.af} />
                    </Col>
                  </Row>

                  <Divider />

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ color: '#666', marginBottom: 4 }}>
                      <BugOutlined /> 主要弱点
                    </div>
                    <Tag color="red">{opponent.weakness}</Tag>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ color: '#666', marginBottom: 4 }}>
                      <AimOutlined /> 利用策略
                    </div>
                    <Tag color="green">{opponent.exploit}</Tag>
                  </div>

                  <div>
                    <div style={{ color: '#666', marginBottom: 4 }}>对战胜率</div>
                    <Progress 
                      percent={opponent.winRate} 
                      strokeColor={opponent.winRate >= 50 ? '#52c41a' : '#ff4d4f'}
                    />
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          <Card title="对手风格分布" style={{ marginTop: 24 }}>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid />
                <XAxis dataKey="vpip" name="VPIP" unit="%" />
                <YAxis dataKey="pfr" name="PFR" unit="%" />
                <ChartTooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter 
                  name="对手" 
                  data={[
                    { vpip: 32, pfr: 28, name: '激进鲨鱼' },
                    { vpip: 18, pfr: 12, name: '岩石玩家' },
                    { vpip: 45, pfr: 8, name: '跟注站' },
                    { vpip: 25, pfr: 20, name: '标准玩家' }
                  ]} 
                  fill="#8884d8"
                >
                  {[0, 1, 2, 3].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#ff4d4f', '#52c41a', '#faad14', '#1890ff'][index]} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </Card>
        </div>
      ),
    },
    {
      key: 'leak-detection',
      label: (
        <span>
          <BugOutlined />
          漏洞检测
        </span>
      ),
      children: (
        <div>
          <Alert
            message="检测到12个需要改进的漏洞"
            description="修复这些漏洞预计可提升3.5 BB/100的盈利率"
            type="warning"
            showIcon
            style={{ marginBottom: 24 }}
          />

          {leakDetection.map(category => (
            <Card title={category.category} key={category.category} style={{ marginBottom: 16 }}>
              <List
                dataSource={category.leaks}
                renderItem={leak => (
                  <List.Item
                    actions={[
                      <Button type="link" icon={<SolutionOutlined />}>
                        查看解决方案
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Badge 
                          dot 
                          color={getSeverityColor(leak.severity)}
                          style={{ marginTop: 8 }}
                        />
                      }
                      title={
                        <Space>
                          <span>{leak.name}</span>
                          <Tag color={
                            leak.severity === 'high' ? 'red' :
                            leak.severity === 'medium' ? 'orange' : 'green'
                          }>
                            {leak.severity === 'high' ? '严重' :
                             leak.severity === 'medium' ? '中等' : '轻微'}
                          </Tag>
                        </Space>
                      }
                      description={
                        <Space direction="vertical">
                          <span>出现频率: {leak.frequency}</span>
                          <span style={{ color: '#52c41a' }}>
                            <CheckCircleOutlined /> 建议: {leak.fix}
                          </span>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          ))}

          <Card title="漏洞影响评估">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={[
                { subject: '翻前', A: 120, B: 85, fullMark: 150 },
                { subject: '翻牌', A: 98, B: 72, fullMark: 150 },
                { subject: '转牌', A: 86, B: 58, fullMark: 150 },
                { subject: '河牌', A: 99, B: 61, fullMark: 150 },
                { subject: '下注尺度', A: 105, B: 78, fullMark: 150 },
                { subject: '诈唬频率', A: 90, B: 45, fullMark: 150 }
              ]}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, 150]} />
                <Radar name="GTO标准" dataKey="A" stroke="#52c41a" fill="#52c41a" fillOpacity={0.3} />
                <Radar name="当前表现" dataKey="B" stroke="#722ed1" fill="#722ed1" fillOpacity={0.3} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      ),
    },
    {
      key: 'profit-analysis',
      label: (
        <span>
          <FundProjectionScreenOutlined />
          盈亏分析
        </span>
      ),
      children: (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="总盈利率"
                  value={8.5}
                  precision={1}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<ThunderboltOutlined />}
                  suffix="BB/100"
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="最佳位置"
                  value="BTN"
                  valueStyle={{ color: '#722ed1' }}
                  prefix={<SafetyCertificateOutlined />}
                  suffix="+12.5 BB/100"
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="改进空间"
                  value={5.8}
                  precision={1}
                  valueStyle={{ color: '#faad14' }}
                  prefix={<ExperimentOutlined />}
                  suffix="BB/100"
                />
              </Card>
            </Col>
          </Row>

          <Card title="位置盈亏分析">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={profitAnalysis}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="position" />
                <YAxis />
                <ChartTooltip />
                <Bar dataKey="profit" fill="#722ed1">
                  {profitAnalysis.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.profit > 0 ? '#52c41a' : '#ff4d4f'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="手牌强度EV分析" style={{ marginTop: 24 }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={handStrengthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <ChartTooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="winRate" stroke="#722ed1" name="胜率%" />
                <Line yAxisId="right" type="monotone" dataKey="ev" stroke="#52c41a" name="EV" />
              </LineChart>
            </ResponsiveContainer>
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
            <h1 style={{ margin: 0, fontSize: 24 }}>
              <ExperimentOutlined style={{ marginRight: 12 }} />
              高级分析中心
            </h1>
            <p style={{ margin: '8px 0 0', color: '#666' }}>
              AI驱动的深度数据分析与策略优化
            </p>
          </Col>
          <Col>
            <Space>
              <Select
                defaultValue="7d"
                style={{ width: 120 }}
                options={[
                  { value: '24h', label: '24小时' },
                  { value: '7d', label: '7天' },
                  { value: '30d', label: '30天' },
                  { value: 'all', label: '全部' }
                ]}
              />
              <Button type="primary" icon={<FileSearchOutlined />}>
                生成报告
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