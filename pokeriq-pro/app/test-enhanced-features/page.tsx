'use client';

import { useState } from 'react';
import { Brain, Target, Zap, BarChart3 } from 'lucide-react';

interface RecommendationData {
  recommendations: Array<{
    id: string;
    title: string;
    description: string;
    scenario: string;
    difficulty: number;
    estimatedTime: number;
    expectedImprovement: number;
    priority: number;
    reasoning: string;
    skillFocus: string[];
  }>;
  userProfile: {
    userId: string;
    overallRating: number;
    strongestSkill: string;
    weakestSkill: string;
    primaryLearningStyle: string;
    mainWeakness: string;
  };
}

interface GTOAnalysisData {
  strategy: Record<string, number>;
  exploitability: number;
  iterations: number;
  convergenceTime: number;
  recommendations: Array<{
    action: string;
    frequency: number;
    confidence: string;
    reasoning: string;
  }>;
}

export default function TestEnhancedFeaturesPage() {
  const [recommendationData, setRecommendationData] = useState<RecommendationData | null>(null);
  const [gtoData, setGTOData] = useState<GTOAnalysisData | null>(null);
  const [loading, setLoading] = useState({ recommendations: false, gto: false });
  const [error, setError] = useState({ recommendations: '', gto: '' });

  // 测试个性化推荐功能
  const testRecommendations = async () => {
    setLoading(prev => ({ ...prev, recommendations: true }));
    setError(prev => ({ ...prev, recommendations: '' }));
    
    try {
      const response = await fetch('/api/training/recommendations?userId=test_user&timeAvailable=45&difficulty=3');
      const result = await response.json();
      
      if (result.success) {
        setRecommendationData(result.data);
      } else {
        setError(prev => ({ ...prev, recommendations: result.error }));
      }
    } catch (err) {
      setError(prev => ({ ...prev, recommendations: err instanceof Error ? err.message : '未知错误' }));
    } finally {
      setLoading(prev => ({ ...prev, recommendations: false }));
    }
  };

  // 测试GTO分析功能
  const testGTOAnalysis = async () => {
    setLoading(prev => ({ ...prev, gto: true }));
    setError(prev => ({ ...prev, gto: '' }));
    
    // 构造测试游戏状态
    const testGameState = {
      street: 'flop',
      pot: 100,
      players: [
        {
          id: 0,
          position: 'BTN',
          stack: 1000,
          invested: 50,
          holeCards: 'AsKs',
          folded: false,
          allIn: false
        },
        {
          id: 1,
          position: 'BB',
          stack: 950,
          invested: 50,
          holeCards: 'XX',
          folded: false,
          allIn: false
        }
      ],
      currentPlayer: 0,
      communityCards: 'Ah7s2c',
      history: ['call']
    };
    
    try {
      const response = await fetch('/api/gto/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameState: testGameState,
          iterations: 1000
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setGTOData(result.data);
      } else {
        setError(prev => ({ ...prev, gto: result.error }));
      }
    } catch (err) {
      setError(prev => ({ ...prev, gto: err instanceof Error ? err.message : '未知错误' }));
    } finally {
      setLoading(prev => ({ ...prev, gto: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <div className="max-w-6xl mx-auto p-6">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            🔬 增强功能测试中心
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            测试新实现的GTO算法、用户画像和个性化推荐系统
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 个性化推荐测试 */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    个性化推荐引擎
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    基于用户画像生成训练建议
                  </p>
                </div>
              </div>
              
              <button
                onClick={testRecommendations}
                disabled={loading.recommendations}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading.recommendations ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>测试中...</span>
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4" />
                    <span>开始测试</span>
                  </>
                )}
              </button>
            </div>

            {error.recommendations && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm">
                  错误: {error.recommendations}
                </p>
              </div>
            )}

            {recommendationData && (
              <div className="space-y-4">
                {/* 用户画像摘要 */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">用户画像分析</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">整体评分:</span>
                      <span className="ml-2 font-medium text-blue-600 dark:text-blue-400">
                        {recommendationData.userProfile.overallRating}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">最强技能:</span>
                      <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                        {recommendationData.userProfile.strongestSkill}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">最弱技能:</span>
                      <span className="ml-2 font-medium text-red-600 dark:text-red-400">
                        {recommendationData.userProfile.weakestSkill}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">学习风格:</span>
                      <span className="ml-2 font-medium text-purple-600 dark:text-purple-400">
                        {recommendationData.userProfile.primaryLearningStyle}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-gray-600 dark:text-gray-400">主要弱点:</span>
                    <span className="ml-2 font-medium text-orange-600 dark:text-orange-400">
                      {recommendationData.userProfile.mainWeakness}
                    </span>
                  </div>
                </div>

                {/* 推荐列表 */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">训练推荐</h3>
                  <div className="space-y-3">
                    {recommendationData.recommendations.map((rec, index) => (
                      <div key={rec.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {rec.title}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                              难度 {rec.difficulty}
                            </span>
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded">
                              +{rec.expectedImprovement}分
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                          {rec.description}
                        </p>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 dark:text-gray-400">
                            预计时间: {rec.estimatedTime}分钟
                          </span>
                          <div className="flex items-center space-x-1">
                            {rec.skillFocus.map(skill => (
                              <span key={skill} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          推荐理由: {rec.reasoning}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* GTO 分析测试 */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    GTO 分析引擎
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    CFR算法求解最优策略
                  </p>
                </div>
              </div>
              
              <button
                onClick={testGTOAnalysis}
                disabled={loading.gto}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading.gto ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>计算中...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>开始分析</span>
                  </>
                )}
              </button>
            </div>

            {error.gto && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm">
                  错误: {error.gto}
                </p>
              </div>
            )}

            {gtoData && (
              <div className="space-y-4">
                {/* 分析统计 */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">分析统计</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">迭代次数:</span>
                      <span className="ml-2 font-medium text-blue-600 dark:text-blue-400">
                        {gtoData.iterations}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">计算时间:</span>
                      <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                        {gtoData.convergenceTime}ms
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600 dark:text-gray-400">可利用性:</span>
                      <span className="ml-2 font-medium text-purple-600 dark:text-purple-400">
                        {gtoData.exploitability.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 策略建议 */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">GTO策略建议</h3>
                  <div className="space-y-3">
                    {gtoData.recommendations.map((rec, index) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-900 dark:text-white capitalize">
                            {rec.action.replace('_', ' ')}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                              {rec.frequency}%
                            </span>
                            <span className={`px-2 py-1 text-xs rounded ${
                              rec.confidence === 'high' 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                : rec.confidence === 'medium'
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            }`}>
                              {rec.confidence}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          {rec.reasoning}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 原始策略数据 */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">原始策略分布</h3>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                      {Object.entries(gtoData.strategy).map(([action, freq]) => (
                        <div key={action} className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">{action}:</span>
                          <span className="text-gray-900 dark:text-white">
                            {(freq * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 测试说明 */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-4">
            ✨ 测试说明
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">个性化推荐引擎</h4>
              <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                <li>• 分析用户6个维度的技能水平</li>
                <li>• 识别学习风格和弱点模式</li>
                <li>• 基于AI算法生成个性化训练建议</li>
                <li>• 考虑时间限制和难度偏好</li>
                <li>• 提供详细的推荐理由和预期改进</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">GTO分析引擎</h4>
              <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                <li>• 使用CFR算法求解博弈论最优策略</li>
                <li>• 计算各种行动的最优频率</li>
                <li>• 提供策略可利用性分析</li>
                <li>• 生成具体的行动建议和推理</li>
                <li>• 支持多种游戏场景和位置</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}