import { io, Socket } from 'socket.io-client';

interface GameEvent {
  type: 'game_action' | 'game_state' | 'player_join' | 'player_leave' | 'chat';
  data: any;
  timestamp: number;
}

interface WebSocketEvents {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onGameUpdate?: (data: any) => void;
  onPlayerAction?: (data: any) => void;
  onChat?: (message: any) => void;
  onError?: (error: any) => void;
}

class WebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private events: WebSocketEvents = {};
  private messageQueue: GameEvent[] = [];
  private isConnected = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeSocket();
    }
  }

  private initializeSocket() {
    const token = localStorage.getItem('token');
    
    this.socket = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001', {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.flushMessageQueue();
      this.events.onConnect?.();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
      this.events.onDisconnect?.();
      
      if (reason === 'io server disconnect') {
        // 服务器主动断开，尝试重连
        this.reconnect();
      }
    });

    this.socket.on('game:update', (data) => {
      this.events.onGameUpdate?.(data);
    });

    this.socket.on('player:action', (data) => {
      this.events.onPlayerAction?.(data);
    });

    this.socket.on('chat:message', (message) => {
      this.events.onChat?.(message);
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.events.onError?.(error);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.handleReconnect();
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), 10000);
      
      setTimeout(() => {
        this.reconnect();
      }, delay);
    }
  }

  private reconnect() {
    if (this.socket) {
      this.socket.connect();
    } else {
      this.initializeSocket();
    }
  }

  private flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const event = this.messageQueue.shift();
      if (event) {
        this.emit(event.type, event.data);
      }
    }
  }

  // Public methods
  public connect() {
    if (!this.socket) {
      this.initializeSocket();
    } else if (!this.isConnected) {
      this.socket.connect();
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }

  public emit(event: string, data: any) {
    if (this.isConnected && this.socket) {
      this.socket.emit(event, data);
    } else {
      // 离线时缓存消息
      this.messageQueue.push({
        type: event as any,
        data,
        timestamp: Date.now()
      });
    }
  }

  public on(events: WebSocketEvents) {
    this.events = { ...this.events, ...events };
  }

  public off(eventName: keyof WebSocketEvents) {
    delete this.events[eventName];
  }

  // Game specific methods
  public joinGame(gameId: string) {
    this.emit('game:join', { gameId });
  }

  public leaveGame(gameId: string) {
    this.emit('game:leave', { gameId });
  }

  public sendAction(action: any) {
    this.emit('game:action', action);
  }

  public sendChat(message: string, gameId: string) {
    this.emit('chat:send', { message, gameId });
  }

  public subscribeToGame(gameId: string) {
    this.emit('game:subscribe', { gameId });
  }

  public unsubscribeFromGame(gameId: string) {
    this.emit('game:unsubscribe', { gameId });
  }

  // Utility methods
  public isSocketConnected(): boolean {
    return this.isConnected;
  }

  public getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

// 单例模式
let wsClient: WebSocketClient | null = null;

export const getWebSocketClient = (): WebSocketClient => {
  if (!wsClient) {
    wsClient = new WebSocketClient();
  }
  return wsClient;
};

export default WebSocketClient;