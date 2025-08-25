'use client';

import { useState } from 'react';

interface ActionPanelProps {
  currentBet: number;
  minRaise: number;
  playerStack: number;
  onAction: (action: string, amount?: number) => void;
  disabled?: boolean;
}

export default function ActionPanel({
  currentBet,
  minRaise,
  playerStack,
  onAction,
  disabled = false
}: ActionPanelProps) {
  const [raiseAmount, setRaiseAmount] = useState(minRaise);

  const handleRaise = () => {
    if (raiseAmount >= minRaise && raiseAmount <= playerStack) {
      onAction('raise', raiseAmount);
    }
  };

  const handleRaiseSlider = (value: number) => {
    setRaiseAmount(Math.min(value, playerStack));
  };

  const quickBets = [
    { label: '最小加注', amount: minRaise },
    { label: '1/2 底池', amount: Math.floor(currentBet * 1.5) },
    { label: '底池', amount: currentBet * 2 },
    { label: 'All-in', amount: playerStack }
  ];

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
      <div className="space-y-4">
        {/* 快捷下注按钮 */}
        <div className="grid grid-cols-4 gap-2">
          {quickBets.map((bet) => (
            <button
              key={bet.label}
              onClick={() => setRaiseAmount(bet.amount)}
              disabled={disabled || bet.amount > playerStack}
              className="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {bet.label}
            </button>
          ))}
        </div>

        {/* 加注滑块 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-400">
            <span>加注金额</span>
            <span className="text-white font-bold">${raiseAmount}</span>
          </div>
          <input
            type="range"
            min={minRaise}
            max={playerStack}
            value={raiseAmount}
            onChange={(e) => handleRaiseSlider(Number(e.target.value))}
            disabled={disabled}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>${minRaise}</span>
            <span>${playerStack}</span>
          </div>
        </div>

        {/* 主要动作按钮 */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => onAction('fold')}
            disabled={disabled}
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            弃牌
          </button>
          
          {currentBet === 0 ? (
            <button
              onClick={() => onAction('check')}
              disabled={disabled}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              过牌
            </button>
          ) : (
            <button
              onClick={() => onAction('call')}
              disabled={disabled || currentBet > playerStack}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              跟注 ${currentBet}
            </button>
          )}

          <button
            onClick={handleRaise}
            disabled={disabled || raiseAmount > playerStack}
            className="px-6 py-3 bg-yellow-600 text-white rounded-lg font-bold hover:bg-yellow-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            加注
          </button>
        </div>

        {/* All-in 按钮 */}
        <button
          onClick={() => onAction('allin')}
          disabled={disabled}
          className="w-full px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-bold hover:from-orange-700 hover:to-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          All-in (${playerStack})
        </button>
      </div>
    </div>
  );
}