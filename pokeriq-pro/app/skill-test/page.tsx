'use client';

import { useState, useEffect } from 'react';
import { Trophy, Rocket, Zap, Flame, Crown, Star, Clock, ArrowUp, TestTube, Radar, LineChart, Users, HelpCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/src/components/layout/AppLayout';

export default function SkillTestPage() {
  const router = useRouter();
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [userHistory, setUserHistory] = useState<any>(null);

  useEffect(() => {
    // 加载用户历史数据
    const savedHistory = localStorage.getItem('skillTestHistory');
    if (savedHistory) {
      setUserHistory(JSON.parse(savedHistory));
    }
  }, []);

  const testModes = [
    {
      id: 'quick',
      name: '快速测试',
      duration: '5分钟',
      questions: 20,
      icon: <Zap size={48} />,
      color: 'text-green-500',
      description: '快速评估你的当前水平',
      features: ['20个精选场景', '即时反馈', '快速报告'],
      recommended: true
    },
    {
      id: 'standard',
      name: '标准测试',
      duration: '15分钟',
      questions: 50,
      icon: <Flame size={48} />,
      color: 'text-blue-500',
      description: '全面分析你的扑克技能',
      features: ['50个综合场景', '详细分析', '个性化建议']
    },
    {
      id: 'deep',
      name: '深度测试',
      duration: '30分钟',
      questions: 100,
      icon: <TestTube size={48} />,
      color: 'text-purple-500',
      description: '专业级别的深度评估',
      features: ['100个高级场景', '专业认证', '训练计划']
    }
  ];

  const rankTiers = [
    { name: '青铜', color: 'text-amber-700', range: '0-1000', icon: '🥉' },
    { name: '白银', color: 'text-gray-400', range: '1001-2000', icon: '🥈' },
    { name: '黄金', color: 'text-yellow-500', range: '2001-3000', icon: '🥇' },
    { name: '铂金', color: 'text-gray-300', range: '3001-4000', icon: '💎' },
    { name: '钻石', color: 'text-blue-200', range: '4001-5000', icon: '💠' },
    { name: '大师', color: 'text-red-500', range: '5001-6000', icon: '🎯' },
    { name: '宗师', color: 'text-red-800', range: '6001-7000', icon: '👑' },
    { name: '传奇', color: 'text-yellow-500', range: '7001+', icon: '🏆' }
  ];

  const skillDimensions = [
    { name: '激进度', key: 'aggression', description: '进攻性和主动性' },
    { name: '紧凶度', key: 'tightness', description: '起手牌选择标准' },
    { name: '位置意识', key: 'position', description: '位置优势利用' },
    { name: '读牌能力', key: 'handReading', description: '对手范围判断' },
    { name: '数学思维', key: 'mathematical', description: 'EV计算和赔率' },
    { name: '心理博弈', key: 'psychological', description: '诈唬与价值平衡' }
  ];

  const handleStartTest = (testId: string) => {
    setSelectedTest(testId);
    setShowModal(true);
  };

  const confirmStartTest = () => {
    if (selectedTest) {
      // 保存测试类型到localStorage
      localStorage.setItem('currentTestType', selectedTest);
      router.push('/skill-test/session');
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
        {/* 页面头部 */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center">
                <Radar size={24} className="mr-2" /> PokerIQ 水平测试
              </h2>
              <p className="opacity-90">
                通过科学的测试体系，精确评估你的德州扑克水平
              </p>
            </div>
            {userHistory && (
              <div className="text-right">
                <p className="text-sm">你的最佳成绩</p>
                <h3 className="text-xl font-bold">{userHistory.bestScore || 0} 分</h3>
                <span className="bg-yellow-500 text-white px-2 py-1 rounded text-xs">{userHistory.currentRank || '未评级'}</span>
              </div>
            )}
          </div>
        </div>

        {/* 测试模式选择 */}
        <h4 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">选择测试模式</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {testModes.map(mode => (
            <div key={mode.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow relative cursor-pointer" onClick={() => handleStartTest(mode.id)}>
              {mode.recommended && (
                <span className="absolute top-0 right-0 bg-red-500 text-white px-2 py-1 rounded-bl text-xs">推荐</span>
              )}
              <div className="text-center mb-4">
                <div className={mode.color + " mb-2"}>
                  {mode.icon}
                </div>
                <h4 className="text-lg font-bold mb-2">{mode.name}</h4>
                <div className="flex justify-center space-x-2">
                  <span className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-sm flex items-center"><Clock size={14} className="mr-1" />{mode.duration}</span>
                  <span className="bg-blue-200 dark:bg-blue-900 px-2 py-1 rounded text-sm">{mode.questions} 题</span>
                </div>
              </div>
              <p className="text-center text-gray-600 dark:text-gray-400 mb-4">{mode.description}</p>
              <div className="mb-4">
                {mode.features.map((feature, index) => (
                  <div key={index} className="flex items-center mb-2 text-gray-600 dark:text-gray-400">
                    <Star size={16} className={`mr-2 ${mode.color}`} />
                    {feature}
                  </div>
                ))}
              </div>
              <button className={`w-full py-2 rounded-lg text-white font-medium transition-colors`} style={{backgroundColor: mode.color.split('-')[1]}}>
                开始测试
              </button>
            </div>
          ))}
        </div>

        {/* 技能维度说明 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h4 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">六维技能评估体系</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {skillDimensions.map(dim => (
              <div key={dim.key} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-center">
                <h5 className="font-bold mb-2">{dim.name}</h5>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{dim.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 天梯段位说明 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h4 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">天梯排名系统</h4>
          <div className="grid grid-cols-2 md:grid-cols-8 gap-2">
            {rankTiers.map(tier => (
              <div key={tier.name} className="rounded-lg p-2 text-center border" style={{borderColor: tier.color.split('-')[1], background: `rgba(255,255,255,0.1)`}}>
                <div className="text-2xl mb-1">{tier.icon}</div>
                <p className={`font-bold ${tier.color}`}>{tier.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{tier.range}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 测试说明 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h4 className="text-lg font-bold mb-4">测试流程</h4>
            <ol className="list-decimal pl-5 space-y-2 text-gray-600 dark:text-gray-400">
              <li>选择适合你的测试模式</li>
              <li>每个场景有15秒决策时间</li>
              <li>根据GTO策略评估你的决策</li>
              <li>测试结束后生成详细报告</li>
              <li>获得个性化训练建议</li>
            </ol>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h4 className="text-lg font-bold mb-4">评分标准</h4>
            <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-400">
              <li>完美决策：100分</li>
              <li>良好决策：70-99分</li>
              <li>可接受：40-69分</li>
              <li>重大失误：0-39分</li>
              <li>快速正确决策有额外加分</li>
            </ul>
          </div>
        </div>

        {/* 开始测试确认弹窗 */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-96 max-w-full">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">准备开始测试</h3>
              <div className="bg-blue-50 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 p-4 rounded-lg mb-4">
                <h4 className="font-bold mb-2">测试须知</h4>
                <p>1. 请确保有足够的时间完成测试</p>
                <p>2. 测试过程中请独立完成，不要查阅资料</p>
                <p>3. 每个场景限时15秒，超时将自动提交</p>
                <p>4. 测试结果将用于生成你的技能报告</p>
              </div>
              <div className="flex space-x-4">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">取消</button>
                <button onClick={confirmStartTest} className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">开始测试</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
