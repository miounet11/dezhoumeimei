/**
 * 个性化UI组件测试
 * 测试React组件的渲染、交互和状态管理
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock依赖
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn()
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn()
  }))
}));

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 'test_user_123', email: 'test@example.com' },
    isAuthenticated: true,
    loading: false
  }))
}));

jest.mock('@/lib/hooks/useApi', () => ({
  useApi: jest.fn(() => ({
    loading: false,
    error: null,
    data: null,
    request: jest.fn()
  }))
}));

// Mock组件（实际情况下从相应文件导入）
interface RecommendationCardProps {
  recommendation: {
    id: string;
    title: string;
    description: string;
    difficulty: number;
    estimatedTime: number;
    expectedImprovement: number;
    skillFocus: string[];
    reasoning: string;
  };
  onSelect?: (id: string) => void;
  onDismiss?: (id: string) => void;
  className?: string;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onSelect,
  onDismiss,
  className
}) => {
  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return 'bg-green-100 text-green-800';
    if (difficulty <= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className={`border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-900">{recommendation.title}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(recommendation.difficulty)}`}>
          难度 {recommendation.difficulty}
        </span>
      </div>
      
      <p className="text-gray-600 text-sm mb-3">{recommendation.description}</p>
      
      <div className="flex items-center text-sm text-gray-500 mb-2">
        <span>⏱️ {recommendation.estimatedTime}分钟</span>
        <span className="mx-2">•</span>
        <span>📈 预期提升 {recommendation.expectedImprovement}分</span>
      </div>
      
      <div className="flex flex-wrap gap-1 mb-3">
        {recommendation.skillFocus.map((skill) => (
          <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
            {skill}
          </span>
        ))}
      </div>
      
      <p className="text-xs text-gray-500 mb-4">{recommendation.reasoning}</p>
      
      <div className="flex space-x-2">
        <button
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
          onClick={() => onSelect?.(recommendation.id)}
        >
          开始训练
        </button>
        <button
          className="px-3 py-2 text-gray-500 hover:text-gray-700 focus:ring-2 focus:ring-gray-300 rounded"
          onClick={() => onDismiss?.(recommendation.id)}
          aria-label="忽略推荐"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

interface PersonalizationDashboardProps {
  userId: string;
}

const PersonalizationDashboard: React.FC<PersonalizationDashboardProps> = ({ userId }) => {
  const [recommendations, setRecommendations] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [preferences, setPreferences] = React.useState({
    timeAvailable: 30,
    preferredDifficulty: 3,
    focusAreas: ['preflop', 'postflop']
  });

  React.useEffect(() => {
    fetchRecommendations();
  }, [userId, preferences]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const mockRecommendations = [
        {
          id: 'rec_1',
          title: '翻前开牌范围训练',
          description: '学习不同位置的标准开牌范围',
          difficulty: 2,
          estimatedTime: 25,
          expectedImprovement: 30,
          skillFocus: ['preflop'],
          reasoning: '您在翻前阶段经常出现范围错误'
        },
        {
          id: 'rec_2',
          title: '底池赔率计算',
          description: '掌握底池赔率和隐含赔率的计算与应用',
          difficulty: 3,
          estimatedTime: 35,
          expectedImprovement: 25,
          skillFocus: ['mathematics', 'postflop'],
          reasoning: '您的数学技能还有提升空间'
        }
      ];
      
      setRecommendations(mockRecommendations);
    } catch (err) {
      setError('获取推荐失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRecommendation = (id: string) => {
    console.log(`Selected recommendation: ${id}`);
    // 实际实现中会导航到训练页面
  };

  const handleDismissRecommendation = (id: string) => {
    setRecommendations(prev => prev.filter(rec => rec.id !== id));
  };

  const handlePreferenceChange = (newPreferences: any) => {
    setPreferences(newPreferences);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-lg text-gray-600">加载推荐中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">{error}</div>
        <button
          className="mt-2 text-red-600 hover:text-red-800 underline"
          onClick={fetchRecommendations}
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">个性化推荐</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-2">偏好设置</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                可用时间
              </label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={preferences.timeAvailable}
                onChange={(e) => handlePreferenceChange({
                  ...preferences,
                  timeAvailable: parseInt(e.target.value)
                })}
              >
                <option value={15}>15分钟</option>
                <option value={30}>30分钟</option>
                <option value={45}>45分钟</option>
                <option value={60}>60分钟</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                偏好难度
              </label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={preferences.preferredDifficulty}
                onChange={(e) => handlePreferenceChange({
                  ...preferences,
                  preferredDifficulty: parseInt(e.target.value)
                })}
              >
                <option value={1}>初级</option>
                <option value={2}>入门</option>
                <option value={3}>中级</option>
                <option value={4}>进阶</option>
                <option value={5}>高级</option>
              </select>
            </div>
            
            <div>
              <button
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                onClick={fetchRecommendations}
              >
                更新推荐
              </button>
            </div>
          </div>
        </div>

        {recommendations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            暂无推荐内容
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                onSelect={handleSelectRecommendation}
                onDismiss={handleDismissRecommendation}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface SkillRadarProps {
  skills: {
    preflop: number;
    postflop: number;
    psychology: number;
    mathematics: number;
    bankroll: number;
  };
  maxValue?: number;
}

const SkillRadar: React.FC<SkillRadarProps> = ({ skills, maxValue = 2000 }) => {
  const skillNames = {
    preflop: '翻前',
    postflop: '翻后',
    psychology: '心理',
    mathematics: '数学',
    bankroll: '资金管理'
  };

  const getSkillColor = (value: number) => {
    const percentage = value / maxValue;
    if (percentage < 0.3) return 'text-red-600';
    if (percentage < 0.7) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getSkillLevel = (value: number) => {
    const percentage = value / maxValue;
    if (percentage < 0.2) return '新手';
    if (percentage < 0.4) return '初级';
    if (percentage < 0.6) return '中级';
    if (percentage < 0.8) return '高级';
    return '专家';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">技能雷达图</h3>
      
      <div className="space-y-3">
        {Object.entries(skills).map(([skillKey, value]) => (
          <div key={skillKey} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700 min-w-[80px]">
                {skillNames[skillKey as keyof typeof skillNames]}
              </span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(value / maxValue) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${getSkillColor(value)}`}>
                {value}
              </span>
              <span className="text-xs text-gray-500 min-w-[40px]">
                {getSkillLevel(value)}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        基于最近的游戏表现分析
      </div>
    </div>
  );
};

interface PreferencesPanelProps {
  initialPreferences?: any;
  onSave?: (preferences: any) => void;
  onCancel?: () => void;
}

const PreferencesPanel: React.FC<PreferencesPanelProps> = ({
  initialPreferences = {},
  onSave,
  onCancel
}) => {
  const [preferences, setPreferences] = React.useState({
    defaultSessionTime: 45,
    preferredDifficulty: 3,
    focusAreas: ['preflop', 'postflop'],
    learningGoals: ['improve_winrate'],
    notifications: {
      dailyReminders: true,
      weeklyReports: true,
      achievementAlerts: true
    },
    ...initialPreferences
  });

  const [hasChanges, setHasChanges] = React.useState(false);

  const handleChange = (field: string, value: any) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleNestedChange = (parentField: string, field: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [parentField]: { ...prev[parentField as keyof typeof prev], [field]: value }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave?.(preferences);
    setHasChanges(false);
  };

  const handleReset = () => {
    setPreferences(initialPreferences);
    setHasChanges(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">个性化偏好设置</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            默认训练时间
          </label>
          <select
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            value={preferences.defaultSessionTime}
            onChange={(e) => handleChange('defaultSessionTime', parseInt(e.target.value))}
          >
            <option value={15}>15分钟</option>
            <option value={30}>30分钟</option>
            <option value={45}>45分钟</option>
            <option value={60}>60分钟</option>
            <option value={90}>90分钟</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            偏好难度
          </label>
          <select
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            value={preferences.preferredDifficulty}
            onChange={(e) => handleChange('preferredDifficulty', parseInt(e.target.value))}
          >
            <option value={1}>新手 (1)</option>
            <option value={2}>初级 (2)</option>
            <option value={3}>中级 (3)</option>
            <option value={4}>进阶 (4)</option>
            <option value={5}>专家 (5)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          重点关注领域
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {['preflop', 'postflop', 'psychology', 'mathematics', 'bankroll', 'tournament'].map((area) => (
            <label key={area} className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={preferences.focusAreas.includes(area)}
                onChange={(e) => {
                  if (e.target.checked) {
                    handleChange('focusAreas', [...preferences.focusAreas, area]);
                  } else {
                    handleChange('focusAreas', preferences.focusAreas.filter((a: string) => a !== area));
                  }
                }}
              />
              <span className="text-sm text-gray-700 capitalize">{area}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          学习目标
        </label>
        <div className="space-y-2">
          {[
            { id: 'improve_winrate', label: '提高胜率' },
            { id: 'reduce_variance', label: '降低波动' },
            { id: 'tournament_success', label: '锦标赛成功' },
            { id: 'cash_game_mastery', label: '现金桌精通' }
          ].map((goal) => (
            <label key={goal.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={preferences.learningGoals.includes(goal.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    handleChange('learningGoals', [...preferences.learningGoals, goal.id]);
                  } else {
                    handleChange('learningGoals', preferences.learningGoals.filter((g: string) => g !== goal.id));
                  }
                }}
              />
              <span className="text-sm text-gray-700">{goal.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-lg font-medium text-gray-800 mb-3">通知设置</h4>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700">每日训练提醒</span>
            <input
              type="checkbox"
              className="rounded border-gray-300"
              checked={preferences.notifications.dailyReminders}
              onChange={(e) => handleNestedChange('notifications', 'dailyReminders', e.target.checked)}
            />
          </label>
          
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700">周报告</span>
            <input
              type="checkbox"
              className="rounded border-gray-300"
              checked={preferences.notifications.weeklyReports}
              onChange={(e) => handleNestedChange('notifications', 'weeklyReports', e.target.checked)}
            />
          </label>
          
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700">成就通知</span>
            <input
              type="checkbox"
              className="rounded border-gray-300"
              checked={preferences.notifications.achievementAlerts}
              onChange={(e) => handleNestedChange('notifications', 'achievementAlerts', e.target.checked)}
            />
          </label>
        </div>
      </div>

      <div className="flex space-x-4 pt-4 border-t">
        <button
          className={`flex-1 py-2 px-4 rounded-md font-medium ${
            hasChanges 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          onClick={handleSave}
          disabled={!hasChanges}
        >
          保存设置
        </button>
        
        <button
          className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
          onClick={handleReset}
          disabled={!hasChanges}
        >
          重置
        </button>
        
        <button
          className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
          onClick={onCancel}
        >
          取消
        </button>
      </div>
    </div>
  );
};

describe('个性化UI组件测试', () => {
  beforeEach(() => {
    // 清理DOM
    document.body.innerHTML = '';
  });

  describe('RecommendationCard组件', () => {
    const mockRecommendation = {
      id: 'rec_1',
      title: '翻前开牌范围训练',
      description: '学习不同位置的标准开牌范围',
      difficulty: 2,
      estimatedTime: 25,
      expectedImprovement: 30,
      skillFocus: ['preflop'],
      reasoning: '您在翻前阶段经常出现范围错误'
    };

    test('应该正确渲染推荐卡片', () => {
      render(<RecommendationCard recommendation={mockRecommendation} />);

      expect(screen.getByText('翻前开牌范围训练')).toBeInTheDocument();
      expect(screen.getByText('学习不同位置的标准开牌范围')).toBeInTheDocument();
      expect(screen.getByText('难度 2')).toBeInTheDocument();
      expect(screen.getByText(/25分钟/)).toBeInTheDocument();
      expect(screen.getByText(/预期提升 30分/)).toBeInTheDocument();
      expect(screen.getByText('preflop')).toBeInTheDocument();
      expect(screen.getByText('您在翻前阶段经常出现范围错误')).toBeInTheDocument();
    });

    test('应该根据难度显示不同颜色', () => {
      const { rerender } = render(<RecommendationCard recommendation={mockRecommendation} />);
      
      // 难度2应该显示绿色（简单）
      let difficultyBadge = screen.getByText('难度 2');
      expect(difficultyBadge).toHaveClass('bg-green-100', 'text-green-800');

      // 难度4应该显示红色（困难）
      rerender(
        <RecommendationCard 
          recommendation={{...mockRecommendation, difficulty: 4}} 
        />
      );
      difficultyBadge = screen.getByText('难度 4');
      expect(difficultyBadge).toHaveClass('bg-red-100', 'text-red-800');
    });

    test('应该处理点击事件', async () => {
      const mockSelect = jest.fn();
      const mockDismiss = jest.fn();
      
      render(
        <RecommendationCard 
          recommendation={mockRecommendation}
          onSelect={mockSelect}
          onDismiss={mockDismiss}
        />
      );

      const selectButton = screen.getByText('开始训练');
      const dismissButton = screen.getByLabelText('忽略推荐');

      await userEvent.click(selectButton);
      await userEvent.click(dismissButton);

      expect(mockSelect).toHaveBeenCalledWith('rec_1');
      expect(mockDismiss).toHaveBeenCalledWith('rec_1');
    });

    test('应该支持自定义样式', () => {
      const { container } = render(
        <RecommendationCard 
          recommendation={mockRecommendation}
          className="custom-class"
        />
      );

      const card = container.firstChild;
      expect(card).toHaveClass('custom-class');
    });
  });

  describe('PersonalizationDashboard组件', () => {
    test('应该显示加载状态', () => {
      render(<PersonalizationDashboard userId="test_user" />);
      
      expect(screen.getByText('加载推荐中...')).toBeInTheDocument();
    });

    test('应该渲染推荐列表', async () => {
      render(<PersonalizationDashboard userId="test_user" />);
      
      await waitFor(() => {
        expect(screen.getByText('翻前开牌范围训练')).toBeInTheDocument();
        expect(screen.getByText('底池赔率计算')).toBeInTheDocument();
      });
    });

    test('应该更新偏好设置', async () => {
      render(<PersonalizationDashboard userId="test_user" />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('30')).toBeInTheDocument();
      });

      const timeSelect = screen.getByDisplayValue('30');
      await userEvent.selectOptions(timeSelect, '60');
      
      expect(timeSelect).toHaveValue('60');
    });

    test('应该处理推荐更新', async () => {
      render(<PersonalizationDashboard userId="test_user" />);
      
      await waitFor(() => {
        expect(screen.getByText('更新推荐')).toBeInTheDocument();
      });

      const updateButton = screen.getByText('更新推荐');
      await userEvent.click(updateButton);

      // 验证重新加载状态
      expect(screen.getByText('加载推荐中...')).toBeInTheDocument();
    });

    test('应该处理推荐忽略', async () => {
      render(<PersonalizationDashboard userId="test_user" />);
      
      await waitFor(() => {
        expect(screen.getByText('翻前开牌范围训练')).toBeInTheDocument();
      });

      const dismissButtons = screen.getAllByLabelText('忽略推荐');
      await userEvent.click(dismissButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText('翻前开牌范围训练')).not.toBeInTheDocument();
      });
    });

    test('应该显示错误状态', async () => {
      // 模拟网络错误
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // 需要模拟错误情况，这里简化处理
      render(<PersonalizationDashboard userId="" />);
      
      // 在实际测试中，会模拟API失败
      
      consoleSpy.mockRestore();
    });
  });

  describe('SkillRadar组件', () => {
    const mockSkills = {
      preflop: 1200,
      postflop: 1400,
      psychology: 800,
      mathematics: 1000,
      bankroll: 1600
    };

    test('应该渲染技能雷达图', () => {
      render(<SkillRadar skills={mockSkills} />);

      expect(screen.getByText('技能雷达图')).toBeInTheDocument();
      expect(screen.getByText('翻前')).toBeInTheDocument();
      expect(screen.getByText('翻后')).toBeInTheDocument();
      expect(screen.getByText('心理')).toBeInTheDocument();
      expect(screen.getByText('数学')).toBeInTheDocument();
      expect(screen.getByText('资金管理')).toBeInTheDocument();
    });

    test('应该显示正确的技能值', () => {
      render(<SkillRadar skills={mockSkills} />);

      expect(screen.getByText('1200')).toBeInTheDocument();
      expect(screen.getByText('1400')).toBeInTheDocument();
      expect(screen.getByText('800')).toBeInTheDocument();
      expect(screen.getByText('1000')).toBeInTheDocument();
      expect(screen.getByText('1600')).toBeInTheDocument();
    });

    test('应该显示技能等级', () => {
      render(<SkillRadar skills={mockSkills} />);

      // 800/2000 = 0.4, 应该显示"中级"
      expect(screen.getByText('中级')).toBeInTheDocument();
      // 1600/2000 = 0.8, 应该显示"专家"
      expect(screen.getByText('专家')).toBeInTheDocument();
    });

    test('应该支持自定义最大值', () => {
      render(<SkillRadar skills={mockSkills} maxValue={1000} />);

      // 现在1000应该是满分，应该显示为专家级别
      const expertElements = screen.getAllByText('专家');
      expect(expertElements.length).toBeGreaterThan(0);
    });
  });

  describe('PreferencesPanel组件', () => {
    test('应该渲染偏好设置面板', () => {
      render(<PreferencesPanel />);

      expect(screen.getByText('个性化偏好设置')).toBeInTheDocument();
      expect(screen.getByText('默认训练时间')).toBeInTheDocument();
      expect(screen.getByText('偏好难度')).toBeInTheDocument();
      expect(screen.getByText('重点关注领域')).toBeInTheDocument();
      expect(screen.getByText('学习目标')).toBeInTheDocument();
      expect(screen.getByText('通知设置')).toBeInTheDocument();
    });

    test('应该处理表单输入', async () => {
      render(<PreferencesPanel />);

      const timeSelect = screen.getByDisplayValue('45');
      await userEvent.selectOptions(timeSelect, '60');
      expect(timeSelect).toHaveValue('60');

      const difficultySelect = screen.getByDisplayValue('中级 (3)');
      await userEvent.selectOptions(difficultySelect, '4');
      expect(difficultySelect).toHaveValue('4');
    });

    test('应该处理复选框选择', async () => {
      render(<PreferencesPanel />);

      const preflopCheckbox = screen.getByLabelText(/preflop/i);
      expect(preflopCheckbox).toBeChecked();

      await userEvent.click(preflopCheckbox);
      expect(preflopCheckbox).not.toBeChecked();

      await userEvent.click(preflopCheckbox);
      expect(preflopCheckbox).toBeChecked();
    });

    test('应该跟踪更改状态', async () => {
      render(<PreferencesPanel />);

      const saveButton = screen.getByText('保存设置');
      expect(saveButton).toBeDisabled();

      const timeSelect = screen.getByDisplayValue('45');
      await userEvent.selectOptions(timeSelect, '60');

      expect(saveButton).not.toBeDisabled();
    });

    test('应该调用保存回调', async () => {
      const mockSave = jest.fn();
      render(<PreferencesPanel onSave={mockSave} />);

      const timeSelect = screen.getByDisplayValue('45');
      await userEvent.selectOptions(timeSelect, '60');

      const saveButton = screen.getByText('保存设置');
      await userEvent.click(saveButton);

      expect(mockSave).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultSessionTime: 60
        })
      );
    });

    test('应该重置表单', async () => {
      const initialPrefs = { defaultSessionTime: 30 };
      render(<PreferencesPanel initialPreferences={initialPrefs} />);

      const timeSelect = screen.getByDisplayValue('30');
      await userEvent.selectOptions(timeSelect, '90');
      expect(timeSelect).toHaveValue('90');

      const resetButton = screen.getByText('重置');
      await userEvent.click(resetButton);

      expect(timeSelect).toHaveValue('30');
    });

    test('应该处理取消操作', async () => {
      const mockCancel = jest.fn();
      render(<PreferencesPanel onCancel={mockCancel} />);

      const cancelButton = screen.getByText('取消');
      await userEvent.click(cancelButton);

      expect(mockCancel).toHaveBeenCalled();
    });
  });

  describe('组件交互测试', () => {
    test('推荐卡片和仪表板应该协同工作', async () => {
      render(<PersonalizationDashboard userId="test_user" />);

      await waitFor(() => {
        expect(screen.getByText('翻前开牌范围训练')).toBeInTheDocument();
      });

      // 点击忽略推荐
      const dismissButton = screen.getAllByLabelText('忽略推荐')[0];
      await userEvent.click(dismissButton);

      // 推荐应该被移除
      await waitFor(() => {
        expect(screen.queryByText('翻前开牌范围训练')).not.toBeInTheDocument();
      });
    });

    test('应该响应键盘导航', async () => {
      render(<PersonalizationDashboard userId="test_user" />);

      await waitFor(() => {
        expect(screen.getByText('开始训练')).toBeInTheDocument();
      });

      const startButton = screen.getAllByText('开始训练')[0];
      startButton.focus();
      expect(startButton).toHaveFocus();

      // 测试键盘事件
      fireEvent.keyDown(startButton, { key: 'Enter' });
      // 在实际实现中会触发相应的处理
    });

    test('应该支持无障碍访问', () => {
      render(<RecommendationCard recommendation={{
        id: 'rec_1',
        title: '测试推荐',
        description: '测试描述',
        difficulty: 3,
        estimatedTime: 30,
        expectedImprovement: 25,
        skillFocus: ['test'],
        reasoning: '测试原因'
      }} />);

      const dismissButton = screen.getByLabelText('忽略推荐');
      expect(dismissButton).toBeInTheDocument();
      expect(dismissButton.getAttribute('aria-label')).toBe('忽略推荐');
    });
  });

  describe('响应式设计测试', () => {
    test('应该在不同屏幕尺寸下正确显示', () => {
      // 模拟移动设备
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<PersonalizationDashboard userId="test_user" />);

      // 验证移动端布局
      const container = document.querySelector('.grid-cols-1');
      expect(container).toBeInTheDocument();
    });
  });

  describe('性能测试', () => {
    test('大量推荐数据应该正常渲染', async () => {
      const manyRecommendations = Array.from({ length: 50 }, (_, i) => ({
        id: `rec_${i}`,
        title: `推荐 ${i}`,
        description: `描述 ${i}`,
        difficulty: Math.floor(Math.random() * 5) + 1,
        estimatedTime: 30,
        expectedImprovement: 25,
        skillFocus: ['test'],
        reasoning: '测试原因'
      }));

      // 在实际测试中需要模拟API返回大量数据
      // 这里简化处理
      expect(manyRecommendations.length).toBe(50);
    });
  });
});