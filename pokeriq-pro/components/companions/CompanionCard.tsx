'use client';

import React from 'react';
import { Card, Tag, Progress, Button, Avatar, Badge } from 'antd';
import { HeartOutlined, GiftOutlined, AudioOutlined, StarFilled } from '@ant-design/icons';

interface CompanionCardProps {
  companion: {
    id: string;
    name: string;
    nameLocalized: { zh: string; en: string };
    personality: string;
    region: string;
    rarity: string;
    basePrice: number;
    poolHallRole: string;
    imageUrl?: string;
  };
  relationship?: {
    level: number;
    intimacyPoints: number;
    currentMood: string;
    isActive: boolean;
    isPrimary: boolean;
  };
  onSelect?: () => void;
  onGift?: () => void;
  onVoiceChat?: () => void;
}

const rarityColors: Record<string, string> = {
  common: '#52c41a',
  rare: '#1890ff',
  epic: '#722ed1',
  legendary: '#f5222d'
};

const moodEmojis: Record<string, string> = {
  happy: '😊',
  excited: '😍',
  neutral: '😌',
  sad: '😢',
  playful: '😏'
};

export const CompanionCard: React.FC<CompanionCardProps> = ({
  companion,
  relationship,
  onSelect,
  onGift,
  onVoiceChat
}) => {
  const isOwned = !!relationship;
  const isFree = companion.basePrice === 0;

  return (
    <Badge.Ribbon 
      text={relationship?.isPrimary ? '主要陪伴' : companion.poolHallRole} 
      color={relationship?.isPrimary ? 'red' : 'blue'}
    >
      <Card
        hoverable
        className="companion-card"
        style={{ 
          width: 280, 
          background: isOwned ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#fff',
          border: `2px solid ${rarityColors[companion.rarity]}`
        }}
        cover={
          <div style={{ position: 'relative', height: 320, overflow: 'hidden' }}>
            <img
              alt={companion.name}
              src={companion.imageUrl || `/images/companions/${companion.id}.jpg`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {isOwned && relationship && (
              <div style={{
                position: 'absolute',
                top: 10,
                right: 10,
                background: 'rgba(0,0,0,0.7)',
                padding: '4px 8px',
                borderRadius: 20,
                color: '#fff',
                fontSize: 18
              }}>
                {moodEmojis[relationship.currentMood]}
              </div>
            )}
            {!isOwned && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                padding: '20px 10px 10px',
                color: '#fff'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 16, fontWeight: 'bold' }}>
                    {isFree ? '免费' : `💎 ${companion.basePrice}`}
                  </span>
                  <Tag color={rarityColors[companion.rarity]}>
                    {companion.rarity.toUpperCase()}
                  </Tag>
                </div>
              </div>
            )}
          </div>
        }
        actions={isOwned ? [
          <Button 
            key="gift" 
            icon={<GiftOutlined />} 
            onClick={onGift}
            style={{ border: 'none' }}
          >
            送礼
          </Button>,
          <Button 
            key="voice" 
            icon={<AudioOutlined />} 
            onClick={onVoiceChat}
            style={{ border: 'none' }}
          >
            语音
          </Button>,
          <Button 
            key="select" 
            type="primary" 
            onClick={onSelect}
            style={{ border: 'none' }}
          >
            选择
          </Button>
        ] : [
          <Button 
            key="unlock" 
            type="primary" 
            onClick={onSelect}
            style={{ width: '100%' }}
          >
            {isFree ? '免费解锁' : `解锁 (💎${companion.basePrice})`}
          </Button>
        ]}
      >
        <Card.Meta
          avatar={
            <Avatar 
              size={48} 
              style={{ 
                backgroundColor: rarityColors[companion.rarity],
                fontSize: 24
              }}
            >
              {companion.nameLocalized.zh[0]}
            </Avatar>
          }
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18, color: isOwned ? '#fff' : '#000' }}>
                {companion.nameLocalized.zh}
              </span>
              <Tag color="gold" style={{ margin: 0 }}>
                {companion.personality}
              </Tag>
            </div>
          }
          description={
            <div style={{ color: isOwned ? '#f0f0f0' : '#666' }}>
              <div>{companion.poolHallRole}</div>
              {isOwned && relationship && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span>关系等级</span>
                    <span>Lv.{relationship.level}</span>
                  </div>
                  <Progress 
                    percent={relationship.level} 
                    strokeColor={{
                      '0%': '#ff4d4f',
                      '100%': '#ff7875'
                    }}
                    showInfo={false}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                    <span>
                      <HeartOutlined /> 亲密度
                    </span>
                    <span>{relationship.intimacyPoints}</span>
                  </div>
                </div>
              )}
            </div>
          }
        />
      </Card>
    </Badge.Ribbon>
  );
};