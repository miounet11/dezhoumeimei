/**
 * A/B Testing Experiments API
 * Provides endpoints for managing A/B tests and experiments
 */

import { NextRequest, NextResponse } from 'next/server';
import { ABTestingEngine } from '@/lib/analytics/ab-testing';
import { BehavioralTracker } from '@/lib/analytics/behavioral-tracker';

// Initialize engines (in a real app, these would be dependency injected)
const abTestEngine = new ABTestingEngine();
const behavioralTracker = new BehavioralTracker();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, experimentId, userId, ...data } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'action field is required' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'create_experiment':
        result = await createExperiment(data);
        break;
      
      case 'start_experiment':
        if (!experimentId) {
          return NextResponse.json(
            { error: 'experimentId is required for start_experiment' },
            { status: 400 }
          );
        }
        result = await startExperiment(experimentId);
        break;
      
      case 'stop_experiment':
        if (!experimentId) {
          return NextResponse.json(
            { error: 'experimentId is required for stop_experiment' },
            { status: 400 }
          );
        }
        result = await stopExperiment(experimentId);
        break;
      
      case 'assign_user':
        if (!userId) {
          return NextResponse.json(
            { error: 'userId is required for assign_user' },
            { status: 400 }
          );
        }
        result = await assignUser(userId, data);
        break;
      
      case 'track_event':
        if (!userId) {
          return NextResponse.json(
            { error: 'userId is required for track_event' },
            { status: 400 }
          );
        }
        result = await trackEvent(userId, data);
        break;
      
      case 'process_feedback':
        result = await processFeedback(data);
        break;
      
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('A/B testing API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process A/B testing request',
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
    const experimentId = url.searchParams.get('experimentId');
    const userId = url.searchParams.get('userId');

    switch (action) {
      case 'status':
        return NextResponse.json({
          status: 'operational',
          stats: abTestEngine.getStats(),
          timestamp: new Date().toISOString()
        });
      
      case 'experiments':
        const experiments = abTestEngine.getAllExperiments();
        return NextResponse.json({
          experiments: experiments.map(exp => ({
            id: exp.id,
            name: exp.name,
            status: exp.status,
            startDate: exp.startDate,
            endDate: exp.endDate,
            variants: exp.variants.length,
            targetMetrics: exp.targetMetrics
          })),
          count: experiments.length
        });
      
      case 'experiment_details':
        if (!experimentId) {
          return NextResponse.json(
            { error: 'experimentId parameter is required' },
            { status: 400 }
          );
        }
        
        const experiment = abTestEngine.getExperiment(experimentId);
        if (!experiment) {
          return NextResponse.json(
            { error: 'Experiment not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({ experiment });
      
      case 'experiment_results':
        if (!experimentId) {
          return NextResponse.json(
            { error: 'experimentId parameter is required' },
            { status: 400 }
          );
        }
        
        const results = await abTestEngine.calculateExperimentResults(experimentId);
        const tests = await abTestEngine.performStatisticalTests(experimentId);
        const significance = await abTestEngine.hasReachedSignificance(experimentId);
        const summary = await abTestEngine.getExperimentSummary(experimentId);
        
        return NextResponse.json({
          experimentId,
          results: Object.fromEntries(results),
          statisticalTests: tests,
          significance,
          summary
        });
      
      case 'user_assignments':
        if (!userId) {
          return NextResponse.json(
            { error: 'userId parameter is required' },
            { status: 400 }
          );
        }
        
        const assignments = abTestEngine.getActiveExperiments(userId);
        return NextResponse.json({
          userId,
          assignments,
          count: assignments.length
        });
      
      case 'experiment_config':
        if (!userId || !experimentId) {
          return NextResponse.json(
            { error: 'userId and experimentId parameters are required' },
            { status: 400 }
          );
        }
        
        const config = await abTestEngine.getExperimentConfig(userId, experimentId);
        return NextResponse.json({
          userId,
          experimentId,
          config
        });
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: status, experiments, experiment_details, experiment_results, user_assignments, experiment_config' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('A/B testing API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { experimentId, updates } = body;

    if (!experimentId || !updates) {
      return NextResponse.json(
        { error: 'experimentId and updates are required' },
        { status: 400 }
      );
    }

    const experiment = abTestEngine.getExperiment(experimentId);
    if (!experiment) {
      return NextResponse.json(
        { error: 'Experiment not found' },
        { status: 404 }
      );
    }

    // Update experiment properties
    Object.assign(experiment, updates, { updatedAt: new Date() });

    return NextResponse.json({
      success: true,
      experimentId,
      updatedExperiment: experiment,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('A/B testing update error:', error);
    return NextResponse.json(
      { error: 'Failed to update experiment' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const experimentId = url.searchParams.get('experimentId');

    if (!experimentId) {
      return NextResponse.json(
        { error: 'experimentId parameter is required' },
        { status: 400 }
      );
    }

    const experiment = abTestEngine.getExperiment(experimentId);
    if (!experiment) {
      return NextResponse.json(
        { error: 'Experiment not found' },
        { status: 404 }
      );
    }

    if (experiment.status === 'running') {
      return NextResponse.json(
        { error: 'Cannot delete a running experiment. Stop it first.' },
        { status: 400 }
      );
    }

    // Archive the experiment instead of deleting
    experiment.status = 'archived';
    experiment.updatedAt = new Date();

    return NextResponse.json({
      success: true,
      experimentId,
      message: 'Experiment archived successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('A/B testing delete error:', error);
    return NextResponse.json(
      { error: 'Failed to archive experiment' },
      { status: 500 }
    );
  }
}

/**
 * Create a new experiment
 */
async function createExperiment(data: any) {
  const {
    name,
    description,
    targetMetrics,
    variants,
    trafficAllocation = 1.0,
    segmentationRules = [],
    minimumDetectableEffect = 0.05,
    confidenceLevel = 0.95,
    power = 0.8,
    createdBy = 'api'
  } = data;

  if (!name || !targetMetrics || !variants) {
    throw new Error('name, targetMetrics, and variants are required');
  }

  if (!Array.isArray(variants) || variants.length < 2) {
    throw new Error('At least 2 variants are required');
  }

  // Validate variants
  const totalAllocation = variants.reduce((sum: number, v: any) => sum + (v.trafficAllocation || 0), 0);
  if (Math.abs(totalAllocation - 1.0) > 0.001) {
    throw new Error('Variant traffic allocations must sum to 1.0');
  }

  const controlVariants = variants.filter((v: any) => v.isControl);
  if (controlVariants.length !== 1) {
    throw new Error('Exactly one control variant is required');
  }

  // Generate success criteria from target metrics
  const successCriteria = targetMetrics.map((metric: string) => ({
    metric,
    operator: '>' as const,
    threshold: 0.05, // 5% improvement threshold
    priority: 'primary' as const
  }));

  const experimentConfig = {
    id: generateExperimentId(),
    name,
    description,
    status: 'draft' as const,
    startDate: new Date(),
    targetMetrics,
    successCriteria,
    variants: variants.map((v: any, index: number) => ({
      id: `variant_${index}`,
      ...v
    })),
    trafficAllocation,
    segmentationRules,
    minimumSampleSize: 1000, // Will be calculated
    minimumDetectableEffect,
    confidenceLevel,
    power,
    createdBy
  };

  const experiment = await abTestEngine.createExperiment(experimentConfig);

  return {
    experiment,
    message: 'Experiment created successfully'
  };
}

/**
 * Start an experiment
 */
async function startExperiment(experimentId: string) {
  await abTestEngine.startExperiment(experimentId);
  
  return {
    experimentId,
    message: 'Experiment started successfully',
    startedAt: new Date().toISOString()
  };
}

/**
 * Stop an experiment
 */
async function stopExperiment(experimentId: string) {
  await abTestEngine.stopExperiment(experimentId);
  
  // Get final results
  const results = await abTestEngine.calculateExperimentResults(experimentId);
  const tests = await abTestEngine.performStatisticalTests(experimentId);
  const summary = await abTestEngine.getExperimentSummary(experimentId);
  
  return {
    experimentId,
    message: 'Experiment stopped successfully',
    stoppedAt: new Date().toISOString(),
    finalResults: Object.fromEntries(results),
    statisticalTests: tests,
    summary
  };
}

/**
 * Assign user to experiments
 */
async function assignUser(userId: string, data: any) {
  const { sessionId, userAttributes = {} } = data;
  
  const assignments = await abTestEngine.assignUser(userId, sessionId, userAttributes);
  
  return {
    userId,
    sessionId,
    assignments,
    assignedExperiments: assignments.length
  };
}

/**
 * Track experiment event
 */
async function trackEvent(userId: string, data: any) {
  const { eventType, eventData = {}, value, sessionId } = data;
  
  if (!eventType) {
    throw new Error('eventType is required');
  }
  
  await abTestEngine.trackEvent(userId, eventType, eventData, value, sessionId);
  
  // Also track in behavioral analytics
  await behavioralTracker.trackEvent({
    userId,
    sessionId: sessionId || `session_${Date.now()}`,
    eventType,
    eventCategory: 'experiment' as const,
    properties: {
      ...eventData,
      experimentEvent: true,
      value
    },
    context: {
      deviceType: data.deviceType || 'desktop',
      userAgent: data.userAgent
    },
    value,
    timestamp: new Date()
  });
  
  return {
    userId,
    eventType,
    tracked: true,
    timestamp: new Date().toISOString()
  };
}

/**
 * Process experiment feedback
 */
async function processFeedback(data: any) {
  const { feedback } = data;
  
  if (!feedback || !Array.isArray(feedback)) {
    throw new Error('feedback array is required');
  }
  
  // Process feedback for hybrid recommendation engine if available
  // This would integrate with the ML prediction API
  
  return {
    processed: feedback.length,
    message: 'Feedback processed successfully'
  };
}

/**
 * Generate experiment statistics and insights
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, experimentId, parameters = {} } = body;

    if (!action || !experimentId) {
      return NextResponse.json(
        { error: 'action and experimentId are required' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'calculate_sample_size':
        const experiment = abTestEngine.getExperiment(experimentId);
        if (!experiment) {
          return NextResponse.json(
            { error: 'Experiment not found' },
            { status: 404 }
          );
        }
        
        // Sample size calculation would be done here
        result = {
          experimentId,
          currentSampleSize: experiment.minimumSampleSize,
          recommendedSampleSize: Math.max(experiment.minimumSampleSize, 2000),
          estimatedDuration: '2-4 weeks',
          powerAnalysis: {
            effect_size: experiment.minimumDetectableEffect,
            power: experiment.power,
            alpha: 1 - experiment.confidenceLevel
          }
        };
        break;

      case 'generate_insights':
        const insights = await generateExperimentInsights(experimentId, parameters);
        result = { experimentId, insights };
        break;

      case 'export_results':
        const exportData = await exportExperimentResults(experimentId, parameters.format || 'json');
        result = { experimentId, exportData };
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('A/B testing analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to process analysis request' },
      { status: 500 }
    );
  }
}

/**
 * Generate experiment insights
 */
async function generateExperimentInsights(experimentId: string, parameters: any) {
  const experiment = abTestEngine.getExperiment(experimentId);
  if (!experiment) {
    throw new Error('Experiment not found');
  }

  const results = await abTestEngine.calculateExperimentResults(experimentId);
  const tests = await abTestEngine.performStatisticalTests(experimentId);
  const summary = await abTestEngine.getExperimentSummary(experimentId);

  const insights = [];

  // Performance insights
  const resultsArray = Array.from(results.values());
  if (resultsArray.length > 1) {
    const bestPerforming = resultsArray.reduce((best, current) => 
      (current.conversionRate || 0) > (best.conversionRate || 0) ? current : best
    );
    
    insights.push(`Best performing variant: ${bestPerforming.variantId} with ${(bestPerforming.conversionRate! * 100).toFixed(2)}% conversion rate`);
  }

  // Statistical insights
  const significantTests = tests.filter(test => test.statisticallySignificant);
  if (significantTests.length > 0) {
    insights.push(`${significantTests.length} metrics show statistically significant results`);
  } else {
    insights.push('No statistically significant results yet - consider running longer or increasing sample size');
  }

  // Sample size insights
  const totalSample = resultsArray.reduce((sum, result) => sum + result.sampleSize, 0);
  if (totalSample < experiment.minimumSampleSize) {
    const progress = Math.round((totalSample / experiment.minimumSampleSize) * 100);
    insights.push(`Sample size progress: ${progress}% (${totalSample}/${experiment.minimumSampleSize})`);
  }

  // Duration insights
  if (experiment.startDate) {
    const daysRunning = Math.floor((Date.now() - experiment.startDate.getTime()) / (1000 * 60 * 60 * 24));
    insights.push(`Experiment has been running for ${daysRunning} days`);
  }

  return {
    totalInsights: insights.length,
    insights,
    recommendations: summary.recommendations,
    confidence: summary.significance.hasSignificance ? 'High' : 'Low'
  };
}

/**
 * Export experiment results
 */
async function exportExperimentResults(experimentId: string, format: string) {
  const experiment = abTestEngine.getExperiment(experimentId);
  if (!experiment) {
    throw new Error('Experiment not found');
  }

  const results = await abTestEngine.calculateExperimentResults(experimentId);
  const tests = await abTestEngine.performStatisticalTests(experimentId);
  const summary = await abTestEngine.getExperimentSummary(experimentId);

  const exportData = {
    experiment: {
      id: experiment.id,
      name: experiment.name,
      status: experiment.status,
      startDate: experiment.startDate,
      endDate: experiment.endDate,
      variants: experiment.variants
    },
    results: Object.fromEntries(results),
    statisticalTests: tests,
    summary
  };

  // In a real implementation, this would generate different formats
  return {
    format,
    data: exportData,
    downloadUrl: `/api/analytics/experiments/download?experimentId=${experimentId}&format=${format}`,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Generate unique experiment ID
 */
function generateExperimentId(): string {
  return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
}

/**
 * Validate experiment configuration
 */
function validateExperimentConfig(config: any) {
  if (!config.name || config.name.trim().length === 0) {
    throw new Error('Experiment name is required');
  }
  
  if (!config.variants || !Array.isArray(config.variants) || config.variants.length < 2) {
    throw new Error('At least 2 variants are required');
  }
  
  const controlVariants = config.variants.filter((v: any) => v.isControl);
  if (controlVariants.length !== 1) {
    throw new Error('Exactly one control variant is required');
  }
  
  const totalAllocation = config.variants.reduce((sum: number, v: any) => sum + (v.trafficAllocation || 0), 0);
  if (Math.abs(totalAllocation - 1.0) > 0.001) {
    throw new Error('Variant traffic allocations must sum to 1.0');
  }
  
  if (!config.targetMetrics || !Array.isArray(config.targetMetrics) || config.targetMetrics.length === 0) {
    throw new Error('At least one target metric is required');
  }
}