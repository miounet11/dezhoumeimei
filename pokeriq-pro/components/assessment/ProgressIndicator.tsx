/**
 * Progress Indicator Component
 * Shows assessment progress with visual progress bar
 */

'use client';

import React from 'react';

interface ProgressIndicatorProps {
  current: number;
  total: number;
  answered: number;
  progress: number;
}

export default function ProgressIndicator({ 
  current, 
  total, 
  answered, 
  progress 
}: ProgressIndicatorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-300">
          Question {current} of {total}
        </span>
        <span className="text-slate-300">
          {answered} answered ({progress}% complete)
        </span>
      </div>
      
      <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-blue-600 to-purple-600 h-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {answered < total && (
        <div className="text-xs text-slate-400 text-center">
          {total - answered} question{total - answered !== 1 ? 's' : ''} remaining
        </div>
      )}
    </div>
  );
}