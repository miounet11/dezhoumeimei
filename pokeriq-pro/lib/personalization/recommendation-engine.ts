/**
 * 个性化推荐引擎 - 基于用户画像生成训练推荐
 */

import { UserSkillProfile, WeaknessPattern, LearningVelocity } from './user-profiler';

export interface TrainingRecommendation {
  id: string;
  title: string;
  description: string;
  scenario: string;
  difficulty: number;                    // 难度 1-5
  estimatedTime: number;                 // 预计时间(分钟)
  expectedImprovement: number;           // 预期提升(评分点数)
  priority: number;                      // 优先级 0-1
  reasoning: string;                     // 推荐理由
  prerequisites?: string[];              // 前置条件
  skillFocus: string[];                  // 针对技能
  learningStyle: string[];               // 适合学习风格
}

export interface PersonalizedTrainingPlan {
  userId: string;
  planId: string;
  title: string;
  description: string;
  estimatedDuration: number;             // 总预计时间(小时)
  expectedOverallImprovement: number;    // 整体预期提升
  recommendations: TrainingRecommendation[];
  milestones: PlanMilestone[];
  createdAt: Date;
  difficulty: number;                    // 计划整体难度
}

export interface PlanMilestone {
  id: string;
  title: string;
  description: string;
  targetSkill: string;
  targetImprovement: number;
  estimatedTimeToComplete: number;
  prerequisites: string[];
}

export interface RecommendationContext {
  timeAvailable: number;                 // 可用时间(分钟)
  preferredDifficulty?: number;          // 偏好难度
  focusAreas?: string[];                 // 重点关注领域
  excludeScenarios?: string[];           // 排除场景
  learningGoals?: string[];              // 学习目标
}

/**
 * 智能推荐引擎
 */
export class PersonalizationEngine {
  private readonly SCENARIOS = {
    // 翻前场景
    'PREFLOP_RANGES': {
      title: '翻前开牌范围训练',
      baseDescription: '学习不同位置的标准开牌范围',
      skillFocus: ['preflop'],
      baseDifficulty: 2,
      baseTime: 20
    },
    'POSITION_PLAY': {
      title: '位置优势运用',
      description: '理解位置的重要性，学会利用位置优势',
      skillFocus: ['preflop', 'psychology'],
      baseDifficulty: 3,
      baseTime: 25
    },
    
    // 翻后场景
    'POT_ODDS': {
      title: '底池赔率计算',
      description: '掌握底池赔率和隐含赔率的计算与应用',
      skillFocus: ['mathematics', 'postflop'],
      baseDifficulty: 3,
      baseTime: 30
    },
    'VALUE_BETTING': {
      title: '价值下注训练',
      description: '学会识别价值下注机会，选择合适的下注尺度',
      skillFocus: ['postflop', 'mathematics'],
      baseDifficulty: 4,
      baseTime: 35
    },
    'BLUFFING': {
      title: '诈唬技巧训练',
      description: '掌握诈唬时机，学会平衡价值下注与诈唬',
      skillFocus: ['psychology', 'postflop'],
      baseDifficulty: 4,
      baseTime: 40
    },
    'HAND_READING': {
      title: '读牌技能训练',
      description: '通过对手行为推断其可能手牌范围',
      skillFocus: ['psychology', 'postflop'],
      baseDifficulty: 5,
      baseTime: 45
    },
    
    // 高级场景
    'TOURNAMENT_PLAY': {
      title: '锦标赛策略',
      description: '学习锦标赛特有策略，包括ICM和泡沫期游戏',
      skillFocus: ['tournament', 'mathematics'],
      baseDifficulty: 5,
      baseTime: 50
    },
    'BANKROLL_MANAGEMENT': {
      title: '资金管理训练',
      description: '掌握风险控制和资金分配策略',
      skillFocus: ['bankroll', 'mathematics'],
      baseDifficulty: 3,
      baseTime: 25
    }
  };

  private readonly LEARNING_STYLE_SCENARIOS: Record<string, string[]> = {
    visual: ['PREFLOP_RANGES', 'HAND_READING', 'POSITION_PLAY'],
    practical: ['POT_ODDS', 'VALUE_BETTING', 'BLUFFING'],
    theoretical: ['TOURNAMENT_PLAY', 'BANKROLL_MANAGEMENT'],
    social: ['PSYCHOLOGY_TRAINING', 'OPPONENT_MODELING']
  };

  constructor() {}

  /**
   * 生成个性化训练推荐
   */
  async generateRecommendations(
    userProfile: UserSkillProfile,
    context: RecommendationContext,
    count: number = 5
  ): Promise<TrainingRecommendation[]> {
    // 1. 基于弱点分析生成推荐
    const weaknessRecommendations = this.generateWeaknessBasedRecommendations(
      userProfile.weaknessPatterns,
      userProfile.skillDimensions
    );

    // 2. 基于技能发展生成推荐
    const skillDevelopmentRecommendations = this.generateSkillDevelopmentRecommendations(
      userProfile.skillDimensions,
      userProfile.overallRating
    );

    // 3. 基于学习风格筛选
    const styleFilteredRecommendations = this.filterByLearningStyle(
      [...weaknessRecommendations, ...skillDevelopmentRecommendations],
      userProfile.learningStyle
    );

    // 4. 应用上下文过滤
    const contextFilteredRecommendations = this.applyContextFilters(
      styleFilteredRecommendations,
      context
    );

    // 5. 计算推荐优先级
    const prioritizedRecommendations = this.calculatePriorities(
      contextFilteredRecommendations,
      userProfile,
      context
    );

    // 6. 排序并返回前N个
    return prioritizedRecommendations
      .sort((a, b) => b.priority - a.priority)
      .slice(0, count);
  }

  /**
   * 生成完整训练计划
   */
  async generateTrainingPlan(
    userProfile: UserSkillProfile,
    context: RecommendationContext,
    planDuration: number = 30 // 天数
  ): Promise<PersonalizedTrainingPlan> {
    // 获取推荐列表
    const recommendations = await this.generateRecommendations(userProfile, context, 15);
    
    // 根据用户画像安排训练顺序
    const orderedRecommendations = this.optimizeTrainingSequence(
      recommendations,
      userProfile,
      planDuration
    );

    // 生成里程碑
    const milestones = this.generateMilestones(orderedRecommendations, userProfile);

    // 计算总体信息
    const totalTime = orderedRecommendations.reduce((sum, r) => sum + r.estimatedTime, 0) / 60;
    const avgImprovement = orderedRecommendations.reduce((sum, r) => sum + r.expectedImprovement, 0) / orderedRecommendations.length;
    const avgDifficulty = orderedRecommendations.reduce((sum, r) => sum + r.difficulty, 0) / orderedRecommendations.length;

    return {
      userId: userProfile.userId,
      planId: this.generatePlanId(),
      title: this.generatePlanTitle(userProfile),
      description: this.generatePlanDescription(userProfile),
      estimatedDuration: totalTime,
      expectedOverallImprovement: avgImprovement,
      recommendations: orderedRecommendations,
      milestones,
      createdAt: new Date(),
      difficulty: Math.round(avgDifficulty)
    };
  }

  /**
   * 基于弱点生成推荐
   */
  private generateWeaknessBasedRecommendations(
    weaknesses: WeaknessPattern[],
    skillDimensions: UserSkillProfile['skillDimensions']
  ): TrainingRecommendation[] {
    const recommendations: TrainingRecommendation[] = [];

    for (const weakness of weaknesses.slice(0, 3)) { // 只处理前3个最严重弱点
      const targetScenarios = this.getScenariosByWeakness(weakness.pattern);
      
      for (const scenario of targetScenarios) {
        const scenarioConfig = this.SCENARIOS[scenario as keyof typeof this.SCENARIOS];
        if (!scenarioConfig) continue;

        // 根据弱点严重程度调整难度
        const adjustedDifficulty = Math.max(1, 
          Math.min(5, scenarioConfig.baseDifficulty - weakness.severity + 1)
        );

        // 计算预期改进 - 基于弱点频率和严重程度
        const expectedImprovement = this.calculateExpectedImprovement(
          weakness,
          skillDimensions,
          scenario
        );

        recommendations.push({
          id: this.generateRecommendationId(),
          title: `针对${weakness.pattern}: ${scenarioConfig.title}`,
          description: `${scenarioConfig.baseDescription || scenarioConfig.description}，专门改进您的${weakness.pattern}问题`,
          scenario,
          difficulty: adjustedDifficulty,
          estimatedTime: scenarioConfig.baseTime + weakness.severity * 10,
          expectedImprovement,
          priority: weakness.frequency * weakness.severity, // 初始优先级
          reasoning: `您在${weakness.street}阶段经常出现${weakness.pattern}，建议针对性训练`,
          skillFocus: scenarioConfig.skillFocus,
          learningStyle: this.getRecommendedLearningStyles(scenario)
        });
      }
    }

    return recommendations;
  }

  /**
   * 基于技能发展生成推荐
   */
  private generateSkillDevelopmentRecommendations(
    skillDimensions: UserSkillProfile['skillDimensions'],
    overallRating: number
  ): TrainingRecommendation[] {
    const recommendations: TrainingRecommendation[] = [];

    // 找出需要提升的技能
    const skillsToImprove = Object.entries(skillDimensions)
      .filter(([_, metric]) => metric.current < overallRating * 0.9 || metric.confidence < 0.7)
      .sort((a, b) => a[1].current - b[1].current); // 按技能水平排序

    for (const [skillName, metric] of skillsToImprove.slice(0, 4)) {
      const scenarios = this.getScenariosBySkill(skillName);
      
      for (const scenario of scenarios) {
        const scenarioConfig = this.SCENARIOS[scenario as keyof typeof this.SCENARIOS];
        if (!scenarioConfig) continue;

        // 根据当前技能水平调整难度
        const skillLevel = metric.current / 2000; // 归一化到0-1
        let adjustedDifficulty = scenarioConfig.baseDifficulty;
        
        if (skillLevel < 0.3) adjustedDifficulty = Math.max(1, adjustedDifficulty - 1);
        else if (skillLevel > 0.7) adjustedDifficulty = Math.min(5, adjustedDifficulty + 1);

        const expectedImprovement = this.calculateSkillBasedImprovement(metric, scenario);

        recommendations.push({
          id: this.generateRecommendationId(),
          title: scenarioConfig.title,
          description: `${scenarioConfig.baseDescription || scenarioConfig.description}，提升您的${skillName}技能`,
          scenario,
          difficulty: adjustedDifficulty,
          estimatedTime: scenarioConfig.baseTime,
          expectedImprovement,
          priority: (1 - skillLevel) * (1 - metric.confidence), // 技能越低，置信度越低，优先级越高
          reasoning: `您的${skillName}技能还有提升空间，当前评分${metric.current}`,
          skillFocus: scenarioConfig.skillFocus,
          learningStyle: this.getRecommendedLearningStyles(scenario)
        });
      }
    }

    return recommendations;
  }

  /**
   * 根据学习风格筛选推荐
   */
  private filterByLearningStyle(
    recommendations: TrainingRecommendation[],
    learningStyle: UserSkillProfile['learningStyle']
  ): TrainingRecommendation[] {
    // 找出用户偏好的学习风格
    const preferredStyles = Object.entries(learningStyle)
      .filter(([_, score]) => score > 0.3)
      .map(([style, _]) => style.replace('Learner', ''));

    // 为每个推荐计算学习风格匹配度
    return recommendations.map(rec => ({
      ...rec,
      priority: rec.priority * this.calculateStyleMatch(rec.learningStyle, preferredStyles)
    }));
  }

  /**
   * 应用上下文过滤
   */
  private applyContextFilters(
    recommendations: TrainingRecommendation[],
    context: RecommendationContext
  ): TrainingRecommendation[] {
    return recommendations.filter(rec => {
      // 时间过滤
      if (rec.estimatedTime > context.timeAvailable * 1.2) return false;
      
      // 难度过滤
      if (context.preferredDifficulty && 
          Math.abs(rec.difficulty - context.preferredDifficulty) > 1) return false;
      
      // 排除场景过滤
      if (context.excludeScenarios?.includes(rec.scenario)) return false;
      
      // 重点领域过滤
      if (context.focusAreas && context.focusAreas.length > 0) {
        const hasOverlap = rec.skillFocus.some(skill => context.focusAreas!.includes(skill));
        if (!hasOverlap) return false;
      }
      
      return true;
    });
  }

  /**
   * 计算推荐优先级
   */
  private calculatePriorities(
    recommendations: TrainingRecommendation[],
    userProfile: UserSkillProfile,
    context: RecommendationContext
  ): TrainingRecommendation[] {
    return recommendations.map(rec => {
      let priority = rec.priority;
      
      // 学习速度调整
      const velocityBonus = userProfile.learningVelocity.skillGainRate > 15 ? 1.2 : 0.8;
      priority *= velocityBonus;
      
      // 时间匹配度调整
      const timeRatio = rec.estimatedTime / context.timeAvailable;
      const timeBonus = timeRatio > 0.8 && timeRatio < 1.2 ? 1.3 : 1.0;
      priority *= timeBonus;
      
      // 改进潜力调整
      const improvementBonus = rec.expectedImprovement > 20 ? 1.4 : 1.0;
      priority *= improvementBonus;
      
      return { ...rec, priority };
    });
  }

  /**
   * 优化训练序列
   */
  private optimizeTrainingSequence(
    recommendations: TrainingRecommendation[],
    userProfile: UserSkillProfile,
    planDuration: number
  ): TrainingRecommendation[] {
    // 按难度和依赖关系排序
    const sorted = [...recommendations];
    
    // 简单排序策略：先易后难，先基础后高级
    sorted.sort((a, b) => {
      // 优先级权重 40%
      const priorityDiff = (b.priority - a.priority) * 0.4;
      
      // 难度权重 30% (先易后难)
      const difficultyDiff = (a.difficulty - b.difficulty) * 0.3;
      
      // 预期改进权重 30%
      const improvementDiff = (b.expectedImprovement - a.expectedImprovement) * 0.3;
      
      return priorityDiff + difficultyDiff + improvementDiff;
    });

    // 确保训练序列的逻辑性
    return this.ensureLogicalProgression(sorted);
  }

  /**
   * 确保训练的逻辑进展
   */
  private ensureLogicalProgression(recommendations: TrainingRecommendation[]): TrainingRecommendation[] {
    const reordered: TrainingRecommendation[] = [];
    const remaining = [...recommendations];

    // 基础技能优先
    const foundationalSkills = ['preflop', 'mathematics'];
    for (const skill of foundationalSkills) {
      const foundational = remaining.filter(r => r.skillFocus.includes(skill));
      reordered.push(...foundational);
      foundational.forEach(r => {
        const index = remaining.indexOf(r);
        if (index > -1) remaining.splice(index, 1);
      });
    }

    // 添加其余推荐
    reordered.push(...remaining);

    return reordered;
  }

  /**
   * 生成里程碑
   */
  private generateMilestones(
    recommendations: TrainingRecommendation[],
    userProfile: UserSkillProfile
  ): PlanMilestone[] {
    const milestones: PlanMilestone[] = [];
    let cumulativeTime = 0;
    const skillProgress = { ...userProfile.skillDimensions };

    // 每完成几个推荐设置一个里程碑
    for (let i = 0; i < recommendations.length; i += 3) {
      const batch = recommendations.slice(i, Math.min(i + 3, recommendations.length));
      const batchTime = batch.reduce((sum, r) => sum + r.estimatedTime, 0);
      const primarySkill = this.getMostCommonSkill(batch);
      
      cumulativeTime += batchTime;
      
      milestones.push({
        id: this.generateMilestoneId(),
        title: `阶段 ${Math.floor(i / 3) + 1}: ${primarySkill}技能提升`,
        description: `完成${batch.length}个相关训练，重点提升${primarySkill}技能`,
        targetSkill: primarySkill,
        targetImprovement: batch.reduce((sum, r) => sum + r.expectedImprovement, 0),
        estimatedTimeToComplete: cumulativeTime,
        prerequisites: i === 0 ? [] : [milestones[milestones.length - 1].id]
      });
    }

    return milestones;
  }

  // 辅助方法

  private getScenariosByWeakness(weakness: string): string[] {
    const weaknessScenarioMap: Record<string, string[]> = {
      '过度保守': ['VALUE_BETTING', 'POSITION_PLAY'],
      '过度激进': ['BANKROLL_MANAGEMENT', 'POT_ODDS'],
      '错失价值': ['VALUE_BETTING', 'HAND_READING'],
      '下注过大': ['POT_ODDS', 'VALUE_BETTING'],
      '翻前范围错误': ['PREFLOP_RANGES', 'POSITION_PLAY'],
      '河牌决策错误': ['HAND_READING', 'VALUE_BETTING'],
      '重大决策失误': ['POT_ODDS', 'HAND_READING'],
      '时机把握不当': ['BLUFFING', 'POSITION_PLAY']
    };

    return weaknessScenarioMap[weakness] || ['POT_ODDS'];
  }

  private getScenariosBySkill(skill: string): string[] {
    const skillScenarioMap: Record<string, string[]> = {
      preflop: ['PREFLOP_RANGES', 'POSITION_PLAY'],
      postflop: ['POT_ODDS', 'VALUE_BETTING', 'BLUFFING', 'HAND_READING'],
      psychology: ['BLUFFING', 'HAND_READING'],
      mathematics: ['POT_ODDS', 'VALUE_BETTING', 'BANKROLL_MANAGEMENT'],
      bankroll: ['BANKROLL_MANAGEMENT'],
      tournament: ['TOURNAMENT_PLAY']
    };

    return skillScenarioMap[skill] || ['POT_ODDS'];
  }

  private getRecommendedLearningStyles(scenario: string): string[] {
    // 根据场景特点推荐学习风格
    const scenarioStyleMap: Record<string, string[]> = {
      'PREFLOP_RANGES': ['visual', 'theoretical'],
      'POT_ODDS': ['theoretical', 'practical'],
      'VALUE_BETTING': ['practical', 'visual'],
      'BLUFFING': ['practical', 'social'],
      'HAND_READING': ['visual', 'social'],
      'TOURNAMENT_PLAY': ['theoretical', 'practical'],
      'BANKROLL_MANAGEMENT': ['theoretical'],
      'POSITION_PLAY': ['visual', 'practical']
    };

    return scenarioStyleMap[scenario] || ['practical'];
  }

  private calculateExpectedImprovement(
    weakness: WeaknessPattern,
    skillDimensions: UserSkillProfile['skillDimensions'],
    scenario: string
  ): number {
    // 基于弱点严重程度和频率计算预期改进
    const baseImprovement = weakness.severity * weakness.frequency * 50;
    
    // 根据当前技能水平调整
    const relevantSkills = this.SCENARIOS[scenario as keyof typeof this.SCENARIOS]?.skillFocus || [];
    const avgSkillLevel = relevantSkills.reduce((sum, skill) => {
      const dimension = skillDimensions[skill as keyof typeof skillDimensions];
      return sum + (dimension?.current || 1000);
    }, 0) / relevantSkills.length;

    // 技能水平越低，改进潜力越大
    const skillMultiplier = Math.max(0.5, Math.min(2.0, 2000 / avgSkillLevel));
    
    return Math.round(baseImprovement * skillMultiplier);
  }

  private calculateSkillBasedImprovement(
    metric: any,
    scenario: string
  ): number {
    // 基于技能差距计算预期改进
    const skillGap = Math.max(0, 1500 - metric.current); // 目标1500分
    const improvementRate = 0.1; // 10%的差距可以通过训练弥补
    
    // 置信度越低，改进潜力越大
    const confidenceMultiplier = Math.max(1.0, 2.0 - metric.confidence);
    
    return Math.round(skillGap * improvementRate * confidenceMultiplier);
  }

  private calculateStyleMatch(
    recStyles: string[],
    userPreferences: string[]
  ): number {
    if (userPreferences.length === 0) return 1.0;
    
    const matches = recStyles.filter(style => userPreferences.includes(style)).length;
    const matchRatio = matches / recStyles.length;
    
    return Math.max(0.7, 0.7 + matchRatio * 0.6); // 0.7-1.3的范围
  }

  private getMostCommonSkill(recommendations: TrainingRecommendation[]): string {
    const skillCount: Record<string, number> = {};
    
    recommendations.forEach(rec => {
      rec.skillFocus.forEach(skill => {
        skillCount[skill] = (skillCount[skill] || 0) + 1;
      });
    });

    return Object.entries(skillCount)
      .reduce((a, b) => skillCount[a[0]] > skillCount[b[0]] ? a : b)[0];
  }

  private generatePlanTitle(userProfile: UserSkillProfile): string {
    const rating = userProfile.overallRating;
    const level = rating < 800 ? '初级' : 
                 rating < 1200 ? '中级' : 
                 rating < 1600 ? '高级' : '专家级';
    
    return `${level}德州扑克技能提升计划`;
  }

  private generatePlanDescription(userProfile: UserSkillProfile): string {
    const weakestSkill = Object.entries(userProfile.skillDimensions)
      .reduce((a, b) => a[1].current < b[1].current ? a : b)[0];
    
    const mainWeakness = userProfile.weaknessPatterns[0]?.pattern || '综合技能';
    
    return `针对您当前${userProfile.overallRating}分的水平，重点改善${weakestSkill}技能和${mainWeakness}问题的个性化训练计划。`;
  }

  // ID生成方法
  private generateRecommendationId(): string {
    return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private generatePlanId(): string {
    return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private generateMilestoneId(): string {
    return `milestone_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }
}

export default PersonalizationEngine;