const { createServer } = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8820',
    credentials: true,
  },
});

const rooms = new Map();

// 简化版的游戏逻辑
class PokerRoom {
  constructor(id) {
    this.id = id;
    this.players = [];
    this.pot = 0;
    this.communityCards = [];
    this.currentPlayer = 0;
    this.gameState = 'waiting';
    this.deck = this.createDeck();
  }

  createDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck = [];
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push(rank + suit);
      }
    }
    return this.shuffle(deck);
  }

  shuffle(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  addPlayer(player) {
    if (this.players.length >= 9) return false;
    this.players.push(player);
    return true;
  }

  removePlayer(socketId) {
    const index = this.players.findIndex(p => p.socketId === socketId);
    if (index !== -1) {
      this.players.splice(index, 1);
      return true;
    }
    return false;
  }

  startGame() {
    if (this.players.length < 2) return false;
    
    this.deck = this.createDeck();
    this.gameState = 'playing';
    this.pot = 0;
    this.communityCards = [];
    
    // 发手牌
    this.players.forEach(player => {
      player.cards = [this.deck.pop(), this.deck.pop()];
      player.status = 'playing';
      player.currentBet = 0;
    });
    
    // 发公共牌（简化版，直接发5张）
    this.communityCards = [
      this.deck.pop(),
      this.deck.pop(),
      this.deck.pop(),
      this.deck.pop(),
      this.deck.pop(),
    ];
    
    return true;
  }

  getPublicState() {
    return {
      id: this.id,
      players: this.players.map(p => ({
        userId: p.userId,
        name: p.name,
        chips: p.chips,
        position: p.position,
        status: p.status,
        currentBet: p.currentBet,
      })),
      pot: this.pot,
      communityCards: this.communityCards,
      currentPlayer: this.currentPlayer,
      gameState: this.gameState,
    };
  }
}

// 认证中间件
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('未授权'));
  }

  try {
    // 验证JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production');
    socket.userId = decoded.userId;
    socket.userName = decoded.email?.split('@')[0] || 'Player';
    next();
  } catch (error) {
    console.error('JWT验证失败:', error);
    next(new Error('认证失败'));
  }
});

io.on('connection', (socket) => {
  console.log(`用户 ${socket.userName} 已连接`);

  socket.on('join_room', (roomId, buyIn) => {
    let room = rooms.get(roomId);
    
    if (!room) {
      room = new PokerRoom(roomId);
      rooms.set(roomId, room);
    }

    const player = {
      userId: socket.userId,
      socketId: socket.id,
      name: socket.userName,
      chips: buyIn || 200,
      position: room.players.length,
      cards: [],
      status: 'waiting',
      currentBet: 0,
    };

    if (room.addPlayer(player)) {
      socket.join(roomId);
      socket.roomId = roomId;

      // 通知所有人
      io.to(roomId).emit('player_joined', {
        player,
        room: room.getPublicState(),
      });

      // 如果有2个或更多玩家，开始游戏
      if (room.players.length >= 2 && room.gameState === 'waiting') {
        if (room.startGame()) {
          room.players.forEach(p => {
            const playerSocket = io.sockets.sockets.get(p.socketId);
            if (playerSocket) {
              playerSocket.emit('game_started', {
                room: room.getPublicState(),
                yourCards: p.cards,
              });
            }
          });
        }
      }
    } else {
      socket.emit('room_full');
    }
  });

  socket.on('leave_room', (roomId) => {
    const room = rooms.get(roomId);
    if (room && room.removePlayer(socket.id)) {
      socket.leave(roomId);
      io.to(roomId).emit('player_left', {
        playerId: socket.userId,
        room: room.getPublicState(),
      });

      if (room.players.length === 0) {
        rooms.delete(roomId);
      }
    }
  });

  socket.on('game_action', (roomId, action) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;

    // 简化的游戏动作处理
    console.log(`玩家 ${player.name} 执行动作:`, action);

    io.to(roomId).emit('game_update', {
      room: room.getPublicState(),
      lastAction: {
        playerId: player.userId,
        action: action.type,
        amount: action.amount,
      },
    });
  });

  socket.on('chat_message', (roomId, message) => {
    io.to(roomId).emit('chat_message', {
      playerId: socket.userId,
      playerName: socket.userName,
      message,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('disconnect', () => {
    console.log(`用户 ${socket.userName} 已断开连接`);
    
    if (socket.roomId) {
      const room = rooms.get(socket.roomId);
      if (room && room.removePlayer(socket.id)) {
        io.to(socket.roomId).emit('player_left', {
          playerId: socket.userId,
          room: room.getPublicState(),
        });

        if (room.players.length === 0) {
          rooms.delete(socket.roomId);
        }
      }
    }
  });
});

const PORT = process.env.SOCKET_PORT || 8850;
httpServer.listen(PORT, () => {
  console.log(`🎮 WebSocket服务器运行在端口 ${PORT}`);
});