'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Row, Col, Typography, Space, Carousel, Tag } from 'antd';
import { 
  PlayCircleOutlined, 
  TrophyOutlined, 
  RocketOutlined,
  TeamOutlined,
  LineChartOutlined,
  HeartOutlined,
  StarOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import Image from 'next/image';

const { Title, Paragraph, Text } = Typography;

export default function HomePage() {
  const router = useRouter();

  // 检查用户是否已登录
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // 如果已登录，直接跳转到控制台
      router.push('/dashboard');
    }
  }, [router]);

  const features = [
    {
      icon: <RocketOutlined style={{ fontSize: 48 }} />,
      title: 'AI智能训练',
      description: '15种AI对手风格，从初学者到专业级别',
      color: '#722ed1'
    },
    {
      icon: <TrophyOutlined style={{ fontSize: 48 }} />,
      title: 'GTO策略学习',
      description: '基于博弈论最优策略的专业训练',
      color: '#13c2c2'
    },
    {
      icon: <LineChartOutlined style={{ fontSize: 48 }} />,
      title: '数据分析',
      description: '详细的游戏数据分析和进步追踪',
      color: '#52c41a'
    },
    {
      icon: <HeartOutlined style={{ fontSize: 48 }} />,
      title: '虚拟陪伴',
      description: '培养专属AI陪伴，享受养成乐趣',
      color: '#eb2f96'
    }
  ];

  const achievements = [
    { name: '新手上路', rarity: 'common', progress: 100 },
    { name: '小有成就', rarity: 'rare', progress: 75 },
    { name: '扑克大师', rarity: 'epic', progress: 45 },
    { name: '传奇玩家', rarity: 'legendary', progress: 20 }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* 导航栏 */}
      <div style={{ 
        background: 'rgba(255, 255, 255, 0.1)', 
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <Row justify="space-between" align="middle" style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px' }}>
          <Col>
            <Title level={3} style={{ margin: 0, color: 'white' }}>
              🎰 PokerIQ Pro
            </Title>
          </Col>
          <Col>
            <Space size="large">
              <Button type="link" style={{ color: 'white' }} onClick={() => router.push('/auth/login')}>
                登录
              </Button>
              <Button type="primary" ghost onClick={() => router.push('/auth/register')}>
                注册
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Hero Section */}
      <div style={{ textAlign: 'center', padding: '80px 24px', color: 'white' }}>
        <Title style={{ color: 'white', fontSize: 48, marginBottom: 24 }}>
          AI驱动的德州扑克训练平台
        </Title>
        <Paragraph style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 20, maxWidth: 600, margin: '0 auto 40px' }}>
          通过先进的AI技术和GTO策略，提升你的扑克技能
          <br />
          超长期成就体系，100天到10年的进阶之路
        </Paragraph>
        <Space size="large">
          <Button 
            type="primary" 
            size="large" 
            icon={<PlayCircleOutlined />}
            onClick={() => router.push('/auth/register')}
            style={{ minWidth: 150 }}
          >
            立即开始
          </Button>
          <Button 
            size="large" 
            ghost
            style={{ color: 'white', borderColor: 'white' }}
            onClick={() => router.push('/auth/login')}
          >
            我有账号
          </Button>
        </Space>
      </div>

      {/* 特性介绍 */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
        <Title level={2} style={{ textAlign: 'center', color: 'white', marginBottom: 48 }}>
          核心功能
        </Title>
        <Row gutter={[24, 24]}>
          {features.map((feature, index) => (
            <Col xs={24} sm={12} md={6} key={index}>
              <Card 
                hoverable
                style={{ 
                  height: '100%', 
                  background: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: 12,
                  border: 'none'
                }}
              >
                <div style={{ textAlign: 'center', marginBottom: 16, color: feature.color }}>
                  {feature.icon}
                </div>
                <Title level={4} style={{ textAlign: 'center', marginBottom: 12 }}>
                  {feature.title}
                </Title>
                <Paragraph style={{ textAlign: 'center', color: '#666', margin: 0 }}>
                  {feature.description}
                </Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* AI对手展示 */}
      <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '80px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <Title level={2} style={{ textAlign: 'center', color: 'white', marginBottom: 48 }}>
            15种AI对手风格
          </Title>
          <Row gutter={[16, 16]} justify="center">
            {['激进型', '保守型', 'GTO型', '诈唬型', '紧凶型'].map((style, index) => (
              <Col key={index}>
                <Tag 
                  color={['volcano', 'blue', 'purple', 'orange', 'green'][index]}
                  style={{ padding: '8px 16px', fontSize: 16 }}
                >
                  {style}
                </Tag>
              </Col>
            ))}
          </Row>
          <Paragraph style={{ 
            textAlign: 'center', 
            color: 'rgba(255, 255, 255, 0.9)', 
            marginTop: 24,
            fontSize: 16 
          }}>
            从新手到专业级别，每种风格都经过精心调教
          </Paragraph>
        </div>
      </div>

      {/* 成就系统预览 */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px' }}>
        <Title level={2} style={{ textAlign: 'center', color: 'white', marginBottom: 48 }}>
          超长期成就体系
        </Title>
        <Row gutter={[24, 24]}>
          {achievements.map((achievement, index) => (
            <Col xs={24} sm={12} md={6} key={index}>
              <Card style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none' }}>
                <div style={{ textAlign: 'center' }}>
                  <StarOutlined style={{ 
                    fontSize: 32, 
                    color: achievement.rarity === 'legendary' ? '#ff6b6b' :
                           achievement.rarity === 'epic' ? '#9c36b5' :
                           achievement.rarity === 'rare' ? '#1890ff' : '#52c41a',
                    marginBottom: 12
                  }} />
                  <Title level={5} style={{ color: 'white', marginBottom: 8 }}>
                    {achievement.name}
                  </Title>
                  <div style={{ 
                    height: 4, 
                    background: 'rgba(255, 255, 255, 0.2)', 
                    borderRadius: 2,
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: `${achievement.progress}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                      transition: 'width 0.3s'
                    }} />
                  </div>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 12, marginTop: 8, display: 'block' }}>
                    {achievement.progress}% 完成
                  </Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
        <Paragraph style={{ 
          textAlign: 'center', 
          color: 'rgba(255, 255, 255, 0.9)', 
          marginTop: 32,
          fontSize: 16 
        }}>
          从100天新手到10年大师，见证你的扑克成长之路
        </Paragraph>
      </div>

      {/* CTA Section */}
      <div style={{ 
        background: 'rgba(0, 0, 0, 0.3)', 
        padding: '60px 24px',
        textAlign: 'center'
      }}>
        <Title level={2} style={{ color: 'white', marginBottom: 24 }}>
          准备好提升你的扑克技能了吗？
        </Title>
        <Paragraph style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 18, marginBottom: 32 }}>
          加入数千名玩家，开始你的专业扑克训练之旅
        </Paragraph>
        <Button 
          type="primary" 
          size="large"
          icon={<ThunderboltOutlined />}
          onClick={() => router.push('/auth/register')}
          style={{ minWidth: 200, height: 48, fontSize: 18 }}
        >
          免费开始训练
        </Button>
      </div>

      {/* Footer */}
      <div style={{ 
        background: 'rgba(0, 0, 0, 0.4)', 
        padding: '24px',
        textAlign: 'center',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          © 2024 PokerIQ Pro. All rights reserved.
        </Text>
      </div>
    </div>
  );
}