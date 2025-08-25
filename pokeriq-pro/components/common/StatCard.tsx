'use client';

import { ReactNode } from 'react';
import { Card } from 'antd';

interface StatCardProps {
  icon: ReactNode;
  value: string | number;
  title: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
  loading?: boolean;
}

export default function StatCard({ 
  icon, 
  value, 
  title, 
  trend, 
  className = '',
  loading = false 
}: StatCardProps) {
  return (
    <Card 
      loading={loading}
      className={`stat-card ${className}`}
      bodyStyle={{ padding: '24px' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="text-3xl">{icon}</div>
        {trend && (
          <span className={`text-sm font-medium ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend.value}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-sm text-gray-500">{title}</div>
    </Card>
  );
}