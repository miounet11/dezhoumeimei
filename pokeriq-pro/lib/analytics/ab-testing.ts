/**
 * A/B Testing Framework
 * Provides experiment configuration, random assignment algorithms,
 * statistical significance testing, and conversion tracking
 */

export interface ExperimentConfig {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'archived';
  startDate: Date;
  endDate?: Date;
  targetMetrics: string[];
  successCriteria: SuccessCriteria[];
  variants: ExperimentVariant[];
  trafficAllocation: number; // 0-1, percentage of users to include
  segmentationRules?: SegmentationRule[];
  minimumSampleSize: number;
  minimumDetectableEffect: number; // Minimum effect size to detect
  confidenceLevel: number; // Typically 0.95
  power: number; // Statistical power, typically 0.8
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExperimentVariant {
  id: string;
  name: string;
  description: string;
  trafficAllocation: number; // 0-1, what percentage of experiment traffic goes to this variant
  configuration: Record<string, any>; // Variant-specific configuration
  isControl: boolean;
}

export interface SuccessCriteria {
  metric: string;
  operator: '>' | '<' | '=' | '>=' | '<=';
  threshold: number;
  priority: 'primary' | 'secondary' | 'guardrail';
}

export interface SegmentationRule {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface ExperimentAssignment {
  userId: string;
  experimentId: string;
  variantId: string;
  assignedAt: Date;
  sessionId?: string;
  segmentInfo: Record<string, any>;
}

export interface ExperimentEvent {
  userId: string;
  sessionId?: string;
  experimentId: string;
  variantId: string;
  eventType: string;
  eventData: Record<string, any>;
  timestamp: Date;
  value?: number; // For conversion value tracking
}

export interface ExperimentResult {
  experimentId: string;
  variantId: string;
  metrics: MetricResult[];
  sampleSize: number;
  conversionRate?: number;
  revenue?: number;
  lastCalculated: Date;
}

export interface MetricResult {
  name: string;
  value: number;
  standardError: number;
  confidenceInterval: [number, number];
  sampleSize: number;
}

export interface StatisticalTest {
  metric: string;
  controlValue: number;
  treatmentValue: number;
  controlSampleSize: number;
  treatmentSampleSize: number;
  pValue: number;
  effectSize: number;
  confidenceInterval: [number, number];
  statisticallySignificant: boolean;
  practicallySignificant: boolean;
  testType: 'ttest' | 'ztest' | 'chi_square' | 'mann_whitney';
}

/**
 * Advanced A/B Testing Engine
 */
export class ABTestingEngine {
  private experiments: Map<string, ExperimentConfig> = new Map();
  private assignments: Map<string, Map<string, ExperimentAssignment>> = new Map(); // userId -> experimentId -> assignment
  private events: Map<string, ExperimentEvent[]> = new Map(); // experimentId -> events
  private results: Map<string, Map<string, ExperimentResult>> = new Map(); // experimentId -> variantId -> result
  private cache: Map<string, any> = new Map(); // Simple caching for performance

  constructor() {}

  /**
   * Create a new experiment
   */
  async createExperiment(config: Omit<ExperimentConfig, 'createdAt' | 'updatedAt'>): Promise<ExperimentConfig> {
    // Validate experiment configuration
    this.validateExperimentConfig(config);
    
    const experiment: ExperimentConfig = {
      ...config,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.experiments.set(experiment.id, experiment);
    this.events.set(experiment.id, []);
    this.results.set(experiment.id, new Map());
    
    // Calculate required sample size
    await this.calculateRequiredSampleSize(experiment);
    
    console.log(`Created experiment: ${experiment.name} (${experiment.id})`);
    return experiment;
  }

  /**
   * Start an experiment
   */
  async startExperiment(experimentId: string): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment not found: ${experimentId}`);
    }
    
    if (experiment.status !== 'draft') {
      throw new Error(`Cannot start experiment in status: ${experiment.status}`);
    }
    
    experiment.status = 'running';
    experiment.startDate = new Date();
    experiment.updatedAt = new Date();
    
    console.log(`Started experiment: ${experiment.name}`);
  }

  /**
   * Stop an experiment
   */
  async stopExperiment(experimentId: string): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment not found: ${experimentId}`);
    }
    
    experiment.status = 'completed';
    experiment.endDate = new Date();
    experiment.updatedAt = new Date();
    
    // Calculate final results
    await this.calculateExperimentResults(experimentId);
    
    console.log(`Stopped experiment: ${experiment.name}`);
  }

  /**
   * Assign a user to experiment variants
   */
  async assignUser(userId: string, sessionId?: string, userAttributes?: Record<string, any>): Promise<ExperimentAssignment[]> {
    const assignments: ExperimentAssignment[] = [];
    const runningExperiments = Array.from(this.experiments.values()).filter(exp => exp.status === 'running');
    
    for (const experiment of runningExperiments) {
      // Check if user is already assigned
      const existingAssignment = this.assignments.get(userId)?.get(experiment.id);
      if (existingAssignment) {
        assignments.push(existingAssignment);
        continue;
      }
      
      // Check if user meets segmentation criteria
      if (!this.meetsCriteria(userAttributes || {}, experiment.segmentationRules || [])) {
        continue;
      }
      
      // Check traffic allocation
      if (!this.shouldIncludeInExperiment(userId, experiment.trafficAllocation)) {
        continue;
      }
      
      // Assign to variant
      const variantId = this.assignToVariant(userId, experiment);
      const assignment: ExperimentAssignment = {
        userId,
        experimentId: experiment.id,
        variantId,
        assignedAt: new Date(),
        sessionId,
        segmentInfo: userAttributes || {}
      };
      
      // Store assignment
      if (!this.assignments.has(userId)) {
        this.assignments.set(userId, new Map());
      }
      this.assignments.get(userId)!.set(experiment.id, assignment);
      assignments.push(assignment);
    }
    
    return assignments;
  }

  /**
   * Track an experiment event
   */
  async trackEvent(
    userId: string,
    eventType: string,
    eventData: Record<string, any> = {},
    value?: number,
    sessionId?: string
  ): Promise<void> {
    
    const userAssignments = this.assignments.get(userId);
    if (!userAssignments) return;
    
    for (const [experimentId, assignment] of userAssignments) {
      const experiment = this.experiments.get(experimentId);
      if (!experiment || experiment.status !== 'running') continue;
      
      const event: ExperimentEvent = {
        userId,
        sessionId,
        experimentId,
        variantId: assignment.variantId,
        eventType,
        eventData,
        timestamp: new Date(),
        value
      };
      
      const experimentEvents = this.events.get(experimentId) || [];
      experimentEvents.push(event);
      this.events.set(experimentId, experimentEvents);
      
      // Clear cached results when new events arrive
      this.clearCachedResults(experimentId);
    }
  }

  /**
   * Get experiment configuration for a user
   */
  async getExperimentConfig(userId: string, experimentId: string): Promise<Record<string, any> | null> {
    const assignment = this.assignments.get(userId)?.get(experimentId);
    if (!assignment) return null;
    
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') return null;
    
    const variant = experiment.variants.find(v => v.id === assignment.variantId);
    return variant?.configuration || null;
  }

  /**
   * Calculate experiment results with statistical testing
   */
  async calculateExperimentResults(experimentId: string): Promise<Map<string, ExperimentResult>> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment not found: ${experimentId}`);
    }
    
    const cacheKey = `results_${experimentId}_${Date.now()}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;
    
    const events = this.events.get(experimentId) || [];
    const results = new Map<string, ExperimentResult>();
    
    // Calculate results for each variant
    for (const variant of experiment.variants) {
      const variantEvents = events.filter(e => e.variantId === variant.id);
      const uniqueUsers = new Set(variantEvents.map(e => e.userId));
      
      const metrics: MetricResult[] = [];
      
      // Calculate metrics
      for (const metric of experiment.targetMetrics) {
        const metricResult = await this.calculateMetric(metric, variantEvents, Array.from(uniqueUsers));
        metrics.push(metricResult);
      }
      
      // Calculate conversion rate (example metric)
      const conversions = variantEvents.filter(e => e.eventType === 'conversion').length;
      const conversionRate = uniqueUsers.size > 0 ? conversions / uniqueUsers.size : 0;
      
      // Calculate revenue
      const revenue = variantEvents
        .filter(e => e.value !== undefined)
        .reduce((sum, e) => sum + (e.value || 0), 0);
      
      results.set(variant.id, {
        experimentId,
        variantId: variant.id,
        metrics,
        sampleSize: uniqueUsers.size,
        conversionRate,
        revenue,
        lastCalculated: new Date()
      });
    }
    
    this.results.set(experimentId, results);
    this.cache.set(cacheKey, results);
    
    return results;
  }

  /**
   * Perform statistical significance tests
   */
  async performStatisticalTests(experimentId: string): Promise<StatisticalTest[]> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment not found: ${experimentId}`);
    }
    
    const results = await this.calculateExperimentResults(experimentId);
    const controlVariant = experiment.variants.find(v => v.isControl);
    if (!controlVariant) {
      throw new Error(`No control variant found for experiment: ${experimentId}`);
    }
    
    const controlResult = results.get(controlVariant.id);
    if (!controlResult) {
      throw new Error(`No results found for control variant: ${controlVariant.id}`);
    }
    
    const tests: StatisticalTest[] = [];
    
    // Test each treatment variant against control
    for (const variant of experiment.variants) {
      if (variant.isControl) continue;
      
      const treatmentResult = results.get(variant.id);
      if (!treatmentResult) continue;
      
      // Test each metric
      for (let i = 0; i < controlResult.metrics.length; i++) {
        const controlMetric = controlResult.metrics[i];
        const treatmentMetric = treatmentResult.metrics[i];
        
        const test = await this.performTTest(
          controlMetric,
          treatmentMetric,
          controlResult.sampleSize,
          treatmentResult.sampleSize,
          experiment.confidenceLevel
        );
        
        test.metric = controlMetric.name;
        tests.push(test);
      }
      
      // Test conversion rate if available
      if (controlResult.conversionRate !== undefined && treatmentResult.conversionRate !== undefined) {
        const conversionTest = await this.performProportionTest(
          controlResult.conversionRate,
          treatmentResult.conversionRate,
          controlResult.sampleSize,
          treatmentResult.sampleSize,
          experiment.confidenceLevel
        );
        
        conversionTest.metric = 'conversion_rate';
        tests.push(conversionTest);
      }
    }
    
    return tests;
  }

  /**
   * Check if experiment has reached statistical significance
   */
  async hasReachedSignificance(experimentId: string): Promise<{
    hasSignificance: boolean;
    tests: StatisticalTest[];
    recommendation: string;
  }> {
    
    const tests = await this.performStatisticalTests(experimentId);
    const experiment = this.experiments.get(experimentId)!;
    
    // Check primary metrics
    const primaryTests = tests.filter(test => 
      experiment.successCriteria.some(criteria => 
        criteria.metric === test.metric && criteria.priority === 'primary'
      )
    );
    
    const hasSignificantPrimaryMetrics = primaryTests.some(test => test.statisticallySignificant);
    
    // Check guardrail metrics (should not be negatively affected)
    const guardrailTests = tests.filter(test =>
      experiment.successCriteria.some(criteria =>
        criteria.metric === test.metric && criteria.priority === 'guardrail'
      )
    );
    
    const hasNegativeGuardrails = guardrailTests.some(test => 
      test.statisticallySignificant && test.effectSize < 0
    );
    
    let recommendation = '';
    
    if (hasSignificantPrimaryMetrics && !hasNegativeGuardrails) {
      recommendation = 'Experiment shows positive results. Consider rolling out the winning variant.';
    } else if (hasNegativeGuardrails) {
      recommendation = 'Experiment shows negative effects on guardrail metrics. Consider stopping.';
    } else if (!hasSignificantPrimaryMetrics) {
      const minSampleReached = await this.hasMinimumSample(experimentId);
      if (minSampleReached) {
        recommendation = 'No significant effect detected with adequate sample size. Consider stopping.';
      } else {
        recommendation = 'Continue experiment to reach minimum sample size for reliable results.';
      }
    }
    
    return {
      hasSignificance: hasSignificantPrimaryMetrics,
      tests,
      recommendation
    };
  }

  /**
   * Get experiment summary and recommendations
   */
  async getExperimentSummary(experimentId: string): Promise<{
    experiment: ExperimentConfig;
    results: Map<string, ExperimentResult>;
    tests: StatisticalTest[];
    significance: any;
    recommendations: string[];
  }> {
    
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment not found: ${experimentId}`);
    }
    
    const results = await this.calculateExperimentResults(experimentId);
    const tests = await this.performStatisticalTests(experimentId);
    const significance = await this.hasReachedSignificance(experimentId);
    
    const recommendations: string[] = [significance.recommendation];
    
    // Add sample size recommendations
    const minSampleReached = await this.hasMinimumSample(experimentId);
    if (!minSampleReached) {
      const currentSample = Array.from(results.values()).reduce((sum, r) => sum + r.sampleSize, 0);
      const requiredSample = experiment.minimumSampleSize;
      const progress = Math.round((currentSample / requiredSample) * 100);
      recommendations.push(`Sample size progress: ${progress}% (${currentSample}/${requiredSample} users)`);
    }
    
    // Add performance recommendations
    const bestPerformingVariant = this.getBestPerformingVariant(results, experiment.successCriteria);
    if (bestPerformingVariant) {
      recommendations.push(`Best performing variant: ${bestPerformingVariant}`);
    }
    
    return {
      experiment,
      results,
      tests,
      significance,
      recommendations
    };
  }

  /**
   * Private helper methods
   */

  private validateExperimentConfig(config: Partial<ExperimentConfig>): void {
    if (!config.name || config.name.trim().length === 0) {
      throw new Error('Experiment name is required');
    }
    
    if (!config.variants || config.variants.length < 2) {
      throw new Error('At least 2 variants are required');
    }
    
    const controlVariants = config.variants.filter(v => v.isControl);
    if (controlVariants.length !== 1) {
      throw new Error('Exactly one control variant is required');
    }
    
    const totalAllocation = config.variants.reduce((sum, v) => sum + v.trafficAllocation, 0);
    if (Math.abs(totalAllocation - 1.0) > 0.001) {
      throw new Error(`Variant traffic allocation must sum to 1.0, got ${totalAllocation}`);
    }
    
    if (!config.targetMetrics || config.targetMetrics.length === 0) {
      throw new Error('At least one target metric is required');
    }
  }

  private async calculateRequiredSampleSize(experiment: ExperimentConfig): Promise<void> {
    // Simplified sample size calculation using power analysis
    const alpha = 1 - experiment.confidenceLevel; // Type I error rate
    const beta = 1 - experiment.power; // Type II error rate
    const delta = experiment.minimumDetectableEffect; // Effect size
    
    // For a two-sample t-test (simplified)
    const zAlpha = this.getZScore(alpha / 2); // Two-tailed test
    const zBeta = this.getZScore(beta);
    
    // Assuming equal variance and sample sizes
    const sampleSizePerVariant = Math.ceil(
      2 * Math.pow((zAlpha + zBeta), 2) / Math.pow(delta, 2)
    );
    
    experiment.minimumSampleSize = sampleSizePerVariant * experiment.variants.length;
    
    console.log(`Calculated minimum sample size: ${experiment.minimumSampleSize} users`);
  }

  private shouldIncludeInExperiment(userId: string, trafficAllocation: number): boolean {
    const hash = this.hashUserId(userId);
    return (hash % 100) / 100 < trafficAllocation;
  }

  private assignToVariant(userId: string, experiment: ExperimentConfig): string {
    const hash = this.hashUserId(userId + experiment.id);
    const random = (hash % 10000) / 10000; // More precise random value
    
    let cumulativeAllocation = 0;
    for (const variant of experiment.variants) {
      cumulativeAllocation += variant.trafficAllocation;
      if (random < cumulativeAllocation) {
        return variant.id;
      }
    }
    
    // Fallback to control variant
    return experiment.variants.find(v => v.isControl)?.id || experiment.variants[0].id;
  }

  private meetsCriteria(attributes: Record<string, any>, rules: SegmentationRule[]): boolean {
    if (rules.length === 0) return true;
    
    for (const rule of rules) {
      const attributeValue = attributes[rule.field];
      let ruleMatches = false;
      
      switch (rule.operator) {
        case 'equals':
          ruleMatches = attributeValue === rule.value;
          break;
        case 'not_equals':
          ruleMatches = attributeValue !== rule.value;
          break;
        case 'in':
          ruleMatches = Array.isArray(rule.value) && rule.value.includes(attributeValue);
          break;
        case 'not_in':
          ruleMatches = Array.isArray(rule.value) && !rule.value.includes(attributeValue);
          break;
        case 'greater_than':
          ruleMatches = typeof attributeValue === 'number' && attributeValue > rule.value;
          break;
        case 'less_than':
          ruleMatches = typeof attributeValue === 'number' && attributeValue < rule.value;
          break;
      }
      
      // For simplicity, treating all rules as AND conditions
      if (!ruleMatches) return false;
    }
    
    return true;
  }

  private async calculateMetric(
    metricName: string,
    events: ExperimentEvent[],
    users: string[]
  ): Promise<MetricResult> {
    
    let value = 0;
    let sampleSize = users.length;
    
    switch (metricName) {
      case 'conversion_rate':
        const conversions = events.filter(e => e.eventType === 'conversion').length;
        value = sampleSize > 0 ? conversions / sampleSize : 0;
        break;
        
      case 'revenue_per_user':
        const totalRevenue = events
          .filter(e => e.value !== undefined)
          .reduce((sum, e) => sum + (e.value || 0), 0);
        value = sampleSize > 0 ? totalRevenue / sampleSize : 0;
        break;
        
      case 'session_duration':
        const sessionEvents = events.filter(e => e.eventType === 'session_end');
        const totalDuration = sessionEvents.reduce((sum, e) => sum + (e.eventData.duration || 0), 0);
        value = sessionEvents.length > 0 ? totalDuration / sessionEvents.length : 0;
        sampleSize = sessionEvents.length;
        break;
        
      default:
        // Generic event count
        const eventCount = events.filter(e => e.eventType === metricName).length;
        value = sampleSize > 0 ? eventCount / sampleSize : 0;
    }
    
    // Calculate standard error (simplified)
    const standardError = sampleSize > 1 ? Math.sqrt(value * (1 - value) / sampleSize) : 0;
    
    // Calculate confidence interval (95% CI)
    const margin = 1.96 * standardError; // For 95% CI
    const confidenceInterval: [number, number] = [
      Math.max(0, value - margin),
      Math.min(1, value + margin)
    ];
    
    return {
      name: metricName,
      value,
      standardError,
      confidenceInterval,
      sampleSize
    };
  }

  private async performTTest(
    control: MetricResult,
    treatment: MetricResult,
    controlSampleSize: number,
    treatmentSampleSize: number,
    confidenceLevel: number
  ): Promise<StatisticalTest> {
    
    const controlMean = control.value;
    const treatmentMean = treatment.value;
    const controlSE = control.standardError;
    const treatmentSE = treatment.standardError;
    
    // Pooled standard error
    const pooledSE = Math.sqrt(
      (Math.pow(controlSE, 2) * (controlSampleSize - 1) + 
       Math.pow(treatmentSE, 2) * (treatmentSampleSize - 1)) /
      (controlSampleSize + treatmentSampleSize - 2)
    );
    
    // T-statistic
    const tStat = (treatmentMean - controlMean) / 
      (pooledSE * Math.sqrt(1/controlSampleSize + 1/treatmentSampleSize));
    
    // Degrees of freedom
    const df = controlSampleSize + treatmentSampleSize - 2;
    
    // P-value (approximation using normal distribution for large samples)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(tStat)));
    
    // Effect size (Cohen's d)
    const effectSize = (treatmentMean - controlMean) / pooledSE;
    
    // Confidence interval for the difference
    const marginOfError = this.getZScore((1 - confidenceLevel) / 2) * 
      pooledSE * Math.sqrt(1/controlSampleSize + 1/treatmentSampleSize);
    
    const confidenceInterval: [number, number] = [
      (treatmentMean - controlMean) - marginOfError,
      (treatmentMean - controlMean) + marginOfError
    ];
    
    return {
      metric: '',
      controlValue: controlMean,
      treatmentValue: treatmentMean,
      controlSampleSize,
      treatmentSampleSize,
      pValue,
      effectSize,
      confidenceInterval,
      statisticallySignificant: pValue < (1 - confidenceLevel),
      practicallySignificant: Math.abs(effectSize) > 0.2, // Small effect threshold
      testType: 'ttest'
    };
  }

  private async performProportionTest(
    controlRate: number,
    treatmentRate: number,
    controlSampleSize: number,
    treatmentSampleSize: number,
    confidenceLevel: number
  ): Promise<StatisticalTest> {
    
    // Pooled proportion
    const pooledP = ((controlRate * controlSampleSize) + (treatmentRate * treatmentSampleSize)) /
      (controlSampleSize + treatmentSampleSize);
    
    // Standard error
    const standardError = Math.sqrt(pooledP * (1 - pooledP) * (1/controlSampleSize + 1/treatmentSampleSize));
    
    // Z-statistic
    const zStat = (treatmentRate - controlRate) / standardError;
    
    // P-value
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zStat)));
    
    // Effect size (difference in proportions)
    const effectSize = treatmentRate - controlRate;
    
    // Confidence interval
    const marginOfError = this.getZScore((1 - confidenceLevel) / 2) * standardError;
    const confidenceInterval: [number, number] = [
      effectSize - marginOfError,
      effectSize + marginOfError
    ];
    
    return {
      metric: '',
      controlValue: controlRate,
      treatmentValue: treatmentRate,
      controlSampleSize,
      treatmentSampleSize,
      pValue,
      effectSize,
      confidenceInterval,
      statisticallySignificant: pValue < (1 - confidenceLevel),
      practicallySignificant: Math.abs(effectSize) > 0.05, // 5% difference threshold
      testType: 'ztest'
    };
  }

  private async hasMinimumSample(experimentId: string): Promise<boolean> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return false;
    
    const results = await this.calculateExperimentResults(experimentId);
    const totalSample = Array.from(results.values()).reduce((sum, r) => sum + r.sampleSize, 0);
    
    return totalSample >= experiment.minimumSampleSize;
  }

  private getBestPerformingVariant(
    results: Map<string, ExperimentResult>,
    criteria: SuccessCriteria[]
  ): string | null {
    
    const primaryCriteria = criteria.filter(c => c.priority === 'primary');
    if (primaryCriteria.length === 0) return null;
    
    let bestVariant: string | null = null;
    let bestScore = -Infinity;
    
    for (const [variantId, result] of results) {
      let score = 0;
      
      for (const criterion of primaryCriteria) {
        const metric = result.metrics.find(m => m.name === criterion.metric);
        if (metric) {
          // Simple scoring: higher values are better (adjust as needed)
          score += metric.value;
        }
        
        // Add conversion rate if available
        if (criterion.metric === 'conversion_rate' && result.conversionRate !== undefined) {
          score += result.conversionRate;
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestVariant = variantId;
      }
    }
    
    return bestVariant;
  }

  private clearCachedResults(experimentId: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => key.startsWith(`results_${experimentId}_`));
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Utility methods
  
  private hashUserId(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private getZScore(p: number): number {
    // Approximate inverse normal CDF (Box-Muller transformation simplified)
    // For common values used in A/B testing
    const zScores: Record<number, number> = {
      0.025: 1.96,  // 95% CI
      0.005: 2.576, // 99% CI
      0.0005: 3.291, // 99.9% CI
      0.1: 1.282,   // 80% CI
      0.05: 1.645   // 90% CI
    };
    
    return zScores[p] || 1.96; // Default to 95% CI
  }

  private normalCDF(x: number): number {
    // Approximate normal CDF using error function approximation
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private erf(x: number): number {
    // Approximation of error function
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  /**
   * Get active experiments for a user
   */
  getActiveExperiments(userId: string): ExperimentAssignment[] {
    const userAssignments = this.assignments.get(userId);
    if (!userAssignments) return [];
    
    return Array.from(userAssignments.values()).filter(assignment => {
      const experiment = this.experiments.get(assignment.experimentId);
      return experiment && experiment.status === 'running';
    });
  }

  /**
   * Get all experiments
   */
  getAllExperiments(): ExperimentConfig[] {
    return Array.from(this.experiments.values());
  }

  /**
   * Get experiment by ID
   */
  getExperiment(experimentId: string): ExperimentConfig | null {
    return this.experiments.get(experimentId) || null;
  }

  /**
   * Get engine statistics
   */
  getStats() {
    const totalAssignments = Array.from(this.assignments.values())
      .reduce((sum, userAssignments) => sum + userAssignments.size, 0);
    
    const totalEvents = Array.from(this.events.values())
      .reduce((sum, events) => sum + events.length, 0);
    
    return {
      totalExperiments: this.experiments.size,
      runningExperiments: Array.from(this.experiments.values()).filter(e => e.status === 'running').length,
      completedExperiments: Array.from(this.experiments.values()).filter(e => e.status === 'completed').length,
      totalAssignments,
      totalEvents,
      cacheSize: this.cache.size
    };
  }
}

export default ABTestingEngine;