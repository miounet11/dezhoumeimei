'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Progress, Modal, Statistic, Tag, Space, message } from 'antd';
import { 
  HeartOutlined, 
  EyeOutlined, 
  ClockCircleOutlined,
  LockOutlined,
  UnlockOutlined,
  HeartFilled
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';

interface IntimacyViewerProps {
  companionId: string;
  companionName: string;
  userId: string;
}

interface IntimacyData {
  level: number;
  points: number;
  milestone: string;
  companionReaction: string;
  nextMilestone: {
    level: number;
    reward: string;
  };
}

export const IntimacyViewer: React.FC<IntimacyViewerProps> = ({
  companionId,
  companionName,
  userId
}) => {
  const [canView, setCanView] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isViewing, setIsViewing] = useState(false);
  const [showRitual, setShowRitual] = useState(false);
  const [ritualStep, setRitualStep] = useState(0);
  const [intimacyData, setIntimacyData] = useState<IntimacyData | null>(null);
  const [showIntimacyModal, setShowIntimacyModal] = useState(false);
  const [heartbeatRate, setHeartbeatRate] = useState(60);

  // Check if user can view intimacy
  const checkViewStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/companions/intimacy?userId=${userId}&companionId=${companionId}`
      );
      const data = await response.json();
      
      setCanView(data.canView);
      if (!data.canView && data.timeRemaining) {
        setTimeRemaining(data.timeRemaining);
      }
    } catch (error) {
      console.error('Error checking view status:', error);
    }
  }, [userId, companionId]);

  // Update countdown timer
  useEffect(() => {
    checkViewStatus();
    const interval = setInterval(checkViewStatus, 1000);
    return () => clearInterval(interval);
  }, [checkViewStatus]);

  // 3-second viewing ritual
  const startViewingRitual = async () => {
    if (!canView || isViewing) return;
    
    setIsViewing(true);
    setShowRitual(true);
    setRitualStep(1);
    
    // Step 1: Heartbeat acceleration (0-1s)
    let currentRate = 60;
    const heartbeatInterval = setInterval(() => {
      currentRate += 10;
      setHeartbeatRate(currentRate);
      if (currentRate >= 120) {
        clearInterval(heartbeatInterval);
      }
    }, 100);
    
    // Step 2: Screen blur effect (1-2s)
    setTimeout(() => {
      setRitualStep(2);
    }, 1000);
    
    // Step 3: Number reveal (2-3s)
    setTimeout(() => {
      setRitualStep(3);
    }, 2000);
    
    // Fetch intimacy data from server
    try {
      const response = await fetch('/api/companions/intimacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          companionId,
          clientTime: Date.now()
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTimeout(() => {
          setIntimacyData(data.intimacy);
          setShowRitual(false);
          setShowIntimacyModal(true);
          setIsViewing(false);
          setHeartbeatRate(60);
          message.success('亲密度查看成功！');
        }, 3000);
      } else {
        setShowRitual(false);
        setIsViewing(false);
        message.error(data.message || '查看失败');
      }
    } catch (error) {
      console.error('Error viewing intimacy:', error);
      setShowRitual(false);
      setIsViewing(false);
      message.error('网络错误，请稍后重试');
    }
  };

  // Render ritual animation
  const renderRitual = () => {
    if (!showRitual) return null;
    
    return (
      <Modal
        open={showRitual}
        footer={null}
        closable={false}
        centered
        width={400}
        className="ritual-modal"
        maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
      >
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          {/* Heartbeat animation */}
          <AnimatePresence>
            {ritualStep >= 1 && (
              <motion.div
                initial={{ scale: 1 }}
                animate={{ 
                  scale: [1, 1.2, 1],
                  transition: {
                    duration: 60 / heartbeatRate,
                    repeat: Infinity
                  }
                }}
                style={{ fontSize: 80, color: '#ff1493', marginBottom: 30 }}
              >
                <HeartFilled />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Blur to focus effect */}
          <AnimatePresence>
            {ritualStep >= 2 && (
              <motion.div
                initial={{ filter: 'blur(20px)', opacity: 0 }}
                animate={{ 
                  filter: 'blur(0px)', 
                  opacity: 1,
                  transition: { duration: 1 }
                }}
                style={{ fontSize: 24, marginBottom: 20 }}
              >
                {companionName}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Number reveal */}
          <AnimatePresence>
            {ritualStep >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  transition: { duration: 0.5 }
                }}
              >
                <div style={{ fontSize: 18, color: '#999', marginBottom: 10 }}>
                  正在读取亲密度...
                </div>
                <Progress 
                  percent={100} 
                  strokeColor={{
                    '0%': '#ff1493',
                    '100%': '#ff69b4'
                  }}
                  showInfo={false}
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Heartbeat sound indicator */}
          <div style={{ marginTop: 30, fontSize: 12, color: '#666' }}>
            心跳: {heartbeatRate} bpm
          </div>
        </div>
      </Modal>
    );
  };

  // Render intimacy data modal
  const renderIntimacyModal = () => {
    if (!intimacyData) return null;
    
    return (
      <Modal
        title={
          <Space>
            <HeartFilled style={{ color: '#ff1493' }} />
            亲密度详情
          </Space>
        }
        open={showIntimacyModal}
        onCancel={() => setShowIntimacyModal(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setShowIntimacyModal(false)}>
            关闭
          </Button>
        ]}
        width={500}
      >
        <div style={{ padding: '20px 0' }}>
          {/* Companion reaction */}
          <Card style={{ marginBottom: 20, background: '#fff0f5' }}>
            <div style={{ textAlign: 'center', fontStyle: 'italic' }}>
              "{intimacyData.companionReaction}"
            </div>
            <div style={{ textAlign: 'right', marginTop: 10, fontSize: 12, color: '#999' }}>
              —— {companionName}
            </div>
          </Card>
          
          {/* Intimacy level */}
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <div style={{ fontSize: 48, fontWeight: 'bold', color: '#ff1493' }}>
              {intimacyData.level}
            </div>
            <div style={{ fontSize: 14, color: '#666' }}>亲密度等级</div>
            <Tag color="pink" style={{ marginTop: 10 }}>
              {intimacyData.milestone}
            </Tag>
          </div>
          
          {/* Progress to next milestone */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ marginBottom: 10, fontSize: 14 }}>
              下一个里程碑: Lv.{intimacyData.nextMilestone.level}
            </div>
            <Progress 
              percent={(intimacyData.level / intimacyData.nextMilestone.level) * 100}
              strokeColor="#ff69b4"
            />
            <div style={{ marginTop: 5, fontSize: 12, color: '#999' }}>
              奖励: {intimacyData.nextMilestone.reward}
            </div>
          </div>
          
          {/* Points display */}
          <Card size="small">
            <Statistic
              title="亲密度点数"
              value={intimacyData.points}
              prefix={<HeartOutlined />}
              valueStyle={{ color: '#ff1493' }}
            />
          </Card>
          
          {/* Next view time */}
          <div style={{ 
            marginTop: 20, 
            padding: 10, 
            background: '#f0f0f0', 
            borderRadius: 8,
            textAlign: 'center'
          }}>
            <ClockCircleOutlined style={{ marginRight: 8 }} />
            下次可查看时间: 明天 00:00
          </div>
        </div>
      </Modal>
    );
  };

  return (
    <div className="intimacy-viewer">
      <Card
        title={
          <Space>
            <HeartOutlined style={{ color: '#ff1493' }} />
            亲密度查看
          </Space>
        }
        extra={
          canView ? (
            <Tag color="green" icon={<UnlockOutlined />}>
              可查看
            </Tag>
          ) : (
            <Tag color="red" icon={<LockOutlined />}>
              {timeRemaining}
            </Tag>
          )
        }
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          {/* View button */}
          <Button
            type="primary"
            size="large"
            icon={<EyeOutlined />}
            onClick={startViewingRitual}
            disabled={!canView || isViewing}
            loading={isViewing}
            style={{
              background: canView ? 'linear-gradient(45deg, #ff1493, #ff69b4)' : undefined,
              borderColor: canView ? '#ff1493' : undefined,
              fontSize: 18,
              height: 50,
              padding: '0 30px'
            }}
          >
            {canView ? '查看亲密度' : `${timeRemaining} 后可查看`}
          </Button>
          
          {/* Daily limit reminder */}
          <div style={{ marginTop: 20, color: '#999', fontSize: 12 }}>
            <LockOutlined style={{ marginRight: 5 }} />
            每个陪伴每天只能查看一次亲密度
          </div>
          
          {/* VIP notice */}
          <div style={{ marginTop: 10, color: '#ff4d4f', fontSize: 12 }}>
            * VIP用户也需要遵守每日查看限制
          </div>
        </div>
      </Card>
      
      {/* Render modals */}
      {renderRitual()}
      {renderIntimacyModal()}
      
      <style jsx global>{`
        .ritual-modal .ant-modal-content {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        @keyframes heartbeat {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};