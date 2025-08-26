/**
 * Chart Configuration for Dashboard Visualizations
 * Provides consistent styling and configuration for Recharts components
 */

import { LearningAnalytics, SkillDimension, TrendData, UserPerformanceMetrics } from './analytics-service';

// Color palette for charts
export const CHART_COLORS = {
  primary: '#1f77b4',
  secondary: '#ff7f0e',
  success: '#2ca02c',
  warning: '#d62728',
  info: '#9467bd',
  light: '#8c564b',
  dark: '#e377c2',
  gradient: {
    start: '#667eea',
    end: '#764ba2'
  },
  skill: {
    preflop: '#3B82F6',
    postflop: '#EF4444',
    psychology: '#8B5CF6',
    mathematics: '#06B6D4',
    bankroll: '#10B981',
    tournament: '#F59E0B'
  }
} as const;

// Chart responsive breakpoints
export const CHART_BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  large: 1440
} as const;

// Common chart margins and dimensions
export const CHART_DIMENSIONS = {
  margin: { top: 20, right: 30, left: 20, bottom: 5 },
  height: {
    small: 200,
    medium: 300,
    large: 400,
    xlarge: 500
  },
  width: {
    small: 300,
    medium: 500,
    large: 800,
    full: '100%'
  }
} as const;

// Skill progression chart configuration
export interface SkillRadarConfig {
  data: SkillDimension[];
  colors: string[];
  responsive: boolean;
}

export const getSkillRadarConfig = (skillData: SkillDimension[]): SkillRadarConfig => ({
  data: skillData.map(skill => ({
    ...skill,
    skillName: skill.name,
    value: skill.currentLevel,
    fullMark: skill.maxLevel
  })),
  colors: [CHART_COLORS.primary, CHART_COLORS.secondary],
  responsive: true
});

// Performance trend chart configuration
export interface TrendChartConfig {
  data: TrendData[];
  xKey: string;
  yKey: string;
  color: string;
  strokeWidth: number;
  showDots: boolean;
  showGrid: boolean;
  responsive: boolean;
}

export const getPerformanceTrendConfig = (trendData: TrendData[], type: 'scores' | 'time' | 'completion'): TrendChartConfig => {
  const colorMap = {
    scores: CHART_COLORS.success,
    time: CHART_COLORS.info,
    completion: CHART_COLORS.primary
  };

  return {
    data: trendData.map(item => ({
      ...item,
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      formattedValue: item.label || item.value.toString()
    })),
    xKey: 'date',
    yKey: 'value',
    color: colorMap[type],
    strokeWidth: 2,
    showDots: true,
    showGrid: true,
    responsive: true
  };
};

// Learning analytics bar chart configuration
export interface BarChartConfig {
  data: Array<{ name: string; value: number; color?: string }>;
  xKey: string;
  yKey: string;
  colors: string[];
  responsive: boolean;
  showLabels: boolean;
}

export const getSkillComparisonConfig = (skillData: SkillDimension[]): BarChartConfig => ({
  data: skillData.map((skill, index) => ({
    name: skill.name,
    value: skill.currentLevel,
    target: skill.maxLevel,
    progress: skill.progress,
    color: Object.values(CHART_COLORS.skill)[index % Object.keys(CHART_COLORS.skill).length]
  })),
  xKey: 'name',
  yKey: 'value',
  colors: Object.values(CHART_COLORS.skill),
  responsive: true,
  showLabels: true
});

// Progress metrics pie chart configuration
export interface PieChartConfig {
  data: Array<{ name: string; value: number; color: string }>;
  cx: string | number;
  cy: string | number;
  innerRadius: number;
  outerRadius: number;
  showLabels: boolean;
  showTooltip: boolean;
}

export const getCourseCompletionConfig = (completionData: {
  completed: number;
  inProgress: number;
  notStarted: number;
}): PieChartConfig => ({
  data: [
    { name: 'Completed', value: completionData.completed, color: CHART_COLORS.success },
    { name: 'In Progress', value: completionData.inProgress, color: CHART_COLORS.warning },
    { name: 'Not Started', value: completionData.notStarted, color: CHART_COLORS.light }
  ],
  cx: '50%',
  cy: '50%',
  innerRadius: 60,
  outerRadius: 100,
  showLabels: true,
  showTooltip: true
});

// Heatmap configuration for study patterns
export interface HeatmapConfig {
  data: Array<{ hour: number; day: string; value: number }>;
  colorScale: string[];
  responsive: boolean;
}

export const getStudyPatternHeatmapConfig = (studyData: Array<{ hour: number; count: number; avgDuration: number }>): HeatmapConfig => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const heatmapData: Array<{ hour: number; day: string; value: number }> = [];
  
  // Generate mock data for demonstration - in real implementation, this would come from analytics
  days.forEach((day, dayIndex) => {
    studyData.forEach(({ hour, count, avgDuration }) => {
      // Simulate varying activity across days
      const variance = Math.random() * 0.5 + 0.75; // 75-125% variance
      heatmapData.push({
        hour,
        day,
        value: Math.round(count * avgDuration * variance)
      });
    });
  });

  return {
    data: heatmapData,
    colorScale: [
      '#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', 
      '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'
    ],
    responsive: true
  };
};

// Assessment performance distribution
export interface HistogramConfig {
  data: Array<{ range: string; count: number; percentage: number }>;
  xKey: string;
  yKey: string;
  color: string;
  responsive: boolean;
}

export const getScoreDistributionConfig = (scores: number[]): HistogramConfig => {
  const ranges = ['0-20', '21-40', '41-60', '61-80', '81-100'];
  const distribution = ranges.map(range => {
    const [min, max] = range.split('-').map(Number);
    const count = scores.filter(score => score >= min && score <= max).length;
    return {
      range,
      count,
      percentage: scores.length > 0 ? Math.round((count / scores.length) * 100) : 0
    };
  });

  return {
    data: distribution,
    xKey: 'range',
    yKey: 'count',
    color: CHART_COLORS.primary,
    responsive: true
  };
};

// Responsive configurations based on screen size
export const getResponsiveConfig = (width: number) => ({
  showLegend: width > CHART_BREAKPOINTS.tablet,
  showAxisLabels: width > CHART_BREAKPOINTS.mobile,
  chartHeight: width > CHART_BREAKPOINTS.desktop 
    ? CHART_DIMENSIONS.height.large 
    : width > CHART_BREAKPOINTS.tablet 
    ? CHART_DIMENSIONS.height.medium 
    : CHART_DIMENSIONS.height.small,
  fontSize: width > CHART_BREAKPOINTS.tablet ? 12 : 10,
  strokeWidth: width > CHART_BREAKPOINTS.tablet ? 2 : 1
});

// Animation configurations
export const ANIMATION_CONFIG = {
  duration: 1000,
  easing: 'ease-out',
  delay: 0,
  stagger: 100
} as const;

// Tooltip configurations
export const TOOLTIP_CONFIG = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  padding: '12px',
  fontSize: '12px',
  color: '#374151'
} as const;

// Legend configurations
export const LEGEND_CONFIG = {
  position: 'top' as const,
  align: 'center' as const,
  verticalAlign: 'top' as const,
  iconType: 'circle' as const,
  fontSize: 12,
  color: '#6b7280'
} as const;

// Grid configurations
export const GRID_CONFIG = {
  strokeDasharray: '3 3',
  stroke: '#e5e7eb',
  strokeOpacity: 0.5
} as const;

// Export default configuration object
export const DEFAULT_CHART_CONFIG = {
  colors: CHART_COLORS,
  dimensions: CHART_DIMENSIONS,
  animation: ANIMATION_CONFIG,
  tooltip: TOOLTIP_CONFIG,
  legend: LEGEND_CONFIG,
  grid: GRID_CONFIG,
  breakpoints: CHART_BREAKPOINTS
} as const;

// Utility functions for chart data processing
export const processChartData = {
  /**
   * Format numbers for display in charts
   */
  formatNumber: (value: number, type: 'percentage' | 'currency' | 'integer' | 'decimal' = 'integer'): string => {
    switch (type) {
      case 'percentage':
        return `${Math.round(value)}%`;
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'decimal':
        return value.toFixed(1);
      case 'integer':
      default:
        return Math.round(value).toString();
    }
  },

  /**
   * Generate color based on performance level
   */
  getPerformanceColor: (value: number, max: number = 100): string => {
    const percentage = (value / max) * 100;
    if (percentage >= 80) return CHART_COLORS.success;
    if (percentage >= 60) return CHART_COLORS.primary;
    if (percentage >= 40) return CHART_COLORS.warning;
    return CHART_COLORS.warning;
  },

  /**
   * Calculate trend direction and strength
   */
  calculateTrend: (data: TrendData[]): { direction: 'up' | 'down' | 'stable'; strength: number } => {
    if (data.length < 2) return { direction: 'stable', strength: 0 };
    
    const firstValue = data[0].value;
    const lastValue = data[data.length - 1].value;
    const change = lastValue - firstValue;
    const changePercentage = firstValue !== 0 ? (change / firstValue) * 100 : 0;
    
    if (Math.abs(changePercentage) < 5) return { direction: 'stable', strength: Math.abs(changePercentage) };
    
    return {
      direction: changePercentage > 0 ? 'up' : 'down',
      strength: Math.abs(changePercentage)
    };
  }
};