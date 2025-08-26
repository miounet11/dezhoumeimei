/**
 * Assessment Timer Component
 * Shows remaining time with visual indicators
 */

'use client';

import React, { useMemo } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface AssessmentTimerProps {
  timeRemaining: number; // seconds
  totalTime: number; // seconds
}

export default function AssessmentTimer({ timeRemaining, totalTime }: AssessmentTimerProps) {
  const { minutes, seconds, percentage, urgencyLevel } = useMemo(() => {
    const mins = Math.floor(timeRemaining / 60);
    const secs = timeRemaining % 60;
    const pct = totalTime > 0 ? (timeRemaining / totalTime) * 100 : 100;
    
    let urgency: 'normal' | 'warning' | 'critical' = 'normal';
    if (pct <= 10) urgency = 'critical';
    else if (pct <= 25) urgency = 'warning';
    
    return {
      minutes: mins,
      seconds: secs,
      percentage: pct,
      urgencyLevel: urgency
    };
  }, [timeRemaining, totalTime]);

  const getTimerClasses = () => {
    switch (urgencyLevel) {
      case 'critical':
        return 'bg-red-500/20 border-red-500 text-red-300';
      case 'warning':
        return 'bg-yellow-500/20 border-yellow-500 text-yellow-300';
      default:
        return 'bg-blue-500/20 border-blue-500 text-blue-300';
    }
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${getTimerClasses()}`}>
      {urgencyLevel === 'critical' ? (
        <AlertTriangle className="w-5 h-5" />
      ) : (
        <Clock className="w-5 h-5" />
      )}
      
      <div className="flex items-center gap-2">
        <span className="font-mono text-lg font-bold">
          {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </span>
        
        {totalTime > 0 && (
          <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${
                urgencyLevel === 'critical' 
                  ? 'bg-red-500' 
                  : urgencyLevel === 'warning'
                  ? 'bg-yellow-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${Math.max(0, percentage)}%` }}
            />
          </div>
        )}
      </div>
      
      {urgencyLevel === 'critical' && (
        <span className="text-xs font-medium">HURRY!</span>
      )}
    </div>
  );
}