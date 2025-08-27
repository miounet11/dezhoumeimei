/**
 * Model Evaluation Utilities
 * Provides comprehensive model evaluation metrics and validation techniques
 */

export interface EvaluationMetrics {
  // Classification metrics
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  rocAuc?: number;
  prAuc?: number;
  logLoss?: number;
  
  // Regression metrics
  mse?: number;
  rmse?: number;
  mae?: number;
  r2Score?: number;
  adjustedR2?: number;
  mape?: number;
  
  // General metrics
  confusionMatrix?: number[][];
  classificationReport?: ClassificationReport;
  featureImportances?: Record<string, number>;
}

export interface ClassificationReport {
  classes: string[];
  precision: Record<string, number>;
  recall: Record<string, number>;
  f1Score: Record<string, number>;
  support: Record<string, number>;
  macroAvg: {
    precision: number;
    recall: number;
    f1Score: number;
  };
  weightedAvg: {
    precision: number;
    recall: number;
    f1Score: number;
  };
}

export interface CrossValidationResult {
  scores: number[];
  mean: number;
  std: number;
  confidence_interval: [number, number];
  fold_metrics: EvaluationMetrics[];
}

export interface ModelComparison {
  models: {
    name: string;
    metrics: EvaluationMetrics;
    crossValidation?: CrossValidationResult;
    trainingTime: number;
    predictionTime: number;
  }[];
  bestModel: string;
  ranking: string[];
}

export interface ValidationCurve {
  parameterName: string;
  parameterValues: any[];
  trainScores: number[][];
  validationScores: number[][];
  meanTrainScores: number[];
  meanValidationScores: number[];
  stdTrainScores: number[];
  stdValidationScores: number[];
}

export interface LearningCurve {
  trainingSizes: number[];
  trainScores: number[][];
  validationScores: number[][];
  meanTrainScores: number[];
  meanValidationScores: number[];
  stdTrainScores: number[];
  stdValidationScores: number[];
}

export interface BiasVarianceAnalysis {
  bias: number;
  variance: number;
  noise: number;
  totalError: number;
  decomposition: {
    bias: number;
    variance: number;
    noise: number;
  };
}

/**
 * Comprehensive Model Evaluation Engine
 */
export class ModelEvaluator {
  private evaluationHistory: Map<string, EvaluationMetrics[]> = new Map();
  private benchmarkResults: Map<string, EvaluationMetrics> = new Map();
  private cachedMetrics: Map<string, any> = new Map();

  constructor() {}

  /**
   * Evaluate classification model
   */
  evaluateClassification(
    yTrue: (number | string)[],
    yPred: (number | string)[],
    yProbabilities?: number[][],
    classNames?: string[]
  ): EvaluationMetrics {
    
    if (yTrue.length !== yPred.length) {
      throw new Error('y_true and y_pred must have the same length');
    }
    
    const uniqueClasses = [...new Set([...yTrue, ...yPred])].map(String);
    const classes = classNames || uniqueClasses;
    
    // Convert to numeric if needed
    const labelMap = new Map(classes.map((cls, idx) => [cls, idx]));
    const yTrueNumeric = yTrue.map(y => labelMap.get(String(y)) ?? 0);
    const yPredNumeric = yPred.map(y => labelMap.get(String(y)) ?? 0);
    
    const metrics: EvaluationMetrics = {};
    
    // Basic classification metrics
    metrics.accuracy = this.calculateAccuracy(yTrueNumeric, yPredNumeric);
    
    // Per-class and averaged metrics
    const classMetrics = this.calculatePerClassMetrics(yTrueNumeric, yPredNumeric, classes.length);
    metrics.precision = classMetrics.macroAvg.precision;
    metrics.recall = classMetrics.macroAvg.recall;
    metrics.f1Score = classMetrics.macroAvg.f1Score;
    
    // Confusion matrix
    metrics.confusionMatrix = this.calculateConfusionMatrix(yTrueNumeric, yPredNumeric, classes.length);
    
    // Classification report
    metrics.classificationReport = this.generateClassificationReport(
      yTrueNumeric, yPredNumeric, classes
    );
    
    // ROC AUC and PR AUC (if probabilities provided)
    if (yProbabilities && yProbabilities.length === yTrue.length) {
      if (classes.length === 2) {
        // Binary classification
        const positiveProbabilities = yProbabilities.map(probs => probs[1] || probs[0]);
        metrics.rocAuc = this.calculateROCAUC(yTrueNumeric, positiveProbabilities);
        metrics.prAuc = this.calculatePRAUC(yTrueNumeric, positiveProbabilities);
      } else {
        // Multi-class (macro-averaged)
        metrics.rocAuc = this.calculateMultiClassROCAUC(yTrueNumeric, yProbabilities);
      }
      
      // Log loss
      metrics.logLoss = this.calculateLogLoss(yTrueNumeric, yProbabilities);
    }
    
    return metrics;
  }

  /**
   * Evaluate regression model
   */
  evaluateRegression(
    yTrue: number[],
    yPred: number[]
  ): EvaluationMetrics {
    
    if (yTrue.length !== yPred.length) {
      throw new Error('y_true and y_pred must have the same length');
    }
    
    const metrics: EvaluationMetrics = {};
    
    // Mean Squared Error
    metrics.mse = this.calculateMSE(yTrue, yPred);
    
    // Root Mean Squared Error
    metrics.rmse = Math.sqrt(metrics.mse);
    
    // Mean Absolute Error
    metrics.mae = this.calculateMAE(yTrue, yPred);
    
    // R² Score
    metrics.r2Score = this.calculateR2Score(yTrue, yPred);
    
    // Adjusted R²
    const n = yTrue.length;
    const p = 1; // Assuming simple regression, would need feature count for multiple regression
    metrics.adjustedR2 = 1 - ((1 - metrics.r2Score) * (n - 1)) / (n - p - 1);
    
    // Mean Absolute Percentage Error
    metrics.mape = this.calculateMAPE(yTrue, yPred);
    
    return metrics;
  }

  /**
   * Perform cross-validation evaluation
   */
  crossValidate(
    data: any[],
    labels: any[],
    modelTrainFunc: (trainData: any[], trainLabels: any[]) => any,
    modelPredictFunc: (model: any, testData: any[]) => any[],
    folds: number = 5,
    stratify: boolean = false,
    metric: string = 'accuracy'
  ): CrossValidationResult {
    
    if (data.length !== labels.length) {
      throw new Error('Data and labels must have the same length');
    }
    
    // Create fold indices
    const foldIndices = this.createCVFolds(data.length, folds, stratify ? labels : undefined);
    
    const scores: number[] = [];
    const foldMetrics: EvaluationMetrics[] = [];
    
    for (let fold = 0; fold < folds; fold++) {
      const testIndices = foldIndices[fold];
      const trainIndices = foldIndices
        .filter((_, i) => i !== fold)
        .flat();
      
      // Split data
      const trainData = trainIndices.map(i => data[i]);
      const trainLabels = trainIndices.map(i => labels[i]);
      const testData = testIndices.map(i => data[i]);
      const testLabels = testIndices.map(i => labels[i]);
      
      // Train model
      const model = modelTrainFunc(trainData, trainLabels);
      
      // Make predictions
      const predictions = modelPredictFunc(model, testData);
      
      // Calculate metrics
      let metrics: EvaluationMetrics;
      if (this.isClassificationTask(labels)) {
        metrics = this.evaluateClassification(testLabels, predictions);
      } else {
        metrics = this.evaluateRegression(testLabels, predictions);
      }
      
      foldMetrics.push(metrics);
      
      // Extract score for specified metric
      const score = this.extractMetricValue(metrics, metric);
      scores.push(score);
    }
    
    // Calculate statistics
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const std = Math.sqrt(variance);
    
    // 95% confidence interval
    const tValue = 1.96; // For large samples
    const marginOfError = tValue * std / Math.sqrt(scores.length);
    const confidenceInterval: [number, number] = [mean - marginOfError, mean + marginOfError];
    
    return {
      scores,
      mean,
      std,
      confidence_interval: confidenceInterval,
      fold_metrics: foldMetrics
    };
  }

  /**
   * Compare multiple models
   */
  compareModels(
    data: any[],
    labels: any[],
    models: {
      name: string;
      trainFunc: (data: any[], labels: any[]) => any;
      predictFunc: (model: any, data: any[]) => any[];
    }[],
    testData?: any[],
    testLabels?: any[],
    crossValidation: boolean = true
  ): ModelComparison {
    
    const results: ModelComparison['models'] = [];
    
    // Split data if no test set provided
    let trainData = data;
    let trainLabels = labels;
    let evalData = testData;
    let evalLabels = testLabels;
    
    if (!testData || !testLabels) {
      const splitIndex = Math.floor(data.length * 0.8);
      const indices = Array.from({length: data.length}, (_, i) => i);
      
      // Shuffle indices
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      
      const trainIndices = indices.slice(0, splitIndex);
      const testIndices = indices.slice(splitIndex);
      
      trainData = trainIndices.map(i => data[i]);
      trainLabels = trainIndices.map(i => labels[i]);
      evalData = testIndices.map(i => data[i]);
      evalLabels = testIndices.map(i => labels[i]);
    }
    
    for (const modelConfig of models) {
      // Train model
      const startTime = Date.now();
      const model = modelConfig.trainFunc(trainData, trainLabels);
      const trainingTime = Date.now() - startTime;
      
      // Make predictions
      const predStartTime = Date.now();
      const predictions = modelConfig.predictFunc(model, evalData!);
      const predictionTime = Date.now() - predStartTime;
      
      // Evaluate
      let metrics: EvaluationMetrics;
      if (this.isClassificationTask(labels)) {
        metrics = this.evaluateClassification(evalLabels!, predictions);
      } else {
        metrics = this.evaluateRegression(evalLabels!, predictions);
      }
      
      // Cross-validation if requested
      let cvResults: CrossValidationResult | undefined;
      if (crossValidation) {
        cvResults = this.crossValidate(
          data, labels,
          modelConfig.trainFunc,
          modelConfig.predictFunc
        );
      }
      
      results.push({
        name: modelConfig.name,
        metrics,
        crossValidation: cvResults,
        trainingTime,
        predictionTime
      });
    }
    
    // Rank models
    const isClassification = this.isClassificationTask(labels);
    const primaryMetric = isClassification ? 'f1Score' : 'r2Score';
    
    const ranking = results
      .sort((a, b) => {
        const scoreA = this.extractMetricValue(a.metrics, primaryMetric);
        const scoreB = this.extractMetricValue(b.metrics, primaryMetric);
        return scoreB - scoreA;
      })
      .map(r => r.name);
    
    return {
      models: results,
      bestModel: ranking[0],
      ranking
    };
  }

  /**
   * Generate validation curve
   */
  generateValidationCurve(
    data: any[],
    labels: any[],
    trainModelFunc: (data: any[], labels: any[], paramValue: any) => any,
    predictFunc: (model: any, data: any[]) => any[],
    parameterName: string,
    parameterValues: any[],
    cv: number = 5
  ): ValidationCurve {
    
    const trainScores: number[][] = [];
    const validationScores: number[][] = [];
    
    for (const paramValue of parameterValues) {
      const foldTrainScores: number[] = [];
      const foldValidationScores: number[] = [];
      
      // Create CV folds
      const foldIndices = this.createCVFolds(data.length, cv);
      
      for (let fold = 0; fold < cv; fold++) {
        const testIndices = foldIndices[fold];
        const trainIndices = foldIndices
          .filter((_, i) => i !== fold)
          .flat();
        
        const trainData = trainIndices.map(i => data[i]);
        const trainLabels = trainIndices.map(i => labels[i]);
        const testData = testIndices.map(i => data[i]);
        const testLabels = testIndices.map(i => labels[i]);
        
        // Train model with parameter value
        const model = trainModelFunc(trainData, trainLabels, paramValue);
        
        // Evaluate on training set
        const trainPredictions = predictFunc(model, trainData);
        const trainMetrics = this.isClassificationTask(labels)
          ? this.evaluateClassification(trainLabels, trainPredictions)
          : this.evaluateRegression(trainLabels, trainPredictions);
        
        // Evaluate on validation set
        const valPredictions = predictFunc(model, testData);
        const valMetrics = this.isClassificationTask(labels)
          ? this.evaluateClassification(testLabels, valPredictions)
          : this.evaluateRegression(testLabels, valPredictions);
        
        const trainScore = this.extractMetricValue(trainMetrics, 'accuracy');
        const valScore = this.extractMetricValue(valMetrics, 'accuracy');
        
        foldTrainScores.push(trainScore);
        foldValidationScores.push(valScore);
      }
      
      trainScores.push(foldTrainScores);
      validationScores.push(foldValidationScores);
    }
    
    // Calculate means and standard deviations
    const meanTrainScores = trainScores.map(scores => 
      scores.reduce((sum, score) => sum + score, 0) / scores.length
    );
    const meanValidationScores = validationScores.map(scores => 
      scores.reduce((sum, score) => sum + score, 0) / scores.length
    );
    
    const stdTrainScores = trainScores.map((scores, i) => 
      Math.sqrt(scores.reduce((sum, score) => sum + Math.pow(score - meanTrainScores[i], 2), 0) / scores.length)
    );
    const stdValidationScores = validationScores.map((scores, i) => 
      Math.sqrt(scores.reduce((sum, score) => sum + Math.pow(score - meanValidationScores[i], 2), 0) / scores.length)
    );
    
    return {
      parameterName,
      parameterValues,
      trainScores,
      validationScores,
      meanTrainScores,
      meanValidationScores,
      stdTrainScores,
      stdValidationScores
    };
  }

  /**
   * Generate learning curve
   */
  generateLearningCurve(
    data: any[],
    labels: any[],
    trainModelFunc: (data: any[], labels: any[]) => any,
    predictFunc: (model: any, data: any[]) => any[],
    trainSizes: number[] = [0.1, 0.3, 0.5, 0.7, 0.9],
    cv: number = 5
  ): LearningCurve {
    
    const trainScores: number[][] = [];
    const validationScores: number[][] = [];
    const trainingSizes: number[] = [];
    
    for (const sizeRatio of trainSizes) {
      const actualSize = Math.floor(data.length * sizeRatio);
      trainingSizes.push(actualSize);
      
      const foldTrainScores: number[] = [];
      const foldValidationScores: number[] = [];
      
      // Create CV folds
      const foldIndices = this.createCVFolds(data.length, cv);
      
      for (let fold = 0; fold < cv; fold++) {
        const testIndices = foldIndices[fold];
        const allTrainIndices = foldIndices
          .filter((_, i) => i !== fold)
          .flat();
        
        // Sample training indices to desired size
        const trainIndices = allTrainIndices.slice(0, actualSize);
        
        const trainData = trainIndices.map(i => data[i]);
        const trainLabels = trainIndices.map(i => labels[i]);
        const testData = testIndices.map(i => data[i]);
        const testLabels = testIndices.map(i => labels[i]);
        
        // Train model
        const model = trainModelFunc(trainData, trainLabels);
        
        // Evaluate on training set
        const trainPredictions = predictFunc(model, trainData);
        const trainMetrics = this.isClassificationTask(labels)
          ? this.evaluateClassification(trainLabels, trainPredictions)
          : this.evaluateRegression(trainLabels, trainPredictions);
        
        // Evaluate on validation set
        const valPredictions = predictFunc(model, testData);
        const valMetrics = this.isClassificationTask(labels)
          ? this.evaluateClassification(testLabels, valPredictions)
          : this.evaluateRegression(testLabels, valPredictions);
        
        const trainScore = this.extractMetricValue(trainMetrics, 'accuracy');
        const valScore = this.extractMetricValue(valMetrics, 'accuracy');
        
        foldTrainScores.push(trainScore);
        foldValidationScores.push(valScore);
      }
      
      trainScores.push(foldTrainScores);
      validationScores.push(foldValidationScores);
    }
    
    // Calculate means and standard deviations
    const meanTrainScores = trainScores.map(scores => 
      scores.reduce((sum, score) => sum + score, 0) / scores.length
    );
    const meanValidationScores = validationScores.map(scores => 
      scores.reduce((sum, score) => sum + score, 0) / scores.length
    );
    
    const stdTrainScores = trainScores.map((scores, i) => 
      Math.sqrt(scores.reduce((sum, score) => sum + Math.pow(score - meanTrainScores[i], 2), 0) / scores.length)
    );
    const stdValidationScores = validationScores.map((scores, i) => 
      Math.sqrt(scores.reduce((sum, score) => sum + Math.pow(score - meanValidationScores[i], 2), 0) / scores.length)
    );
    
    return {
      trainingSizes,
      trainScores,
      validationScores,
      meanTrainScores,
      meanValidationScores,
      stdTrainScores,
      stdValidationScores
    };
  }

  /**
   * Perform bias-variance analysis
   */
  biasVarianceAnalysis(
    data: any[],
    labels: any[],
    trainModelFunc: (data: any[], labels: any[]) => any,
    predictFunc: (model: any, data: any[]) => any[],
    iterations: number = 100,
    trainRatio: number = 0.8
  ): BiasVarianceAnalysis {
    
    const predictions: number[][] = [];
    const testSize = Math.floor(data.length * (1 - trainRatio));
    let avgTestLabels: number[] = [];
    
    for (let iter = 0; iter < iterations; iter++) {
      // Bootstrap sample
      const indices = Array.from({length: data.length}, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      
      const trainIndices = indices.slice(0, Math.floor(data.length * trainRatio));
      const testIndices = indices.slice(-testSize);
      
      const trainData = trainIndices.map(i => data[i]);
      const trainLabels = trainIndices.map(i => labels[i]);
      const testData = testIndices.map(i => data[i]);
      const testLabels = testIndices.map(i => labels[i]);
      
      if (iter === 0) {
        avgTestLabels = testLabels.slice();
      }
      
      // Train model
      const model = trainModelFunc(trainData, trainLabels);
      
      // Make predictions
      const preds = predictFunc(model, testData);
      predictions.push(preds.slice(0, testSize));
    }
    
    // Calculate bias, variance, and noise
    const mainPredictions = new Array(testSize).fill(0);
    
    // Average prediction for each test point
    for (let i = 0; i < testSize; i++) {
      for (let iter = 0; iter < iterations; iter++) {
        mainPredictions[i] += predictions[iter][i];
      }
      mainPredictions[i] /= iterations;
    }
    
    // Bias: (main_prediction - true_label)²
    let bias = 0;
    for (let i = 0; i < testSize; i++) {
      bias += Math.pow(mainPredictions[i] - avgTestLabels[i], 2);
    }
    bias /= testSize;
    
    // Variance: E[(prediction - main_prediction)²]
    let variance = 0;
    for (let i = 0; i < testSize; i++) {
      let pointVariance = 0;
      for (let iter = 0; iter < iterations; iter++) {
        pointVariance += Math.pow(predictions[iter][i] - mainPredictions[i], 2);
      }
      variance += pointVariance / iterations;
    }
    variance /= testSize;
    
    // Noise: E[(true_label - prediction)²] - bias - variance
    let totalError = 0;
    for (let i = 0; i < testSize; i++) {
      for (let iter = 0; iter < iterations; iter++) {
        totalError += Math.pow(avgTestLabels[i] - predictions[iter][i], 2);
      }
    }
    totalError /= (testSize * iterations);
    
    const noise = Math.max(0, totalError - bias - variance);
    
    return {
      bias,
      variance,
      noise,
      totalError,
      decomposition: {
        bias: bias / totalError,
        variance: variance / totalError,
        noise: noise / totalError
      }
    };
  }

  /**
   * Private helper methods
   */

  private calculateAccuracy(yTrue: number[], yPred: number[]): number {
    let correct = 0;
    for (let i = 0; i < yTrue.length; i++) {
      if (yTrue[i] === yPred[i]) correct++;
    }
    return correct / yTrue.length;
  }

  private calculatePerClassMetrics(yTrue: number[], yPred: number[], numClasses: number) {
    const tp = new Array(numClasses).fill(0);
    const fp = new Array(numClasses).fill(0);
    const fn = new Array(numClasses).fill(0);
    const tn = new Array(numClasses).fill(0);
    
    for (let i = 0; i < yTrue.length; i++) {
      const trueClass = yTrue[i];
      const predClass = yPred[i];
      
      for (let c = 0; c < numClasses; c++) {
        if (trueClass === c && predClass === c) tp[c]++;
        else if (trueClass !== c && predClass === c) fp[c]++;
        else if (trueClass === c && predClass !== c) fn[c]++;
        else tn[c]++;
      }
    }
    
    const precision = tp.map((t, i) => t + fp[i] > 0 ? t / (t + fp[i]) : 0);
    const recall = tp.map((t, i) => t + fn[i] > 0 ? t / (t + fn[i]) : 0);
    const f1 = precision.map((p, i) => p + recall[i] > 0 ? 2 * p * recall[i] / (p + recall[i]) : 0);
    
    return {
      precision,
      recall,
      f1,
      macroAvg: {
        precision: precision.reduce((sum, p) => sum + p, 0) / precision.length,
        recall: recall.reduce((sum, r) => sum + r, 0) / recall.length,
        f1Score: f1.reduce((sum, f) => sum + f, 0) / f1.length
      }
    };
  }

  private calculateConfusionMatrix(yTrue: number[], yPred: number[], numClasses: number): number[][] {
    const matrix = Array.from({length: numClasses}, () => new Array(numClasses).fill(0));
    
    for (let i = 0; i < yTrue.length; i++) {
      matrix[yTrue[i]][yPred[i]]++;
    }
    
    return matrix;
  }

  private generateClassificationReport(yTrue: number[], yPred: number[], classNames: string[]): ClassificationReport {
    const numClasses = classNames.length;
    const metrics = this.calculatePerClassMetrics(yTrue, yPred, numClasses);
    
    const precision: Record<string, number> = {};
    const recall: Record<string, number> = {};
    const f1Score: Record<string, number> = {};
    const support: Record<string, number> = {};
    
    for (let i = 0; i < numClasses; i++) {
      const className = classNames[i];
      precision[className] = metrics.precision[i];
      recall[className] = metrics.recall[i];
      f1Score[className] = metrics.f1[i];
      support[className] = yTrue.filter(y => y === i).length;
    }
    
    const totalSupport = yTrue.length;
    const weightedAvg = {
      precision: Object.entries(support).reduce((sum, [cls, sup]) => sum + precision[cls] * sup, 0) / totalSupport,
      recall: Object.entries(support).reduce((sum, [cls, sup]) => sum + recall[cls] * sup, 0) / totalSupport,
      f1Score: Object.entries(support).reduce((sum, [cls, sup]) => sum + f1Score[cls] * sup, 0) / totalSupport
    };
    
    return {
      classes: classNames,
      precision,
      recall,
      f1Score,
      support,
      macroAvg: metrics.macroAvg,
      weightedAvg
    };
  }

  private calculateROCAUC(yTrue: number[], yProb: number[]): number {
    // Create ROC curve points
    const rocPoints: Array<{fpr: number, tpr: number, threshold: number}> = [];
    
    // Get unique thresholds
    const thresholds = [...new Set(yProb)].sort((a, b) => b - a);
    thresholds.push(0); // Add 0 threshold for complete ROC curve
    
    for (const threshold of thresholds) {
      let tp = 0, fp = 0, tn = 0, fn = 0;
      
      for (let i = 0; i < yTrue.length; i++) {
        const predicted = yProb[i] >= threshold ? 1 : 0;
        
        if (yTrue[i] === 1 && predicted === 1) tp++;
        else if (yTrue[i] === 0 && predicted === 1) fp++;
        else if (yTrue[i] === 0 && predicted === 0) tn++;
        else fn++;
      }
      
      const tpr = tp + fn > 0 ? tp / (tp + fn) : 0;
      const fpr = fp + tn > 0 ? fp / (fp + tn) : 0;
      
      rocPoints.push({fpr, tpr, threshold});
    }
    
    // Calculate AUC using trapezoidal rule
    rocPoints.sort((a, b) => a.fpr - b.fpr);
    
    let auc = 0;
    for (let i = 1; i < rocPoints.length; i++) {
      const width = rocPoints[i].fpr - rocPoints[i-1].fpr;
      const height = (rocPoints[i].tpr + rocPoints[i-1].tpr) / 2;
      auc += width * height;
    }
    
    return auc;
  }

  private calculatePRAUC(yTrue: number[], yProb: number[]): number {
    // Simplified PR AUC calculation
    const prPoints: Array<{precision: number, recall: number}> = [];
    const thresholds = [...new Set(yProb)].sort((a, b) => b - a);
    
    for (const threshold of thresholds) {
      let tp = 0, fp = 0, fn = 0;
      
      for (let i = 0; i < yTrue.length; i++) {
        const predicted = yProb[i] >= threshold ? 1 : 0;
        
        if (yTrue[i] === 1 && predicted === 1) tp++;
        else if (yTrue[i] === 0 && predicted === 1) fp++;
        else if (yTrue[i] === 1 && predicted === 0) fn++;
      }
      
      const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
      const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
      
      prPoints.push({precision, recall});
    }
    
    // Calculate AUC using trapezoidal rule
    prPoints.sort((a, b) => a.recall - b.recall);
    
    let auc = 0;
    for (let i = 1; i < prPoints.length; i++) {
      const width = prPoints[i].recall - prPoints[i-1].recall;
      const height = (prPoints[i].precision + prPoints[i-1].precision) / 2;
      auc += width * height;
    }
    
    return auc;
  }

  private calculateMultiClassROCAUC(yTrue: number[], yProb: number[][]): number {
    const numClasses = Math.max(...yTrue) + 1;
    let totalAuc = 0;
    
    for (let cls = 0; cls < numClasses; cls++) {
      const binaryTrue = yTrue.map(y => y === cls ? 1 : 0);
      const binaryProb = yProb.map(probs => probs[cls]);
      
      const auc = this.calculateROCAUC(binaryTrue, binaryProb);
      totalAuc += auc;
    }
    
    return totalAuc / numClasses;
  }

  private calculateLogLoss(yTrue: number[], yProb: number[][]): number {
    let loss = 0;
    
    for (let i = 0; i < yTrue.length; i++) {
      const trueClass = yTrue[i];
      const predProb = Math.max(1e-15, Math.min(1 - 1e-15, yProb[i][trueClass]));
      loss -= Math.log(predProb);
    }
    
    return loss / yTrue.length;
  }

  private calculateMSE(yTrue: number[], yPred: number[]): number {
    let mse = 0;
    for (let i = 0; i < yTrue.length; i++) {
      mse += Math.pow(yTrue[i] - yPred[i], 2);
    }
    return mse / yTrue.length;
  }

  private calculateMAE(yTrue: number[], yPred: number[]): number {
    let mae = 0;
    for (let i = 0; i < yTrue.length; i++) {
      mae += Math.abs(yTrue[i] - yPred[i]);
    }
    return mae / yTrue.length;
  }

  private calculateR2Score(yTrue: number[], yPred: number[]): number {
    const yMean = yTrue.reduce((sum, y) => sum + y, 0) / yTrue.length;
    
    let ssRes = 0; // Sum of squares of residuals
    let ssTot = 0; // Total sum of squares
    
    for (let i = 0; i < yTrue.length; i++) {
      ssRes += Math.pow(yTrue[i] - yPred[i], 2);
      ssTot += Math.pow(yTrue[i] - yMean, 2);
    }
    
    return ssTot > 0 ? 1 - (ssRes / ssTot) : 0;
  }

  private calculateMAPE(yTrue: number[], yPred: number[]): number {
    let mape = 0;
    let count = 0;
    
    for (let i = 0; i < yTrue.length; i++) {
      if (yTrue[i] !== 0) {
        mape += Math.abs((yTrue[i] - yPred[i]) / yTrue[i]);
        count++;
      }
    }
    
    return count > 0 ? (mape / count) * 100 : 0;
  }

  private createCVFolds(dataLength: number, folds: number, stratifyLabels?: any[]): number[][] {
    const foldIndices: number[][] = Array.from({length: folds}, () => []);
    
    if (stratifyLabels) {
      // Stratified sampling
      const classIndices = new Map<any, number[]>();
      
      for (let i = 0; i < dataLength; i++) {
        const label = stratifyLabels[i];
        if (!classIndices.has(label)) {
          classIndices.set(label, []);
        }
        classIndices.get(label)!.push(i);
      }
      
      // Distribute each class across folds
      for (const indices of classIndices.values()) {
        for (let i = 0; i < indices.length; i++) {
          const foldIdx = i % folds;
          foldIndices[foldIdx].push(indices[i]);
        }
      }
    } else {
      // Random sampling
      const indices = Array.from({length: dataLength}, (_, i) => i);
      
      // Shuffle indices
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      
      // Distribute across folds
      for (let i = 0; i < indices.length; i++) {
        const foldIdx = i % folds;
        foldIndices[foldIdx].push(indices[i]);
      }
    }
    
    return foldIndices;
  }

  private isClassificationTask(labels: any[]): boolean {
    // Check if labels are discrete (classification) or continuous (regression)
    const uniqueLabels = new Set(labels);
    const isInteger = labels.every(label => Number.isInteger(label));
    const numUnique = uniqueLabels.size;
    
    // Heuristic: if there are relatively few unique values and they're integers, it's likely classification
    return isInteger && numUnique <= Math.max(10, Math.sqrt(labels.length));
  }

  private extractMetricValue(metrics: EvaluationMetrics, metricName: string): number {
    const value = (metrics as any)[metricName];
    return typeof value === 'number' ? value : 0;
  }

  /**
   * Store evaluation results for comparison
   */
  storeEvaluation(modelName: string, metrics: EvaluationMetrics): void {
    if (!this.evaluationHistory.has(modelName)) {
      this.evaluationHistory.set(modelName, []);
    }
    this.evaluationHistory.get(modelName)!.push(metrics);
  }

  /**
   * Get evaluation history for a model
   */
  getEvaluationHistory(modelName: string): EvaluationMetrics[] {
    return this.evaluationHistory.get(modelName) || [];
  }

  /**
   * Get evaluation statistics
   */
  getStats() {
    const totalEvaluations = Array.from(this.evaluationHistory.values())
      .reduce((sum, evals) => sum + evals.length, 0);
    
    return {
      totalModelsEvaluated: this.evaluationHistory.size,
      totalEvaluations,
      benchmarkResults: this.benchmarkResults.size,
      cachedMetrics: this.cachedMetrics.size
    };
  }
}

export default ModelEvaluator;