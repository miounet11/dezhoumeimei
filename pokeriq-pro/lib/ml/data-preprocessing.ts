/**
 * Data Preprocessing Utilities
 * Provides comprehensive data preprocessing capabilities for ML pipelines
 */

export interface DataSample {
  [key: string]: any;
}

export interface PreprocessingPipeline {
  steps: PreprocessingStep[];
  fitted: boolean;
  metadata: PipelineMetadata;
}

export interface PreprocessingStep {
  name: string;
  type: 'cleaning' | 'transformation' | 'feature_engineering' | 'scaling' | 'encoding';
  parameters: Record<string, any>;
  fitted: boolean;
}

export interface PipelineMetadata {
  inputFeatures: string[];
  outputFeatures: string[];
  sampleSize: number;
  createdAt: Date;
  lastFitted: Date | null;
}

export interface DataQualityReport {
  totalSamples: number;
  totalFeatures: number;
  missingValueCounts: Record<string, number>;
  duplicateCount: number;
  outlierCounts: Record<string, number>;
  dataTypes: Record<string, string>;
  uniqueValueCounts: Record<string, number>;
  memoryUsage: number;
  qualityScore: number;
  recommendations: string[];
}

export interface OutlierDetectionResult {
  outlierIndices: number[];
  outlierScores: number[];
  threshold: number;
  method: string;
  affectedFeatures: string[];
}

export interface FeatureDistribution {
  feature: string;
  type: 'numerical' | 'categorical' | 'binary' | 'text';
  statistics: {
    count: number;
    mean?: number;
    std?: number;
    min?: number;
    max?: number;
    median?: number;
    mode?: any;
    uniqueCount: number;
    missingCount: number;
    skewness?: number;
    kurtosis?: number;
  };
  distribution: {
    histogram?: { bins: number[], counts: number[] };
    valueFrequency?: Record<string, number>;
  };
}

/**
 * Advanced Data Preprocessing Engine
 */
export class DataPreprocessor {
  private pipelines: Map<string, PreprocessingPipeline> = new Map();
  private cachedTransformations: Map<string, any> = new Map();
  private qualityReports: Map<string, DataQualityReport> = new Map();
  
  constructor() {}

  /**
   * Create a preprocessing pipeline
   */
  createPipeline(
    name: string,
    steps: Omit<PreprocessingStep, 'fitted'>[]
  ): PreprocessingPipeline {
    
    const pipeline: PreprocessingPipeline = {
      steps: steps.map(step => ({ ...step, fitted: false })),
      fitted: false,
      metadata: {
        inputFeatures: [],
        outputFeatures: [],
        sampleSize: 0,
        createdAt: new Date(),
        lastFitted: null
      }
    };
    
    this.pipelines.set(name, pipeline);
    return pipeline;
  }

  /**
   * Fit and transform data using a pipeline
   */
  fitTransform(
    pipelineName: string,
    data: DataSample[]
  ): { transformedData: DataSample[], pipeline: PreprocessingPipeline } {
    
    const pipeline = this.pipelines.get(pipelineName);
    if (!pipeline) {
      throw new Error(`Pipeline '${pipelineName}' not found`);
    }
    
    let currentData = JSON.parse(JSON.stringify(data)); // Deep copy
    
    // Update metadata
    pipeline.metadata.inputFeatures = Object.keys(data[0] || {});
    pipeline.metadata.sampleSize = data.length;
    
    // Apply each step
    for (const step of pipeline.steps) {
      currentData = this.applyStep(step, currentData, true);
      step.fitted = true;
    }
    
    // Update pipeline metadata
    pipeline.fitted = true;
    pipeline.metadata.lastFitted = new Date();
    pipeline.metadata.outputFeatures = Object.keys(currentData[0] || {});
    
    return { transformedData: currentData, pipeline };
  }

  /**
   * Transform data using a fitted pipeline
   */
  transform(pipelineName: string, data: DataSample[]): DataSample[] {
    const pipeline = this.pipelines.get(pipelineName);
    if (!pipeline) {
      throw new Error(`Pipeline '${pipelineName}' not found`);
    }
    
    if (!pipeline.fitted) {
      throw new Error(`Pipeline '${pipelineName}' has not been fitted yet`);
    }
    
    let currentData = JSON.parse(JSON.stringify(data)); // Deep copy
    
    // Apply each fitted step
    for (const step of pipeline.steps) {
      if (!step.fitted) {
        throw new Error(`Step '${step.name}' has not been fitted yet`);
      }
      currentData = this.applyStep(step, currentData, false);
    }
    
    return currentData;
  }

  /**
   * Generate comprehensive data quality report
   */
  generateDataQualityReport(data: DataSample[], reportName?: string): DataQualityReport {
    const totalSamples = data.length;
    const features = Object.keys(data[0] || {});
    const totalFeatures = features.length;
    
    const missingValueCounts: Record<string, number> = {};
    const dataTypes: Record<string, string> = {};
    const uniqueValueCounts: Record<string, number> = {};
    const outlierCounts: Record<string, number> = {};
    
    // Analyze each feature
    for (const feature of features) {
      const values = data.map(sample => sample[feature]);
      
      // Count missing values
      missingValueCounts[feature] = values.filter(v => v === null || v === undefined || v === '').length;
      
      // Determine data type
      dataTypes[feature] = this.inferDataType(values);
      
      // Count unique values
      uniqueValueCounts[feature] = new Set(values.filter(v => v !== null && v !== undefined && v !== '')).size;
      
      // Count outliers (for numerical features)
      if (dataTypes[feature] === 'numerical') {
        outlierCounts[feature] = this.detectOutliers(values, 'iqr').outlierIndices.length;
      } else {
        outlierCounts[feature] = 0;
      }
    }
    
    // Count duplicates
    const duplicateCount = this.countDuplicates(data);
    
    // Estimate memory usage
    const memoryUsage = this.estimateMemoryUsage(data);
    
    // Calculate quality score
    const qualityScore = this.calculateQualityScore({
      totalSamples,
      totalFeatures,
      missingValueCounts,
      duplicateCount,
      outlierCounts
    });
    
    // Generate recommendations
    const recommendations = this.generateRecommendations({
      missingValueCounts,
      duplicateCount,
      outlierCounts,
      dataTypes,
      uniqueValueCounts,
      totalSamples
    });
    
    const report: DataQualityReport = {
      totalSamples,
      totalFeatures,
      missingValueCounts,
      duplicateCount,
      outlierCounts,
      dataTypes,
      uniqueValueCounts,
      memoryUsage,
      qualityScore,
      recommendations
    };
    
    if (reportName) {
      this.qualityReports.set(reportName, report);
    }
    
    return report;
  }

  /**
   * Clean data by handling missing values, duplicates, and outliers
   */
  cleanData(
    data: DataSample[],
    options: {
      handleMissing?: 'drop' | 'mean' | 'median' | 'mode' | 'forward_fill' | 'backward_fill';
      handleOutliers?: 'remove' | 'clip' | 'transform' | 'keep';
      removeDuplicates?: boolean;
      outlierMethod?: 'iqr' | 'zscore' | 'isolation_forest';
      outlierThreshold?: number;
    } = {}
  ): DataSample[] {
    
    const {
      handleMissing = 'mean',
      handleOutliers = 'clip',
      removeDuplicates = true,
      outlierMethod = 'iqr',
      outlierThreshold = 3
    } = options;
    
    let cleanedData = JSON.parse(JSON.stringify(data)); // Deep copy
    
    // Handle missing values
    cleanedData = this.handleMissingValues(cleanedData, handleMissing);
    
    // Remove duplicates
    if (removeDuplicates) {
      cleanedData = this.removeDuplicates(cleanedData);
    }
    
    // Handle outliers
    if (handleOutliers !== 'keep') {
      cleanedData = this.handleOutliers(cleanedData, handleOutliers, outlierMethod, outlierThreshold);
    }
    
    return cleanedData;
  }

  /**
   * Detect outliers using various methods
   */
  detectOutliers(
    values: any[],
    method: 'iqr' | 'zscore' | 'isolation_forest' = 'iqr',
    threshold: number = 3
  ): OutlierDetectionResult {
    
    // Filter numerical values
    const numericalValues = values.filter(v => typeof v === 'number' && !isNaN(v));
    const numericalIndices = values.map((v, i) => typeof v === 'number' && !isNaN(v) ? i : -1).filter(i => i >= 0);
    
    if (numericalValues.length === 0) {
      return {
        outlierIndices: [],
        outlierScores: [],
        threshold,
        method,
        affectedFeatures: []
      };
    }
    
    let outlierIndices: number[] = [];
    let outlierScores: number[] = [];
    
    switch (method) {
      case 'iqr':
        const result = this.detectOutliersIQR(numericalValues, numericalIndices);
        outlierIndices = result.indices;
        outlierScores = result.scores;
        break;
        
      case 'zscore':
        const zResult = this.detectOutliersZScore(numericalValues, numericalIndices, threshold);
        outlierIndices = zResult.indices;
        outlierScores = zResult.scores;
        break;
        
      case 'isolation_forest':
        // Simplified isolation forest implementation
        const isoResult = this.detectOutliersIsolationForest(numericalValues, numericalIndices);
        outlierIndices = isoResult.indices;
        outlierScores = isoResult.scores;
        break;
    }
    
    return {
      outlierIndices,
      outlierScores,
      threshold,
      method,
      affectedFeatures: ['numerical_feature'] // Placeholder
    };
  }

  /**
   * Generate feature distributions
   */
  analyzeFeatureDistributions(data: DataSample[]): FeatureDistribution[] {
    if (data.length === 0) return [];
    
    const features = Object.keys(data[0]);
    const distributions: FeatureDistribution[] = [];
    
    for (const feature of features) {
      const values = data.map(sample => sample[feature]);
      const type = this.inferDataType(values) as 'numerical' | 'categorical' | 'binary' | 'text';
      
      const distribution = this.calculateFeatureDistribution(feature, values, type);
      distributions.push(distribution);
    }
    
    return distributions;
  }

  /**
   * Resample data for class balance
   */
  resampleData(
    data: DataSample[],
    targetColumn: string,
    method: 'undersample' | 'oversample' | 'smote' = 'oversample'
  ): DataSample[] {
    
    // Group data by target class
    const classGroups = new Map<any, DataSample[]>();
    for (const sample of data) {
      const targetValue = sample[targetColumn];
      if (!classGroups.has(targetValue)) {
        classGroups.set(targetValue, []);
      }
      classGroups.get(targetValue)!.push(sample);
    }
    
    const classSizes = Array.from(classGroups.values()).map(group => group.length);
    
    switch (method) {
      case 'undersample':
        const minSize = Math.min(...classSizes);
        return this.undersampleData(classGroups, minSize);
        
      case 'oversample':
        const maxSize = Math.max(...classSizes);
        return this.oversampleData(classGroups, maxSize);
        
      case 'smote':
        // Simplified SMOTE implementation
        return this.smoteResample(classGroups, Math.max(...classSizes));
        
      default:
        return data;
    }
  }

  /**
   * Split data into train/validation/test sets
   */
  splitData(
    data: DataSample[],
    splits: {
      train: number;
      validation?: number;
      test: number;
    },
    stratifyColumn?: string,
    randomSeed?: number
  ): {
    train: DataSample[];
    validation?: DataSample[];
    test: DataSample[];
  } {
    
    if (randomSeed) {
      // Set random seed for reproducible splits
      Math.random = this.seededRandom(randomSeed);
    }
    
    const { train: trainRatio, validation: valRatio = 0, test: testRatio } = splits;
    
    if (Math.abs((trainRatio + valRatio + testRatio) - 1.0) > 0.001) {
      throw new Error('Split ratios must sum to 1.0');
    }
    
    let shuffledData = [...data];
    
    if (stratifyColumn) {
      // Stratified split
      shuffledData = this.stratifiedShuffle(data, stratifyColumn);
    } else {
      // Random shuffle
      for (let i = shuffledData.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledData[i], shuffledData[j]] = [shuffledData[j], shuffledData[i]];
      }
    }
    
    const trainSize = Math.floor(data.length * trainRatio);
    const valSize = Math.floor(data.length * valRatio);
    
    const result: any = {
      train: shuffledData.slice(0, trainSize),
      test: shuffledData.slice(trainSize + valSize)
    };
    
    if (valRatio > 0) {
      result.validation = shuffledData.slice(trainSize, trainSize + valSize);
    }
    
    return result;
  }

  /**
   * Private helper methods
   */

  private applyStep(step: PreprocessingStep, data: DataSample[], fit: boolean): DataSample[] {
    switch (step.type) {
      case 'cleaning':
        return this.applyCleaning(step, data, fit);
      case 'transformation':
        return this.applyTransformation(step, data, fit);
      case 'feature_engineering':
        return this.applyFeatureEngineering(step, data, fit);
      case 'scaling':
        return this.applyScaling(step, data, fit);
      case 'encoding':
        return this.applyEncoding(step, data, fit);
      default:
        console.warn(`Unknown step type: ${step.type}`);
        return data;
    }
  }

  private applyCleaning(step: PreprocessingStep, data: DataSample[], fit: boolean): DataSample[] {
    const { method, target_features } = step.parameters;
    
    switch (method) {
      case 'remove_missing':
        return data.filter(sample => {
          return target_features.every((feature: string) => 
            sample[feature] !== null && sample[feature] !== undefined && sample[feature] !== ''
          );
        });
        
      case 'remove_duplicates':
        return this.removeDuplicates(data);
        
      case 'remove_outliers':
        return this.handleOutliers(data, 'remove', step.parameters.outlier_method || 'iqr');
        
      default:
        return data;
    }
  }

  private applyTransformation(step: PreprocessingStep, data: DataSample[], fit: boolean): DataSample[] {
    const { method, features } = step.parameters;
    
    return data.map(sample => {
      const transformedSample = { ...sample };
      
      for (const feature of features) {
        const value = sample[feature];
        if (typeof value !== 'number') continue;
        
        switch (method) {
          case 'log':
            transformedSample[feature] = Math.log(Math.max(value, 1e-8));
            break;
          case 'sqrt':
            transformedSample[feature] = Math.sqrt(Math.max(value, 0));
            break;
          case 'square':
            transformedSample[feature] = value * value;
            break;
          case 'reciprocal':
            transformedSample[feature] = value !== 0 ? 1 / value : 0;
            break;
          case 'box_cox':
            // Simplified Box-Cox transformation
            const lambda = step.parameters.lambda || 0;
            if (lambda === 0) {
              transformedSample[feature] = Math.log(Math.max(value, 1e-8));
            } else {
              transformedSample[feature] = (Math.pow(Math.max(value, 1e-8), lambda) - 1) / lambda;
            }
            break;
        }
      }
      
      return transformedSample;
    });
  }

  private applyFeatureEngineering(step: PreprocessingStep, data: DataSample[], fit: boolean): DataSample[] {
    const { method } = step.parameters;
    
    switch (method) {
      case 'polynomial':
        return this.createPolynomialFeatures(data, step.parameters);
      case 'interaction':
        return this.createInteractionFeatures(data, step.parameters);
      case 'binning':
        return this.createBinnedFeatures(data, step.parameters, fit);
      case 'date_features':
        return this.createDateFeatures(data, step.parameters);
      default:
        return data;
    }
  }

  private applyScaling(step: PreprocessingStep, data: DataSample[], fit: boolean): DataSample[] {
    const { method, features } = step.parameters;
    
    if (fit) {
      // Calculate scaling parameters
      const scalingParams: Record<string, any> = {};
      
      for (const feature of features) {
        const values = data.map(sample => sample[feature]).filter(v => typeof v === 'number');
        
        switch (method) {
          case 'standard':
            const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
            const std = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);
            scalingParams[feature] = { mean, std };
            break;
            
          case 'minmax':
            const min = Math.min(...values);
            const max = Math.max(...values);
            scalingParams[feature] = { min, max };
            break;
            
          case 'robust':
            const sorted = values.sort((a, b) => a - b);
            const q25 = sorted[Math.floor(sorted.length * 0.25)];
            const q75 = sorted[Math.floor(sorted.length * 0.75)];
            const median = sorted[Math.floor(sorted.length * 0.5)];
            scalingParams[feature] = { median, q25, q75 };
            break;
        }
      }
      
      step.parameters.scalingParams = scalingParams;
    }
    
    // Apply scaling
    return data.map(sample => {
      const scaledSample = { ...sample };
      
      for (const feature of features) {
        const value = sample[feature];
        if (typeof value !== 'number') continue;
        
        const params = step.parameters.scalingParams[feature];
        
        switch (method) {
          case 'standard':
            scaledSample[feature] = params.std > 0 ? (value - params.mean) / params.std : 0;
            break;
          case 'minmax':
            const range = params.max - params.min;
            scaledSample[feature] = range > 0 ? (value - params.min) / range : 0;
            break;
          case 'robust':
            const iqr = params.q75 - params.q25;
            scaledSample[feature] = iqr > 0 ? (value - params.median) / iqr : 0;
            break;
        }
      }
      
      return scaledSample;
    });
  }

  private applyEncoding(step: PreprocessingStep, data: DataSample[], fit: boolean): DataSample[] {
    const { method, features } = step.parameters;
    
    if (fit) {
      // Learn encoding mappings
      const encodingMappings: Record<string, any> = {};
      
      for (const feature of features) {
        const uniqueValues = [...new Set(data.map(sample => sample[feature]))];
        
        switch (method) {
          case 'label':
            encodingMappings[feature] = Object.fromEntries(
              uniqueValues.map((value, index) => [value, index])
            );
            break;
          case 'onehot':
            encodingMappings[feature] = uniqueValues;
            break;
        }
      }
      
      step.parameters.encodingMappings = encodingMappings;
    }
    
    // Apply encoding
    return data.map(sample => {
      const encodedSample = { ...sample };
      
      for (const feature of features) {
        const value = sample[feature];
        const mapping = step.parameters.encodingMappings[feature];
        
        switch (method) {
          case 'label':
            encodedSample[feature] = mapping[value] || 0;
            break;
          case 'onehot':
            // Remove original feature
            delete encodedSample[feature];
            
            // Add one-hot features
            for (const uniqueValue of mapping) {
              encodedSample[`${feature}_${uniqueValue}`] = value === uniqueValue ? 1 : 0;
            }
            break;
        }
      }
      
      return encodedSample;
    });
  }

  // Data cleaning helper methods
  
  private handleMissingValues(data: DataSample[], method: string): DataSample[] {
    if (method === 'drop') {
      return data.filter(sample => 
        Object.values(sample).every(value => 
          value !== null && value !== undefined && value !== ''
        )
      );
    }
    
    const features = Object.keys(data[0] || {});
    const imputationValues: Record<string, any> = {};
    
    // Calculate imputation values
    for (const feature of features) {
      const values = data.map(sample => sample[feature]).filter(v => v !== null && v !== undefined && v !== '');
      
      if (values.length === 0) continue;
      
      switch (method) {
        case 'mean':
          if (values.every(v => typeof v === 'number')) {
            imputationValues[feature] = values.reduce((sum: number, v) => sum + v, 0) / values.length;
          }
          break;
        case 'median':
          if (values.every(v => typeof v === 'number')) {
            const sorted = values.sort((a, b) => a - b);
            imputationValues[feature] = sorted[Math.floor(sorted.length / 2)];
          }
          break;
        case 'mode':
          const counts = new Map();
          values.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
          let maxCount = 0;
          let mode = values[0];
          for (const [value, count] of counts) {
            if (count > maxCount) {
              maxCount = count;
              mode = value;
            }
          }
          imputationValues[feature] = mode;
          break;
      }
    }
    
    // Apply imputation
    return data.map(sample => {
      const imputedSample = { ...sample };
      
      for (const [feature, value] of Object.entries(sample)) {
        if (value === null || value === undefined || value === '') {
          imputedSample[feature] = imputationValues[feature] || value;
        }
      }
      
      return imputedSample;
    });
  }

  private removeDuplicates(data: DataSample[]): DataSample[] {
    const seen = new Set<string>();
    return data.filter(sample => {
      const key = JSON.stringify(sample);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private handleOutliers(
    data: DataSample[],
    method: string,
    outlierMethod: string = 'iqr',
    threshold: number = 3
  ): DataSample[] {
    
    const features = Object.keys(data[0] || {});
    const numericalFeatures = features.filter(feature => 
      data.every(sample => typeof sample[feature] === 'number' || sample[feature] === null)
    );
    
    let processedData = [...data];
    
    for (const feature of numericalFeatures) {
      const values = data.map(sample => sample[feature]).filter(v => typeof v === 'number');
      if (values.length === 0) continue;
      
      const outlierResult = this.detectOutliers(
        data.map(sample => sample[feature]),
        outlierMethod as any,
        threshold
      );
      
      switch (method) {
        case 'remove':
          processedData = processedData.filter((_, index) => !outlierResult.outlierIndices.includes(index));
          break;
          
        case 'clip':
          const sortedValues = values.sort((a, b) => a - b);
          const lowerBound = sortedValues[Math.floor(sortedValues.length * 0.05)];
          const upperBound = sortedValues[Math.floor(sortedValues.length * 0.95)];
          
          processedData = processedData.map(sample => ({
            ...sample,
            [feature]: Math.max(lowerBound, Math.min(upperBound, sample[feature]))
          }));
          break;
          
        case 'transform':
          // Apply log transformation to reduce outlier impact
          processedData = processedData.map(sample => ({
            ...sample,
            [feature]: typeof sample[feature] === 'number' 
              ? Math.log(Math.max(sample[feature], 1))
              : sample[feature]
          }));
          break;
      }
    }
    
    return processedData;
  }

  // Outlier detection implementations
  
  private detectOutliersIQR(values: number[], indices: number[]): { indices: number[], scores: number[] } {
    const sorted = values.slice().sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    const outlierIndices: number[] = [];
    const outlierScores: number[] = [];
    
    values.forEach((value, i) => {
      if (value < lowerBound || value > upperBound) {
        outlierIndices.push(indices[i]);
        outlierScores.push(Math.max(lowerBound - value, value - upperBound) / iqr);
      }
    });
    
    return { indices: outlierIndices, scores: outlierScores };
  }

  private detectOutliersZScore(values: number[], indices: number[], threshold: number): { indices: number[], scores: number[] } {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const std = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);
    
    const outlierIndices: number[] = [];
    const outlierScores: number[] = [];
    
    values.forEach((value, i) => {
      const zScore = Math.abs((value - mean) / std);
      if (zScore > threshold) {
        outlierIndices.push(indices[i]);
        outlierScores.push(zScore);
      }
    });
    
    return { indices: outlierIndices, scores: outlierScores };
  }

  private detectOutliersIsolationForest(values: number[], indices: number[]): { indices: number[], scores: number[] } {
    // Simplified isolation forest - in practice, use a proper implementation
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const std = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);
    
    const outlierIndices: number[] = [];
    const outlierScores: number[] = [];
    
    values.forEach((value, i) => {
      const isolationScore = Math.abs((value - mean) / std);
      if (isolationScore > 2) { // Simplified threshold
        outlierIndices.push(indices[i]);
        outlierScores.push(isolationScore);
      }
    });
    
    return { indices: outlierIndices, scores: outlierScores };
  }

  // Feature engineering helper methods
  
  private createPolynomialFeatures(data: DataSample[], parameters: any): DataSample[] {
    const { features, degree } = parameters;
    
    return data.map(sample => {
      const newSample = { ...sample };
      
      // Add polynomial features
      for (const feature of features) {
        const value = sample[feature];
        if (typeof value === 'number') {
          for (let d = 2; d <= degree; d++) {
            newSample[`${feature}_pow_${d}`] = Math.pow(value, d);
          }
        }
      }
      
      return newSample;
    });
  }

  private createInteractionFeatures(data: DataSample[], parameters: any): DataSample[] {
    const { features } = parameters;
    
    return data.map(sample => {
      const newSample = { ...sample };
      
      // Add interaction features
      for (let i = 0; i < features.length; i++) {
        for (let j = i + 1; j < features.length; j++) {
          const feature1 = features[i];
          const feature2 = features[j];
          const value1 = sample[feature1];
          const value2 = sample[feature2];
          
          if (typeof value1 === 'number' && typeof value2 === 'number') {
            newSample[`${feature1}_x_${feature2}`] = value1 * value2;
          }
        }
      }
      
      return newSample;
    });
  }

  private createBinnedFeatures(data: DataSample[], parameters: any, fit: boolean): DataSample[] {
    const { features, bins } = parameters;
    
    if (fit) {
      // Calculate bin edges
      const binEdges: Record<string, number[]> = {};
      
      for (const feature of features) {
        const values = data.map(sample => sample[feature]).filter(v => typeof v === 'number').sort((a, b) => a - b);
        const min = values[0];
        const max = values[values.length - 1];
        const step = (max - min) / bins;
        
        binEdges[feature] = Array.from({length: bins + 1}, (_, i) => min + i * step);
      }
      
      parameters.binEdges = binEdges;
    }
    
    return data.map(sample => {
      const newSample = { ...sample };
      
      for (const feature of features) {
        const value = sample[feature];
        if (typeof value === 'number') {
          const edges = parameters.binEdges[feature];
          let bin = 0;
          for (let i = 1; i < edges.length; i++) {
            if (value <= edges[i]) {
              bin = i - 1;
              break;
            }
          }
          newSample[`${feature}_bin`] = bin;
        }
      }
      
      return newSample;
    });
  }

  private createDateFeatures(data: DataSample[], parameters: any): DataSample[] {
    const { features } = parameters;
    
    return data.map(sample => {
      const newSample = { ...sample };
      
      for (const feature of features) {
        const value = sample[feature];
        const date = new Date(value);
        
        if (!isNaN(date.getTime())) {
          newSample[`${feature}_year`] = date.getFullYear();
          newSample[`${feature}_month`] = date.getMonth() + 1;
          newSample[`${feature}_day`] = date.getDate();
          newSample[`${feature}_hour`] = date.getHours();
          newSample[`${feature}_dayofweek`] = date.getDay();
          newSample[`${feature}_quarter`] = Math.floor(date.getMonth() / 3) + 1;
        }
      }
      
      return newSample;
    });
  }

  // Resampling helper methods
  
  private undersampleData(classGroups: Map<any, DataSample[]>, targetSize: number): DataSample[] {
    const result: DataSample[] = [];
    
    for (const [_, samples] of classGroups) {
      const shuffled = samples.slice().sort(() => Math.random() - 0.5);
      result.push(...shuffled.slice(0, targetSize));
    }
    
    return result.sort(() => Math.random() - 0.5);
  }

  private oversampleData(classGroups: Map<any, DataSample[]>, targetSize: number): DataSample[] {
    const result: DataSample[] = [];
    
    for (const [_, samples] of classGroups) {
      const oversampledSamples: DataSample[] = [];
      
      while (oversampledSamples.length < targetSize) {
        const randomIndex = Math.floor(Math.random() * samples.length);
        oversampledSamples.push({ ...samples[randomIndex] });
      }
      
      result.push(...oversampledSamples.slice(0, targetSize));
    }
    
    return result.sort(() => Math.random() - 0.5);
  }

  private smoteResample(classGroups: Map<any, DataSample[]>, targetSize: number): DataSample[] {
    // Simplified SMOTE implementation
    const result: DataSample[] = [];
    
    for (const [classValue, samples] of classGroups) {
      const syntheticSamples: DataSample[] = [];
      const numericalFeatures = Object.keys(samples[0]).filter(feature =>
        samples.every(sample => typeof sample[feature] === 'number')
      );
      
      while (syntheticSamples.length + samples.length < targetSize) {
        const randomSample = samples[Math.floor(Math.random() * samples.length)];
        const nearestSample = samples[Math.floor(Math.random() * samples.length)];
        
        const syntheticSample = { ...randomSample };
        
        // Interpolate numerical features
        for (const feature of numericalFeatures) {
          const alpha = Math.random();
          syntheticSample[feature] = 
            (1 - alpha) * randomSample[feature] + alpha * nearestSample[feature];
        }
        
        syntheticSamples.push(syntheticSample);
      }
      
      result.push(...samples, ...syntheticSamples.slice(0, targetSize - samples.length));
    }
    
    return result.sort(() => Math.random() - 0.5);
  }

  // Utility helper methods
  
  private inferDataType(values: any[]): string {
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    
    if (nonNullValues.length === 0) return 'unknown';
    
    // Check if all values are numbers
    if (nonNullValues.every(v => typeof v === 'number' && !isNaN(v))) {
      return 'numerical';
    }
    
    // Check if binary
    const uniqueValues = new Set(nonNullValues);
    if (uniqueValues.size <= 2) {
      return 'binary';
    }
    
    // Check if categorical (reasonable number of unique values)
    if (uniqueValues.size <= Math.max(10, Math.sqrt(nonNullValues.length))) {
      return 'categorical';
    }
    
    // Check if text/string
    if (nonNullValues.every(v => typeof v === 'string')) {
      return 'text';
    }
    
    return 'mixed';
  }

  private calculateFeatureDistribution(feature: string, values: any[], type: string): FeatureDistribution {
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    
    const statistics = {
      count: values.length,
      uniqueCount: new Set(nonNullValues).size,
      missingCount: values.length - nonNullValues.length
    } as any;
    
    let distribution: any = {};
    
    if (type === 'numerical') {
      const numValues = nonNullValues.filter(v => typeof v === 'number');
      statistics.mean = numValues.reduce((sum, v) => sum + v, 0) / numValues.length;
      statistics.std = Math.sqrt(numValues.reduce((sum, v) => sum + Math.pow(v - statistics.mean, 2), 0) / numValues.length);
      statistics.min = Math.min(...numValues);
      statistics.max = Math.max(...numValues);
      
      const sorted = numValues.sort((a, b) => a - b);
      statistics.median = sorted[Math.floor(sorted.length / 2)];
      
      // Create histogram
      const bins = Math.min(20, Math.floor(Math.sqrt(numValues.length)));
      const binSize = (statistics.max - statistics.min) / bins;
      const binEdges = Array.from({length: bins + 1}, (_, i) => statistics.min + i * binSize);
      const counts = new Array(bins).fill(0);
      
      for (const value of numValues) {
        const binIndex = Math.min(bins - 1, Math.floor((value - statistics.min) / binSize));
        counts[binIndex]++;
      }
      
      distribution.histogram = { bins: binEdges, counts };
    } else {
      // Categorical/binary/text
      const valueFrequency: Record<string, number> = {};
      
      for (const value of nonNullValues) {
        const key = String(value);
        valueFrequency[key] = (valueFrequency[key] || 0) + 1;
      }
      
      // Find mode
      let maxCount = 0;
      let mode = null;
      for (const [value, count] of Object.entries(valueFrequency)) {
        if (count > maxCount) {
          maxCount = count;
          mode = value;
        }
      }
      statistics.mode = mode;
      
      distribution.valueFrequency = valueFrequency;
    }
    
    return {
      feature,
      type: type as any,
      statistics,
      distribution
    };
  }

  private countDuplicates(data: DataSample[]): number {
    const seen = new Set<string>();
    let duplicates = 0;
    
    for (const sample of data) {
      const key = JSON.stringify(sample);
      if (seen.has(key)) {
        duplicates++;
      } else {
        seen.add(key);
      }
    }
    
    return duplicates;
  }

  private estimateMemoryUsage(data: DataSample[]): number {
    // Rough estimation of memory usage in bytes
    const sampleString = JSON.stringify(data[0] || {});
    return sampleString.length * data.length * 2; // Rough estimate
  }

  private calculateQualityScore(info: any): number {
    const { totalSamples, missingValueCounts, duplicateCount, outlierCounts } = info;
    
    let score = 100;
    
    // Penalize missing values
    const totalMissingRate = Object.values(missingValueCounts).reduce((sum: number, count) => sum + count, 0) / 
      (totalSamples * Object.keys(missingValueCounts).length);
    score -= totalMissingRate * 30;
    
    // Penalize duplicates
    const duplicateRate = duplicateCount / totalSamples;
    score -= duplicateRate * 20;
    
    // Penalize outliers
    const totalOutlierRate = Object.values(outlierCounts).reduce((sum: number, count) => sum + count, 0) / 
      (totalSamples * Object.keys(outlierCounts).length);
    score -= totalOutlierRate * 10;
    
    return Math.max(0, Math.min(100, score));
  }

  private generateRecommendations(info: any): string[] {
    const recommendations: string[] = [];
    const { missingValueCounts, duplicateCount, outlierCounts, dataTypes, uniqueValueCounts, totalSamples } = info;
    
    // Missing value recommendations
    for (const [feature, count] of Object.entries(missingValueCounts)) {
      const rate = (count as number) / totalSamples;
      if (rate > 0.1) {
        recommendations.push(`Feature '${feature}' has ${Math.round(rate * 100)}% missing values - consider imputation or removal`);
      }
    }
    
    // Duplicate recommendations
    if (duplicateCount > 0) {
      recommendations.push(`Found ${duplicateCount} duplicate rows - consider removing duplicates`);
    }
    
    // Outlier recommendations
    for (const [feature, count] of Object.entries(outlierCounts)) {
      if ((count as number) > totalSamples * 0.05) {
        recommendations.push(`Feature '${feature}' has many outliers - consider outlier treatment`);
      }
    }
    
    // Data type recommendations
    for (const [feature, type] of Object.entries(dataTypes)) {
      if (type === 'mixed') {
        recommendations.push(`Feature '${feature}' has mixed data types - consider data cleaning`);
      }
    }
    
    // High cardinality recommendations
    for (const [feature, uniqueCount] of Object.entries(uniqueValueCounts)) {
      if ((uniqueCount as number) > totalSamples * 0.5 && dataTypes[feature] === 'categorical') {
        recommendations.push(`Feature '${feature}' has high cardinality - consider grouping or encoding`);
      }
    }
    
    return recommendations;
  }

  private stratifiedShuffle(data: DataSample[], stratifyColumn: string): DataSample[] {
    const classGroups = new Map<any, DataSample[]>();
    
    for (const sample of data) {
      const classValue = sample[stratifyColumn];
      if (!classGroups.has(classValue)) {
        classGroups.set(classValue, []);
      }
      classGroups.get(classValue)!.push(sample);
    }
    
    // Shuffle each class group
    for (const [_, samples] of classGroups) {
      for (let i = samples.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [samples[i], samples[j]] = [samples[j], samples[i]];
      }
    }
    
    // Interleave samples from each class
    const result: DataSample[] = [];
    const classArrays = Array.from(classGroups.values());
    const maxLength = Math.max(...classArrays.map(arr => arr.length));
    
    for (let i = 0; i < maxLength; i++) {
      for (const classArray of classArrays) {
        if (i < classArray.length) {
          result.push(classArray[i]);
        }
      }
    }
    
    return result;
  }

  private seededRandom(seed: number) {
    let x = Math.sin(seed) * 10000;
    return function() {
      x = Math.sin(x) * 10000;
      return x - Math.floor(x);
    };
  }

  /**
   * Get preprocessing statistics
   */
  getStats() {
    return {
      totalPipelines: this.pipelines.size,
      fittedPipelines: Array.from(this.pipelines.values()).filter(p => p.fitted).length,
      cachedTransformations: this.cachedTransformations.size,
      qualityReports: this.qualityReports.size
    };
  }
}

export default DataPreprocessor;