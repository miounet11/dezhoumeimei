'use client';

import { useState } from 'react';
import { Card, Row, Col, Button, Space, Tag, List, Modal, message, Divider, Badge, Statistic } from 'antd';
import {
  CrownOutlined,
  CheckCircleOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  StarOutlined,
  GiftOutlined,
  SafetyOutlined,
  CustomerServiceOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import AppLayout from '@/src/components/layout/AppLayout';

const { confirm } = Modal;

export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const plans = [
    {
      id: 'free',
      name: '免费版',
      price: 0,
      period: '永久',
      badge: '基础',
      badgeColor: 'default',
      features: [
        { text: '每日5局免费游戏', included: true },
        { text: '基础AI对手（3种）', included: true },
        { text: '基础数据分析', included: true },
        { text: '成就系统', included: true },
        { text: '社区访问', included: true },
        { text: '高级AI对手', included: false },
        { text: 'GTO策略分析', included: false },
        { text: '无限游戏局数', included: false },
        { text: '专属陪伴', included: false },
        { text: '优先匹配', included: false }
      ]
    },
    {
      id: 'pro',
      name: '专业版',
      price: 68,
      originalPrice: 100,
      period: '/月',
      badge: '最受欢迎',
      badgeColor: 'red',
      features: [
        { text: '无限游戏局数', included: true },
        { text: '全部15种AI对手', included: true },
        { text: '完整GTO策略分析', included: true },
        { text: '高级数据分析', included: true },
        { text: '专属陪伴（3个）', included: true },
        { text: '优先匹配', included: true },
        { text: '每月赠送1000筹码', included: true },
        { text: '专属客服', included: true },
        { text: '去除广告', included: true },
        { text: 'API访问', included: false }
      ],
      discount: '限时优惠'
    },
    {
      id: 'ultimate',
      name: '至尊版',
      price: 198,
      originalPrice: 298,
      period: '/月',
      badge: 'VIP',
      badgeColor: 'gold',
      features: [
        { text: '专业版全部功能', included: true },
        { text: '无限专属陪伴', included: true },
        { text: 'API完全访问', included: true },
        { text: '1对1专业指导', included: true },
        { text: '每月赠送5000筹码', included: true },
        { text: '独家锦标赛资格', included: true },
        { text: '自定义AI训练', included: true },
        { text: '数据导出功能', included: true },
        { text: '优先新功能体验', included: true },
        { text: '终身会员资格', included: true }
      ],
      discount: '限量发售'
    }
  ];

  const benefits = [
    { icon: <RocketOutlined />, title: '即时生效', desc: '购买后立即解锁所有功能' },
    { icon: <SafetyOutlined />, title: '安全支付', desc: '支持支付宝、微信等主流支付' },
    { icon: <CustomerServiceOutlined />, title: '7天退款', desc: '不满意7天内无理由退款' },
    { icon: <GiftOutlined />, title: '赠送筹码', desc: '订阅即送额外游戏筹码' }
  ];

  const handleSubscribe = (planId: string) => {
    confirm({
      title: '确认订阅',
      content: `您确定要订阅${plans.find(p => p.id === planId)?.name}吗？`,
      icon: <CrownOutlined />,
      okText: '确认支付',
      cancelText: '取消',
      onOk: async () => {
        setLoading(true);
        // 模拟支付过程
        setTimeout(() => {
          setLoading(false);
          message.success('订阅成功！已解锁所有高级功能');
          setSelectedPlan(planId);
        }, 2000);
      }
    });
  };

  return (
    <AppLayout>
      <div style={{ padding: '24px' }}>
      {/* 页面标题 */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{ fontSize: 32, marginBottom: 16 }}>
          <CrownOutlined style={{ color: '#faad14', marginRight: 12 }} />
          选择您的订阅计划
        </h1>
        <p style={{ fontSize: 16, color: '#666' }}>
          解锁全部功能，成为德州扑克大师
        </p>
      </div>

      {/* 订阅计划 */}
      <Row gutter={24} justify="center">
        {plans.map((plan) => (
          <Col xs={24} md={8} key={plan.id}>
            <Card
              hoverable
              style={{
                height: '100%',
                position: 'relative',
                border: selectedPlan === plan.id ? '2px solid #722ed1' : undefined
              }}
            >
              {plan.badge && (
                <Badge.Ribbon text={plan.badge} color={plan.badgeColor}>
                  <div style={{ padding: '24px 24px 0' }}>
                    <div style={{ textAlign: 'center' }}>
                      <h2 style={{ fontSize: 24, marginBottom: 8 }}>{plan.name}</h2>
                      {plan.discount && (
                        <Tag color="red" style={{ marginBottom: 16 }}>{plan.discount}</Tag>
                      )}
                      <div style={{ marginBottom: 24 }}>
                        {plan.originalPrice && (
                          <span style={{ 
                            textDecoration: 'line-through', 
                            color: '#999',
                            marginRight: 8
                          }}>
                            ¥{plan.originalPrice}
                          </span>
                        )}
                        <span style={{ fontSize: 36, fontWeight: 'bold', color: '#722ed1' }}>
                          ¥{plan.price}
                        </span>
                        <span style={{ color: '#666' }}>{plan.period}</span>
                      </div>
                    </div>

                    <List
                      dataSource={plan.features}
                      renderItem={(item) => (
                        <List.Item style={{ 
                          border: 'none', 
                          padding: '8px 0',
                          color: item.included ? '#333' : '#ccc'
                        }}>
                          {item.included ? (
                            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                          ) : (
                            <CloseCircleOutlined style={{ color: '#ccc', marginRight: 8 }} />
                          )}
                          <span style={{ 
                            textDecoration: item.included ? 'none' : 'line-through'
                          }}>
                            {item.text}
                          </span>
                        </List.Item>
                      )}
                    />

                    <Button
                      type={plan.id === 'pro' ? 'primary' : 'default'}
                      size="large"
                      block
                      loading={loading && selectedPlan === plan.id}
                      onClick={() => handleSubscribe(plan.id)}
                      style={{ marginTop: 24 }}
                    >
                      {plan.price === 0 ? '当前计划' : '立即订阅'}
                    </Button>
                  </div>
                </Badge.Ribbon>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      {/* 订阅优势 */}
      <Divider />
      <div style={{ marginTop: 48 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 32 }}>订阅优势</h2>
        <Row gutter={[24, 24]}>
          {benefits.map((benefit, index) => (
            <Col xs={12} md={6} key={index}>
              <Card style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, color: '#722ed1', marginBottom: 16 }}>
                  {benefit.icon}
                </div>
                <h3>{benefit.title}</h3>
                <p style={{ color: '#666', margin: 0 }}>{benefit.desc}</p>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* 当前订阅状态 */}
      <Card style={{ marginTop: 48 }}>
        <Row align="middle">
          <Col flex="1">
            <Space direction="vertical">
              <h3>当前订阅状态</h3>
              <Space>
                <Tag color="blue">免费版</Tag>
                <span>剩余游戏次数：3/5</span>
              </Space>
            </Space>
          </Col>
          <Col>
            <Space>
              <Statistic 
                title="累计节省" 
                value={1280} 
                prefix="¥"
                valueStyle={{ color: '#cf1322' }}
              />
              <Divider type="vertical" style={{ height: 40 }} />
              <Statistic 
                title="会员天数" 
                value={0}
                suffix="天"
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* FAQ */}
      <Card title="常见问题" style={{ marginTop: 24 }}>
        <List
          dataSource={[
            { q: '如何取消订阅？', a: '在设置-订阅管理中可以随时取消订阅' },
            { q: '支持哪些支付方式？', a: '支持支付宝、微信支付、信用卡等' },
            { q: '订阅后可以退款吗？', a: '7天内无理由退款，超过7天不支持退款' },
            { q: '如何升级订阅计划？', a: '可以随时升级，差价按日计算' }
          ]}
          renderItem={item => (
            <List.Item>
              <List.Item.Meta
                title={<span style={{ fontWeight: 'bold' }}>{item.q}</span>}
                description={item.a}
              />
            </List.Item>
          )}
        />
      </Card>
      </div>
    </AppLayout>
  );
}