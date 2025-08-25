import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db/prisma';

interface Player {
  userId: string;
  socketId: string;
  name: string;
  chips: number;
  position: number;
  cards: string[];
  status: 'waiting' | 'playing' | 'folded' | 'allin';
  currentBet: number;
}

interface GameRoom {
  id: string;
  players: Player[];
  pot: number;
  communityCards: string[];
  currentPlayer: number;
  bigBlind: number;
  smallBlind: number;
  dealerPosition: number;
  gameState: 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  minBet: number;
  deck: string[];
}

class PokerSocketServer {
  private io: SocketIOServer;
  private rooms: Map<string, GameRoom> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        credentials: true,
      },
    });

    this.setupMiddleware();
    this.setupHandlers();
  }

  private setupMiddleware() {
    // 认证中间件
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('未授权'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, name: true, level: true },
        });

        if (!user) {
          return next(new Error('用户不存在'));
        }

        socket.data.user = user;
        next();
      } catch (error) {
        next(new Error('认证失败'));
      }
    });
  }

  private setupHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`用户 ${socket.data.user.name} 已连接`);

      // 加入房间
      socket.on('join_room', (roomId: string, buyIn: number) => {
        this.handleJoinRoom(socket, roomId, buyIn);
      });

      // 离开房间
      socket.on('leave_room', (roomId: string) => {
        this.handleLeaveRoom(socket, roomId);
      });

      // 游戏动作
      socket.on('game_action', (roomId: string, action: any) => {
        this.handleGameAction(socket, roomId, action);
      });

      // 聊天消息
      socket.on('chat_message', (roomId: string, message: string) => {
        this.handleChatMessage(socket, roomId, message);
      });

      // 断开连接
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private handleJoinRoom(socket: any, roomId: string, buyIn: number) {
    let room = this.rooms.get(roomId);

    if (!room) {
      // 创建新房间
      room = {
        id: roomId,
        players: [],
        pot: 0,
        communityCards: [],
        currentPlayer: 0,
        bigBlind: 2,
        smallBlind: 1,
        dealerPosition: 0,
        gameState: 'waiting',
        minBet: 2,
        deck: this.createDeck(),
      };
      this.rooms.set(roomId, room);
    }

    // 检查房间是否已满
    if (room.players.length >= 9) {
      socket.emit('room_full');
      return;
    }

    // 添加玩家到房间
    const player: Player = {
      userId: socket.data.user.id,
      socketId: socket.id,
      name: socket.data.user.name,
      chips: buyIn,
      position: room.players.length,
      cards: [],
      status: 'waiting',
      currentBet: 0,
    };

    room.players.push(player);
    socket.join(roomId);

    // 通知房间内所有玩家
    this.io.to(roomId).emit('player_joined', {
      player,
      room: this.sanitizeRoom(room),
    });

    // 如果玩家数量达到2人，开始游戏
    if (room.players.length >= 2 && room.gameState === 'waiting') {
      this.startGame(roomId);
    }
  }

  private handleLeaveRoom(socket: any, roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
    if (playerIndex === -1) return;

    const player = room.players[playerIndex];
    room.players.splice(playerIndex, 1);
    socket.leave(roomId);

    // 通知其他玩家
    this.io.to(roomId).emit('player_left', {
      playerId: player.userId,
      room: this.sanitizeRoom(room),
    });

    // 如果房间空了，删除房间
    if (room.players.length === 0) {
      this.rooms.delete(roomId);
    }
  }

  private handleGameAction(socket: any, roomId: string, action: any) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;

    // 验证是否轮到该玩家
    if (room.players[room.currentPlayer].socketId !== socket.id) {
      socket.emit('not_your_turn');
      return;
    }

    switch (action.type) {
      case 'fold':
        this.handleFold(room, player);
        break;
      case 'check':
        this.handleCheck(room, player);
        break;
      case 'call':
        this.handleCall(room, player);
        break;
      case 'raise':
        this.handleRaise(room, player, action.amount);
        break;
      case 'allin':
        this.handleAllIn(room, player);
        break;
    }

    // 更新游戏状态
    this.updateGameState(room);

    // 通知所有玩家
    this.io.to(roomId).emit('game_update', {
      room: this.sanitizeRoom(room),
      lastAction: {
        playerId: player.userId,
        action: action.type,
        amount: action.amount,
      },
    });
  }

  private handleChatMessage(socket: any, roomId: string, message: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;

    // 广播消息
    this.io.to(roomId).emit('chat_message', {
      playerId: player.userId,
      playerName: player.name,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  private handleDisconnect(socket: any) {
    console.log(`用户 ${socket.data.user.name} 已断开连接`);

    // 从所有房间中移除玩家
    this.rooms.forEach((room, roomId) => {
      const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
      if (playerIndex !== -1) {
        this.handleLeaveRoom(socket, roomId);
      }
    });
  }

  private startGame(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // 重置牌组
    room.deck = this.createDeck();
    this.shuffleDeck(room.deck);

    // 发牌
    room.players.forEach(player => {
      player.cards = [room.deck.pop()!, room.deck.pop()!];
      player.status = 'playing';
      player.currentBet = 0;
    });

    // 设置盲注
    const sbPlayer = room.players[(room.dealerPosition + 1) % room.players.length];
    const bbPlayer = room.players[(room.dealerPosition + 2) % room.players.length];
    
    sbPlayer.chips -= room.smallBlind;
    sbPlayer.currentBet = room.smallBlind;
    bbPlayer.chips -= room.bigBlind;
    bbPlayer.currentBet = room.bigBlind;
    
    room.pot = room.smallBlind + room.bigBlind;
    room.minBet = room.bigBlind;
    room.currentPlayer = (room.dealerPosition + 3) % room.players.length;
    room.gameState = 'preflop';

    // 通知所有玩家游戏开始
    room.players.forEach(player => {
      const socket = this.io.sockets.sockets.get(player.socketId);
      if (socket) {
        socket.emit('game_started', {
          room: this.sanitizeRoom(room),
          yourCards: player.cards,
        });
      }
    });
  }

  private handleFold(room: GameRoom, player: Player) {
    player.status = 'folded';
    this.nextPlayer(room);
  }

  private handleCheck(room: GameRoom, player: Player) {
    // 只有当前下注为0或玩家已经匹配当前下注时才能check
    const maxBet = Math.max(...room.players.map(p => p.currentBet));
    if (player.currentBet < maxBet) {
      return; // 不能check，必须call或fold
    }
    this.nextPlayer(room);
  }

  private handleCall(room: GameRoom, player: Player) {
    const maxBet = Math.max(...room.players.map(p => p.currentBet));
    const callAmount = maxBet - player.currentBet;
    
    if (callAmount > player.chips) {
      // 玩家筹码不足，全下
      this.handleAllIn(room, player);
      return;
    }

    player.chips -= callAmount;
    player.currentBet += callAmount;
    room.pot += callAmount;
    this.nextPlayer(room);
  }

  private handleRaise(room: GameRoom, player: Player, amount: number) {
    if (amount > player.chips) {
      return; // 无效加注
    }

    const maxBet = Math.max(...room.players.map(p => p.currentBet));
    const raiseAmount = amount - player.currentBet;

    player.chips -= raiseAmount;
    player.currentBet = amount;
    room.pot += raiseAmount;
    room.minBet = amount;
    this.nextPlayer(room);
  }

  private handleAllIn(room: GameRoom, player: Player) {
    const allInAmount = player.chips;
    room.pot += allInAmount;
    player.currentBet += allInAmount;
    player.chips = 0;
    player.status = 'allin';
    this.nextPlayer(room);
  }

  private nextPlayer(room: GameRoom) {
    // 找到下一个还在游戏中的玩家
    let nextIndex = (room.currentPlayer + 1) % room.players.length;
    let attempts = 0;

    while (attempts < room.players.length) {
      const player = room.players[nextIndex];
      if (player.status === 'playing') {
        room.currentPlayer = nextIndex;
        return;
      }
      nextIndex = (nextIndex + 1) % room.players.length;
      attempts++;
    }

    // 没有玩家可以行动，进入下一阶段
    this.nextRound(room);
  }

  private nextRound(room: GameRoom) {
    // 重置玩家下注
    room.players.forEach(p => p.currentBet = 0);

    switch (room.gameState) {
      case 'preflop':
        // 发flop
        room.communityCards = [
          room.deck.pop()!,
          room.deck.pop()!,
          room.deck.pop()!,
        ];
        room.gameState = 'flop';
        break;
      case 'flop':
        // 发turn
        room.communityCards.push(room.deck.pop()!);
        room.gameState = 'turn';
        break;
      case 'turn':
        // 发river
        room.communityCards.push(room.deck.pop()!);
        room.gameState = 'river';
        break;
      case 'river':
        // 摊牌
        room.gameState = 'showdown';
        this.showdown(room);
        return;
    }

    // 设置下一轮的首个玩家
    room.currentPlayer = (room.dealerPosition + 1) % room.players.length;
  }

  private showdown(room: GameRoom) {
    // TODO: 实现摊牌逻辑，计算获胜者
    // 这里需要实现扑克牌型比较逻辑

    // 暂时随机选择获胜者
    const activePlayers = room.players.filter(p => p.status !== 'folded');
    if (activePlayers.length > 0) {
      const winner = activePlayers[Math.floor(Math.random() * activePlayers.length)];
      winner.chips += room.pot;

      // 通知所有玩家游戏结果
      this.io.to(room.id).emit('game_ended', {
        winner: winner.userId,
        pot: room.pot,
        players: room.players.map(p => ({
          userId: p.userId,
          cards: p.cards,
          chips: p.chips,
        })),
      });
    }

    // 重置游戏状态
    setTimeout(() => {
      if (room.players.length >= 2) {
        room.dealerPosition = (room.dealerPosition + 1) % room.players.length;
        this.startGame(room.id);
      } else {
        room.gameState = 'waiting';
      }
    }, 5000);
  }

  private updateGameState(room: GameRoom) {
    // 检查是否只剩一个玩家
    const activePlayers = room.players.filter(p => p.status !== 'folded');
    if (activePlayers.length === 1) {
      // 直接结束游戏
      room.gameState = 'showdown';
      this.showdown(room);
    }
  }

  private createDeck(): string[] {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck: string[] = [];

    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push(rank + suit);
      }
    }

    return deck;
  }

  private shuffleDeck(deck: string[]) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  private sanitizeRoom(room: GameRoom): any {
    // 返回不包含敏感信息的房间数据
    return {
      id: room.id,
      players: room.players.map(p => ({
        userId: p.userId,
        name: p.name,
        chips: p.chips,
        position: p.position,
        status: p.status,
        currentBet: p.currentBet,
        // 不返回其他玩家的手牌
      })),
      pot: room.pot,
      communityCards: room.communityCards,
      currentPlayer: room.currentPlayer,
      gameState: room.gameState,
      minBet: room.minBet,
    };
  }
}

export default PokerSocketServer;