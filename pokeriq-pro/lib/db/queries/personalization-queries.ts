/**
 * 个性化系统数据库查询 - Personalization Database Queries
 * 
 * 提供用户偏好、个性化档案等相关的数据库操作
 */

import { PrismaClient } from '@prisma/client';
import { UserSkillProfile, WeaknessPattern, LearningVelocity } from '@/lib/personalization/user-profiler';

const prisma = new PrismaClient();

// 用户偏好接口
export interface UserPreferencesData {
  visualLearner: number;
  practicalLearner: number;
  theoreticalLearner: number;
  socialLearner: number;
  learningGoals: string[];
  preferredDifficulty?: number;
  timeAvailability: number;
  sessionLength: number;
  preferredGameTypes: string[];
  stakesPreference: Record<string, any>;
  positionPreference: Record<string, any>;
  feedbackStyle: string;
  encouragementLevel: number;
  challengeLevel: number;
  trainingReminders: boolean;
  weeklyReports: boolean;
  achievementNotifs: boolean;
}

// 个性化档案数据接口
export interface PersonalizationProfileData {
  // 技能评分
  preflopSkill: number;
  postflopSkill: number;
  psychologySkill: number;
  mathematicsSkill: number;
  bankrollSkill: number;
  tournamentSkill: number;
  
  // 技能置信度
  preflopConfidence: number;
  postflopConfidence: number;
  psychologyConfidence: number;
  mathematicsConfidence: number;
  bankrollConfidence: number;
  tournamentConfidence: number;
  
  // 技能趋势
  preflopTrend: number;
  postflopTrend: number;
  psychologyTrend: number;
  mathematicsTrend: number;
  bankrollTrend: number;
  tournamentTrend: number;
  
  // 综合数据
  overallRating: number;
  totalSampleSize: number;
  dataQuality: number;
  weaknessPatterns: WeaknessPattern[];
  strengthAreas: string[];
  
  // 学习特性
  learningVelocity: number;
  consistencyScore: number;
  adaptabilityScore: number;
  retentionRate: number;
  
  // 游戏风格
  playStyle: string;
  riskTolerance: number;
  bluffingTendency: number;
  valueExtraction: number;
}

/**
 * 个性化查询类
 */
export class PersonalizationQueries {
  
  /**
   * 获取用户偏好设置
   */
  static async getUserPreferences(userId: string): Promise<UserPreferencesData | null> {
    try {
      const preferences = await prisma.userPreferences.findUnique({
        where: { userId }
      });

      if (!preferences) return null;

      return {
        visualLearner: preferences.visualLearner,
        practicalLearner: preferences.practicalLearner,
        theoreticalLearner: preferences.theoreticalLearner,
        socialLearner: preferences.socialLearner,
        learningGoals: preferences.learningGoals as string[],
        preferredDifficulty: preferences.preferredDifficulty || undefined,
        timeAvailability: preferences.timeAvailability,
        sessionLength: preferences.sessionLength,
        preferredGameTypes: preferences.preferredGameTypes as string[],
        stakesPreference: preferences.stakesPreference as Record<string, any>,
        positionPreference: preferences.positionPreference as Record<string, any>,
        feedbackStyle: preferences.feedbackStyle,
        encouragementLevel: preferences.encouragementLevel,
        challengeLevel: preferences.challengeLevel,
        trainingReminders: preferences.trainingReminders,
        weeklyReports: preferences.weeklyReports,
        achievementNotifs: preferences.achievementNotifs
      };
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return null;
    }
  }

  /**
   * 更新用户偏好设置
   */
  static async updateUserPreferences(
    userId: string, 
    data: Partial<UserPreferencesData>
  ): Promise<UserPreferencesData | null> {
    try {
      const preferences = await prisma.userPreferences.upsert({
        where: { userId },
        create: {
          userId,
          ...data,
          learningGoals: data.learningGoals || [],
          preferredGameTypes: data.preferredGameTypes || ['cash'],
          stakesPreference: data.stakesPreference || {},
          positionPreference: data.positionPreference || {}
        },
        update: {
          ...data,
          ...(data.learningGoals && { learningGoals: data.learningGoals }),
          ...(data.preferredGameTypes && { preferredGameTypes: data.preferredGameTypes }),
          ...(data.stakesPreference && { stakesPreference: data.stakesPreference }),
          ...(data.positionPreference && { positionPreference: data.positionPreference })
        }
      });

      return {
        visualLearner: preferences.visualLearner,
        practicalLearner: preferences.practicalLearner,
        theoreticalLearner: preferences.theoreticalLearner,
        socialLearner: preferences.socialLearner,
        learningGoals: preferences.learningGoals as string[],
        preferredDifficulty: preferences.preferredDifficulty || undefined,
        timeAvailability: preferences.timeAvailability,
        sessionLength: preferences.sessionLength,
        preferredGameTypes: preferences.preferredGameTypes as string[],
        stakesPreference: preferences.stakesPreference as Record<string, any>,
        positionPreference: preferences.positionPreference as Record<string, any>,
        feedbackStyle: preferences.feedbackStyle,
        encouragementLevel: preferences.encouragementLevel,
        challengeLevel: preferences.challengeLevel,
        trainingReminders: preferences.trainingReminders,
        weeklyReports: preferences.weeklyReports,
        achievementNotifs: preferences.achievementNotifs
      };
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return null;
    }
  }

  /**
   * 获取个性化档案
   */
  static async getPersonalizationProfile(userId: string): Promise<PersonalizationProfileData | null> {
    try {
      const profile = await prisma.personalizationProfile.findUnique({
        where: { userId }
      });

      if (!profile) return null;

      return {
        preflopSkill: profile.preflopSkill,
        postflopSkill: profile.postflopSkill,
        psychologySkill: profile.psychologySkill,
        mathematicsSkill: profile.mathematicsSkill,
        bankrollSkill: profile.bankrollSkill,
        tournamentSkill: profile.tournamentSkill,
        
        preflopConfidence: profile.preflopConfidence,
        postflopConfidence: profile.postflopConfidence,
        psychologyConfidence: profile.psychologyConfidence,
        mathematicsConfidence: profile.mathematicsConfidence,
        bankrollConfidence: profile.bankrollConfidence,
        tournamentConfidence: profile.tournamentConfidence,
        
        preflopTrend: profile.preflopTrend,
        postflopTrend: profile.postflopTrend,
        psychologyTrend: profile.psychologyTrend,
        mathematicsTrend: profile.mathematicsTrend,
        bankrollTrend: profile.bankrollTrend,
        tournamentTrend: profile.tournamentTrend,
        
        overallRating: profile.overallRating,
        totalSampleSize: profile.totalSampleSize,
        dataQuality: profile.dataQuality,
        weaknessPatterns: profile.weaknessPatterns as WeaknessPattern[],
        strengthAreas: profile.strengthAreas as string[],
        
        learningVelocity: profile.learningVelocity,
        consistencyScore: profile.consistencyScore,
        adaptabilityScore: profile.adaptabilityScore,
        retentionRate: profile.retentionRate,
        
        playStyle: profile.playStyle,
        riskTolerance: profile.riskTolerance,
        bluffingTendency: profile.bluffingTendency,
        valueExtraction: profile.valueExtraction
      };
    } catch (error) {
      console.error('Error fetching personalization profile:', error);
      return null;
    }
  }

  /**
   * 更新个性化档案
   */
  static async updatePersonalizationProfile(
    userId: string, 
    data: Partial<PersonalizationProfileData>
  ): Promise<PersonalizationProfileData | null> {
    try {
      const profile = await prisma.personalizationProfile.upsert({
        where: { userId },
        create: {
          userId,
          ...data,
          weaknessPatterns: data.weaknessPatterns || [],
          strengthAreas: data.strengthAreas || []
        },
        update: {
          ...data,
          ...(data.weaknessPatterns && { weaknessPatterns: data.weaknessPatterns }),
          ...(data.strengthAreas && { strengthAreas: data.strengthAreas }),
          lastAssessment: new Date()
        }
      });

      return {
        preflopSkill: profile.preflopSkill,
        postflopSkill: profile.postflopSkill,
        psychologySkill: profile.psychologySkill,
        mathematicsSkill: profile.mathematicsSkill,
        bankrollSkill: profile.bankrollSkill,
        tournamentSkill: profile.tournamentSkill,
        
        preflopConfidence: profile.preflopConfidence,
        postflopConfidence: profile.postflopConfidence,
        psychologyConfidence: profile.psychologyConfidence,
        mathematicsConfidence: profile.mathematicsConfidence,
        bankrollConfidence: profile.bankrollConfidence,
        tournamentConfidence: profile.tournamentConfidence,
        
        preflopTrend: profile.preflopTrend,
        postflopTrend: profile.postflopTrend,
        psychologyTrend: profile.psychologyTrend,
        mathematicsTrend: profile.mathematicsTrend,
        bankrollTrend: profile.bankrollTrend,
        tournamentTrend: profile.tournamentTrend,
        
        overallRating: profile.overallRating,
        totalSampleSize: profile.totalSampleSize,
        dataQuality: profile.dataQuality,
        weaknessPatterns: profile.weaknessPatterns as WeaknessPattern[],
        strengthAreas: profile.strengthAreas as string[],
        
        learningVelocity: profile.learningVelocity,
        consistencyScore: profile.consistencyScore,
        adaptabilityScore: profile.adaptabilityScore,
        retentionRate: profile.retentionRate,
        
        playStyle: profile.playStyle,
        riskTolerance: profile.riskTolerance,
        bluffingTendency: profile.bluffingTendency,
        valueExtraction: profile.valueExtraction
      };
    } catch (error) {
      console.error('Error updating personalization profile:', error);
      return null;
    }
  }

  /**
   * 将数据库档案转换为UserSkillProfile格式
   */
  static convertToUserSkillProfile(
    profile: PersonalizationProfileData,
    preferences: UserPreferencesData
  ): UserSkillProfile {
    return {
      userId: '', // Will be set by caller
      skillDimensions: {
        preflop: {
          current: profile.preflopSkill,
          trend: profile.preflopTrend,
          confidence: profile.preflopConfidence,
          lastAssessment: new Date(),
          sampleSize: Math.floor(profile.totalSampleSize / 6) // Approximate per skill
        },
        postflop: {
          current: profile.postflopSkill,
          trend: profile.postflopTrend,
          confidence: profile.postflopConfidence,
          lastAssessment: new Date(),
          sampleSize: Math.floor(profile.totalSampleSize / 6)
        },
        psychology: {
          current: profile.psychologySkill,
          trend: profile.psychologyTrend,
          confidence: profile.psychologyConfidence,
          lastAssessment: new Date(),
          sampleSize: Math.floor(profile.totalSampleSize / 6)
        },
        mathematics: {
          current: profile.mathematicsSkill,
          trend: profile.mathematicsTrend,
          confidence: profile.mathematicsConfidence,
          lastAssessment: new Date(),
          sampleSize: Math.floor(profile.totalSampleSize / 6)
        },
        bankroll: {
          current: profile.bankrollSkill,
          trend: profile.bankrollTrend,
          confidence: profile.bankrollConfidence,
          lastAssessment: new Date(),
          sampleSize: Math.floor(profile.totalSampleSize / 6)
        },
        tournament: {
          current: profile.tournamentSkill,
          trend: profile.tournamentTrend,
          confidence: profile.tournamentConfidence,
          lastAssessment: new Date(),
          sampleSize: Math.floor(profile.totalSampleSize / 6)
        }
      },
      learningStyle: {
        visualLearner: preferences.visualLearner,
        practicalLearner: preferences.practicalLearner,
        theoreticalLearner: preferences.theoreticalLearner,
        socialLearner: preferences.socialLearner
      },
      weaknessPatterns: profile.weaknessPatterns,
      learningVelocity: {
        skillGainRate: profile.learningVelocity,
        consistencyScore: profile.consistencyScore,
        adaptabilityScore: profile.adaptabilityScore,
        retentionRate: profile.retentionRate
      },
      lastUpdated: new Date(),
      overallRating: profile.overallRating
    };
  }

  /**
   * 从UserSkillProfile转换为数据库格式
   */
  static convertFromUserSkillProfile(
    userProfile: UserSkillProfile
  ): Partial<PersonalizationProfileData> {
    return {
      preflopSkill: userProfile.skillDimensions.preflop.current,
      postflopSkill: userProfile.skillDimensions.postflop.current,
      psychologySkill: userProfile.skillDimensions.psychology.current,
      mathematicsSkill: userProfile.skillDimensions.mathematics.current,
      bankrollSkill: userProfile.skillDimensions.bankroll.current,
      tournamentSkill: userProfile.skillDimensions.tournament.current,
      
      preflopConfidence: userProfile.skillDimensions.preflop.confidence,
      postflopConfidence: userProfile.skillDimensions.postflop.confidence,
      psychologyConfidence: userProfile.skillDimensions.psychology.confidence,
      mathematicsConfidence: userProfile.skillDimensions.mathematics.confidence,
      bankrollConfidence: userProfile.skillDimensions.bankroll.confidence,
      tournamentConfidence: userProfile.skillDimensions.tournament.confidence,
      
      preflopTrend: userProfile.skillDimensions.preflop.trend,
      postflopTrend: userProfile.skillDimensions.postflop.trend,
      psychologyTrend: userProfile.skillDimensions.psychology.trend,
      mathematicsTrend: userProfile.skillDimensions.mathematics.trend,
      bankrollTrend: userProfile.skillDimensions.bankroll.trend,
      tournamentTrend: userProfile.skillDimensions.tournament.trend,
      
      overallRating: userProfile.overallRating,
      totalSampleSize: Object.values(userProfile.skillDimensions)
        .reduce((sum, skill) => sum + skill.sampleSize, 0),
      weaknessPatterns: userProfile.weaknessPatterns,
      
      learningVelocity: userProfile.learningVelocity.skillGainRate,
      consistencyScore: userProfile.learningVelocity.consistencyScore,
      adaptabilityScore: userProfile.learningVelocity.adaptabilityScore,
      retentionRate: userProfile.learningVelocity.retentionRate
    };
  }

  /**
   * 批量获取用户的完整个性化数据
   */
  static async getCompletePersonalizationData(userId: string): Promise<{
    preferences: UserPreferencesData | null;
    profile: PersonalizationProfileData | null;
    userSkillProfile: UserSkillProfile | null;
  }> {
    try {
      const [preferences, profile] = await Promise.all([
        this.getUserPreferences(userId),
        this.getPersonalizationProfile(userId)
      ]);

      let userSkillProfile: UserSkillProfile | null = null;
      if (profile && preferences) {
        userSkillProfile = this.convertToUserSkillProfile(profile, preferences);
        userSkillProfile.userId = userId;
      }

      return {
        preferences,
        profile,
        userSkillProfile
      };
    } catch (error) {
      console.error('Error fetching complete personalization data:', error);
      return {
        preferences: null,
        profile: null,
        userSkillProfile: null
      };
    }
  }

  /**
   * 获取用户最近的技能评估历史
   */
  static async getSkillAssessmentHistory(
    userId: string, 
    limit: number = 10
  ): Promise<Array<{
    date: Date;
    overallRating: number;
    skillBreakdown: Record<string, number>;
  }>> {
    try {
      // 这里可以扩展为记录历史评估数据
      // 目前返回当前评估作为示例
      const profile = await this.getPersonalizationProfile(userId);
      
      if (!profile) return [];

      return [{
        date: new Date(),
        overallRating: profile.overallRating,
        skillBreakdown: {
          preflop: profile.preflopSkill,
          postflop: profile.postflopSkill,
          psychology: profile.psychologySkill,
          mathematics: profile.mathematicsSkill,
          bankroll: profile.bankrollSkill,
          tournament: profile.tournamentSkill
        }
      }];
    } catch (error) {
      console.error('Error fetching skill assessment history:', error);
      return [];
    }
  }

  /**
   * 清理方法 - 关闭数据库连接
   */
  static async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}

export default PersonalizationQueries;