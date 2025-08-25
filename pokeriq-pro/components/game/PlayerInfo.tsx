'use client';

interface PlayerInfoProps {
  player: any;
  isActive: boolean;
  isHuman: boolean;
}

export default function PlayerInfo({ player, isActive, isHuman }: PlayerInfoProps) {
  return (
    <div className={`
      bg-gray-800 rounded-lg p-4 
      ${isActive ? 'ring-2 ring-yellow-400 animate-pulse' : ''}
      ${player.status === 'folded' ? 'opacity-50' : ''}
    `}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* 头像 */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
            {isHuman ? '👤' : '🤖'}
          </div>
          
          {/* 玩家信息 */}
          <div>
            <div className="text-white font-bold">
              {player.name}
              {isHuman && <span className="ml-2 text-xs text-green-400">(你)</span>}
            </div>
            <div className="text-sm text-gray-400">
              筹码: ${player.stack}
            </div>
          </div>
        </div>

        {/* 状态指示 */}
        <div className="text-right">
          {player.status === 'folded' && (
            <span className="text-red-400 text-sm">已弃牌</span>
          )}
          {player.status === 'allin' && (
            <span className="text-yellow-400 text-sm font-bold">All-in</span>
          )}
          {player.status === 'active' && isActive && (
            <span className="text-green-400 text-sm animate-pulse">
              {isHuman ? '你的回合' : '思考中...'}
            </span>
          )}
        </div>
      </div>

      {/* 玩家统计（未来可以添加） */}
      <div className="mt-3 pt-3 border-t border-gray-700">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-gray-500">VPIP</span>
            <span className="ml-1 text-gray-300">25%</span>
          </div>
          <div>
            <span className="text-gray-500">PFR</span>
            <span className="ml-1 text-gray-300">18%</span>
          </div>
          <div>
            <span className="text-gray-500">AF</span>
            <span className="ml-1 text-gray-300">2.5</span>
          </div>
        </div>
      </div>
    </div>
  );
}