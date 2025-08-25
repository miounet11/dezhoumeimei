'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlayCircle, 
  Trophy, 
  Target, 
  Brain, 
  Settings,
  Plus,
  Heart,
  Star,
  Zap
} from 'lucide-react';

// Import our enhanced components
import { EnhancedButton, EnhancedInput } from '@/components/ui/EnhancedButton';
import { 
  AnimatedCard, 
  AnimatedChipStack, 
  AnimatedProgressRing, 
  FloatingActionButton, 
  Confetti, 
  TypingAnimation, 
  SwipeToReveal, 
  MagneticButton 
} from '@/components/ui/MicroInteractions';
import AppLayout from '@/src/components/layout/AppLayout';

export default function EnhancedDemoPage() {
  const [showConfetti, setShowConfetti] = useState(false);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [progressValue, setProgressValue] = useState(75);

  const handleAchievementClick = () => {
    setShowConfetti(true);
  };

  const handleProgressIncrease = () => {
    setProgressValue(prev => Math.min(prev + 10, 100));
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-4">
            <TypingAnimation text="🎮 Enhanced UI Showcase" speed={100} />
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            体验 PokerIQ Pro 的全新交互体验 - 包含微动画、触觉反馈和现代化界面组件
          </p>
        </motion.div>

        {/* Enhanced Buttons Section */}
        <motion.section 
          className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <Zap className="w-6 h-6 mr-2 text-yellow-500" />
            Enhanced Buttons
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <EnhancedButton 
              variant="primary" 
              size="lg"
              leftIcon={<PlayCircle className="w-5 h-5" />}
              onClick={() => alert('Primary button clicked!')}
            >
              开始游戏
            </EnhancedButton>
            
            <EnhancedButton 
              variant="success" 
              size="md"
              rightIcon={<Trophy className="w-4 h-4" />}
              onClick={handleAchievementClick}
            >
              获得成就
            </EnhancedButton>
            
            <EnhancedButton 
              variant="warning" 
              size="sm"
              loading={false}
              leftIcon={<Settings className="w-4 h-4" />}
            >
              设置选项
            </EnhancedButton>

            <EnhancedButton 
              variant="danger" 
              size="md"
              className="col-span-full"
            >
              重置所有数据
            </EnhancedButton>
          </div>
        </motion.section>

        {/* Enhanced Inputs Section */}
        <motion.section 
          className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <Target className="w-6 h-6 mr-2 text-blue-500" />
            Enhanced Inputs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EnhancedInput
              label="玩家昵称"
              placeholder="输入您的昵称"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              success={inputValue.length > 3 ? "昵称格式正确" : undefined}
              error={inputValue.length > 0 && inputValue.length <= 3 ? "昵称至少需要4个字符" : undefined}
              leftIcon={<Star className="w-4 h-4" />}
            />
            
            <EnhancedInput
              label="邮箱地址"
              type="email"
              placeholder="your@email.com"
              leftIcon={<Heart className="w-4 h-4" />}
            />
          </div>
        </motion.section>

        {/* Micro-interactions Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card Animations */}
          <motion.section 
            className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Card Flip Animation</h2>
            <div className="space-y-6">
              <AnimatedCard
                className="h-40"
                isFlipped={cardFlipped}
                onFlip={() => setCardFlipped(!cardFlipped)}
                frontContent={
                  <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl cursor-pointer">
                    🂡 A♠
                  </div>
                }
                backContent={
                  <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-xl cursor-pointer">
                    🂠 背面
                  </div>
                }
              />
              
              <div className="text-center">
                <EnhancedButton 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setCardFlipped(!cardFlipped)}
                >
                  {cardFlipped ? '翻到正面' : '翻到背面'}
                </EnhancedButton>
              </div>
            </div>
          </motion.section>

          {/* Chip Stack & Progress Ring */}
          <motion.section 
            className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Chip Stack & Progress</h2>
            <div className="flex items-center justify-around">
              <div className="text-center">
                <AnimatedChipStack 
                  value={500} 
                  color="red" 
                  count={6} 
                  className="mb-4"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-16">筹码堆栈</p>
              </div>
              
              <div className="text-center">
                <AnimatedProgressRing 
                  progress={progressValue} 
                  size={120}
                  color="#8b5cf6"
                  showPercentage={true}
                />
                <div className="mt-4">
                  <EnhancedButton 
                    variant="primary" 
                    size="sm"
                    onClick={handleProgressIncrease}
                    disabled={progressValue >= 100}
                  >
                    增加进度
                  </EnhancedButton>
                </div>
              </div>
            </div>
          </motion.section>
        </div>

        {/* Swipe to Reveal Demo */}
        <motion.section 
          className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Swipe to Reveal</h2>
          <div className="space-y-4">
            {['玩家消息 1', '玩家消息 2', '重要通知'].map((message, index) => (
              <SwipeToReveal
                key={index}
                className="h-16"
                revealContent={
                  <div className="flex items-center space-x-2 text-red-500">
                    <span>删除</span>
                    <span>🗑️</span>
                  </div>
                }
                onReveal={() => alert(`删除: ${message}`)}
              >
                <div className="h-16 px-4 flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <span className="text-gray-900 dark:text-white font-medium">{message}</span>
                  <span className="text-sm text-gray-500">向右滑动删除</span>
                </div>
              </SwipeToReveal>
            ))}
          </div>
        </motion.section>

        {/* Magnetic Buttons */}
        <motion.section 
          className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Magnetic Button Effect</h2>
          <div className="flex justify-center space-x-8">
            <MagneticButton 
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-2xl transition-shadow duration-300"
              strength={0.4}
              onClick={() => alert('Magnetic button clicked!')}
            >
              磁性按钮
            </MagneticButton>
            
            <MagneticButton 
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-2xl transition-shadow duration-300"
              strength={0.3}
              onClick={() => alert('Another magnetic button!')}
            >
              另一个磁性按钮
            </MagneticButton>
          </div>
        </motion.section>

        {/* Floating Action Button */}
        <FloatingActionButton
          icon={<Plus className="w-6 h-6" />}
          label="快速操作"
          color="primary"
          size="lg"
          pulse={true}
          onClick={() => alert('快速操作按钮被点击!')}
        />

        {/* Confetti Animation */}
        <Confetti 
          active={showConfetti} 
          onComplete={() => setShowConfetti(false)} 
        />
      </div>
    </AppLayout>
  );
}