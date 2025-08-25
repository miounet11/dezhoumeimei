// 简单的游戏功能测试脚本

async function testGame() {
  console.log('🎮 开始测试游戏功能...\n');

  // 测试卡牌类
  console.log('1. 测试卡牌系统:');
  const { Card } = require('./lib/poker-engine/card');
  const card1 = new Card('Ah');
  const card2 = new Card('Kd');
  console.log(`   - 创建卡牌: ${card1.toSymbol()}, ${card2.toSymbol()}`);
  console.log(`   - 比较大小: A vs K = ${card1.compareTo(card2) > 0 ? 'A胜' : 'K胜'}`);

  // 测试牌堆
  console.log('\n2. 测试牌堆系统:');
  const { Deck } = require('./lib/poker-engine/deck');
  const deck = new Deck(true);
  console.log(`   - 创建牌堆: ${deck.cardsRemaining()}张牌`);
  const hand = deck.deal(2);
  console.log(`   - 发牌: ${hand.map(c => c.toSymbol()).join(', ')}`);
  console.log(`   - 剩余: ${deck.cardsRemaining()}张牌`);

  // 测试手牌评估
  console.log('\n3. 测试手牌评估:');
  const { HandEvaluator } = require('./lib/poker-engine/hand-evaluator');
  const testCards = [
    new Card('Ah'), new Card('Kh'), new Card('Qh'), 
    new Card('Jh'), new Card('Th')
  ];
  const evaluation = HandEvaluator.evaluate(testCards);
  console.log(`   - 测试牌: ${testCards.map(c => c.toSymbol()).join(', ')}`);
  console.log(`   - 评估结果: ${evaluation.rankName}`);

  // 测试AI策略
  console.log('\n4. 测试AI策略:');
  const { AIStrategy } = require('./lib/poker-engine/ai-strategy');
  const ai = new AIStrategy('TAG');
  console.log(`   - AI风格: ${ai.getStyleDescription()}`);
  const context = {
    holeCards: [new Card('Ah'), new Card('Kh')],
    communityCards: [],
    pot: 10,
    currentBet: 2,
    playerStack: 200,
    opponentStack: 200,
    street: 'PREFLOP',
    position: 'IP',
    history: []
  };
  const action = ai.getAction(context);
  console.log(`   - AI决策: ${action.action}${action.amount ? ` $${action.amount}` : ''}`);

  console.log('\n✅ 所有测试完成！');
}

testGame().catch(console.error);