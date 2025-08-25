import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Deck } from '@/lib/poker-engine/deck';
import { Card } from '@/lib/poker-engine/card';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    // 获取 Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false, 
        error: 'No token provided' 
      }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid token' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { 
      gameType = 'CASH',
      stakes = '1/2',
      buyIn = 200,
      opponentId = 'ai-basic'
    } = body;

    // 获取用户
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 创建游戏会话
    const gameSession = await prisma.gameSession.create({
      data: {
        userId: user.id,
        type: gameType,
        stakes,
        buyIn,
        result: 'DRAW',
        hands: 0,
        duration: 0,
        opponentIds: JSON.stringify([opponentId])
      }
    });

    // 初始化牌堆
    const deck = new Deck(true);
    
    // 发玩家手牌
    const playerCards = deck.deal(2);
    
    // 发AI手牌
    const aiCards = deck.deal(2);

    // 创建游戏状态
    const players = [
      {
        seat: 0,
        userId: user.id,
        name: user.name || 'Player',
        stack: buyIn,
        status: 'active',
        cards: playerCards.map(c => c.toString()),
        isHuman: true
      },
      {
        seat: 1,
        userId: opponentId,
        name: 'AI Opponent',
        stack: buyIn,
        status: 'active',
        cards: aiCards.map(c => c.toString()),
        isHuman: false
      }
    ];

    const gameState = await prisma.gameState.create({
      data: {
        sessionId: gameSession.id,
        currentHandNumber: 1,
        dealerPosition: 0,
        players: JSON.stringify(players),
        deck: deck.serialize(),
        communityCards: '[]',
        pot: 0,
        currentBet: 0,
        minRaise: stakes.split('/')[1] ? parseFloat(stakes.split('/')[1]) * 2 : 4,
        street: 'PREFLOP',
        actionOn: 1 // Small blind acts first preflop
      }
    });

    // 创建第一手牌记录
    const hand = await prisma.hand.create({
      data: {
        sessionId: gameSession.id,
        handNumber: 1,
        holeCards: JSON.stringify(playerCards.map(c => c.toString())),
        communityCards: '[]',
        position: 'BTN',
        stackSize: buyIn,
        preflopActions: JSON.stringify([]),
        pot: 0,
        result: 'FOLD',
        showdown: false
      }
    });

    // AI 先行动处理 - 模拟 AI 决策循环
    let currentPlayers = [...players];
    let currentPot = 0;
    let currentBet = 0;
    let currentActionOn = 1;
    let currentStreet = 'PREFLOP';
    let communityCards: string[] = [];
    
    // 处理盲注
    currentPlayers[0].stack -= 1; // 小盲
    currentPlayers[1].stack -= 2; // 大盲
    currentPot = 3;
    currentBet = 2;
    currentActionOn = 0; // 小盲行动
    
    // 连续执行 AI 决策直到轮到人类玩家
    while (currentPlayers[currentActionOn]?.isHuman === false && currentStreet !== 'SHOWDOWN') {
      const aiPlayer = currentPlayers[currentActionOn];
      
      // 简单 AI 决策逻辑
      let aiAction = 'check';
      let aiAmount: number | undefined;
      
      const random = Math.random();
      if (currentBet === 0) {
        // 没有下注时
        if (random < 0.4) {
          aiAction = 'check';
        } else if (random < 0.8) {
          aiAction = 'raise';
          aiAmount = Math.min(4, aiPlayer.stack);
        } else {
          aiAction = 'fold';
        }
      } else {
        // 有下注时
        const callAmount = currentBet;
        if (random < 0.3) {
          aiAction = 'fold';
        } else if (random < 0.7) {
          if (callAmount <= aiPlayer.stack) {
            aiAction = 'call';
          } else {
            aiAction = 'allin';
          }
        } else {
          if (currentBet * 2 <= aiPlayer.stack) {
            aiAction = 'raise';
            aiAmount = currentBet * 2;
          } else if (callAmount <= aiPlayer.stack) {
            aiAction = 'call';
          } else {
            aiAction = 'allin';
          }
        }
      }
      
      // 执行 AI 动作
      switch (aiAction) {
        case 'fold':
          aiPlayer.status = 'folded';
          break;
        case 'check':
          break;
        case 'call':
          const callAmount = currentBet;
          aiPlayer.stack -= callAmount;
          currentPot += callAmount;
          break;
        case 'raise':
          if (aiAmount && aiAmount <= aiPlayer.stack) {
            aiPlayer.stack -= aiAmount;
            currentPot += aiAmount;
            currentBet = aiAmount;
          } else {
            // Fallback to call
            const fallbackAmount = currentBet;
            aiPlayer.stack -= fallbackAmount;
            currentPot += fallbackAmount;
          }
          break;
        case 'allin':
          const allinAmount = aiPlayer.stack;
          currentPot += allinAmount;
          aiPlayer.stack = 0;
          aiPlayer.status = 'allin';
          if (allinAmount > currentBet) {
            currentBet = allinAmount;
          }
          break;
      }
      
      // 移动到下一个玩家
      currentActionOn = (currentActionOn + 1) % currentPlayers.length;
      
      // 如果只剩一个活跃玩家，结束
      if (currentPlayers.filter(p => p.status === 'active').length <= 1) {
        currentStreet = 'SHOWDOWN';
        break;
      }
    }
    
    // 更新数据库状态
    await prisma.gameState.update({
      where: { id: gameState.id },
      data: {
        players: JSON.stringify(currentPlayers),
        pot: currentPot,
        currentBet: currentBet,
        street: currentStreet,
        actionOn: currentActionOn,
        lastActionAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      sessionId: gameSession.id,
      gameState: {
        id: gameState.id,
        sessionId: gameSession.id,
        players: currentPlayers,
        playerCards: playerCards.map(c => c.toString()),
        communityCards,
        pot: currentPot,
        currentBet: currentBet,
        minRaise: gameState.minRaise,
        street: currentStreet,
        actionOn: currentActionOn,
        handNumber: 1,
        isComplete: currentStreet === 'SHOWDOWN'
      }
    });

  } catch (error) {
    console.error('Game start error:', error);
    return NextResponse.json(
      { error: 'Failed to start game' },
      { status: 500 }
    );
  }
}