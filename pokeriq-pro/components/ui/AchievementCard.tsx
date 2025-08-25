'use client';

import { Card, Progress, Badge, Avatar, Typography, Button, Space } from 'antd';
import { 
  TrophyOutlined, 
  StarOutlined, 
  CheckCircleOutlined, 
  LockOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { Achievement } from '@/types';

const { Text, Title } = Typography;

interface AchievementCardProps {
  achievement: Achievement;
  progress?: number;
  maxProgress?: number;
  isCompleted?: boolean;
  completedAt?: string;
  onClick?: () => void;
  showDetails?: boolean;
}

const rarityColors = {
  common: '#d9d9d9',
  rare: '#1890ff',
  epic: '#722ed1',
  legendary: '#fa8c16'
};

const rarityLabels = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传奇'
};

const rarityGradients = {
  common: 'from-gray-400 to-gray-600',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-orange-600'
};

export default function AchievementCard({
  achievement,
  progress = 0,
  maxProgress = 1,
  isCompleted = false,
  completedAt,
  onClick,
  showDetails = true
}: AchievementCardProps) {
  const progressPercentage = maxProgress > 0 ? (progress / maxProgress) * 100 : 0;

  return (
    <Card
      hoverable={!!onClick}
      className={`
        relative overflow-hidden transition-all duration-300 transform hover:scale-105
        ${isCompleted 
          ? 'border-green-300 shadow-green-100 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900' 
          : 'border-gray-200 shadow-gray-100 bg-white dark:bg-gray-800 opacity-75'
        }
      `}
      bodyStyle={{ padding: '20px' }}
      onClick={onClick}
    >
      {/* 稀有度装饰条 */}
      <div 
        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${rarityGradients[achievement.rarity]}`}
      />

      {/* 主要内容 */}
      <div className="text-center">
        {/* 成就图标 */}
        <div className="relative mb-4">
          <Avatar
            size={64}
            className={`bg-gradient-to-br ${rarityGradients[achievement.rarity]} text-2xl`}
          >
            {achievement.icon}
          </Avatar>
          
          {/* 状态指示器 */}
          <div className="absolute -top-2 -right-2">
            {isCompleted ? (
              <CheckCircleOutlined className="text-2xl text-green-500 bg-white rounded-full" />
            ) : (
              <LockOutlined className="text-xl text-gray-400 bg-white rounded-full p-1" />
            )}
          </div>

          {/* 稀有度徽章 */}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <Badge 
              color={rarityColors[achievement.rarity]} 
              text={
                <Text 
                  className="text-xs font-medium"
                  style={{ color: rarityColors[achievement.rarity] }}
                >
                  {rarityLabels[achievement.rarity]}
                </Text>
              }
            />
          </div>
        </div>

        {/* 成就信息 */}
        <div className="mb-4">
          <Title 
            level={5} 
            className={`mb-2 ${isCompleted ? 'text-gray-800 dark:text-white' : 'text-gray-400'}`}
          >
            {achievement.name}
          </Title>
          
          <Text 
            className={`text-sm ${isCompleted ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400'}`}
          >
            {achievement.description}
          </Text>
        </div>

        {/* 进度条（未完成时显示） */}
        {!isCompleted && showDetails && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>进度</span>
              <span>{progress}/{maxProgress}</span>
            </div>
            <Progress 
              percent={progressPercentage}
              strokeColor={{
                '0%': rarityColors[achievement.rarity],
                '100%': '#52c41a'
              }}
              size="small"
              showInfo={false}
            />
          </div>
        )}

        {/* 奖励信息 */}
        {showDetails && (
          <div className="mb-4">
            <Space size="small" wrap>
              <Badge 
                count={`+${achievement.reward.experience} XP`}
                style={{ backgroundColor: '#1890ff' }}
              />
              {achievement.reward.badges?.map(badge => (
                <Badge 
                  key={badge}
                  count={badge}
                  style={{ backgroundColor: '#722ed1' }}
                />
              ))}
            </Space>
          </div>
        )}

        {/* 完成时间 */}
        {isCompleted && completedAt && showDetails && (
          <div className="flex items-center justify-center space-x-1 text-xs text-green-600 dark:text-green-400">
            <CheckCircleOutlined />
            <span>{completedAt} 解锁</span>
          </div>
        )}

        {/* 预计完成时间（未完成时） */}
        {!isCompleted && progress > 0 && showDetails && (
          <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
            <ClockCircleOutlined />
            <span>
              还需 {maxProgress - progress} 次
            </span>
          </div>
        )}
      </div>

      {/* 发光效果（传奇成就） */}
      {achievement.rarity === 'legendary' && isCompleted && (
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 animate-pulse pointer-events-none rounded-lg" />
      )}

      {/* 闪烁效果（史诗成就） */}
      {achievement.rarity === 'epic' && isCompleted && (
        <div className="absolute top-2 right-2">
          <StarOutlined className="text-purple-500 animate-bounce text-lg" />
        </div>
      )}
    </Card>
  );
}

// 成就卡片网格组件
export function AchievementGrid({ 
  achievements, 
  onAchievementClick 
}: { 
  achievements: Array<Achievement & { progress?: number; maxProgress?: number; isCompleted?: boolean; completedAt?: string; }>; 
  onAchievementClick?: (achievement: Achievement) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {achievements.map(achievement => (
        <AchievementCard
          key={achievement.id}
          achievement={achievement}
          progress={achievement.progress}
          maxProgress={achievement.maxProgress}
          isCompleted={achievement.isCompleted}
          completedAt={achievement.completedAt}
          onClick={() => onAchievementClick?.(achievement)}
        />
      ))}
    </div>
  );
}

// 迷你成就卡片（用于侧边栏等紧凑空间）
export function MiniAchievementCard({
  achievement,
  isCompleted = false,
  onClick
}: {
  achievement: Achievement;
  isCompleted?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={`
        flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200
        ${isCompleted 
          ? 'bg-green-50 dark:bg-green-900 hover:bg-green-100 dark:hover:bg-green-800' 
          : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
        }
      `}
      onClick={onClick}
    >
      <Avatar
        size="small"
        className={`bg-gradient-to-br ${rarityGradients[achievement.rarity]}`}
      >
        {achievement.icon}
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium truncate ${
          isCompleted ? 'text-gray-800 dark:text-white' : 'text-gray-400'
        }`}>
          {achievement.name}
        </div>
        <div className="text-xs text-blue-600">
          +{achievement.reward.experience} XP
        </div>
      </div>

      <div>
        {isCompleted ? (
          <CheckCircleOutlined className="text-green-500" />
        ) : (
          <LockOutlined className="text-gray-400" />
        )}
      </div>
    </div>
  );
}