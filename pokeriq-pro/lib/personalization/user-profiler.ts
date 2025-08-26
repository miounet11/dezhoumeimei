/**
 * 用户画像系统 - 分析用户技能、学习风格和弱点
 */

export interface SkillMetric {
  current: number;          // 当前评分 (0-2000)
  trend: number;           // 趋势 (正负百分比)
  confidence: number;      // 置信度 (0-1)
  lastAssessment: Date;    // 最后评估时间
  sampleSize: number;      // 样本数量
}

export interface UserSkillProfile {
  userId: string;
  skillDimensions: {
    preflop: SkillMetric;        // 翻前决策
    postflop: SkillMetric;       // 翻后游戏
    psychology: SkillMetric;     // 心理博弈
    mathematics: SkillMetric;    // 数学计算
    bankroll: SkillMetric;       // 资金管理
    tournament: SkillMetric;     // 锦标赛技巧
  };
  learningStyle: {
    visualLearner: number;       // 视觉学习偏好 (0-1)
    practicalLearner: number;    // 实践学习偏好 (0-1)
    theoreticalLearner: number;  // 理论学习偏好 (0-1)
    socialLearner: number;       // 社交学习偏好 (0-1)
  };
  weaknessPatterns: WeaknessPattern[];
  learningVelocity: LearningVelocity;
  lastUpdated: Date;
  overallRating: number;       // 综合评分
}

export interface WeaknessPattern {
  pattern: string;             // 错误模式描述
  frequency: number;           // 出现频率
  severity: number;            // 严重程度 (0-1)
  street: string;              // 主要出现街道
  improvementSuggestion: string;
}

export interface LearningVelocity {
  skillGainRate: number;       // 技能提升速度 (点/小时)
  consistencyScore: number;    // 一致性评分 (0-1)
  adaptabilityScore: number;   // 适应性评分 (0-1)
  retentionRate: number;       // 知识保持率 (0-1)
}

export interface TrainingSession {
  id: string;
  userId: string;
  scenario: string;
  startTime: Date;
  endTime?: Date;
  hands: TrainingHand[];
  score: number;
  mistakes: Mistake[];
}

export interface TrainingHand {
  handNumber: number;
  street: string;
  userAction: any;
  correctAction: any;
  isCorrect?: boolean;
  decisionTime: number;        // 决策时间 (毫秒)
  difficulty: number;          // 难度级别 (1-5)
  scenario: string;
}

export interface Mistake {
  street: string;
  userAction: any;
  correctAction: any;
  evLoss: number;
  category: string;            // 错误类别
}

/**
 * 高级用户画像分析器
 */
export class UserProfiler {
  private readonly SKILL_DIMENSIONS = [
    'preflop', 'postflop', 'psychology', 'mathematics', 'bankroll', 'tournament'
  ] as const;

  constructor() {}

  /**
   * 综合分析用户技能画像
   */
  async analyzeUserProfile(userId: string, recentSessions: TrainingSession[]): Promise<UserSkillProfile> {
    if (recentSessions.length === 0) {
      return this.createDefaultProfile(userId);
    }

    // 分析技能维度
    const skillDimensions = await this.analyzeSkillDimensions(recentSessions);
    
    // 识别学习风格
    const learningStyle = this.identifyLearningStyle(recentSessions);
    
    // 检测弱点模式
    const weaknessPatterns = this.detectWeaknessPatterns(recentSessions);
    
    // 计算学习速度
    const learningVelocity = this.calculateLearningVelocity(recentSessions);
    
    // 计算综合评分
    const overallRating = this.calculateOverallRating(skillDimensions);

    return {
      userId,
      skillDimensions,
      learningStyle,
      weaknessPatterns,
      learningVelocity,
      lastUpdated: new Date(),
      overallRating
    };
  }

  /**
   * 分析技能维度
   */
  private async analyzeSkillDimensions(sessions: TrainingSession[]): Promise<UserSkillProfile['skillDimensions']> {
    const dimensions: any = {};

    for (const dimension of this.SKILL_DIMENSIONS) {
      dimensions[dimension] = await this.analyzeSkillDimension(dimension, sessions);
    }

    return dimensions;
  }

  /**
   * 分析单个技能维度
   */
  private async analyzeSkillDimension(dimension: string, sessions: TrainingSession[]): Promise<SkillMetric> {
    // 筛选相关会话
    const relevantSessions = sessions.filter(session => 
      this.isDimensionRelevant(session.scenario, dimension)
    );

    if (relevantSessions.length === 0) {
      return this.createDefaultSkillMetric();
    }

    // 收集所有相关手牌
    const relevantHands = relevantSessions.flatMap(s => 
      s.hands.filter(h => this.isHandRelevant(h, dimension))
    );

    if (relevantHands.length === 0) {
      return this.createDefaultSkillMetric();
    }

    // 计算基础指标
    const accuracy = this.calculateAccuracy(relevantHands);
    const consistency = this.calculateConsistency(relevantHands);
    const averageDifficulty = this.calculateAverageDifficulty(relevantHands);
    const timeEfficiency = this.calculateTimeEfficiency(relevantHands);

    // 计算当前评分
    const current = this.calculateSkillScore(accuracy, consistency, averageDifficulty, timeEfficiency);
    
    // 计算趋势
    const trend = this.calculateSkillTrend(relevantHands, dimension);
    
    // 计算置信度
    const confidence = this.calculateConfidence(relevantHands.length, consistency);

    return {
      current: Math.round(current),
      trend: Math.round(trend * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      lastAssessment: new Date(),
      sampleSize: relevantHands.length
    };
  }

  /**
   * 判断会话场景是否与技能维度相关
   */
  private isDimensionRelevant(scenario: string, dimension: string): boolean {
    const relevanceMap: Record<string, string[]> = {
      preflop: ['PREFLOP_RANGES', 'POSITION_PLAY', 'OPENING_RANGES'],
      postflop: ['POT_ODDS', 'VALUE_BETTING', 'BLUFFING', 'HAND_READING'],
      psychology: ['BLUFFING', 'HAND_READING', 'TELLS', 'OPPONENT_MODELING'],
      mathematics: ['POT_ODDS', 'EQUITY_CALCULATION', 'EV_ANALYSIS'],
      bankroll: ['BANKROLL_MANAGEMENT', 'VARIANCE', 'RISK_ASSESSMENT'],
      tournament: ['TOURNAMENT_PLAY', 'ICM', 'BUBBLE_PLAY']
    };

    return relevanceMap[dimension]?.some(s => scenario.includes(s)) || false;
  }

  /**
   * 判断手牌是否与技能维度相关
   */
  private isHandRelevant(hand: TrainingHand, dimension: string): boolean {
    // 基于街道和场景判断相关性
    const streetRelevance: Record<string, string[]> = {
      preflop: ['preflop'],
      postflop: ['flop', 'turn', 'river'],
      psychology: ['flop', 'turn', 'river'],
      mathematics: ['preflop', 'flop', 'turn', 'river'],
      bankroll: ['preflop', 'flop', 'turn', 'river'],
      tournament: ['preflop', 'flop', 'turn', 'river']
    };

    return streetRelevance[dimension]?.includes(hand.street) || false;
  }

  /**
   * 计算准确率
   */
  private calculateAccuracy(hands: TrainingHand[]): number {
    if (hands.length === 0) return 0.5;
    
    const correct = hands.filter(h => h.isCorrect).length;
    return correct / hands.length;
  }

  /**
   * 计算一致性
   */
  private calculateConsistency(hands: TrainingHand[]): number {
    if (hands.length < 2) return 0.5;

    // 计算准确率的标准差
    const windowSize = 10;
    const accuracies: number[] = [];

    for (let i = 0; i <= hands.length - windowSize; i++) {
      const window = hands.slice(i, i + windowSize);
      const accuracy = this.calculateAccuracy(window);
      accuracies.push(accuracy);
    }

    if (accuracies.length < 2) return 0.5;

    const mean = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
    const variance = accuracies.reduce((sum, acc) => sum + Math.pow(acc - mean, 2), 0) / accuracies.length;
    const stdDev = Math.sqrt(variance);

    // 一致性 = 1 - 标准差 (越小越一致)
    return Math.max(0, Math.min(1, 1 - stdDev * 2));
  }

  /**
   * 计算平均难度
   */
  private calculateAverageDifficulty(hands: TrainingHand[]): number {
    if (hands.length === 0) return 0.5;
    
    const totalDifficulty = hands.reduce((sum, h) => sum + (h.difficulty || 3), 0);
    return totalDifficulty / hands.length / 5; // 归一化到0-1
  }

  /**
   * 计算时间效率
   */
  private calculateTimeEfficiency(hands: TrainingHand[]): number {
    if (hands.length === 0) return 0.5;

    const avgDecisionTime = hands.reduce((sum, h) => sum + (h.decisionTime || 30000), 0) / hands.length;
    
    // 理想决策时间: 10-30秒
    const idealTime = 20000; // 20秒
    const efficiency = Math.max(0, Math.min(1, idealTime / avgDecisionTime));
    
    return efficiency;
  }

  /**
   * 计算技能评分
   */
  private calculateSkillScore(accuracy: number, consistency: number, difficulty: number, timeEfficiency: number): number {
    // 基础分 1000，根据各项指标调整
    let score = 1000;
    
    // 准确率影响 (±400分)
    score += (accuracy - 0.5) * 800;
    
    // 一致性加成 (±200分)
    score += (consistency - 0.5) * 400;
    
    // 难度加成 (±300分)
    score += (difficulty - 0.6) * 500;
    
    // 效率加成 (±100分)
    score += (timeEfficiency - 0.5) * 200;

    return Math.max(200, Math.min(2000, score));
  }

  /**
   * 计算技能趋势
   */
  private calculateSkillTrend(hands: TrainingHand[], dimension: string): number {
    if (hands.length < 20) return 0;

    // 分成两半比较
    const mid = Math.floor(hands.length / 2);
    const firstHalf = hands.slice(0, mid);
    const secondHalf = hands.slice(mid);

    const firstAccuracy = this.calculateAccuracy(firstHalf);
    const secondAccuracy = this.calculateAccuracy(secondHalf);

    // 返回改进率
    return (secondAccuracy - firstAccuracy) * 100;
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(sampleSize: number, consistency: number): number {
    // 基于样本数量和一致性计算置信度
    const sampleFactor = Math.min(1, sampleSize / 100); // 100个样本达到满信度
    const consistencyFactor = consistency;
    
    return Math.min(1, sampleFactor * consistencyFactor);
  }

  /**
   * 识别学习风格
   */
  private identifyLearningStyle(sessions: TrainingSession[]): UserSkillProfile['learningStyle'] {
    // 基于用户行为模式识别学习偏好
    let visualScore = 0;
    let practicalScore = 0;
    let theoreticalScore = 0;
    let socialScore = 0;

    for (const session of sessions) {
      // 分析决策时间 - 快速决策可能偏向直觉/视觉
      const avgDecisionTime = session.hands.reduce((sum, h) => sum + (h.decisionTime || 30000), 0) / session.hands.length;
      if (avgDecisionTime < 15000) visualScore += 1;
      if (avgDecisionTime > 45000) theoreticalScore += 1;

      // 分析错误模式 - 数学错误偏向需要理论学习
      const mathMistakes = session.mistakes.filter(m => m.category === 'mathematics').length;
      if (mathMistakes > 0) theoreticalScore += mathMistakes * 0.5;

      // 分析场景偏好
      if (session.scenario.includes('PRACTICAL')) practicalScore += 1;
      if (session.scenario.includes('THEORY')) theoreticalScore += 1;
    }

    const total = visualScore + practicalScore + theoreticalScore + socialScore + 4; // 加4避免除零
    
    return {
      visualLearner: Math.min(1, visualScore / total + 0.25),
      practicalLearner: Math.min(1, practicalScore / total + 0.25),
      theoreticalLearner: Math.min(1, theoreticalScore / total + 0.25),
      socialLearner: Math.min(1, socialScore / total + 0.25)
    };
  }

  /**
   * 检测弱点模式
   */
  private detectWeaknessPatterns(sessions: TrainingSession[]): WeaknessPattern[] {
    const patterns: Map<string, { count: number; severity: number; streets: string[]; examples: Mistake[] }> = new Map();

    // 收集所有错误
    for (const session of sessions) {
      for (const mistake of session.mistakes) {
        const category = mistake.category || this.categorizeError(mistake);
        
        if (!patterns.has(category)) {
          patterns.set(category, { count: 0, severity: 0, streets: [], examples: [] });
        }
        
        const pattern = patterns.get(category)!;
        pattern.count++;
        pattern.severity += mistake.evLoss;
        pattern.streets.push(mistake.street);
        pattern.examples.push(mistake);
      }
    }

    // 转换为弱点模式
    const weaknessPatterns: WeaknessPattern[] = [];
    const totalMistakes = Array.from(patterns.values()).reduce((sum, p) => sum + p.count, 0);

    for (const [patternName, data] of patterns) {
      if (data.count >= 3) { // 至少出现3次才认为是模式
        const frequency = data.count / totalMistakes;
        const avgSeverity = data.severity / data.count;
        const primaryStreet = this.getMostFrequentStreet(data.streets);

        weaknessPatterns.push({
          pattern: patternName,
          frequency,
          severity: Math.min(1, avgSeverity / 5), // 归一化到0-1
          street: primaryStreet,
          improvementSuggestion: this.getImprovementSuggestion(patternName, primaryStreet)
        });
      }
    }

    // 按严重程度排序
    return weaknessPatterns.sort((a, b) => (b.frequency * b.severity) - (a.frequency * a.severity));
  }

  /**
   * 分类错误类型
   */
  private categorizeError(mistake: Mistake): string {
    const userType = mistake.userAction?.type || '';
    const correctType = mistake.correctAction?.type || '';

    if (userType === 'fold' && correctType !== 'fold') return '过度保守';
    if (userType === 'raise' && correctType === 'fold') return '过度激进';
    if (userType === 'call' && correctType === 'raise') return '错失价值';
    if (userType === 'raise' && correctType === 'call') return '下注过大';
    if (mistake.evLoss > 2.0) return '重大决策失误';
    if (mistake.street === 'preflop') return '翻前范围错误';
    if (mistake.street === 'river') return '河牌决策错误';
    
    return '时机把握不当';
  }

  /**
   * 获取最频繁的街道
   */
  private getMostFrequentStreet(streets: string[]): string {
    const counts = streets.reduce((acc, street) => {
      acc[street] = (acc[street] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).reduce((a, b) => counts[a[0]] > counts[b[0]] ? a : b)[0];
  }

  /**
   * 获取改进建议
   */
  private getImprovementSuggestion(pattern: string, street: string): string {
    const suggestions: Record<string, string> = {
      '过度保守': `在${street}阶段需要更加积极，不要过度弃牌优质手牌`,
      '过度激进': `在${street}阶段需要更加谨慎，避免过度下注弱牌`,
      '错失价值': `在${street}阶段要充分提取价值，不要害怕下注强牌`,
      '下注过大': `在${street}阶段控制下注尺度，避免吓跑对手`,
      '重大决策失误': `在${street}阶段需要更仔细分析，避免犯重大错误`,
      '翻前范围错误': '学习标准翻前开牌范围，根据位置调整策略',
      '河牌决策错误': '在河牌阶段要精确计算底池赔率和对手范围',
      '时机把握不当': `在${street}阶段提高时机判断能力，观察对手动向`
    };

    return suggestions[pattern] || `改进${pattern}相关技能`;
  }

  /**
   * 计算学习速度
   */
  private calculateLearningVelocity(sessions: TrainingSession[]): LearningVelocity {
    if (sessions.length < 2) {
      return {
        skillGainRate: 10, // 默认每小时10点提升
        consistencyScore: 0.5,
        adaptabilityScore: 0.5,
        retentionRate: 0.7
      };
    }

    // 按时间排序
    const sortedSessions = sessions.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    
    // 计算技能提升速度
    const firstSession = sortedSessions[0];
    const lastSession = sortedSessions[sortedSessions.length - 1];
    const timeSpan = (lastSession.startTime.getTime() - firstSession.startTime.getTime()) / (1000 * 60 * 60); // 小时
    
    const firstAccuracy = this.calculateAccuracy(firstSession.hands);
    const lastAccuracy = this.calculateAccuracy(lastSession.hands);
    const improvement = (lastAccuracy - firstAccuracy) * 1000; // 转换为评分点数
    
    const skillGainRate = timeSpan > 0 ? improvement / timeSpan : 0;

    // 计算一致性分数 
    const allHands = sessions.flatMap(s => s.hands);
    const consistencyScore = this.calculateConsistency(allHands);

    // 计算适应性 - 在不同场景下的表现差异
    const scenarioPerformance = new Map<string, number>();
    for (const session of sessions) {
      const accuracy = this.calculateAccuracy(session.hands);
      scenarioPerformance.set(session.scenario, accuracy);
    }
    
    const performances = Array.from(scenarioPerformance.values());
    const avgPerformance = performances.reduce((sum, p) => sum + p, 0) / performances.length;
    const variance = performances.reduce((sum, p) => sum + Math.pow(p - avgPerformance, 2), 0) / performances.length;
    const adaptabilityScore = Math.max(0, 1 - Math.sqrt(variance) * 2);

    // 计算知识保持率 - 简化计算
    const retentionRate = Math.max(0.5, consistencyScore * 0.8 + adaptabilityScore * 0.2);

    return {
      skillGainRate: Math.max(0, skillGainRate),
      consistencyScore,
      adaptabilityScore,
      retentionRate
    };
  }

  /**
   * 计算综合评分
   */
  private calculateOverallRating(skillDimensions: UserSkillProfile['skillDimensions']): number {
    const weights = {
      preflop: 0.20,
      postflop: 0.25,
      psychology: 0.15,
      mathematics: 0.15,
      bankroll: 0.15,
      tournament: 0.10
    };

    let weightedSum = 0;
    let totalWeight = 0;

    for (const [dimension, metric] of Object.entries(skillDimensions)) {
      const weight = weights[dimension as keyof typeof weights] || 0;
      weightedSum += metric.current * weight * metric.confidence;
      totalWeight += weight * metric.confidence;
    }

    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 1000;
  }

  /**
   * 创建默认画像
   */
  private createDefaultProfile(userId: string): UserSkillProfile {
    const defaultMetric = this.createDefaultSkillMetric();
    
    return {
      userId,
      skillDimensions: {
        preflop: defaultMetric,
        postflop: defaultMetric,
        psychology: defaultMetric,
        mathematics: defaultMetric,
        bankroll: defaultMetric,
        tournament: defaultMetric
      },
      learningStyle: {
        visualLearner: 0.25,
        practicalLearner: 0.25,
        theoreticalLearner: 0.25,
        socialLearner: 0.25
      },
      weaknessPatterns: [],
      learningVelocity: {
        skillGainRate: 10,
        consistencyScore: 0.5,
        adaptabilityScore: 0.5,
        retentionRate: 0.7
      },
      lastUpdated: new Date(),
      overallRating: 1000
    };
  }

  /**
   * 创建默认技能度量
   */
  private createDefaultSkillMetric(): SkillMetric {
    return {
      current: 1000,
      trend: 0,
      confidence: 0.1,
      lastAssessment: new Date(),
      sampleSize: 0
    };
  }
}

export default UserProfiler;