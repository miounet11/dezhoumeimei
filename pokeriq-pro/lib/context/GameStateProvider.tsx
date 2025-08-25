'use client';

import { createContext, useContext, useReducer, useCallback, useEffect, useMemo } from 'react';
import { useOptimizedSocket } from '@/lib/socket/useOptimizedSocket';

// 游戏状态类型定义
export interface GameState {
  gameId: string | null;
  roomId: string | null;
  phase: 'waiting' | 'playing' | 'showdown' | 'ended';
  street: 'PREFLOP' | 'FLOP' | 'TURN' | 'RIVER' | 'SHOWDOWN';
  pot: number;
  currentBet: number;
  players: Player[];
  communityCards: string[];
  playerCards: string[];
  actionOn: number;
  dealerButton: number;
  isMyTurn: boolean;
  canCheck: boolean;
  canCall: boolean;
  canRaise: boolean;
  minRaise: number;
  maxRaise: number;
}

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  stack: number;
  position: number;
  status: 'active' | 'folded' | 'allin' | 'away';
  currentBet: number;
  totalBet: number;
  cards?: string[];
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
}

// Action 类型定义
type GameAction = 
  | { type: 'GAME_STARTED'; payload: GameState }
  | { type: 'GAME_UPDATE'; payload: Partial<GameState> }
  | { type: 'PLAYER_ACTION'; payload: { playerId: string; action: string; amount?: number } }
  | { type: 'NEW_STREET'; payload: { street: string; communityCards: string[] } }
  | { type: 'PLAYER_JOINED'; payload: { player: Player } }
  | { type: 'PLAYER_LEFT'; payload: { playerId: string } }
  | { type: 'GAME_ENDED'; payload: { winner: string; winnings: number } }
  | { type: 'CONNECTION_CHANGED'; payload: { connected: boolean } }
  | { type: 'ERROR'; payload: { message: string } }
  | { type: 'RESET_GAME' };

// 初始状态
const initialGameState: GameState = {
  gameId: null,
  roomId: null,
  phase: 'waiting',
  street: 'PREFLOP',
  pot: 0,
  currentBet: 0,
  players: [],
  communityCards: [],
  playerCards: [],
  actionOn: -1,
  dealerButton: 0,
  isMyTurn: false,
  canCheck: false,
  canCall: false,
  canRaise: false,
  minRaise: 0,
  maxRaise: 0,
};

// Reducer函数 - 优化性能
function gameStateReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'GAME_STARTED':
      return {
        ...initialGameState,
        ...action.payload,
        phase: 'playing',
      };

    case 'GAME_UPDATE':
      return {
        ...state,
        ...action.payload,
      };

    case 'PLAYER_ACTION':
      return {
        ...state,
        players: state.players.map(player => 
          player.id === action.payload.playerId
            ? { 
                ...player, 
                currentBet: action.payload.amount || 0,
                status: action.payload.action === 'fold' ? 'folded' : player.status 
              }
            : player
        ),
      };

    case 'NEW_STREET':
      return {
        ...state,
        street: action.payload.street as GameState['street'],
        communityCards: action.payload.communityCards,
        players: state.players.map(player => ({
          ...player,
          currentBet: 0,
        })),
      };

    case 'PLAYER_JOINED':
      return {
        ...state,
        players: [...state.players, action.payload.player],
      };

    case 'PLAYER_LEFT':
      return {
        ...state,
        players: state.players.filter(player => player.id !== action.payload.playerId),
      };

    case 'GAME_ENDED':
      return {
        ...state,
        phase: 'ended',
      };

    case 'RESET_GAME':
      return initialGameState;

    default:
      return state;
  }
}

// Context 类型定义
interface GameContextType {
  gameState: GameState;
  connected: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  messages: any[];
  joinRoom: (roomId: string, buyIn: number) => boolean;
  leaveRoom: () => boolean;
  fold: () => boolean;
  check: () => boolean;
  call: () => boolean;
  raise: (amount: number) => boolean;
  allIn: () => boolean;
  sendMessage: (message: string) => boolean;
}

// Context创建
const GameContext = createContext<GameContextType | null>(null);

// Provider组件
interface GameProviderProps {
  children: React.ReactNode;
  token?: string;
}

export function GameStateProvider({ children, token }: GameProviderProps) {
  const [gameState, dispatch] = useReducer(gameStateReducer, initialGameState);
  
  // 使用优化的socket hook
  const {
    socket,
    connected,
    connectionStatus,
    messages,
    joinRoom: socketJoinRoom,
    leaveRoom: socketLeaveRoom,
    fold: socketFold,
    check: socketCheck,
    call: socketCall,
    raise: socketRaise,
    allIn: socketAllIn,
    sendMessage: socketSendMessage,
  } = useOptimizedSocket({ token });

  // 监听socket事件并更新游戏状态
  useEffect(() => {
    if (!socket) return;

    const handleGameStarted = (data: any) => {
      dispatch({ type: 'GAME_STARTED', payload: data });
    };

    const handleGameUpdate = (data: any) => {
      dispatch({ type: 'GAME_UPDATE', payload: data });
    };

    const handlePlayerAction = (data: any) => {
      dispatch({ type: 'PLAYER_ACTION', payload: data });
    };

    const handleNewStreet = (data: any) => {
      dispatch({ type: 'NEW_STREET', payload: data });
    };

    const handlePlayerJoined = (data: any) => {
      dispatch({ type: 'PLAYER_JOINED', payload: data });
    };

    const handlePlayerLeft = (data: any) => {
      dispatch({ type: 'PLAYER_LEFT', payload: data });
    };

    const handleGameEnded = (data: any) => {
      dispatch({ type: 'GAME_ENDED', payload: data });
    };

    // 注册事件监听器
    socket.on('game_started', handleGameStarted);
    socket.on('game_update', handleGameUpdate);
    socket.on('player_action', handlePlayerAction);
    socket.on('new_street', handleNewStreet);
    socket.on('player_joined', handlePlayerJoined);
    socket.on('player_left', handlePlayerLeft);
    socket.on('game_ended', handleGameEnded);

    return () => {
      socket.off('game_started', handleGameStarted);
      socket.off('game_update', handleGameUpdate);
      socket.off('player_action', handlePlayerAction);
      socket.off('new_street', handleNewStreet);
      socket.off('player_joined', handlePlayerJoined);
      socket.off('player_left', handlePlayerLeft);
      socket.off('game_ended', handleGameEnded);
    };
  }, [socket]);

  // 封装游戏操作方法
  const joinRoom = useCallback((roomId: string, buyIn: number) => {
    const success = socketJoinRoom(roomId, buyIn);
    if (success) {
      dispatch({ type: 'GAME_UPDATE', payload: { roomId } });
    }
    return success;
  }, [socketJoinRoom]);

  const leaveRoom = useCallback(() => {
    const success = socketLeaveRoom();
    if (success) {
      dispatch({ type: 'RESET_GAME' });
    }
    return success;
  }, [socketLeaveRoom]);

  // 缓存context值以避免不必要的重渲染
  const contextValue = useMemo<GameContextType>(() => ({
    gameState,
    connected,
    connectionStatus,
    messages,
    joinRoom,
    leaveRoom,
    fold: socketFold,
    check: socketCheck,
    call: socketCall,
    raise: socketRaise,
    allIn: socketAllIn,
    sendMessage: socketSendMessage,
  }), [
    gameState,
    connected,
    connectionStatus,
    messages,
    joinRoom,
    leaveRoom,
    socketFold,
    socketCheck,
    socketCall,
    socketRaise,
    socketAllIn,
    socketSendMessage,
  ]);

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}

// Hook for using game context
export function useGameState() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
}

// 选择器hooks - 避免不必要的重渲染
export function useGamePhase() {
  const { gameState } = useGameState();
  return gameState.phase;
}

export function useCurrentPlayer() {
  const { gameState } = useGameState();
  return useMemo(() => 
    gameState.players[gameState.actionOn], 
    [gameState.players, gameState.actionOn]
  );
}

export function usePlayerByPosition(position: number) {
  const { gameState } = useGameState();
  return useMemo(() => 
    gameState.players.find(p => p.position === position),
    [gameState.players, position]
  );
}

export function useGameActions() {
  const { fold, check, call, raise, allIn } = useGameState();
  return useMemo(() => ({
    fold,
    check,
    call,
    raise,
    allIn,
  }), [fold, check, call, raise, allIn]);
}

export function useConnectionStatus() {
  const { connected, connectionStatus } = useGameState();
  return { connected, connectionStatus };
}