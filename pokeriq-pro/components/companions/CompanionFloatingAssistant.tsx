'use client';

import React, { useState, useEffect } from 'react';
import { Avatar, Badge, Tooltip, Drawer, Card, Button, Tag, Progress, Space, message } from 'antd';
import { 
  HeartOutlined, 
  CommentOutlined, 
  GiftOutlined,
  StarOutlined,
  CloseOutlined,
  HeartFilled,
  SmileOutlined,
  FireOutlined
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';

interface CompanionFloatingAssistantProps {
  companion?: {
    id: string;
    name: string;
    tier: string;
    level: number;
    intimacy: number;
    mood: 'happy' | 'excited' | 'neutral' | 'sad' | 'playful';
  };
  onGameResult?: (result: 'win' | 'lose') => void;
}

export const CompanionFloatingAssistant: React.FC<CompanionFloatingAssistantProps> = ({
  companion = {
    id: 'comp_001',
    name: '雪',
    tier: 'A',
    level: 45,
    intimacy: 68,
    mood: 'happy'
  },
  onGameResult
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isBreathing, setIsBreathing] = useState(true);
  const [eyeTracking, setEyeTracking] = useState({ x: 0, y: 0 });
  const [showEmotionParticle, setShowEmotionParticle] = useState(false);

  // 随机消息池
  const messages = {
    idle: [
      '今天训练很努力呢～',
      '要不要休息一下？',
      '我一直在这里陪着你',
      '你的牌技越来越好了！'
    ],
    win: [
      '太棒了！你赢了！🎉',
      '我就知道你可以的！',
      '这把打得真漂亮！',
      '胜利的感觉真好呢～'
    ],
    lose: [
      '没关系，下次一定能赢！',
      '失败是成功之母哦',
      '我相信你，加油！',
      '要不要分析一下刚才的牌局？'
    ],
    training: [
      '这个决策很明智！',
      '要考虑对手的范围哦',
      '位置很重要呢',
      'GTO建议你这样打...'
    ],
    special: [
      '今天是个特别的日子呢',
      '我们在一起{days}天了',
      '谢谢你一直陪着我',
      '你是最棒的！'
    ]
  };

  // 情绪粒子效果
  const emotionParticles = {
    happy: '💕',
    excited: '✨',
    neutral: '💭',
    sad: '💧',
    playful: '🌟'
  };

  // 随机显示消息
  useEffect(() => {
    const showRandomMessage = () => {
      const messageType = ['idle', 'training'][Math.floor(Math.random() * 2)];
      const messageList = messages[messageType as keyof typeof messages];
      const randomMessage = messageList[Math.floor(Math.random() * messageList.length)];
      setCurrentMessage(randomMessage);
      
      // 触发情绪粒子
      if (Math.random() > 0.7) {
        setShowEmotionParticle(true);
        setTimeout(() => setShowEmotionParticle(false), 2000);
      }
    };

    showRandomMessage();
    const interval = setInterval(showRandomMessage, 30000); // 每30秒更换消息
    return () => clearInterval(interval);
  }, []);

  // 眼睛跟踪鼠标
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isOpen) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setEyeTracking({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isOpen]);

  // 游戏结果反馈 - 移除自动触发，避免无限循环
  // onGameResult 应该由实际游戏事件触发，而不是在组件加载时自动调用

  // 渲染浮动头像
  const renderFloatingAvatar = () => (
    <motion.div
      className="fixed bottom-6 right-6 z-50"
      initial={{ scale: 0 }}
      animate={{ scale: isMinimized ? 0.8 : 1 }}
      whileHover={{ scale: 1.1 }}
      style={{ display: isOpen ? 'none' : 'block' }}
    >
      <Tooltip title={currentMessage} placement="left">
        <Badge 
          count={companion.level} 
          style={{ backgroundColor: '#ff1493' }}
          offset={[-5, 5]}
        >
          <Avatar
            size={64}
            style={{
              backgroundColor: companion.tier === 'S' ? '#ff4d4f' :
                             companion.tier === 'A' ? '#fa8c16' :
                             companion.tier === 'B' ? '#fadb14' : '#52c41a',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
            onClick={() => setIsOpen(true)}
          >
            <motion.div
              animate={isBreathing ? {
                scale: [1, 1.05, 1],
                transition: { duration: 3, repeat: Infinity }
              } : {}}
            >
              {companion.tier}
            </motion.div>
          </Avatar>
        </Badge>
      </Tooltip>
      
      {/* 情绪粒子 */}
      <AnimatePresence>
        {showEmotionParticle && (
          <motion.div
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: -30 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 right-0 text-2xl"
          >
            {emotionParticles[companion.mood]}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 对话气泡 */}
      <AnimatePresence>
        {currentMessage && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-full mb-2 right-0 bg-white rounded-lg shadow-lg px-3 py-2 whitespace-nowrap"
            style={{ maxWidth: '200px' }}
          >
            <div className="text-sm">{currentMessage}</div>
            <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-white" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  // 渲染详细面板
  const renderDetailPanel = () => (
    <Drawer
      title={
        <div className="flex items-center justify-between">
          <Space>
            <Avatar
              size={32}
              style={{
                backgroundColor: companion.tier === 'S' ? '#ff4d4f' :
                               companion.tier === 'A' ? '#fa8c16' :
                               companion.tier === 'B' ? '#fadb14' : '#52c41a'
              }}
            >
              {companion.tier}
            </Avatar>
            <div>
              <div className="font-semibold">{companion.name}</div>
              <Tag color="pink" className="mt-1">Lv.{companion.level}</Tag>
            </div>
          </Space>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={() => setIsOpen(false)}
          />
        </div>
      }
      placement="right"
      open={isOpen}
      onClose={() => setIsOpen(false)}
      width={350}
      closable={false}
    >
      {/* 陪伴状态 */}
      <Card size="small" className="mb-4">
        <div className="text-center">
          {/* 动态眼睛 */}
          <div className="relative inline-block mb-4">
            <Avatar
              size={80}
              style={{
                backgroundColor: companion.tier === 'S' ? '#ff4d4f' :
                               companion.tier === 'A' ? '#fa8c16' :
                               companion.tier === 'B' ? '#fadb14' : '#52c41a',
                transform: `perspective(100px) rotateY(${eyeTracking.x}deg) rotateX(${-eyeTracking.y}deg)`
              }}
            >
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  transition: { duration: 3, repeat: Infinity }
                }}
              >
                {companion.tier}
              </motion.div>
            </Avatar>
          </div>
          
          {/* 心情指示 */}
          <div className="mb-2">
            <Space>
              <span>心情:</span>
              {companion.mood === 'happy' && <SmileOutlined style={{ color: '#52c41a', fontSize: 20 }} />}
              {companion.mood === 'excited' && <FireOutlined style={{ color: '#fa8c16', fontSize: 20 }} />}
              <span className="capitalize">{companion.mood}</span>
            </Space>
          </div>
          
          {/* 亲密度 */}
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span>亲密度</span>
              <span>{companion.intimacy}/100</span>
            </div>
            <Progress 
              percent={companion.intimacy} 
              strokeColor="#ff1493"
              showInfo={false}
            />
          </div>
        </div>
      </Card>

      {/* 互动选项 */}
      <Card size="small" title="互动" className="mb-4">
        <Space direction="vertical" className="w-full">
          <Button 
            icon={<CommentOutlined />} 
            block
            onClick={() => message.info('开启对话功能开发中...')}
          >
            聊天对话
          </Button>
          <Button 
            icon={<GiftOutlined />} 
            block
            onClick={() => message.info('礼物系统开发中...')}
          >
            送礼物
          </Button>
          <Button 
            icon={<HeartOutlined />} 
            block
            type="primary"
            danger
            onClick={() => message.success('亲密度+1')}
          >
            增进感情
          </Button>
        </Space>
      </Card>

      {/* 今日建议 */}
      <Card size="small" title="陪伴建议">
        <div className="text-sm space-y-2">
          <div className="flex items-start">
            <StarOutlined className="mr-2 mt-1 text-yellow-500" />
            <span>今天适合练习翻牌前的范围</span>
          </div>
          <div className="flex items-start">
            <StarOutlined className="mr-2 mt-1 text-yellow-500" />
            <span>建议复习昨天的错误决策</span>
          </div>
          <div className="flex items-start">
            <StarOutlined className="mr-2 mt-1 text-yellow-500" />
            <span>保持冷静，不要上头哦</span>
          </div>
        </div>
      </Card>
    </Drawer>
  );

  return (
    <>
      {renderFloatingAvatar()}
      {renderDetailPanel()}
    </>
  );
};