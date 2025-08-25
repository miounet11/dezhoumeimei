'use client';

import { useState, useEffect, useRef } from 'react';
import { Button, Slider, Card, Select, Tag, Tooltip, Progress } from 'antd';
import {
  RotateLeftOutlined,
  RotateRightOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  EyeOutlined,
  CameraOutlined,
  ThunderboltOutlined,
  HeartOutlined,
  StarOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined
} from '@ant-design/icons';

const { Option } = Select;

interface Advanced3DViewerProps {
  companion: {
    id: string;
    name: string;
    nameLocalized: { zh: string; en: string };
    personality: string;
    level: number;
    intimacy: number;
    color: string;
    currentOutfit?: string;
    currentAccessories?: string[];
  };
  outfit?: string;
  accessories?: string[];
  onModelLoaded?: () => void;
  onInteraction?: (type: string) => void;
}

export const Advanced3DViewer: React.FC<Advanced3DViewerProps> = ({
  companion,
  outfit,
  accessories,
  onModelLoaded,
  onInteraction
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [animationPlaying, setAnimationPlaying] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState('idle');
  const [modelRotation, setModelRotation] = useState(0);
  const [modelScale, setModelScale] = useState(1.0);
  const [lightingMode, setLightingMode] = useState('soft');
  const [showEffects, setShowEffects] = useState(true);
  const [interactionMode, setInteractionMode] = useState('view');

  // 3D模型加载模拟
  useEffect(() => {
    const loadModel = async () => {
      setIsLoading(true);
      // 模拟3D模型加载过程
      await new Promise(resolve => setTimeout(resolve, 2500));
      setIsLoading(false);
      onModelLoaded?.();
    };

    loadModel();
  }, [companion.id, outfit, accessories]);

  // 动画系统
  const animations = [
    { id: 'idle', name: '站立', icon: '🧍‍♀️', duration: 0 },
    { id: 'wave', name: '挥手', icon: '👋', duration: 3000 },
    { id: 'dance', name: '舞蹈', icon: '💃', duration: 8000 },
    { id: 'bow', name: '鞠躬', icon: '🙇‍♀️', duration: 2000 },
    { id: 'heart', name: '比心', icon: '💖', duration: 2500 },
    { id: 'billiard', name: '台球动作', icon: '🎱', duration: 4000 },
    { id: 'poker', name: '发牌动作', icon: '🃏', duration: 3500 }
  ];

  const playAnimation = (animationId: string) => {
    setCurrentAnimation(animationId);
    setAnimationPlaying(true);
    
    const animation = animations.find(a => a.id === animationId);
    if (animation && animation.duration > 0) {
      setTimeout(() => {
        setAnimationPlaying(false);
        setCurrentAnimation('idle');
      }, animation.duration);
    }

    onInteraction?.(`animation:${animationId}`);
  };

  // 灯光设置
  const lightingModes = [
    { id: 'soft', name: '柔和光线', color: '#ffeaa7' },
    { id: 'dramatic', name: '戏剧光线', color: '#fd79a8' },
    { id: 'neon', name: '霓虹灯光', color: '#00cec9' },
    { id: 'romantic', name: '浪漫灯光', color: '#e17055' },
    { id: 'studio', name: '摄影灯光', color: '#ffffff' }
  ];

  // 交互模式
  const interactionModes = [
    { id: 'view', name: '观看模式', icon: <EyeOutlined /> },
    { id: 'pose', name: '摆拍模式', icon: <CameraOutlined /> },
    { id: 'interact', name: '互动模式', icon: <HeartOutlined /> },
    { id: 'effects', name: '特效模式', icon: <ThunderboltOutlined /> }
  ];

  return (
    <div className="advanced-3d-viewer">
      <Card 
        className="h-full"
        styles={{ 
          body: { padding: 0, height: '600px' },
        }}
      >
        {/* 3D画布区域 */}
        <div className="relative w-full h-96 bg-gradient-to-br from-purple-900 to-pink-900 overflow-hidden">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="text-center text-white">
                <div className="text-6xl mb-4 animate-spin">⚡</div>
                <div className="text-xl font-bold mb-2">正在加载3D模型...</div>
                <div className="text-sm opacity-75">
                  加载 {companion.nameLocalized.zh} 的专属模型
                </div>
                <Progress 
                  percent={85} 
                  strokeColor="#ff4d4f"
                  trailColor="#ffffff33"
                  className="mt-4 max-w-xs"
                />
              </div>
            </div>
          ) : (
            <>
              {/* 3D角色展示区 */}
              <div 
                className="w-full h-full flex items-center justify-center transition-all duration-500"
                style={{ 
                  transform: `scale(${modelScale}) rotate(${modelRotation}deg)`,
                  filter: `hue-rotate(${lightingMode === 'neon' ? '180deg' : '0deg'})`
                }}
              >
                {/* 角色模型占位 */}
                <div className="relative">
                  {/* 主体模型 */}
                  <div className="w-48 h-48 rounded-full flex items-center justify-center relative overflow-hidden">
                    <div 
                      className="absolute inset-0 rounded-full animate-pulse"
                      style={{ 
                        background: `radial-gradient(circle, ${companion.color}22, ${companion.color}88)`,
                        boxShadow: `0 0 60px ${companion.color}66`
                      }}
                    />
                    <div className="relative z-10">
                      <div 
                        className="text-8xl font-bold text-white drop-shadow-lg"
                        style={{ textShadow: `0 0 20px ${companion.color}` }}
                      >
                        {companion.nameLocalized.zh[0]}
                      </div>
                    </div>
                  </div>

                  {/* 动画特效 */}
                  {animationPlaying && (
                    <div className="absolute -inset-4">
                      {currentAnimation === 'heart' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          {Array.from({length: 8}).map((_, i) => (
                            <div
                              key={i}
                              className="absolute text-4xl animate-ping"
                              style={{
                                animationDelay: `${i * 200}ms`,
                                transform: `rotate(${i * 45}deg) translateY(-80px)`
                              }}
                            >
                              💖
                            </div>
                          ))}
                        </div>
                      )}
                      {currentAnimation === 'dance' && (
                        <div className="absolute -inset-8 border-4 border-pink-500 rounded-full animate-spin" />
                      )}
                      {currentAnimation === 'billiard' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-6xl animate-bounce">🎱</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 装备展示 */}
                  {accessories && accessories.length > 0 && (
                    <div className="absolute -top-4 -right-4">
                      {accessories.map((accessory, index) => (
                        <div 
                          key={accessory}
                          className="text-2xl animate-pulse"
                          style={{ animationDelay: `${index * 500}ms` }}
                        >
                          {accessory === 'pearl_necklace' && '📿'}
                          {accessory === 'crown' && '👑'}
                          {accessory === 'earrings' && '💎'}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 氛围特效 */}
              {showEffects && (
                <>
                  {/* 浮动粒子 */}
                  <div className="absolute inset-0 pointer-events-none">
                    {Array.from({length: 12}).map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-2 h-2 bg-white rounded-full opacity-30 animate-ping"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                          animationDelay: `${Math.random() * 3000}ms`,
                          animationDuration: `${2000 + Math.random() * 2000}ms`
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* 光晕效果 */}
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at center, transparent 40%, ${
                        lightingModes.find(m => m.id === lightingMode)?.color || '#ffeaa7'
                      }22 100%)`
                    }}
                  />
                </>
              )}
            </>
          )}

          {/* 右上角信息显示 */}
          <div className="absolute top-4 right-4 text-white text-right">
            <div className="text-sm opacity-75">
              {animations.find(a => a.id === currentAnimation)?.name}
            </div>
            {animationPlaying && (
              <div className="text-xs opacity-50">
                动画播放中...
              </div>
            )}
          </div>

          {/* 左上角状态信息 */}
          <div className="absolute top-4 left-4 text-white">
            <div className="bg-black bg-opacity-50 rounded-lg p-2">
              <div className="text-lg font-bold">{companion.nameLocalized.zh}</div>
              <div className="text-xs opacity-75">
                Lv.{companion.level} • ❤️{companion.intimacy}%
              </div>
            </div>
          </div>
        </div>

        {/* 控制面板 */}
        <div className="p-4 bg-gray-50 space-y-4">
          {/* 动画控制 */}
          <div>
            <div className="text-sm font-semibold mb-2 flex items-center">
              <PlayCircleOutlined className="mr-2" />
              动画控制
            </div>
            <div className="flex flex-wrap gap-2">
              {animations.map(animation => (
                <Tooltip key={animation.id} title={animation.name}>
                  <Button
                    size="small"
                    type={currentAnimation === animation.id ? 'primary' : 'default'}
                    disabled={animationPlaying && currentAnimation !== animation.id}
                    onClick={() => playAnimation(animation.id)}
                  >
                    <span className="text-xs">{animation.icon}</span>
                  </Button>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* 视角和光照控制 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-semibold mb-2">视角控制</div>
              <div className="flex items-center space-x-2">
                <Button 
                  size="small" 
                  icon={<RotateLeftOutlined />}
                  onClick={() => setModelRotation(r => r - 45)}
                />
                <Slider
                  value={modelRotation}
                  onChange={setModelRotation}
                  min={0}
                  max={360}
                  step={15}
                  className="flex-1"
                />
                <Button 
                  size="small" 
                  icon={<RotateRightOutlined />}
                  onClick={() => setModelRotation(r => r + 45)}
                />
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <Button 
                  size="small" 
                  icon={<ZoomOutOutlined />}
                  onClick={() => setModelScale(s => Math.max(0.5, s - 0.1))}
                />
                <Slider
                  value={modelScale}
                  onChange={setModelScale}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="flex-1"
                />
                <Button 
                  size="small" 
                  icon={<ZoomInOutlined />}
                  onClick={() => setModelScale(s => Math.min(2.0, s + 0.1))}
                />
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold mb-2">灯光模式</div>
              <Select
                value={lightingMode}
                onChange={setLightingMode}
                size="small"
                className="w-full mb-2"
              >
                {lightingModes.map(mode => (
                  <Option key={mode.id} value={mode.id}>
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: mode.color }}
                      />
                      {mode.name}
                    </div>
                  </Option>
                ))}
              </Select>
              <div className="flex items-center space-x-2">
                <Button
                  size="small"
                  type={showEffects ? 'primary' : 'default'}
                  onClick={() => setShowEffects(!showEffects)}
                  icon={<ThunderboltOutlined />}
                >
                  特效
                </Button>
                <Button
                  size="small"
                  icon={<CameraOutlined />}
                  onClick={() => onInteraction?.('screenshot')}
                >
                  截图
                </Button>
              </div>
            </div>
          </div>

          {/* 交互模式切换 */}
          <div>
            <div className="text-sm font-semibold mb-2">交互模式</div>
            <div className="flex space-x-2">
              {interactionModes.map(mode => (
                <Button
                  key={mode.id}
                  size="small"
                  type={interactionMode === mode.id ? 'primary' : 'default'}
                  icon={mode.icon}
                  onClick={() => {
                    setInteractionMode(mode.id);
                    onInteraction?.(mode.id);
                  }}
                >
                  {mode.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Advanced3DViewer;