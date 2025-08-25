'use client';

import { Card, Select, Typography } from 'antd';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useState } from 'react';

const { Title } = Typography;
const { Option } = Select;

interface ChartData {
  date?: string;
  name?: string;
  value?: number;
  winRate?: number;
  profit?: number;
  handsPlayed?: number;
  [key: string]: string | number | undefined;
}

interface StatsChartProps {
  title: string;
  type: 'line' | 'area' | 'bar' | 'pie';
  data: ChartData[];
  xKey?: string;
  yKey?: string;
  className?: string;
  height?: number;
  showDateFilter?: boolean;
  colors?: string[];
}

const defaultColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#d084d0'];

export default function StatsChart({
  title,
  type,
  data,
  xKey = 'date',
  yKey = 'value',
  className = '',
  height = 300,
  showDateFilter = false,
  colors = defaultColors
}: StatsChartProps) {
  const [dateRange, setDateRange] = useState('7d');

  const formatTooltipValue = (value: string | number, name: string): [string, string] => {
    if (name === 'winRate') {
      return [`${value}%`, '胜率'];
    }
    if (name === 'profit') {
      return [`$${value}`, '盈利'];
    }
    if (name === 'handsPlayed') {
      return [value, '手数'];
    }
    return [value, name];
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey={xKey} className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                formatter={formatTooltipValue}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey={yKey} 
                stroke={colors[0]} 
                strokeWidth={2}
                dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: colors[0], strokeWidth: 2 }}
              />
              {data[0]?.profit !== undefined && (
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke={colors[1]}
                  strokeWidth={2}
                  dot={{ fill: colors[1], strokeWidth: 2, r: 4 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey={xKey} className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                formatter={formatTooltipValue}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey={yKey} 
                stroke={colors[0]} 
                fill={colors[0]}
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey={xKey} className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                formatter={formatTooltipValue}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey={yKey} fill={colors[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={height / 3}
                fill="#8884d8"
                dataKey={yKey}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Card 
      title={
        <div className="flex justify-between items-center">
          <Title level={4} className="mb-0">
            {title}
          </Title>
          {showDateFilter && (
            <Select
              value={dateRange}
              onChange={setDateRange}
              size="small"
              style={{ width: 100 }}
            >
              <Option value="7d">7天</Option>
              <Option value="30d">30天</Option>
              <Option value="90d">90天</Option>
              <Option value="1y">1年</Option>
            </Select>
          )}
        </div>
      }
      className={className}
      bodyStyle={{ padding: '16px' }}
    >
      {renderChart()}
    </Card>
  );
}

// 预定义的图表配置
export const chartConfigs = {
  winRateChart: {
    type: 'line' as const,
    yKey: 'winRate',
    colors: ['#52c41a', '#1890ff']
  },
  profitChart: {
    type: 'area' as const,
    yKey: 'profit',
    colors: ['#722ed1']
  },
  handsChart: {
    type: 'bar' as const,
    yKey: 'handsPlayed',
    colors: ['#fa8c16']
  },
  positionChart: {
    type: 'pie' as const,
    yKey: 'value',
    xKey: 'position',
    colors: ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#d084d0', '#8dd1e1']
  }
};

// 快捷图表组件
export function WinRateChart({ data, title = "胜率趋势", ...props }: Omit<StatsChartProps, 'type'> & { data: ChartData[] }) {
  return (
    <StatsChart
      type="line"
      title={title}
      data={data}
      yKey="winRate"
      colors={['#52c41a']}
      {...props}
    />
  );
}

export function ProfitChart({ data, title = "盈利趋势", ...props }: Omit<StatsChartProps, 'type'> & { data: ChartData[] }) {
  return (
    <StatsChart
      type="area"
      title={title}
      data={data}
      yKey="profit"
      colors={['#722ed1']}
      {...props}
    />
  );
}

export function HandsChart({ data, title = "手数统计", ...props }: Omit<StatsChartProps, 'type'> & { data: ChartData[] }) {
  return (
    <StatsChart
      type="bar"
      title={title}
      data={data}
      yKey="handsPlayed"
      colors={['#fa8c16']}
      {...props}
    />
  );
}

export function PositionChart({ data, title = "位置分布", ...props }: Omit<StatsChartProps, 'type'> & { data: ChartData[] }) {
  return (
    <StatsChart
      type="pie"
      title={title}
      data={data}
      yKey="value"
      xKey="name"
      colors={['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#d084d0', '#8dd1e1']}
      {...props}
    />
  );
}