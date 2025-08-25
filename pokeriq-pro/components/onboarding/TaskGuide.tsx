'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Gift, Lock, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Task {
  id: string;
  title: string;
  description: string;
  reward: string;
  rewardIcon: string;
  action: string;
  route?: string;
  completed: boolean;
  locked: boolean;
}

const initialTasks: Task[] = [
  {
    id: 'first_training',
    title: '完成首次AI训练',
    description: '与AI对手进行一局游戏，熟悉基本操作',
    reward: '100经验值',
    rewardIcon: '⭐',
    action: '开始训练',
    route: '/ai-training',
    completed: false,
    locked: false
  },
  {
    id: 'view_analytics',
    title: '查看数据分析',
    description: '了解您的游戏统计数据和改进方向',
    reward: '解锁高级图表',
    rewardIcon: '📊',
    action: '查看分析',
    route: '/analytics',
    completed: false,
    locked: false
  },
  {
    id: 'first_achievement',
    title: '解锁第一个成就',
    description: '完成任意成就条件，开启成就之路',
    reward: '专属徽章',
    rewardIcon: '🏆',
    action: '查看成就',
    route: '/achievements',
    completed: false,
    locked: false
  },
  {
    id: 'complete_profile',
    title: '完善个人资料',
    description: '设置您的头像和游戏偏好',
    reward: '个性化推荐',
    rewardIcon: '👤',
    action: '前往设置',
    route: '/settings',
    completed: false,
    locked: false
  },
  {
    id: 'week_streak',
    title: '连续训练7天',
    description: '保持每天训练，养成良好习惯',
    reward: '500经验值 + 稀有背景',
    rewardIcon: '🔥',
    action: '继续训练',
    route: '/ai-training',
    completed: false,
    locked: true
  }
];

export default function TaskGuide() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isExpanded, setIsExpanded] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 从localStorage加载任务状态
    const savedTasks = localStorage.getItem('user_tasks');
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        setTasks(parsedTasks);
      } catch (error) {
        console.error('Failed to load tasks:', error);
      }
    }
  }, []);

  const handleTaskAction = (task: Task) => {
    if (task.locked) return;
    
    if (task.route) {
      router.push(task.route);
    }
    
    // 模拟任务完成（实际应该根据具体操作）
    if (task.id === 'view_analytics' || task.id === 'complete_profile') {
      completeTask(task.id);
    }
  };

  const completeTask = (taskId: string) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        return { ...task, completed: true };
      }
      // 解锁下一个任务
      if (task.locked && tasks.findIndex(t => t.id === taskId) < tasks.findIndex(t => t.id === task.id)) {
        const completedCount = tasks.filter(t => t.completed).length;
        if (completedCount >= 3) {
          return { ...task, locked: false };
        }
      }
      return task;
    });
    
    setTasks(updatedTasks);
    localStorage.setItem('user_tasks', JSON.stringify(updatedTasks));
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = (completedCount / tasks.length) * 100;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">新手任务</h3>
            <p className="text-sm text-gray-500">完成任务，获得奖励</p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-gray-600 transition"
        >
          <ChevronRight className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {/* 进度条 */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>进度</span>
          <span>{completedCount}/{tasks.length}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 任务列表 */}
      {isExpanded && (
        <div className="space-y-3">
          {tasks.map(task => (
            <div
              key={task.id}
              className={`border rounded-lg p-4 transition-all ${
                task.completed 
                  ? 'bg-green-50 border-green-200' 
                  : task.locked 
                  ? 'bg-gray-50 border-gray-200 opacity-60'
                  : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : task.locked ? (
                      <Lock className="w-5 h-5 text-gray-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-medium ${task.completed ? 'text-green-700' : 'text-gray-900'}`}>
                      {task.title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-lg">{task.rewardIcon}</span>
                      <span className="text-sm font-medium text-gray-700">{task.reward}</span>
                    </div>
                  </div>
                </div>
                {!task.completed && !task.locked && (
                  <button
                    onClick={() => handleTaskAction(task)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition"
                  >
                    {task.action}
                  </button>
                )}
                {task.completed && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                    已完成
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 完成所有任务的奖励 */}
      {completedCount === tasks.length && (
        <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <h4 className="font-semibold text-gray-900">恭喜完成所有新手任务！</h4>
              <p className="text-sm text-gray-600">您已获得"新手毕业"成就和专属奖励包</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}