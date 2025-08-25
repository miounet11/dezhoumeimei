'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Modal, Row, Col, Tag, Progress, Tooltip, Badge, Avatar, Empty, Tabs, Select, Slider } from 'antd';
import {
  ShopOutlined,
  CrownOutlined,
  HeartOutlined,
  StarOutlined,
  ThunderboltOutlined,
  GiftOutlined,
  LockOutlined,
  CheckCircleOutlined,
  ShoppingCartOutlined,
  EyeOutlined,
  FireOutlined,
  DiamondOutlined
} from '@ant-design/icons';

const { TabPane } = Tabs;
const { Option } = Select;

interface Equipment {
  id: string;
  name: string;
  category: 'outfit' | 'accessory' | 'special' | 'background';
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  price: number;
  owned: boolean;
  equipped: boolean;
  level: number;
  effects: {
    charm: number;
    elegance: number;
    energy: number;
    mystery: number;
  };
  description: string;
  unlockLevel: number;
  tags: string[];
  setBonus?: string;
}

interface EquipmentManagerProps {
  companion: {
    id: string;
    name: string;
    nameLocalized: { zh: string };
    level: number;
    intimacy: number;
  };
  onEquipmentChange: (equipment: Equipment) => void;
  userWisdomCoins: number;
}

export const EquipmentManager: React.FC<EquipmentManagerProps> = ({
  companion,
  onEquipmentChange,
  userWisdomCoins
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('outfit');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [showPreview, setShowPreview] = useState(false);
  const [previewItem, setPreviewItem] = useState<Equipment | null>(null);
  const [equipmentData, setEquipmentData] = useState<Equipment[]>([]);
  const [equippedItems, setEquippedItems] = useState<{ [category: string]: Equipment }>({});

  // 稀有度颜色映射
  const rarityColors = {
    common: '#52c41a',
    rare: '#1890ff',
    epic: '#722ed1',
    legendary: '#f5222d',
    mythic: '#fa8c16'
  };

  // 稀有度发光效果
  const rarityGlow = {
    common: 'shadow-lg',
    rare: 'shadow-xl shadow-blue-500/50',
    epic: 'shadow-xl shadow-purple-500/50',
    legendary: 'shadow-xl shadow-red-500/50',
    mythic: 'shadow-xl shadow-yellow-500/50'
  };

  // 装备数据
  useEffect(() => {
    const mockEquipment: Equipment[] = [
      // 服装类
      {
        id: 'pool_uniform',
        name: '经典台球制服',
        category: 'outfit',
        rarity: 'common',
        price: 100,
        owned: true,
        equipped: true,
        level: 1,
        effects: { charm: 10, elegance: 15, energy: 20, mystery: 5 },
        description: '经典的台球制服，展现专业风范',
        unlockLevel: 1,
        tags: ['professional', 'classic']
      },
      {
        id: 'evening_dress',
        name: '优雅晚礼服',
        category: 'outfit',
        rarity: 'rare',
        price: 500,
        owned: false,
        equipped: false,
        level: 10,
        effects: { charm: 25, elegance: 35, energy: 10, mystery: 20 },
        description: '高贵优雅的晚礼服，适合正式场合',
        unlockLevel: 10,
        tags: ['elegant', 'formal']
      },
      {
        id: 'gothic_dress',
        name: '哥特式暗黑礼服',
        category: 'outfit',
        rarity: 'epic',
        price: 1200,
        owned: false,
        equipped: false,
        level: 25,
        effects: { charm: 30, elegance: 20, energy: 15, mystery: 45 },
        description: '神秘而优雅的哥特风格礼服',
        unlockLevel: 25,
        tags: ['gothic', 'mysterious']
      },
      {
        id: 'phoenix_gown',
        name: '凤凰涅槃之裙',
        category: 'outfit',
        rarity: 'legendary',
        price: 2500,
        owned: false,
        equipped: false,
        level: 50,
        effects: { charm: 50, elegance: 45, energy: 40, mystery: 35 },
        description: '传说中的凤凰之裙，象征重生与力量',
        unlockLevel: 50,
        tags: ['legendary', 'phoenix', 'power'],
        setBonus: '凤凰套装：全属性+20%'
      },
      
      // 饰品类
      {
        id: 'pearl_necklace',
        name: '天然珍珠项链',
        category: 'accessory',
        rarity: 'rare',
        price: 300,
        owned: true,
        equipped: true,
        level: 5,
        effects: { charm: 20, elegance: 25, energy: 5, mystery: 10 },
        description: '优质天然珍珠制成的项链',
        unlockLevel: 5,
        tags: ['pearl', 'natural']
      },
      {
        id: 'diamond_crown',
        name: '钻石皇冠',
        category: 'accessory',
        rarity: 'legendary',
        price: 3000,
        owned: false,
        equipped: false,
        level: 40,
        effects: { charm: 40, elegance: 50, energy: 20, mystery: 30 },
        description: '镶嵌着完美钻石的华丽皇冠',
        unlockLevel: 40,
        tags: ['diamond', 'crown', 'royal']
      },
      {
        id: 'starlight_earrings',
        name: '星光耳环',
        category: 'accessory',
        rarity: 'mythic',
        price: 5000,
        owned: false,
        equipped: false,
        level: 60,
        effects: { charm: 45, elegance: 40, energy: 35, mystery: 50 },
        description: '蕴含星辰之力的神话级耳环',
        unlockLevel: 60,
        tags: ['starlight', 'mythic', 'celestial']
      },

      // 特效类
      {
        id: 'heart_aura',
        name: '爱心光环',
        category: 'special',
        rarity: 'epic',
        price: 800,
        owned: false,
        equipped: false,
        level: 20,
        effects: { charm: 35, elegance: 15, energy: 25, mystery: 15 },
        description: '散发温柔粉色光芒的爱心特效',
        unlockLevel: 20,
        tags: ['aura', 'love', 'pink']
      },
      {
        id: 'phoenix_flames',
        name: '凤凰烈焰',
        category: 'special',
        rarity: 'legendary',
        price: 2000,
        owned: false,
        equipped: false,
        level: 45,
        effects: { charm: 40, elegance: 25, energy: 50, mystery: 35 },
        description: '环绕周身的神圣凤凰火焰',
        unlockLevel: 45,
        tags: ['phoenix', 'flames', 'divine']
      }
    ];

    setEquipmentData(mockEquipment);
    
    // 设置已装备的物品
    const equipped: { [category: string]: Equipment } = {};
    mockEquipment.filter(item => item.equipped).forEach(item => {
      equipped[item.category] = item;
    });
    setEquippedItems(equipped);
  }, []);

  // 过滤装备
  const filteredEquipment = equipmentData.filter(item => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (selectedRarity !== 'all' && item.rarity !== selectedRarity) return false;
    return true;
  });

  // 装备/卸下物品
  const equipItem = (item: Equipment) => {
    if (!item.owned && item.price > userWisdomCoins) {
      Modal.warning({
        title: '智慧币不足',
        content: `需要 ${item.price} 💎，当前只有 ${userWisdomCoins} 💎`
      });
      return;
    }

    if (!item.owned) {
      // 购买物品
      Modal.confirm({
        title: '购买装备',
        content: (
          <div>
            <p>确定要购买 <strong>{item.name}</strong> 吗？</p>
            <p>价格: <strong>{item.price} 💎</strong></p>
            <div className="mt-3">
              <div className="text-sm text-gray-600 mb-2">属性加成:</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>魅力: +{item.effects.charm}</div>
                <div>优雅: +{item.effects.elegance}</div>
                <div>活力: +{item.effects.energy}</div>
                <div>神秘: +{item.effects.mystery}</div>
              </div>
            </div>
          </div>
        ),
        onOk() {
          // 购买并装备
          const updatedEquipment = equipmentData.map(eq => 
            eq.id === item.id ? { ...eq, owned: true, equipped: true } : 
            eq.category === item.category ? { ...eq, equipped: false } : eq
          );
          setEquipmentData(updatedEquipment);
          setEquippedItems(prev => ({ ...prev, [item.category]: { ...item, owned: true, equipped: true } }));
          onEquipmentChange({ ...item, owned: true, equipped: true });
        }
      });
    } else {
      // 装备/卸下已有物品
      const isCurrentlyEquipped = equippedItems[item.category]?.id === item.id;
      
      const updatedEquipment = equipmentData.map(eq => {
        if (eq.category === item.category) {
          if (eq.id === item.id) {
            return { ...eq, equipped: !isCurrentlyEquipped };
          } else {
            return { ...eq, equipped: false };
          }
        }
        return eq;
      });
      
      setEquipmentData(updatedEquipment);
      
      if (isCurrentlyEquipped) {
        const newEquipped = { ...equippedItems };
        delete newEquipped[item.category];
        setEquippedItems(newEquipped);
      } else {
        setEquippedItems(prev => ({ ...prev, [item.category]: { ...item, equipped: true } }));
      }
      
      onEquipmentChange({ ...item, equipped: !isCurrentlyEquipped });
    }
  };

  // 预览物品
  const previewItem_ = (item: Equipment) => {
    setPreviewItem(item);
    setShowPreview(true);
  };

  // 计算总属性
  const totalEffects = Object.values(equippedItems).reduce((total, item) => ({
    charm: total.charm + item.effects.charm,
    elegance: total.elegance + item.effects.elegance,
    energy: total.energy + item.effects.energy,
    mystery: total.mystery + item.effects.mystery
  }), { charm: 0, elegance: 0, energy: 0, mystery: 0 });

  const categories = [
    { id: 'all', name: '全部', icon: <ShopOutlined /> },
    { id: 'outfit', name: '服装', icon: <Avatar /> },
    { id: 'accessory', name: '饰品', icon: <CrownOutlined /> },
    { id: 'special', name: '特效', icon: <ThunderboltOutlined /> },
    { id: 'background', name: '背景', icon: <EyeOutlined /> }
  ];

  const rarities = [
    { id: 'all', name: '全部品质', color: '#666' },
    { id: 'common', name: '普通', color: rarityColors.common },
    { id: 'rare', name: '稀有', color: rarityColors.rare },
    { id: 'epic', name: '史诗', color: rarityColors.epic },
    { id: 'legendary', name: '传说', color: rarityColors.legendary },
    { id: 'mythic', name: '神话', color: rarityColors.mythic }
  ];

  return (
    <div className="equipment-manager">
      {/* 装备概览 */}
      <Card className="mb-6">
        <Row gutter={16}>
          <Col span={12}>
            <div className="text-lg font-bold mb-4">当前装备</div>
            <div className="grid grid-cols-4 gap-3">
              {['outfit', 'accessory', 'special', 'background'].map(category => {
                const item = equippedItems[category];
                return (
                  <div key={category} className="text-center">
                    <div className="text-xs text-gray-500 mb-1 capitalize">{category}</div>
                    {item ? (
                      <Tooltip title={item.name}>
                        <div 
                          className={`w-16 h-16 rounded-lg flex items-center justify-center cursor-pointer ${rarityGlow[item.rarity]}`}
                          style={{ 
                            backgroundColor: rarityColors[item.rarity],
                            color: 'white'
                          }}
                          onClick={() => previewItem_(item)}
                        >
                          <div className="text-2xl">
                            {category === 'outfit' && '👗'}
                            {category === 'accessory' && '💎'}
                            {category === 'special' && '✨'}
                            {category === 'background' && '🖼️'}
                          </div>
                        </div>
                      </Tooltip>
                    ) : (
                      <div className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                        <div className="text-2xl">+</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Col>
          <Col span={12}>
            <div className="text-lg font-bold mb-4">属性总览</div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <HeartOutlined className="text-pink-500 mr-2" />
                  魅力
                </span>
                <div className="flex items-center space-x-2">
                  <Progress 
                    percent={Math.min(totalEffects.charm, 200) / 2} 
                    strokeColor="#ff4d4f" 
                    showInfo={false}
                    size="small"
                    className="w-20"
                  />
                  <span className="text-sm font-bold">{totalEffects.charm}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <CrownOutlined className="text-purple-500 mr-2" />
                  优雅
                </span>
                <div className="flex items-center space-x-2">
                  <Progress 
                    percent={Math.min(totalEffects.elegance, 200) / 2} 
                    strokeColor="#722ed1" 
                    showInfo={false}
                    size="small"
                    className="w-20"
                  />
                  <span className="text-sm font-bold">{totalEffects.elegance}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <ThunderboltOutlined className="text-yellow-500 mr-2" />
                  活力
                </span>
                <div className="flex items-center space-x-2">
                  <Progress 
                    percent={Math.min(totalEffects.energy, 200) / 2} 
                    strokeColor="#faad14" 
                    showInfo={false}
                    size="small"
                    className="w-20"
                  />
                  <span className="text-sm font-bold">{totalEffects.energy}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <StarOutlined className="text-blue-500 mr-2" />
                  神秘
                </span>
                <div className="flex items-center space-x-2">
                  <Progress 
                    percent={Math.min(totalEffects.mystery, 200) / 2} 
                    strokeColor="#1890ff" 
                    showInfo={false}
                    size="small"
                    className="w-20"
                  />
                  <span className="text-sm font-bold">{totalEffects.mystery}</span>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 装备商店 */}
      <Card title="装备商店">
        {/* 过滤器 */}
        <div className="mb-6 flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm">分类:</span>
            <div className="flex space-x-1">
              {categories.map(cat => (
                <Button
                  key={cat.id}
                  type={selectedCategory === cat.id ? 'primary' : 'default'}
                  size="small"
                  icon={cat.icon}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm">品质:</span>
            <Select 
              value={selectedRarity} 
              onChange={setSelectedRarity}
              size="small"
              style={{ width: 120 }}
            >
              {rarities.map(rarity => (
                <Option key={rarity.id} value={rarity.id}>
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: rarity.color }}
                    />
                    {rarity.name}
                  </div>
                </Option>
              ))}
            </Select>
          </div>
        </div>

        {/* 装备网格 */}
        <Row gutter={[16, 16]}>
          {filteredEquipment.length > 0 ? filteredEquipment.map(item => (
            <Col span={6} key={item.id}>
              <Card 
                hoverable
                className={`equipment-card ${item.equipped ? 'ring-2 ring-blue-500' : ''} ${rarityGlow[item.rarity]}`}
                cover={
                  <div 
                    className="h-32 flex items-center justify-center text-white relative"
                    style={{ backgroundColor: rarityColors[item.rarity] }}
                  >
                    <div className="text-4xl">
                      {item.category === 'outfit' && '👗'}
                      {item.category === 'accessory' && '💎'}
                      {item.category === 'special' && '✨'}
                      {item.category === 'background' && '🖼️'}
                    </div>
                    {!item.owned && (
                      <div className="absolute top-2 right-2">
                        <LockOutlined className="text-white text-xl" />
                      </div>
                    )}
                    {item.equipped && (
                      <div className="absolute top-2 left-2">
                        <CheckCircleOutlined className="text-green-300 text-xl" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 px-2 py-1">
                      <Tag size="small" style={{ backgroundColor: rarityColors[item.rarity], border: 'none' }}>
                        {item.rarity}
                      </Tag>
                    </div>
                  </div>
                }
                actions={[
                  <Button 
                    key="preview" 
                    type="text" 
                    icon={<EyeOutlined />}
                    onClick={() => previewItem_(item)}
                  >
                    预览
                  </Button>,
                  <Button
                    key="equip"
                    type={item.equipped ? "default" : "primary"}
                    size="small"
                    disabled={!item.owned && companion.level < item.unlockLevel}
                    onClick={() => equipItem(item)}
                  >
                    {item.owned ? (item.equipped ? '已装备' : '装备') : `💎${item.price}`}
                  </Button>
                ]}
              >
                <Card.Meta
                  title={
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{item.name}</span>
                      {item.setBonus && (
                        <Tooltip title={item.setBonus}>
                          <FireOutlined className="text-orange-500" />
                        </Tooltip>
                      )}
                    </div>
                  }
                  description={
                    <div className="text-xs">
                      <div className="mb-2">{item.description}</div>
                      {companion.level < item.unlockLevel && (
                        <div className="text-red-500">
                          需要等级 {item.unlockLevel}
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-1 mt-2">
                        <div>魅力 +{item.effects.charm}</div>
                        <div>优雅 +{item.effects.elegance}</div>
                        <div>活力 +{item.effects.energy}</div>
                        <div>神秘 +{item.effects.mystery}</div>
                      </div>
                    </div>
                  }
                />
              </Card>
            </Col>
          )) : (
            <Col span={24}>
              <Empty description="没有找到匹配的装备" />
            </Col>
          )}
        </Row>
      </Card>

      {/* 预览模态框 */}
      <Modal
        title="装备预览"
        open={showPreview}
        onCancel={() => setShowPreview(false)}
        footer={null}
        width={600}
      >
        {previewItem && (
          <div>
            <Row gutter={24}>
              <Col span={12}>
                <div 
                  className="h-64 rounded-lg flex items-center justify-center text-white mb-4"
                  style={{ backgroundColor: rarityColors[previewItem.rarity] }}
                >
                  <div className="text-8xl">
                    {previewItem.category === 'outfit' && '👗'}
                    {previewItem.category === 'accessory' && '💎'}
                    {previewItem.category === 'special' && '✨'}
                    {previewItem.category === 'background' && '🖼️'}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold flex items-center">
                      {previewItem.name}
                      <Tag 
                        color={rarityColors[previewItem.rarity]}
                        className="ml-2"
                      >
                        {previewItem.rarity}
                      </Tag>
                    </h3>
                    <p className="text-gray-600 mt-2">{previewItem.description}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">属性加成</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center">
                        <HeartOutlined className="text-pink-500 mr-2" />
                        魅力 +{previewItem.effects.charm}
                      </div>
                      <div className="flex items-center">
                        <CrownOutlined className="text-purple-500 mr-2" />
                        优雅 +{previewItem.effects.elegance}
                      </div>
                      <div className="flex items-center">
                        <ThunderboltOutlined className="text-yellow-500 mr-2" />
                        活力 +{previewItem.effects.energy}
                      </div>
                      <div className="flex items-center">
                        <StarOutlined className="text-blue-500 mr-2" />
                        神秘 +{previewItem.effects.mystery}
                      </div>
                    </div>
                  </div>

                  {previewItem.setBonus && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center">
                        <FireOutlined className="text-orange-500 mr-2" />
                        套装效果
                      </h4>
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <div className="text-sm text-orange-800">{previewItem.setBonus}</div>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold mb-2">标签</h4>
                    <div className="space-x-1">
                      {previewItem.tags.map(tag => (
                        <Tag key={tag} size="small">#{tag}</Tag>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button
                      type="primary"
                      block
                      size="large"
                      disabled={!previewItem.owned && companion.level < previewItem.unlockLevel}
                      onClick={() => {
                        equipItem(previewItem);
                        setShowPreview(false);
                      }}
                    >
                      {previewItem.owned 
                        ? (previewItem.equipped ? '已装备' : '装备') 
                        : `购买 💎${previewItem.price}`
                      }
                    </Button>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EquipmentManager;