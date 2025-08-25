'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CompanionFloatingAssistant } from '@/components/companions/CompanionFloatingAssistant';
import { usePathname } from 'next/navigation';

interface CompanionContextType {
  activeCompanion: any;
  setActiveCompanion: (companion: any) => void;
  companionMood: string;
  updateCompanionMood: (mood: string) => void;
}

const CompanionContext = createContext<CompanionContextType | undefined>(undefined);

export const useCompanion = () => {
  const context = useContext(CompanionContext);
  if (!context) {
    throw new Error('useCompanion must be used within CompanionProvider');
  }
  return context;
};

export const CompanionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const [activeCompanion, setActiveCompanion] = useState({
    id: 'comp_001',
    name: '雪',
    tier: 'A',
    level: 45,
    intimacy: 68,
    mood: 'happy' as const
  });
  const [companionMood, setCompanionMood] = useState('happy');

  // 根据页面变化更新陪伴心情
  useEffect(() => {
    if (pathname?.includes('training')) {
      setCompanionMood('excited');
    } else if (pathname?.includes('analytics')) {
      setCompanionMood('neutral');
    } else if (pathname?.includes('achievements')) {
      setCompanionMood('playful');
    } else if (pathname?.includes('companions')) {
      setCompanionMood('happy');
    } else {
      setCompanionMood('happy');
    }
  }, [pathname]);

  const updateCompanionMood = useCallback((mood: string) => {
    setCompanionMood(mood);
    setActiveCompanion(prev => ({ ...prev, mood }));
  }, []);

  // 不在登录/注册页面显示陪伴助手
  const shouldShowCompanion = pathname && 
    !pathname.includes('/auth/login') && 
    !pathname.includes('/auth/register') &&
    !pathname.includes('/companions'); // 在陪伴页面也不显示浮动助手

  // 游戏结果处理回调
  const handleGameResult = useCallback((result: 'win' | 'loss' | 'draw') => {
    // 根据游戏结果更新心情
    updateCompanionMood(result === 'win' ? 'excited' : result === 'loss' ? 'sad' : 'neutral');
    setTimeout(() => {
      updateCompanionMood('happy');
    }, 5000);
  }, [updateCompanionMood]);

  return (
    <CompanionContext.Provider
      value={{
        activeCompanion,
        setActiveCompanion,
        companionMood,
        updateCompanionMood
      }}
    >
      {children}
      {shouldShowCompanion && (
        <CompanionFloatingAssistant 
          companion={activeCompanion}
          onGameResult={handleGameResult}
        />
      )}
    </CompanionContext.Provider>
  );
};