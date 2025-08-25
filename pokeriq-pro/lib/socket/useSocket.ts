'use client';

import { useEffect, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

interface UseSocketOptions {
  autoConnect?: boolean;
  token?: string;
}

export function useSocket(options: UseSocketOptions = {}) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [myCards, setMyCards] = useState<string[]>([]);

  useEffect(() => {
    if (!options.token) return;

    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      auth: {
        token: options.token,
      },
      autoConnect: options.autoConnect !== false,
    });

    socketInstance.on('connect', () => {
      console.log('已连接到游戏服务器');
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('已断开连接');
      setConnected(false);
    });

    // 游戏事件监听
    socketInstance.on('player_joined', (data) => {
      console.log('玩家加入', data);
      setGameState(data.room);
    });

    socketInstance.on('player_left', (data) => {
      console.log('玩家离开', data);
      setGameState(data.room);
    });

    socketInstance.on('game_started', (data) => {
      console.log('游戏开始', data);
      setGameState(data.room);
      setMyCards(data.yourCards);
    });

    socketInstance.on('game_update', (data) => {
      console.log('游戏更新', data);
      setGameState(data.room);
    });

    socketInstance.on('game_ended', (data) => {
      console.log('游戏结束', data);
      // 处理游戏结束逻辑
    });

    socketInstance.on('chat_message', (data) => {
      setMessages(prev => [...prev, data]);
    });

    socketInstance.on('room_full', () => {
      console.log('房间已满');
      alert('房间已满，无法加入');
    });

    socketInstance.on('not_your_turn', () => {
      console.log('还没轮到你');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [options.token, options.autoConnect]);

  const joinRoom = useCallback((roomId: string, buyIn: number) => {
    if (!socket) return;
    socket.emit('join_room', roomId, buyIn);
    setRoomId(roomId);
  }, [socket]);

  const leaveRoom = useCallback(() => {
    if (!socket || !roomId) return;
    socket.emit('leave_room', roomId);
    setRoomId(null);
    setGameState(null);
    setMyCards([]);
  }, [socket, roomId]);

  const sendGameAction = useCallback((action: any) => {
    if (!socket || !roomId) return;
    socket.emit('game_action', roomId, action);
  }, [socket, roomId]);

  const sendMessage = useCallback((message: string) => {
    if (!socket || !roomId) return;
    socket.emit('chat_message', roomId, message);
  }, [socket, roomId]);

  const fold = useCallback(() => {
    sendGameAction({ type: 'fold' });
  }, [sendGameAction]);

  const check = useCallback(() => {
    sendGameAction({ type: 'check' });
  }, [sendGameAction]);

  const call = useCallback(() => {
    sendGameAction({ type: 'call' });
  }, [sendGameAction]);

  const raise = useCallback((amount: number) => {
    sendGameAction({ type: 'raise', amount });
  }, [sendGameAction]);

  const allIn = useCallback(() => {
    sendGameAction({ type: 'allin' });
  }, [sendGameAction]);

  return {
    socket,
    connected,
    roomId,
    gameState,
    messages,
    myCards,
    joinRoom,
    leaveRoom,
    sendMessage,
    fold,
    check,
    call,
    raise,
    allIn,
  };
}