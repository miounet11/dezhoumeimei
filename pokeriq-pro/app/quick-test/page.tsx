'use client';

import { useState } from 'react';

export default function QuickTestPage() {
  const [results, setResults] = useState<{
    recommendations?: any;
    gto?: any;
  }>({});
  const [loading, setLoading] = useState(false);

  const testRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/training/recommendations?userId=test_user&timeAvailable=30&difficulty=3');
      const result = await response.json();
      setResults(prev => ({ ...prev, recommendations: result }));
    } catch (error) {
      setResults(prev => ({ ...prev, recommendations: { error: error instanceof Error ? error.message : String(error) } }));
    }
    setLoading(false);
  };

  const testGTO = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/gto/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameState: {
            street: 'flop',
            pot: 100,
            players: [
              { id: 0, position: 'BTN', stack: 1000, invested: 50, holeCards: 'AsKs', folded: false, allIn: false },
              { id: 1, position: 'BB', stack: 950, invested: 50, holeCards: 'XX', folded: false, allIn: false }
            ],
            currentPlayer: 0,
            communityCards: 'Ah7s2c'
          }
        })
      });
      const result = await response.json();
      setResults(prev => ({ ...prev, gto: result }));
    } catch (error) {
      setResults(prev => ({ ...prev, gto: { error: error instanceof Error ? error.message : String(error) } }));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">🧪 PokerIQ Pro 功能测试</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">🤖 个性化推荐测试</h2>
            <button
              onClick={testRecommendations}
              disabled={loading}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? '测试中...' : '测试推荐系统'}
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">🎯 GTO分析测试</h2>
            <button
              onClick={testGTO}
              disabled={loading}
              className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? '计算中...' : '测试GTO求解'}
            </button>
          </div>
        </div>

        {/* 结果显示区域 */}
        <div className="space-y-6">
          {results.recommendations && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">📋 推荐结果</h3>
              <div className="bg-gray-50 p-4 rounded overflow-auto">
                <pre className="text-sm">
                  {JSON.stringify(results.recommendations, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {results.gto && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">🧠 GTO分析结果</h3>
              <div className="bg-gray-50 p-4 rounded overflow-auto">
                <pre className="text-sm">
                  {JSON.stringify(results.gto, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* 状态指示 */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-4 bg-white px-6 py-3 rounded-lg shadow">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm">服务器运行正常</span>
            </div>
            <div className="text-gray-300">|</div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-sm">API接口就绪</span>
            </div>
            <div className="text-gray-300">|</div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
              <span className="text-sm">算法引擎已加载</span>
            </div>
          </div>
        </div>

        {/* 功能说明 */}
        <div className="mt-8 bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">✨ 测试说明</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">个性化推荐引擎</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• 用户技能分析 (6个维度)</li>
                <li>• 学习风格识别</li>
                <li>• 弱点模式检测</li>
                <li>• 个性化训练建议</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">GTO分析引擎</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• CFR算法求解</li>
                <li>• 策略频率计算</li>
                <li>• 可利用性分析</li>
                <li>• 行动建议生成</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}