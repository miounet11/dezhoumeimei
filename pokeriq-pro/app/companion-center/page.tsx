'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Button, Avatar, Badge, Progress, Tabs, Spin, Modal, Select, Tag, Tooltip, Statistic } from 'antd';
import {
  HeartOutlined,
  CrownOutlined,
  ShoppingOutlined,
  SettingOutlined,
  HomeOutlined,
  AudioOutlined,
  GiftOutlined,
  EyeOutlined,
  ThunderboltOutlined,
  StarOutlined,
  DollarOutlined,
  ShopOutlined,
  UserOutlined,
  TeamOutlined,
  TrophyOutlined,
  FireOutlined,
  CoffeeOutlined
} from '@ant-design/icons';
import Advanced3DViewer from '@/components/companion/Advanced3DViewer';
import EquipmentManager from '@/components/companion/EquipmentManager';
import TavernInteractionSystem from '@/components/companion/TavernInteractionSystem';
import AppLayout from '@/src/components/layout/AppLayout';
import Link from 'next/link';
import { Settings, Globe } from 'lucide-react';

const { Option } = Select;

export default function CompanionCenterPage() {
  const [selectedCompanion, setSelectedCompanion] = useState({
    id: 'vivian',
    name: 'Vivian',
    nameLocalized: { zh: '薇薇安', en: 'Vivian' },
    personality: 'professional',
    level: 45,
    intimacy: 68,
    currentMood: 'happy',
    energy: 85,
    color: '#722ed1'
  });

  const [activeTab, setActiveTab] = useState('center');
  const [userWisdomCoins, setUserWisdomCoins] = useState(2580);
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [companionStats, setCompanionStats] = useState({
    totalOwned: 6,
    sTierCount: 2,
    maxIntimacy: 88,
    collectionProgress: 85
  });

  // 我的陪伴列表
  const myCompanions = [
    { id: 'sakura', nameLocalized: { zh: '樱花' }, level: 32, intimacy: 45, status: 'active', color: '#ff85c0' },
    { id: 'vivian', nameLocalized: { zh: '薇薇安' }, level: 45, intimacy: 68, status: 'active', color: '#722ed1' },
    { id: 'jessica', nameLocalized: { zh: '杰西卡' }, level: 28, intimacy: 35, status: 'active', color: '#faad14' },
    { id: 'sophia', nameLocalized: { zh: '索菲亚' }, level: 52, intimacy: 78, status: 'active', color: '#13c2c2' },
    { id: 'luna', nameLocalized: { zh: '露娜' }, level: 38, intimacy: 55, status: 'active', color: '#eb2f96' },
    { id: 'natasha', nameLocalized: { zh: '娜塔莎' }, level: 60, intimacy: 88, status: 'active', color: '#f5222d' }
  ];

  // 开始互动函数
  const handleStartInteraction = async () => {
    try {
      // 直接打开酒馆互动标签页
      setActiveTab('tavern');
      
      // 可选：显示欢迎消息
      Modal.success({
        title: '欢迎来到酒馆！',
        content: `准备与${selectedCompanion.nameLocalized?.zh}开始互动吧！`,
      });
    } catch (error) {
      console.error('启动互动失败:', error);
      Modal.error({
        title: '互动启动失败',
        content: '请稍后再试',
      });
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen max-w-full">
        {/* 页面头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                陪伴中心
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                与你的AI陪伴互动，建立深层连接
              </p>
            </div>
            
            {/* 控制按钮 */}
            <div className="flex items-center space-x-4">
              <button
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Globe className="w-5 h-5" />
                <span className="font-medium">中文</span>
              </button>
              
              <button className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">💝 陪伴中心</h1>
              <p className="text-gray-600 mt-1">与您的AI陪伴互动，培养深厚的情感纽带</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-lg font-medium">💎 智慧币: {userWisdomCoins.toLocaleString()}</div>
              <Button type="primary" icon={<ShoppingOutlined />} size="large">前往商城</Button>
            </div>
          </div>
        </div>
        {/* 统计概览卡片 */}
        <Row gutter={16} className="mb-8">
          <Col span={6}>
            <Card>
              <Statistic
                title="拥有陪伴"
                value={companionStats.totalOwned}
                prefix={<TeamOutlined />}
                suffix="位"
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="S级陪伴"
                value={companionStats.sTierCount}
                prefix={<CrownOutlined />}
                suffix="位"
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="最高亲密度"
                value={companionStats.maxIntimacy}
                prefix={<HeartOutlined />}
                suffix="/100"
                valueStyle={{ color: '#ff1493' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="收藏进度"
                value={companionStats.collectionProgress}
                prefix={<TrophyOutlined />}
                suffix="%"
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab} 
          size="large" 
          className="companion-center-tabs"
          items={[
            {
              key: 'center',
              label: <span><UserOutlined /> 陪伴中心</span>,
              children: (
            <Row gutter={24}>
              {/* 左侧：陪伴选择 */}
              <Col span={6}>
                <Card title="我的陪伴" className="h-full">
                  <div className="space-y-3">
                    {myCompanions.map(companion => (
                      <div 
                        key={companion.id}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          selectedCompanion.id === companion.id 
                            ? 'bg-purple-100 ring-2 ring-purple-500' 
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                        onClick={() => setSelectedCompanion({
                          ...companion,
                          name: companion.id,
                          personality: 'professional',
                          currentMood: 'happy',
                          energy: 85
                        })}
                      >
                        <div className="flex items-center">
                          <Avatar 
                            size={40} 
                            style={{ backgroundColor: companion.color }}
                          >
                            {companion.nameLocalized.zh[0]}
                          </Avatar>
                          <div className="ml-3 flex-1">
                            <div className="font-semibold">{companion.nameLocalized.zh}</div>
                            <div className="text-xs text-gray-500">
                              Lv.{companion.level} • ❤️{companion.intimacy}
                            </div>
                          </div>
                          {selectedCompanion.id === companion.id && (
                            <Badge status="processing" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </Col>

              {/* 中间：3D展示 */}
              <Col span={12}>
                <Advanced3DViewer
                  companion={selectedCompanion}
                  outfit="evening_dress"
                  accessories={['pearl_necklace']}
                  onModelLoaded={() => console.log('3D模型加载完成')}
                  onInteraction={(type) => console.log('3D交互:', type)}
                />
              </Col>

              {/* 右侧：快速信息 */}
              <Col span={6}>
                <Card title="陪伴信息" className="mb-4">
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-bold mb-2">{selectedCompanion.nameLocalized?.zh}</h3>
                      <Tag color="purple">{selectedCompanion.personality}</Tag>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">等级</span>
                          <span className="text-sm font-bold">Lv.{selectedCompanion.level}</span>
                        </div>
                        <Progress percent={selectedCompanion.level} strokeColor="#722ed1" showInfo={false} />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">亲密度</span>
                          <span className="text-sm font-bold">{selectedCompanion.intimacy}/100</span>
                        </div>
                        <Progress percent={selectedCompanion.intimacy} strokeColor="#ff4d4f" showInfo={false} />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">活力值</span>
                          <span className="text-sm font-bold">{selectedCompanion.energy}/100</span>
                        </div>
                        <Progress percent={selectedCompanion.energy} strokeColor="#52c41a" showInfo={false} />
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t">
                      <Button 
                        type="primary" 
                        block 
                        icon={<HeartOutlined />}
                        onClick={handleStartInteraction}
                        className="hover:scale-105 transition-transform"
                      >
                        开始互动
                      </Button>
                    </div>
                  </div>
                </Card>

                <Card title="今日活动" size="small">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>💬 对话次数</span>
                      <span className="font-bold">5/10</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>🎁 赠送礼物</span>
                      <span className="font-bold">2/3</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>🎮 游戏互动</span>
                      <span className="font-bold">1/2</span>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
              )
            },
            {
              key: 'equipment',
              label: <span><ShopOutlined /> 装备管理</span>,
              children: (
                <EquipmentManager
                  companion={selectedCompanion}
                  onEquipmentChange={(equipment) => {
                    console.log('装备变更:', equipment);
                    // 更新用户智慧币
                    if (!equipment.owned && equipment.price > 0) {
                      setUserWisdomCoins(prev => prev - equipment.price);
                    }
                  }}
                  userWisdomCoins={userWisdomCoins}
                />
              )
            },
            {
              key: 'tavern',
              label: <span><CoffeeOutlined /> 酒馆互动</span>,
              children: (
                <TavernInteractionSystem
                  companion={selectedCompanion}
                  userWisdomCoins={userWisdomCoins}
                  onInteractionComplete={(interaction) => {
                    console.log('互动完成:', interaction);
                    // 更新智慧币和陪伴状态
                    if (interaction.cost > 0) {
                      setUserWisdomCoins(prev => prev - interaction.cost);
                    }
                    // 更新陪伴的亲密度等属性
                    setSelectedCompanion(prev => ({
                      ...prev,
                      intimacy: Math.min(100, prev.intimacy + (interaction.effects?.intimacy || 0)),
                      energy: Math.max(0, Math.min(100, prev.energy + (interaction.effects?.energy || 0)))
                    }));
                  }}
                />
              )
            },
            {
              key: 'shop',
              label: <span><ShoppingOutlined /> 陪伴商城</span>,
              children: (
                <Row gutter={[16, 16]}>
              {/* 限时活动 */}
              <Col span={24}>
                <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  <Row>
                    <Col span={18}>
                      <h2 className="text-2xl font-bold mb-2">🎉 限时活动：陪伴节庆典</h2>
                      <p className="mb-4">全套陪伴礼包8折优惠，包含专属服装、饰品和特效！</p>
                      <Button size="large" type="primary" style={{ background: 'white', color: '#6366f1' }}>
                        立即购买 💎1,999 (原价 💎2,499)
                      </Button>
                    </Col>
                    <Col span={6}>
                      <div className="text-right">
                        <div className="text-sm opacity-75">活动倒计时</div>
                        <div className="text-xl font-bold">23:45:12</div>
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Col>

              {/* 商品分类 */}
              {['新品上架', '热门装扮', '稀有收藏', '特效道具'].map((category, index) => (
                <Col span={6} key={category}>
                  <Card title={category} hoverable>
                    <div className="space-y-3">
                      {Array.from({ length: 3 }, (_, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-purple-200 rounded mr-2" />
                            <span className="text-sm">物品 {i+1}</span>
                          </div>
                          <span className="text-xs">💎{(index+1) * 100}</span>
                        </div>
                      ))}
                    </div>
                    <Button type="link" block className="mt-3">查看更多 →</Button>
                  </Card>
                </Col>
              ))}
            </Row>
              )
            },
            {
              key: 'profiles',
              label: <span><StarOutlined /> 陪伴档案</span>,
              children: (
            <Row gutter={24}>
              <Col span={8}>
                <Card title="基础信息">
                  <div className="text-center mb-4">
                    <Avatar size={80} style={{ backgroundColor: selectedCompanion.color }}>
                      {selectedCompanion.nameLocalized?.zh?.[0]}
                    </Avatar>
                    <h3 className="mt-3 text-xl font-bold">{selectedCompanion.nameLocalized?.zh}</h3>
                    <Tag color="purple">{selectedCompanion.personality}</Tag>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>关系等级:</span>
                      <span className="font-bold">Lv.{selectedCompanion.level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>亲密度:</span>
                      <span className="font-bold text-pink-600">❤️ {selectedCompanion.intimacy}/100</span>
                    </div>
                    <div>
                      <div className="text-sm mb-1">亲密度进度</div>
                      <Progress percent={selectedCompanion.intimacy} strokeColor="#ff4d4f" />
                    </div>
                  </div>
                </Card>
              </Col>
              
              <Col span={16}>
                <Card title="详细资料" className="h-full">
                  <Tabs 
                    defaultActiveKey="story"
                    items={[
                      {
                        key: 'story',
                        label: '背景故事',
                        children: (
                          <div className="prose max-w-none">
                            <p>
                              薇薇安出生于上海的一个艺术世家，从小就展现出对台球运动的天赋。
                              在她18岁那年，她成为了全国最年轻的女子九球冠军...
                            </p>
                            <p>
                              现在的她经营着一家高端台球俱乐部，同时也是资深的德州扑克玩家。
                              她总是穿着优雅的旗袍，在台球桌边展现完美的击球姿态。
                            </p>
                          </div>
                        )
                      },
                      {
                        key: 'personality',
                        label: '性格特点',
                        children: (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold mb-2">优点</h4>
                              <ul className="space-y-1 text-sm">
                                <li>• 专业严谨的态度</li>
                                <li>• 优雅的举止风范</li>
                                <li>• 敏锐的战术眼光</li>
                                <li>• 细致的教学方式</li>
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">爱好</h4>
                              <ul className="space-y-1 text-sm">
                                <li>• 古典音乐欣赏</li>
                                <li>• 茶艺文化</li>
                                <li>• 时尚搭配</li>
                                <li>• 心理学研究</li>
                              </ul>
                            </div>
                          </div>
                        )
                      },
                      {
                        key: 'history',
                        label: '互动记录',
                        children: (
                          <div className="space-y-3">
                            {[
                              { date: '2024-08-10', action: '赠送礼物', detail: '珍珠项链', mood: '+5' },
                              { date: '2024-08-09', action: '台球对战', detail: '胜利', mood: '+3' },
                              { date: '2024-08-08', action: '深度对话', detail: '30分钟', mood: '+2' },
                            ].map((record, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                <div>
                                  <div className="font-semibold">{record.action}</div>
                                  <div className="text-sm text-gray-500">{record.date}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm">{record.detail}</div>
                                  <div className="text-xs text-green-600">{record.mood}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      }
                    ]}
                  />
                </Card>
              </Col>
            </Row>
              )
            }
          ]}
        />
      </div>
    </AppLayout>
  );
}