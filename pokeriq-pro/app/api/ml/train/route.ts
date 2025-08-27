/**
 * ML Training API
 * Provides endpoints for training ML models including recommendation systems
 */

import { NextRequest, NextResponse } from 'next/server';
import { CollaborativeFilteringEngine } from '@/lib/personalization/algorithms/collaborative-filtering';
import { ContentBasedEngine } from '@/lib/personalization/algorithms/content-based';
import { HybridRecommendationEngine } from '@/lib/personalization/algorithms/hybrid-recommender';
import { ABTestingEngine } from '@/lib/analytics/ab-testing';
import { BehavioralTracker } from '@/lib/analytics/behavioral-tracker';
import { DataPreprocessor } from '@/lib/ml/data-preprocessing';
import { FeatureEngineer } from '@/lib/ml/feature-engineering';

// Initialize ML engines (in a real app, these would be dependency injected)
const collaborativeEngine = new CollaborativeFilteringEngine();
const contentBasedEngine = new ContentBasedEngine();
const hybridEngine = new HybridRecommendationEngine(collaborativeEngine, contentBasedEngine);
const dataPreprocessor = new DataPreprocessor();
const featureEngineer = new FeatureEngineer();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modelType, trainingData, parameters = {}, userId } = body;

    if (!modelType || !trainingData) {
      return NextResponse.json(
        { error: 'Missing required fields: modelType and trainingData' },
        { status: 400 }
      );
    }

    let result;
    const startTime = Date.now();

    switch (modelType) {
      case 'collaborative_filtering':
        result = await trainCollaborativeFiltering(trainingData, parameters);
        break;
      
      case 'content_based':
        result = await trainContentBased(trainingData, parameters);
        break;
      
      case 'hybrid':
        result = await trainHybridModel(trainingData, parameters);
        break;
      
      case 'feature_engineering':
        result = await trainFeatureEngineering(trainingData, parameters);
        break;
      
      default:
        return NextResponse.json(
          { error: `Unknown model type: ${modelType}` },
          { status: 400 }
        );
    }

    const trainingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      modelType,
      trainingTime,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('ML training error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to train ML model',
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

    switch (action) {
      case 'status':
        return NextResponse.json({
          status: 'operational',
          availableModels: [
            'collaborative_filtering',
            'content_based',
            'hybrid',
            'feature_engineering'
          ],
          engines: {
            collaborativeFiltering: collaborativeEngine.getModelStats(),
            contentBased: contentBasedEngine.getStats(),
            hybrid: hybridEngine.getStats(),
            dataPreprocessor: dataPreprocessor.getStats(),
            featureEngineer: featureEngineer.getStats()
          }
        });
      
      case 'model_stats':
        if (!modelType) {
          return NextResponse.json(
            { error: 'modelType parameter is required for model_stats' },
            { status: 400 }
          );
        }
        return NextResponse.json(await getModelStats(modelType));
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: status, model_stats' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('ML training API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

/**
 * Train collaborative filtering model
 */
async function trainCollaborativeFiltering(trainingData: any, parameters: any) {
  const { ratings, matrixFactorization = {} } = trainingData;
  
  if (!ratings || !Array.isArray(ratings)) {
    throw new Error('Training data must include ratings array');
  }

  // Validate rating structure
  for (const rating of ratings) {
    if (!rating.userId || !rating.itemId || typeof rating.rating !== 'number') {
      throw new Error('Each rating must have userId, itemId, and numeric rating');
    }
  }

  // Convert to expected format
  const userRatings = ratings.map((r: any) => ({
    userId: r.userId,
    itemId: r.itemId,
    rating: r.rating,
    timestamp: new Date(r.timestamp || Date.now()),
    implicit: r.implicit || false
  }));

  // Train the model
  await collaborativeEngine.trainModel(userRatings, matrixFactorization);

  return {
    modelType: 'collaborative_filtering',
    trainingSamples: userRatings.length,
    uniqueUsers: new Set(userRatings.map(r => r.userId)).size,
    uniqueItems: new Set(userRatings.map(r => r.itemId)).size,
    parameters: matrixFactorization,
    stats: collaborativeEngine.getModelStats()
  };
}

/**
 * Train content-based model
 */
async function trainContentBased(trainingData: any, parameters: any) {
  const { itemFeatures, userInteractions } = trainingData;
  
  if (!itemFeatures || !Array.isArray(itemFeatures)) {
    throw new Error('Training data must include itemFeatures array');
  }
  
  if (!userInteractions || !Array.isArray(userInteractions)) {
    throw new Error('Training data must include userInteractions array');
  }

  // Add item features
  contentBasedEngine.addItemFeatures(itemFeatures);

  // Group interactions by user
  const userInteractionMap = new Map<string, any[]>();
  for (const interaction of userInteractions) {
    if (!userInteractionMap.has(interaction.userId)) {
      userInteractionMap.set(interaction.userId, []);
    }
    userInteractionMap.get(interaction.userId)!.push(interaction);
  }

  // Update user profiles
  let updatedUsers = 0;
  for (const [userId, interactions] of userInteractionMap) {
    await contentBasedEngine.updateUserProfile(userId, interactions);
    updatedUsers++;
  }

  return {
    modelType: 'content_based',
    itemFeatures: itemFeatures.length,
    userInteractions: userInteractions.length,
    updatedUsers,
    stats: contentBasedEngine.getStats()
  };
}

/**
 * Train hybrid model
 */
async function trainHybridModel(trainingData: any, parameters: any) {
  const { ratings, itemFeatures, userInteractions, feedback = [] } = trainingData;
  
  // Train collaborative filtering component
  if (ratings && Array.isArray(ratings)) {
    const userRatings = ratings.map((r: any) => ({
      userId: r.userId,
      itemId: r.itemId,
      rating: r.rating,
      timestamp: new Date(r.timestamp || Date.now()),
      implicit: r.implicit || false
    }));
    
    await collaborativeEngine.trainModel(userRatings, parameters.matrixFactorization);
  }

  // Train content-based component
  if (itemFeatures && Array.isArray(itemFeatures)) {
    contentBasedEngine.addItemFeatures(itemFeatures);
    
    if (userInteractions && Array.isArray(userInteractions)) {
      const userInteractionMap = new Map<string, any[]>();
      for (const interaction of userInteractions) {
        if (!userInteractionMap.has(interaction.userId)) {
          userInteractionMap.set(interaction.userId, []);
        }
        userInteractionMap.get(interaction.userId)!.push(interaction);
      }

      for (const [userId, interactions] of userInteractionMap) {
        await contentBasedEngine.updateUserProfile(userId, interactions);
      }
    }
  }

  // Process feedback for hybrid engine
  if (feedback && Array.isArray(feedback)) {
    await hybridEngine.processFeedback(feedback);
  }

  return {
    modelType: 'hybrid',
    components: {
      collaborative: collaborativeEngine.getModelStats(),
      contentBased: contentBasedEngine.getStats(),
      hybrid: hybridEngine.getStats()
    },
    trainingData: {
      ratings: ratings?.length || 0,
      itemFeatures: itemFeatures?.length || 0,
      userInteractions: userInteractions?.length || 0,
      feedback: feedback?.length || 0
    }
  };
}

/**
 * Train feature engineering pipeline
 */
async function trainFeatureEngineering(trainingData: any, parameters: any) {
  const { userInteractions, userProfiles, sessionData } = trainingData;
  const { extractionType = 'user_features' } = parameters;

  if (!userInteractions || !Array.isArray(userInteractions)) {
    throw new Error('Training data must include userInteractions array');
  }

  let result;
  
  switch (extractionType) {
    case 'user_features':
      if (!userProfiles || !sessionData) {
        throw new Error('User feature extraction requires userProfiles and sessionData');
      }
      
      const userFeatures: any[] = [];
      for (let i = 0; i < Math.min(userInteractions.length, userProfiles.length, sessionData.length); i++) {
        const features = featureEngineer.extractUserFeatures(
          [userInteractions[i]],
          userProfiles[i],
          [sessionData[i]]
        );
        userFeatures.push({
          userId: userProfiles[i].userId,
          features: features.features,
          metadata: features.metadata
        });
      }
      
      result = {
        extractionType,
        extractedFeatures: userFeatures.length,
        sampleFeatureCount: Object.keys(userFeatures[0]?.features || {}).length,
        samples: userFeatures.slice(0, 3) // Return first 3 samples
      };
      break;

    case 'time_series':
      const timeSeries = parameters.timeSeries;
      if (!timeSeries || !Array.isArray(timeSeries)) {
        throw new Error('Time series extraction requires timeSeries parameter');
      }
      
      const tsFeatures = featureEngineer.extractTimeSeriesFeatures(timeSeries);
      
      result = {
        extractionType,
        timeSeriesLength: timeSeries.length,
        features: tsFeatures
      };
      break;

    case 'poker_features':
      const { gameState, playerActions = [], handHistory = [] } = parameters;
      if (!gameState) {
        throw new Error('Poker feature extraction requires gameState parameter');
      }
      
      const pokerFeatures = featureEngineer.extractPokerFeatures(
        gameState,
        playerActions,
        handHistory
      );
      
      result = {
        extractionType,
        features: pokerFeatures
      };
      break;

    default:
      throw new Error(`Unknown extraction type: ${extractionType}`);
  }

  return {
    modelType: 'feature_engineering',
    ...result,
    stats: featureEngineer.getStats()
  };
}

/**
 * Get model statistics
 */
async function getModelStats(modelType: string) {
  switch (modelType) {
    case 'collaborative_filtering':
      return {
        modelType,
        stats: collaborativeEngine.getModelStats(),
        description: 'Matrix factorization-based collaborative filtering with user-user and item-item similarity'
      };

    case 'content_based':
      return {
        modelType,
        stats: contentBasedEngine.getStats(),
        description: 'Content-based filtering using item features and user preferences'
      };

    case 'hybrid':
      return {
        modelType,
        stats: hybridEngine.getStats(),
        description: 'Hybrid recommendation combining collaborative and content-based filtering'
      };

    case 'feature_engineering':
      return {
        modelType,
        stats: featureEngineer.getStats(),
        description: 'Feature engineering pipeline for ML preprocessing'
      };

    default:
      throw new Error(`Unknown model type: ${modelType}`);
  }
}

/**
 * Validate training data structure
 */
function validateTrainingData(modelType: string, data: any) {
  const validations: Record<string, (data: any) => void> = {
    collaborative_filtering: (data) => {
      if (!data.ratings || !Array.isArray(data.ratings)) {
        throw new Error('Collaborative filtering requires ratings array');
      }
      
      for (const rating of data.ratings) {
        if (!rating.userId || !rating.itemId || typeof rating.rating !== 'number') {
          throw new Error('Each rating must have userId, itemId, and numeric rating');
        }
      }
    },

    content_based: (data) => {
      if (!data.itemFeatures || !Array.isArray(data.itemFeatures)) {
        throw new Error('Content-based filtering requires itemFeatures array');
      }
      
      if (!data.userInteractions || !Array.isArray(data.userInteractions)) {
        throw new Error('Content-based filtering requires userInteractions array');
      }
    },

    hybrid: (data) => {
      // Hybrid can work with various combinations of data
      if (!data.ratings && !data.itemFeatures && !data.userInteractions) {
        throw new Error('Hybrid model requires at least one of: ratings, itemFeatures, userInteractions');
      }
    },

    feature_engineering: (data) => {
      if (!data.userInteractions || !Array.isArray(data.userInteractions)) {
        throw new Error('Feature engineering requires userInteractions array');
      }
    }
  };

  const validator = validations[modelType];
  if (validator) {
    validator(data);
  }
}