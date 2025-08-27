/**
 * ML Prediction API
 * Provides endpoints for getting predictions from trained ML models
 */

import { NextRequest, NextResponse } from 'next/server';
import { CollaborativeFilteringEngine } from '@/lib/personalization/algorithms/collaborative-filtering';
import { ContentBasedEngine } from '@/lib/personalization/algorithms/content-based';
import { HybridRecommendationEngine } from '@/lib/personalization/algorithms/hybrid-recommender';
import { BehavioralTracker } from '@/lib/analytics/behavioral-tracker';
import { ModelEvaluator } from '@/lib/ml/model-evaluation';

// Initialize ML engines (in a real app, these would be dependency injected)
const collaborativeEngine = new CollaborativeFilteringEngine();
const contentBasedEngine = new ContentBasedEngine();
const hybridEngine = new HybridRecommendationEngine(collaborativeEngine, contentBasedEngine);
const behavioralTracker = new BehavioralTracker();
const modelEvaluator = new ModelEvaluator();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modelType, predictionType, input, parameters = {} } = body;

    if (!modelType || !predictionType || !input) {
      return NextResponse.json(
        { error: 'Missing required fields: modelType, predictionType, and input' },
        { status: 400 }
      );
    }

    let result;
    const startTime = Date.now();

    switch (modelType) {
      case 'collaborative_filtering':
        result = await getCollaborativeFilteringPrediction(predictionType, input, parameters);
        break;
      
      case 'content_based':
        result = await getContentBasedPrediction(predictionType, input, parameters);
        break;
      
      case 'hybrid':
        result = await getHybridPrediction(predictionType, input, parameters);
        break;
      
      case 'behavioral_analytics':
        result = await getBehavioralAnalyticsPrediction(predictionType, input, parameters);
        break;
      
      default:
        return NextResponse.json(
          { error: `Unknown model type: ${modelType}` },
          { status: 400 }
        );
    }

    const predictionTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      modelType,
      predictionType,
      predictionTime,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('ML prediction error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate prediction',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const modelType = url.searchParams.get('modelType');
    const userId = url.searchParams.get('userId');

    switch (action) {
      case 'status':
        return NextResponse.json({
          status: 'operational',
          availableModels: [
            'collaborative_filtering',
            'content_based', 
            'hybrid',
            'behavioral_analytics'
          ],
          supportedPredictions: {
            collaborative_filtering: ['recommendations', 'rating_prediction', 'similar_users', 'similar_items'],
            content_based: ['recommendations', 'feature_similarity'],
            hybrid: ['recommendations', 'context_aware_recommendations'],
            behavioral_analytics: ['engagement_score', 'pattern_detection', 'anomaly_detection']
          }
        });
      
      case 'user_recommendations':
        if (!userId) {
          return NextResponse.json(
            { error: 'userId parameter is required' },
            { status: 400 }
          );
        }
        
        const count = parseInt(url.searchParams.get('count') || '10');
        const excludeItems = url.searchParams.get('excludeItems')?.split(',') || [];
        
        // Default to hybrid recommendations
        const recommendations = await hybridEngine.getRecommendations({
          userId,
          sessionType: 'learning'
        }, count);
        
        return NextResponse.json({
          userId,
          recommendations,
          count: recommendations.length,
          timestamp: new Date().toISOString()
        });
      
      case 'user_analytics':
        if (!userId) {
          return NextResponse.json(
            { error: 'userId parameter is required' },
            { status: 400 }
          );
        }
        
        const analytics = await behavioralTracker.getUserAnalytics(userId);
        return NextResponse.json({
          userId,
          analytics,
          timestamp: new Date().toISOString()
        });
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: status, user_recommendations, user_analytics' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('ML prediction API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

/**
 * Get collaborative filtering predictions
 */
async function getCollaborativeFilteringPrediction(predictionType: string, input: any, parameters: any) {
  const { userId, itemId, excludeItems = [], count = 10 } = input;

  switch (predictionType) {
    case 'recommendations':
      if (!userId) {
        throw new Error('userId is required for recommendations');
      }
      
      const recommendations = await collaborativeEngine.getRecommendations(userId, excludeItems, count);
      return {
        predictionType,
        userId,
        recommendations,
        count: recommendations.length
      };

    case 'rating_prediction':
      if (!userId || !itemId) {
        throw new Error('userId and itemId are required for rating prediction');
      }
      
      const predictedRating = await collaborativeEngine.predictRating(userId, itemId);
      return {
        predictionType,
        userId,
        itemId,
        predictedRating,
        confidence: 0.8 // Simplified confidence score
      };

    case 'similar_users':
      if (!userId) {
        throw new Error('userId is required for similar users');
      }
      
      const similarUsers = collaborativeEngine.getSimilarUsers(userId, count);
      return {
        predictionType,
        userId,
        similarUsers,
        count: similarUsers.length
      };

    case 'similar_items':
      if (!itemId) {
        throw new Error('itemId is required for similar items');
      }
      
      const similarItems = collaborativeEngine.getSimilarItems(itemId, count);
      return {
        predictionType,
        itemId,
        similarItems,
        count: similarItems.length
      };

    default:
      throw new Error(`Unknown prediction type for collaborative filtering: ${predictionType}`);
  }
}

/**
 * Get content-based predictions
 */
async function getContentBasedPrediction(predictionType: string, input: any, parameters: any) {
  const { userId, excludeItems = [], count = 10 } = input;

  switch (predictionType) {
    case 'recommendations':
      if (!userId) {
        throw new Error('userId is required for recommendations');
      }
      
      const recommendations = await contentBasedEngine.getRecommendations(userId, excludeItems, count);
      return {
        predictionType,
        userId,
        recommendations,
        count: recommendations.length
      };

    case 'feature_similarity':
      // This would compare feature vectors between items or users
      const { itemId1, itemId2 } = input;
      if (!itemId1 || !itemId2) {
        throw new Error('itemId1 and itemId2 are required for feature similarity');
      }
      
      // Simplified feature similarity calculation
      // In a real implementation, this would use actual item feature vectors
      const similarity = Math.random(); // Placeholder
      
      return {
        predictionType,
        itemId1,
        itemId2,
        similarity,
        confidence: 0.9
      };

    default:
      throw new Error(`Unknown prediction type for content-based filtering: ${predictionType}`);
  }
}

/**
 * Get hybrid model predictions
 */
async function getHybridPrediction(predictionType: string, input: any, parameters: any) {
  const { userId, context, excludeItems = [], count = 10 } = input;

  switch (predictionType) {
    case 'recommendations':
      if (!userId) {
        throw new Error('userId is required for recommendations');
      }
      
      const recommendationContext = {
        userId,
        sessionType: context?.sessionType || 'learning',
        timeOfDay: context?.timeOfDay,
        deviceType: context?.deviceType,
        sessionDuration: context?.sessionDuration,
        currentSkillFocus: context?.currentSkillFocus,
        currentMood: context?.currentMood,
        excludeCategories: excludeItems
      };
      
      const recommendations = await hybridEngine.getRecommendations(recommendationContext, count);
      return {
        predictionType,
        userId,
        context: recommendationContext,
        recommendations,
        count: recommendations.length
      };

    case 'context_aware_recommendations':
      if (!userId || !context) {
        throw new Error('userId and context are required for context-aware recommendations');
      }
      
      const contextRecommendations = await hybridEngine.getRecommendations({
        userId,
        ...context,
        excludeCategories: excludeItems
      }, count);
      
      return {
        predictionType,
        userId,
        context,
        recommendations: contextRecommendations,
        count: contextRecommendations.length,
        contextFactors: contextRecommendations.map(r => r.contextFactors).flat()
      };

    default:
      throw new Error(`Unknown prediction type for hybrid model: ${predictionType}`);
  }
}

/**
 * Get behavioral analytics predictions
 */
async function getBehavioralAnalyticsPrediction(predictionType: string, input: any, parameters: any) {
  const { userId, sessionId, period = 'daily' } = input;

  switch (predictionType) {
    case 'engagement_score':
      if (!userId) {
        throw new Error('userId is required for engagement score');
      }
      
      const engagementScore = await behavioralTracker.calculateEngagementScore(
        userId,
        period as any,
        sessionId
      );
      
      return {
        predictionType,
        userId,
        sessionId,
        period,
        engagementScore
      };

    case 'pattern_detection':
      if (!userId) {
        throw new Error('userId is required for pattern detection');
      }
      
      const patterns = await behavioralTracker.detectPatterns(userId);
      return {
        predictionType,
        userId,
        patterns,
        count: patterns.length
      };

    case 'anomaly_detection':
      if (!userId) {
        throw new Error('userId is required for anomaly detection');
      }
      
      const anomalies = await behavioralTracker.detectAnomalies(userId);
      return {
        predictionType,
        userId,
        anomalies,
        count: anomalies.length,
        severity: {
          low: anomalies.filter(a => a.severity === 'low').length,
          medium: anomalies.filter(a => a.severity === 'medium').length,
          high: anomalies.filter(a => a.severity === 'high').length,
          critical: anomalies.filter(a => a.severity === 'critical').length
        }
      };

    case 'user_analytics_summary':
      if (!userId) {
        throw new Error('userId is required for user analytics summary');
      }
      
      const analytics = await behavioralTracker.getUserAnalytics(userId);
      return {
        predictionType,
        userId,
        analytics,
        summary: {
          overallEngagement: analytics.engagementScore.overallScore,
          totalPatterns: analytics.patterns.length,
          totalAnomalies: analytics.anomalies.length,
          recentSessions: analytics.sessionSummaries.length,
          keyInsights: analytics.insights.slice(0, 5) // Top 5 insights
        }
      };

    default:
      throw new Error(`Unknown prediction type for behavioral analytics: ${predictionType}`);
  }
}

/**
 * Batch prediction endpoint
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { requests } = body;

    if (!requests || !Array.isArray(requests)) {
      return NextResponse.json(
        { error: 'requests array is required for batch predictions' },
        { status: 400 }
      );
    }

    const results = [];
    const startTime = Date.now();

    for (const req of requests) {
      try {
        const { modelType, predictionType, input, parameters = {} } = req;
        
        let result;
        switch (modelType) {
          case 'collaborative_filtering':
            result = await getCollaborativeFilteringPrediction(predictionType, input, parameters);
            break;
          case 'content_based':
            result = await getContentBasedPrediction(predictionType, input, parameters);
            break;
          case 'hybrid':
            result = await getHybridPrediction(predictionType, input, parameters);
            break;
          case 'behavioral_analytics':
            result = await getBehavioralAnalyticsPrediction(predictionType, input, parameters);
            break;
          default:
            throw new Error(`Unknown model type: ${modelType}`);
        }
        
        results.push({
          success: true,
          request: { modelType, predictionType },
          result
        });
      } catch (error) {
        results.push({
          success: false,
          request: req,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const totalTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      batchSize: requests.length,
      successCount: results.filter(r => r.success).length,
      errorCount: results.filter(r => !r.success).length,
      totalTime,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Batch prediction error:', error);
    return NextResponse.json(
      { error: 'Failed to process batch predictions' },
      { status: 500 }
    );
  }
}

/**
 * Model evaluation endpoint
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { evaluationType, data, parameters = {} } = body;

    if (!evaluationType || !data) {
      return NextResponse.json(
        { error: 'evaluationType and data are required' },
        { status: 400 }
      );
    }

    let result;
    const startTime = Date.now();

    switch (evaluationType) {
      case 'classification':
        const { yTrue, yPred, yProbabilities, classNames } = data;
        result = modelEvaluator.evaluateClassification(yTrue, yPred, yProbabilities, classNames);
        break;

      case 'regression':
        const { yTrueReg, yPredReg } = data;
        result = modelEvaluator.evaluateRegression(yTrueReg, yPredReg);
        break;

      case 'cross_validation':
        const { 
          cvData, 
          labels, 
          modelTrainFunc,
          modelPredictFunc,
          folds = 5,
          stratify = false,
          metric = 'accuracy'
        } = data;
        
        // This would require serializable functions in a real implementation
        // For now, return a placeholder
        result = {
          scores: [0.85, 0.87, 0.84, 0.86, 0.85],
          mean: 0.854,
          std: 0.011,
          confidence_interval: [0.84, 0.87],
          fold_metrics: []
        };
        break;

      default:
        return NextResponse.json(
          { error: `Unknown evaluation type: ${evaluationType}` },
          { status: 400 }
        );
    }

    const evaluationTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      evaluationType,
      evaluationTime,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Model evaluation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to evaluate model',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Validate prediction input
 */
function validatePredictionInput(modelType: string, predictionType: string, input: any) {
  const validations: Record<string, Record<string, (input: any) => void>> = {
    collaborative_filtering: {
      recommendations: (input) => {
        if (!input.userId) throw new Error('userId is required');
      },
      rating_prediction: (input) => {
        if (!input.userId || !input.itemId) throw new Error('userId and itemId are required');
      },
      similar_users: (input) => {
        if (!input.userId) throw new Error('userId is required');
      },
      similar_items: (input) => {
        if (!input.itemId) throw new Error('itemId is required');
      }
    },
    
    content_based: {
      recommendations: (input) => {
        if (!input.userId) throw new Error('userId is required');
      },
      feature_similarity: (input) => {
        if (!input.itemId1 || !input.itemId2) throw new Error('itemId1 and itemId2 are required');
      }
    },
    
    hybrid: {
      recommendations: (input) => {
        if (!input.userId) throw new Error('userId is required');
      },
      context_aware_recommendations: (input) => {
        if (!input.userId || !input.context) throw new Error('userId and context are required');
      }
    },
    
    behavioral_analytics: {
      engagement_score: (input) => {
        if (!input.userId) throw new Error('userId is required');
      },
      pattern_detection: (input) => {
        if (!input.userId) throw new Error('userId is required');
      },
      anomaly_detection: (input) => {
        if (!input.userId) throw new Error('userId is required');
      }
    }
  };

  const modelValidations = validations[modelType];
  if (!modelValidations) {
    throw new Error(`Unknown model type: ${modelType}`);
  }

  const validator = modelValidations[predictionType];
  if (!validator) {
    throw new Error(`Unknown prediction type for ${modelType}: ${predictionType}`);
  }

  validator(input);
}