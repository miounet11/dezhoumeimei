'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import io, { Socket } from 'socket.io-client';

interface UseSocketOptions {
  autoConnect?: boolean;
  token?: string;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

interface GameState {
  room: any;
  yourCards?: string[];
}

// 优化的Socket Hook，使用React模式提升性能
export function useOptimizedSocket(options: UseSocketOptions = {}) {
  const {
    autoConnect = true,
    token,
    reconnectAttempts = 5,
    reconnectDelay = 1000
  } = options;

  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [myCards, setMyCards] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  // 使用ref避免在useEffect依赖中包含options
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // 缓存socket连接配置
  const socketConfig = useMemo(() => ({
    auth: { token },
    autoConnect,
    reconnection: true,
    reconnectionAttempts: reconnectAttempts,
    reconnectionDelay: reconnectDelay,
  }), [token, autoConnect, reconnectAttempts, reconnectDelay]);

  // 缓存socket URL
  const socketUrl = useMemo(() => 
    process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001',
    []
  );

  // 优化的事件处理器
  const handleConnect = useCallback(() => {
    console.log('已连接到游戏服务器');
    setConnected(true);
    setConnectionStatus('connected');
  }, []);

  const handleDisconnect = useCallback(() => {
    console.log('已断开连接');
    setConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  const handlePlayerJoined = useCallback((data: any) => {
    console.log('玩家加入', data);
    setGameState(data.room);
  }, []);

  const handlePlayerLeft = useCallback((data: any) => {
    console.log('玩家离开', data);
    setGameState(data.room);
  }, []);

  const handleGameStarted = useCallback((data: GameState) => {
    console.log('游戏开始', data);
    setGameState(data.room);
    if (data.yourCards) {
      setMyCards(data.yourCards);
    }
  }, []);

  const handleGameUpdate = useCallback((data: GameState) => {
    console.log('游戏更新', data);
    setGameState(data.room);
  }, []);

  const handleGameEnded = useCallback((data: any) => {
    console.log('游戏结束', data);
    // 处理游戏结束逻辑
  }, []);

  const handleChatMessage = useCallback((data: any) => {
    setMessages(prev => [...prev, data]);
  }, []);

  const handleRoomFull = useCallback(() => {
    console.log('房间已满');
    alert('房间已满，无法加入');
  }, []);

  const handleNotYourTurn = useCallback(() => {
    console.log('还没轮到你');
  }, []);

  // Socket连接管理
  useEffect(() => {
    if (!token) return;

    setConnectionStatus('connecting');
    const socketInstance = io(socketUrl, socketConfig);

    // 注册事件监听器
    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);
    socketInstance.on('player_joined', handlePlayerJoined);
    socketInstance.on('player_left', handlePlayerLeft);
    socketInstance.on('game_started', handleGameStarted);
    socketInstance.on('game_update', handleGameUpdate);
    socketInstance.on('game_ended', handleGameEnded);
    socketInstance.on('chat_message', handleChatMessage);
    socketInstance.on('room_full', handleRoomFull);
    socketInstance.on('not_your_turn', handleNotYourTurn);

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
      setSocket(null);
      setConnected(false);
      setConnectionStatus('disconnected');
    };
  }, [
    token, 
    socketUrl, 
    socketConfig,
    handleConnect,
    handleDisconnect,
    handlePlayerJoined,
    handlePlayerLeft,
    handleGameStarted,
    handleGameUpdate,
    handleGameEnded,
    handleChatMessage,
    handleRoomFull,
    handleNotYourTurn
  ]);

  // 优化的游戏操作方法
  const joinRoom = useCallback((roomId: string, buyIn: number) => {
    if (!socket?.connected) return false;
    socket.emit('join_room', roomId, buyIn);
    setRoomId(roomId);
    return true;
  }, [socket]);

  const leaveRoom = useCallback(() => {
    if (!socket?.connected || !roomId) return false;
    socket.emit('leave_room', roomId);
    setRoomId(null);
    setGameState(null);
    setMyCards([]);
    return true;
  }, [socket, roomId]);

  const sendGameAction = useCallback((action: any) => {
    if (!socket?.connected || !roomId) return false;
    socket.emit('game_action', roomId, action);
    return true;
  }, [socket, roomId]);

  const sendMessage = useCallback((message: string) => {
    if (!socket?.connected || !roomId) return false;
    socket.emit('chat_message', roomId, message);
    return true;
  }, [socket, roomId]);

  // 缓存的游戏动作方法
  const gameActions = useMemo(() => ({
    fold: () => sendGameAction({ type: 'fold' }),
    check: () => sendGameAction({ type: 'check' }),
    call: () => sendGameAction({ type: 'call' }),
    raise: (amount: number) => sendGameAction({ type: 'raise', amount }),
    allIn: () => sendGameAction({ type: 'allin' }),
  }), [sendGameAction]);

  // 返回优化的状态和方法
  return useMemo(() => ({
    socket,
    connected,
    connectionStatus,
    roomId,
    gameState,
    messages,
    myCards,
    joinRoom,
    leaveRoom,
    sendMessage,
    ...gameActions,
  }), [
    socket,
    connected,
    connectionStatus,
    roomId,
    gameState,
    messages,
    myCards,
    joinRoom,
    leaveRoom,
    sendMessage,
    gameActions,
  ]);
}