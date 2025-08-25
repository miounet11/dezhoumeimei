export type Suit = 'h' | 'd' | 'c' | 's';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';

export class Card {
  readonly suit: Suit;
  readonly rank: Rank;
  readonly value: number;

  private static readonly RANK_VALUES: Record<Rank, number> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
  };

  private static readonly SUIT_SYMBOLS: Record<Suit, string> = {
    'h': '♥', 'd': '♦', 'c': '♣', 's': '♠'
  };

  private static readonly SUIT_NAMES: Record<Suit, string> = {
    'h': 'Hearts', 'd': 'Diamonds', 'c': 'Clubs', 's': 'Spades'
  };

  constructor(cardString: string) {
    if (cardString.length !== 2) {
      throw new Error(`Invalid card string: ${cardString}`);
    }
    
    const rank = cardString[0] as Rank;
    const suit = cardString[1] as Suit;
    
    if (!Card.RANK_VALUES[rank]) {
      throw new Error(`Invalid rank: ${rank}`);
    }
    
    if (!Card.SUIT_SYMBOLS[suit]) {
      throw new Error(`Invalid suit: ${suit}`);
    }
    
    this.rank = rank;
    this.suit = suit;
    this.value = Card.RANK_VALUES[rank];
  }

  toString(): string {
    return `${this.rank}${this.suit}`;
  }

  toSymbol(): string {
    return `${this.rank}${Card.SUIT_SYMBOLS[this.suit]}`;
  }

  getSuitName(): string {
    return Card.SUIT_NAMES[this.suit];
  }

  getSuitSymbol(): string {
    return Card.SUIT_SYMBOLS[this.suit];
  }

  equals(other: Card): boolean {
    return this.rank === other.rank && this.suit === other.suit;
  }

  compareTo(other: Card): number {
    if (this.value !== other.value) {
      return this.value - other.value;
    }
    return this.suit.localeCompare(other.suit);
  }

  static fromString(cardString: string): Card {
    return new Card(cardString);
  }

  static compare(a: Card, b: Card): number {
    return a.compareTo(b);
  }
}