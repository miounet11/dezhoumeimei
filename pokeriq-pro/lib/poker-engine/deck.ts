import { Card, Suit, Rank } from './card';

export class Deck {
  private cards: Card[] = [];
  private dealtCards: Card[] = [];

  constructor(shuffled = true) {
    this.reset();
    if (shuffled) {
      this.shuffle();
    }
  }

  reset(): void {
    this.cards = [];
    this.dealtCards = [];
    
    const suits: Suit[] = ['h', 'd', 'c', 's'];
    const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    
    for (const suit of suits) {
      for (const rank of ranks) {
        this.cards.push(new Card(`${rank}${suit}`));
      }
    }
  }

  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  deal(count = 1): Card[] {
    if (this.cards.length < count) {
      throw new Error(`Not enough cards in deck. Requested: ${count}, Available: ${this.cards.length}`);
    }
    
    const dealt: Card[] = [];
    for (let i = 0; i < count; i++) {
      const card = this.cards.pop()!;
      this.dealtCards.push(card);
      dealt.push(card);
    }
    
    return dealt;
  }

  dealOne(): Card {
    return this.deal(1)[0];
  }

  cardsRemaining(): number {
    return this.cards.length;
  }

  getDealtCards(): Card[] {
    return [...this.dealtCards];
  }

  removeSpecificCards(cards: Card[]): void {
    for (const cardToRemove of cards) {
      const index = this.cards.findIndex(card => card.equals(cardToRemove));
      if (index !== -1) {
        this.cards.splice(index, 1);
        this.dealtCards.push(cardToRemove);
      }
    }
  }

  serialize(): string {
    return this.cards.map(card => card.toString()).join(',');
  }

  static deserialize(serialized: string, dealtCardsString?: string): Deck {
    const deck = new Deck(false);
    deck.cards = [];
    
    if (serialized) {
      const cardStrings = serialized.split(',');
      for (const cardString of cardStrings) {
        if (cardString) {
          deck.cards.push(new Card(cardString));
        }
      }
    }
    
    if (dealtCardsString) {
      const dealtCardStrings = dealtCardsString.split(',');
      for (const cardString of dealtCardStrings) {
        if (cardString) {
          deck.dealtCards.push(new Card(cardString));
        }
      }
    }
    
    return deck;
  }
}