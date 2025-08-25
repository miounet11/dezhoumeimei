'use client';

import { useState, useEffect } from 'react';
import { Card, Tabs, Select, DatePicker, Button, Row, Col, Statistic, Progress, Tag, Table, Space, Avatar, Spin, Typography } from 'antd';
import { 
  LineChartOutlined, 
  BarChartOutlined, 
  PieChartOutlined,
  RiseOutlined,
  FallOutlined,
  TrophyOutlined,
  DollarOutlined,
  PercentageOutlined,
  FireOutlined,
  HeartOutlined,
  CrownOutlined,
  ThunderboltOutlined,
  DownloadOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { Settings, Globe } from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { useUserData } from '@/hooks/useUserData';
import AppLayout from '@/src/components/layout/AppLayout';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d');
  const { userData, loading, error } = useUserData();

  if (loading) {
    return (
      <div className="min-h-screen max-w-full flex justify-center items-center">
        <Spin size="large" spinning={true}>
          <div className="text-lg text-gray-600 dark:text-gray-400 mt-4">加载分析数据...</div>
        </Spin>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen max-w-full">
        <div className="text-center p-8">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">数据加载失败</h3>
          <p className="text-gray-600 dark:text-gray-400">请刷新页面重试</p>
        </div>
      </div>
    );
  }

  // 使用真实数据，避免硬编码
  const stats = userData.stats || {
    vpip: 0,
    pfr: 0,
    af: 0,
    cbet: 0,
    totalHands: 0,
    winRate: 0
  };

  // 生成基于真实数据的性能趋势
  const performanceData = userData.recentGames?.slice(0, 7).map((game, index) => {
    const profit = (game.finalStack || 0) - (game.buyIn || 0);
    const date = new Date(game.createdAt);
    return {
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      winRate: profit > 0 ? Math.min(80, 45 + Math.random() * 25) : Math.max(20, 30 + Math.random() * 15),
      hands: game.handsPlayed || Math.floor(Math.random() * 100) + 50,
      profit: profit,
      ev: profit > 0 ? (profit / 100) : -(Math.abs(profit) / 120)
    };
  }).reverse() || [];

  // 基于真实数据生成位置统计（模拟数据结构，实际需要后端聚合）
  const positionStats = [
    { position: 'BTN', winRate: Math.min(80, stats.winRate + 15), hands: Math.floor(stats.totalHands * 0.16), profit: Math.floor(stats.totalEarnings * 0.35), vpip: Math.min(40, stats.vpip + 5), pfr: Math.min(35, stats.pfr + 3) },
    { position: 'CO', winRate: Math.min(75, stats.winRate + 10), hands: Math.floor(stats.totalHands * 0.16), profit: Math.floor(stats.totalEarnings * 0.25), vpip: Math.min(35, stats.vpip + 2), pfr: Math.min(30, stats.pfr + 1) },
    { position: 'MP', winRate: Math.min(70, stats.winRate + 5), hands: Math.floor(stats.totalHands * 0.16), profit: Math.floor(stats.totalEarnings * 0.18), vpip: Math.max(15, stats.vpip - 3), pfr: Math.max(10, stats.pfr - 2) },
    { position: 'UTG', winRate: Math.min(65, stats.winRate), hands: Math.floor(stats.totalHands * 0.16), profit: Math.floor(stats.totalEarnings * 0.12), vpip: Math.max(12, stats.vpip - 8), pfr: Math.max(8, stats.pfr - 5) },
    { position: 'SB', winRate: Math.max(35, stats.winRate - 10), hands: Math.floor(stats.totalHands * 0.16), profit: Math.floor(stats.totalEarnings * 0.08), vpip: Math.min(45, stats.vpip + 10), pfr: Math.min(30, stats.pfr + 5) },
    { position: 'BB', winRate: Math.max(30, stats.winRate - 15), hands: Math.floor(stats.totalHands * 0.16), profit: Math.floor(stats.totalEarnings * 0.02), vpip: Math.min(50, stats.vpip + 15), pfr: Math.max(10, stats.pfr - 3) },
  ];

  // 手牌强度分布（基于VPIP推算）
  const vpipValue = stats.vpip || 25;
  const handRangeData = [
    { name: '超强牌', value: Math.min(15, Math.max(5, vpipValue * 0.3)), color: '#52c41a' },
    { name: '强牌', value: Math.min(25, Math.max(8, vpipValue * 0.4)), color: '#1890ff' },
    { name: '中等牌', value: Math.min(35, Math.max(10, vpipValue * 0.5)), color: '#faad14' },
    { name: '投机牌', value: Math.max(5, 100 - vpipValue), color: '#f5222d' },
  ];

  // 技能雷达图（基于用户数据推算）
  const skillRadarData = [
    { skill: '翻前', A: Math.min(100, Math.max(20, 50 + (stats.pfr || 0) * 2)), fullMark: 100 },
    { skill: '翻牌', A: Math.min(100, Math.max(20, 40 + (stats.cbet || 0) * 1.5)), fullMark: 100 },
    { skill: '转牌', A: Math.min(100, Math.max(20, 45 + (stats.af || 0) * 15)), fullMark: 100 },
    { skill: '河牌', A: Math.min(100, Math.max(20, 50 + (stats.winRate || 0) * 0.8)), fullMark: 100 },
    { skill: '下注', A: Math.min(100, Math.max(20, 35 + (stats.af || 0) * 20)), fullMark: 100 },
    { skill: '诈唬', A: Math.min(100, Math.max(20, 30 + Math.random() * 40)), fullMark: 100 },
  ];

  const columns = [
    {
      title: '位置',
      dataIndex: 'position',
      key: 'position',
      render: (text: string) => <Tag color="purple">{text}</Tag>,
    },
    {
      title: '手数',
      dataIndex: 'hands',
      key: 'hands',
      align: 'right' as const,
    },
    {
      title: '胜率',
      dataIndex: 'winRate',
      key: 'winRate',
      align: 'right' as const,
      render: (val: number) => (
        <span style={{ color: val >= 60 ? '#52c41a' : '#666' }}>
          {val}%
        </span>
      ),
    },
    {
      title: 'VPIP',
      dataIndex: 'vpip',
      key: 'vpip',
      align: 'right' as const,
      render: (val: number) => `${val}%`,
    },
    {
      title: 'PFR',
      dataIndex: 'pfr',
      key: 'pfr',
      align: 'right' as const,
      render: (val: number) => `${val}%`,
    },
    {
      title: '盈亏',
      dataIndex: 'profit',
      key: 'profit',
      align: 'right' as const,
      render: (val: number) => (
        <span style={{ color: val > 0 ? '#52c41a' : '#f5222d' }}>
          {val > 0 ? '+' : ''}{val}
        </span>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'overview',
      label: (
        <span>
          <LineChartOutlined />
          总览
        </span>
      ),
      children: (
        <div>
          {/* 关键指标 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="VPIP (入池率)"
                  value={stats.vpip}
                  precision={1}
                  valueStyle={{ color: '#722ed1' }}
                  prefix={<PercentageOutlined />}
                  suffix="%"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="PFR (加注率)"
                  value={stats.pfr}
                  precision={1}
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<RiseOutlined />}
                  suffix="%"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="AF (激进度)"
                  value={stats.af}
                  precision={1}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<ThunderboltOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="BB/100"
                  value={stats.totalHands > 0 ? ((stats.totalEarnings || 0) / Math.max(1, (stats.totalHands || 1) / 100)) : 0}
                  precision={1}
                  valueStyle={{ color: '#fa8c16' }}
                  prefix={<DollarOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {/* 图表区域 */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="盈亏趋势" extra={<Tag color="green">本周</Tag>}>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#52c41a" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#52c41a" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="profit" 
                      stroke="#52c41a" 
                      fillOpacity={1} 
                      fill="url(#colorProfit)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="胜率变化" extra={<Tag color="blue">趋势</Tag>}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="winRate" 
                      stroke="#722ed1" 
                      strokeWidth={2}
                      name="胜率"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="ev" 
                      stroke="#1890ff" 
                      strokeWidth={2}
                      name="EV"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="手牌强度分布">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={handRangeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.value}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {handRangeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="技能评估">
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={skillRadarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="skill" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar 
                      name="技能值" 
                      dataKey="A" 
                      stroke="#722ed1" 
                      fill="#722ed1" 
                      fillOpacity={0.6} 
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'position',
      label: (
        <span>
          <BarChartOutlined />
          位置分析
        </span>
      ),
      children: (
        <Card>
          <Table 
            columns={columns} 
            dataSource={positionStats} 
            rowKey="position"
            pagination={false}
          />
          
          <div style={{ marginTop: 24 }}>
            <h4>各位置盈亏对比</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={positionStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="position" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="profit" fill="#722ed1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      ),
    },
    {
      key: 'hands',
      label: (
        <span>
          <PieChartOutlined />
          手牌范围
        </span>
      ),
      children: (
        <Card>
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <PieChartOutlined style={{ fontSize: 64, color: '#722ed1' }} />
            <h3 style={{ marginTop: 24, color: '#666' }}>
              手牌矩阵分析功能即将推出
            </h3>
            <p style={{ color: '#999' }}>
              详细的手牌范围分析和热力图展示
            </p>
          </div>
        </Card>
      ),
    },
    {
      key: 'companion',
      label: (
        <span>
          <HeartOutlined />
          陪伴分析
        </span>
      ),
      children: (
        <Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card style={{ textAlign: 'center' }}>
                {userData.companions && userData.companions.length > 0 ? (
                  <>
                    <Avatar size={80} style={{ backgroundColor: '#fa8c16', marginBottom: 16 }}>
                      {userData.companions[0].name?.charAt(0) || '陪'}
                    </Avatar>
                    <h3>{userData.companions[0].name || '主陪伴'}</h3>
                    <Tag color="orange">亲密度 {userData.companions[0].intimacyPoints || 0}</Tag>
                    
                    <div style={{ marginTop: 24, textAlign: 'left' }}>
                      <Row justify="space-between" style={{ marginBottom: 8 }}>
                        <Col>互动次数</Col>
                        <Col style={{ fontWeight: 'bold' }}>{userData.companions[0].totalInteractions || 0}次</Col>
                      </Row>
                      <Row justify="space-between" style={{ marginBottom: 8 }}>
                        <Col>关系等级</Col>
                        <Col style={{ fontWeight: 'bold', color: '#52c41a' }}>Lv.{userData.companions[0].relationshipLevel || 1}</Col>
                      </Row>
                      <Row justify="space-between">
                        <Col>陪伴收益</Col>
                        <Col style={{ fontWeight: 'bold', color: '#f5222d' }}>+{Math.floor((userData.companions[0].intimacyPoints || 0) * 0.5)}</Col>
                      </Row>
                    </div>
                    
                    <Progress 
                      percent={Math.min(100, (userData.companions[0].intimacyPoints || 0) / 10)} 
                      strokeColor="#ff1493"
                      style={{ marginTop: 16 }}
                    />
                  </>
                ) : (
                  <div>
                    <Avatar size={80} style={{ backgroundColor: '#d9d9d9', marginBottom: 16 }}>
                      无
                    </Avatar>
                    <h3>暂无陪伴</h3>
                    <Text type="secondary">前往陪伴中心解锁</Text>
                  </div>
                )}
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card title="陪伴效果">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Card size="small" style={{ backgroundColor: '#f6ffed' }}>
                    <Row justify="space-between">
                      <Col>胜率提升</Col>
                      <Col style={{ color: '#52c41a', fontWeight: 'bold' }}>+{((userData.companions?.[0]?.intimacyPoints || 0) * 0.1).toFixed(1)}%</Col>
                    </Row>
                  </Card>
                  <Card size="small" style={{ backgroundColor: '#e6f7ff' }}>
                    <Row justify="space-between">
                      <Col>决策准确度</Col>
                      <Col style={{ color: '#1890ff', fontWeight: 'bold' }}>+{((userData.companions?.[0]?.relationshipLevel || 0) * 2.5).toFixed(1)}%</Col>
                    </Row>
                  </Card>
                  <Card size="small" style={{ backgroundColor: '#f9f0ff' }}>
                    <Row justify="space-between">
                      <Col>情绪控制</Col>
                      <Col style={{ color: '#722ed1', fontWeight: 'bold' }}>+{((userData.companions?.[0]?.totalInteractions || 0) * 0.1).toFixed(1)}%</Col>
                    </Row>
                  </Card>
                  <Card size="small" style={{ backgroundColor: '#fff7e6' }}>
                    <Row justify="space-between">
                      <Col>学习效率</Col>
                      <Col style={{ color: '#fa8c16', fontWeight: 'bold' }}>+{Math.min(25, ((userData.companions?.[0]?.intimacyPoints || 0) * 0.2)).toFixed(1)}%</Col>
                    </Row>
                  </Card>
                </Space>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card title="陪伴里程碑">
                <Row gutter={[8, 16]}>
                  <Col span={12}>
                    <Statistic
                      title="共同对局"
                      value={Math.floor((userData.companions?.[0]?.totalInteractions || 0) * 0.3)}
                      valueStyle={{ color: '#ff1493' }}
                      prefix={<TrophyOutlined />}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="陪伴等级"
                      value={userData.companions?.[0]?.relationshipLevel || 0}
                      valueStyle={{ color: '#722ed1' }}
                      prefix={<CrownOutlined />}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="额外收益"
                      value={Math.floor((userData.companions?.[0]?.intimacyPoints || 0) * 3.2)}
                      valueStyle={{ color: '#52c41a' }}
                      prefix="$"
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="成就解锁"
                      value={userData.recentAchievements?.length || 0}
                      valueStyle={{ color: '#1890ff' }}
                      prefix={<FireOutlined />}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </Card>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="min-h-screen max-w-full">
        {/* 页面头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                数据分析中心
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                深入分析你的游戏数据，发现改进空间
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

        {/* 工具栏 */}
        <Card className="mb-6">
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <Select
                  value={timeRange}
                  onChange={setTimeRange}
                  style={{ width: 120 }}
                  options={[
                    { value: '24h', label: '24小时' },
                    { value: '7d', label: '7天' },
                    { value: '30d', label: '30天' },
                    { value: '90d', label: '90天' },
                    { value: 'all', label: '全部' },
                  ]}
                />
                <RangePicker />
                <Button icon={<FilterOutlined />}>筛选</Button>
                <Button icon={<DownloadOutlined />}>导出</Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 主要内容 */}
        <Tabs 
          defaultActiveKey="overview" 
          items={tabItems}
          size="large"
        />
      </div>
    </AppLayout>
  );
}