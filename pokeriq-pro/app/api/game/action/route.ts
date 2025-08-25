import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Deck } from '@/lib/poker-engine/deck';
import { Card } from '@/lib/poker-engine/card';
import { HandEvaluator } from '@/lib/poker-engine/hand-evaluator';

type PlayerAction = 'fold' | 'check' | 'call' | 'raise' | 'allin';

interface ActionRequest {
  sessionId: string;
  action: PlayerAction;
  amount?: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ActionRequest = await request.json();
    const { sessionId, action, amount } = body;

    // 获取游戏状态
    const gameState = await prisma.gameState.findUnique({
      where: { sessionId }
    });

    if (!gameState) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const players = JSON.parse(gameState.players as string);
    const currentPlayer = players[gameState.actionOn];
    
    // 处理玩家动作
    let newPot = gameState.pot;
    let newCurrentBet = gameState.currentBet;
    
    switch (action) {
      case 'fold':
        currentPlayer.status = 'folded';
        break;
        
      case 'check':
        if (gameState.currentBet > 0) {
          return NextResponse.json({ error: 'Cannot check when there is a bet' }, { status: 400 });
        }
        break;
        
      case 'call':
        const callAmount = gameState.currentBet;
        currentPlayer.stack -= callAmount;
        newPot += callAmount;
        break;
        
      case 'raise':
        if (!amount || amount < gameState.minRaise) {
          return NextResponse.json({ error: 'Invalid raise amount' }, { status: 400 });
        }
        currentPlayer.stack -= amount;
        newPot += amount;
        newCurrentBet = amount;
        break;
        
      case 'allin':
        const allinAmount = currentPlayer.stack;
        newPot += allinAmount;
        currentPlayer.stack = 0;
        currentPlayer.status = 'allin';
        if (allinAmount > newCurrentBet) {
          newCurrentBet = allinAmount;
        }
        break;
    }

    // 移动到下一个玩家
    let nextPlayer = (gameState.actionOn + 1) % players.length;
    while (players[nextPlayer].status !== 'active' && nextPlayer !== gameState.actionOn) {
      nextPlayer = (nextPlayer + 1) % players.length;
    }

    // 检查是否需要进入下一条街
    let newStreet = gameState.street;
    let communityCards = JSON.parse(gameState.communityCards);
    
    if (nextPlayer === gameState.actionOn || players.filter((p: any) => p.status === 'active').length <= 1) {
      // 所有玩家都行动过了，进入下一条街
      const deck = Deck.deserialize(gameState.deck);
      
      switch (gameState.street) {
        case 'PREFLOP':
          newStreet = 'FLOP';
          const flop = deck.deal(3);
          communityCards.push(...flop.map(c => c.toString()));
          break;
        case 'FLOP':
          newStreet = 'TURN';
          const turn = deck.deal(1);
          communityCards.push(...turn.map(c => c.toString()));
          break;
        case 'TURN':
          newStreet = 'RIVER';
          const river = deck.deal(1);
          communityCards.push(...river.map(c => c.toString()));
          break;
        case 'RIVER':
          newStreet = 'SHOWDOWN';
          // 计算胜负
          break;
      }
      
      // 更新deck
      await prisma.gameState.update({
        where: { id: gameState.id },
        data: {
          deck: deck.serialize()
        }
      });
      
      newCurrentBet = 0;
      nextPlayer = gameState.dealerPosition;
    }

    // AI决策处理（连续执行所有AI决策直到轮到人类玩家）
    let finalPlayers = players;
    let finalPot = newPot;
    let finalCurrentBet = newCurrentBet;
    let finalStreet = newStreet;
    let finalActionOn = nextPlayer;
    let finalCommunityCards = communityCards;
    
    // 连续执行AI决策
    while (finalPlayers[finalActionOn]?.isHuman === false && finalStreet !== 'SHOWDOWN') {
      const aiPlayer = finalPlayers[finalActionOn];
      
      // 使用简单的AI决策逻辑
      let aiAction: PlayerAction = 'check';
      let aiAmount: number | undefined;
      
      const random = Math.random();
      if (finalCurrentBet === 0) {
        // 没有下注时
        if (random < 0.4) {
          aiAction = 'check';
        } else if (random < 0.8) {
          aiAction = 'raise';
          aiAmount = Math.min(gameState.minRaise * 2, aiPlayer.stack);
        } else {
          aiAction = 'fold';
        }
      } else {
        // 有下注时
        if (random < 0.3) {
          aiAction = 'fold';
        } else if (random < 0.7) {
          if (finalCurrentBet <= aiPlayer.stack) {
            aiAction = 'call';
          } else {
            aiAction = 'allin';
          }
        } else {
          if (finalCurrentBet * 2 <= aiPlayer.stack) {
            aiAction = 'raise';
            aiAmount = finalCurrentBet * 2;
          } else if (finalCurrentBet <= aiPlayer.stack) {
            aiAction = 'call';
          } else {
            aiAction = 'allin';
          }
        }
      }
      
      // 执行AI动作
      switch (aiAction) {
        case 'fold':
          aiPlayer.status = 'folded';
          break;
        case 'check':
          break;
        case 'call':
          const callAmount = finalCurrentBet;
          aiPlayer.stack -= callAmount;
          finalPot += callAmount;
          break;
        case 'raise':
          if (aiAmount && aiAmount <= aiPlayer.stack) {
            aiPlayer.stack -= aiAmount;
            finalPot += aiAmount;
            finalCurrentBet = aiAmount;
          } else {
            // Fallback to call if raise is invalid
            const fallbackAmount = finalCurrentBet;
            aiPlayer.stack -= fallbackAmount;
            finalPot += fallbackAmount;
          }
          break;
        case 'allin':
          const allinAmount = aiPlayer.stack;
          finalPot += allinAmount;
          aiPlayer.stack = 0;
          aiPlayer.status = 'allin';
          if (allinAmount > finalCurrentBet) {
            finalCurrentBet = allinAmount;
          }
          break;
      }
      
      // 移动到下一个玩家
      let nextAIPlayer = (finalActionOn + 1) % finalPlayers.length;
      while (finalPlayers[nextAIPlayer].status !== 'active' && nextAIPlayer !== finalActionOn) {
        nextAIPlayer = (nextAIPlayer + 1) % finalPlayers.length;
      }
      
      // 检查是否需要进入下一条街
      if (nextAIPlayer === finalActionOn || finalPlayers.filter((p: any) => p.status === 'active').length <= 1) {
        const deck = Deck.deserialize(gameState.deck);
        
        switch (finalStreet) {
          case 'PREFLOP':
            finalStreet = 'FLOP';
            const flop = deck.deal(3);
            finalCommunityCards.push(...flop.map(c => c.toString()));
            break;
          case 'FLOP':
            finalStreet = 'TURN';
            const turn = deck.deal(1);
            finalCommunityCards.push(...turn.map(c => c.toString()));
            break;
          case 'TURN':
            finalStreet = 'RIVER';
            const river = deck.deal(1);
            finalCommunityCards.push(...river.map(c => c.toString()));
            break;
          case 'RIVER':
            finalStreet = 'SHOWDOWN';
            break;
        }
        
        // 更新deck
        await prisma.gameState.update({
          where: { id: gameState.id },
          data: { deck: deck.serialize() }
        });
        
        finalCurrentBet = 0;
        nextAIPlayer = gameState.dealerPosition;
      }
      
      finalActionOn = nextAIPlayer;
    }

    // 最终更新数据库
    await prisma.gameState.update({
      where: { id: gameState.id },
      data: {
        players: JSON.stringify(finalPlayers),
        pot: finalPot,
        currentBet: finalCurrentBet,
        street: finalStreet,
        actionOn: finalActionOn,
        communityCards: JSON.stringify(finalCommunityCards),
        lastActionAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      gameState: {
        players: finalPlayers,
        communityCards: finalCommunityCards,
        pot: finalPot,
        currentBet: finalCurrentBet,
        street: finalStreet,
        actionOn: finalActionOn,
        isComplete: finalStreet === 'SHOWDOWN'
      }
    });

  } catch (error) {
    console.error('Game action error:', error);
    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 }
    );
  }
}