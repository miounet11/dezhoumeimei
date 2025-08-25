import { CompanionService } from '@/lib/services/companion.service';
import prisma from '@/lib/db/prisma';

// Mock Prisma
jest.mock('@/lib/db/prisma', () => ({
  __esModule: true,
  default: {
    aICompanion: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    userCompanion: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    wisdomCoin: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    coinTransaction: {
      create: jest.fn(),
    },
    companionMemory: {
      create: jest.fn(),
    },
    intimacyView: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    companionInteraction: {
      create: jest.fn(),
    },
    userInventory: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    giftHistory: {
      create: jest.fn(),
    },
    companionDialogue: {
      findMany: jest.fn(),
    },
    companionRanking: {
      findFirst: jest.fn(),
    },
  },
}));

describe('CompanionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCompanions', () => {
    it('should return all active companions', async () => {
      const mockCompanions = [
        {
          id: '1',
          codeName: 'sakura',
          name: 'Sakura',
          nameLocalized: { zh: '樱花', en: 'Sakura' },
          personality: 'sweet',
          backstory: { zh: 'test', en: 'test' },
          region: 'asia',
          voiceType: 'soft',
          basePrice: 0,
          rarity: 'common',
          tags: ['cute'],
          isActive: true,
        },
      ];

      (prisma.aICompanion.findMany as jest.Mock).mockResolvedValue(mockCompanions);

      const result = await CompanionService.getAllCompanions();

      expect(prisma.aICompanion.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { basePrice: 'asc' },
      });
      expect(result).toEqual(mockCompanions);
    });
  });

  describe('getUserCompanions', () => {
    it('should return user companions with details', async () => {
      const mockUserCompanions = [
        {
          id: '1',
          userId: 'user1',
          companionId: 'comp1',
          relationshipLevel: 10,
          intimacyPoints: 1000,
          totalInteractions: 50,
          lastInteraction: new Date(),
          currentMood: 'happy',
          isPrimary: true,
          companion: {
            id: 'comp1',
            name: 'Sakura',
          },
          interactions: [],
          gifts: [],
          memories: [],
        },
      ];

      (prisma.userCompanion.findMany as jest.Mock).mockResolvedValue(mockUserCompanions);

      const result = await CompanionService.getUserCompanions('user1');

      expect(prisma.userCompanion.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        include: {
          companion: true,
          interactions: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          gifts: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          memories: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
        orderBy: { isPrimary: 'desc' },
      });
      expect(result).toEqual(mockUserCompanions);
    });
  });

  describe('viewIntimacy', () => {
    it('should allow viewing intimacy once per day', async () => {
      const userId = 'user1';
      const companionId = 'comp1';

      (prisma.intimacyView.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.userCompanion.findFirst as jest.Mock).mockResolvedValue({
        id: 'uc1',
        userId,
        companionId,
        relationshipLevel: 50,
        intimacyPoints: 5000,
        companion: { name: 'Sakura' },
      });
      (prisma.intimacyView.create as jest.Mock).mockResolvedValue({});

      const result = await CompanionService.viewIntimacy(userId, companionId);

      expect(result.allowed).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.level).toBe(50);
      expect(result.data?.milestone).toBe('知己');
    });

    it('should prevent viewing intimacy twice in one day', async () => {
      const userId = 'user1';
      const companionId = 'comp1';
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      (prisma.intimacyView.findFirst as jest.Mock).mockResolvedValue({
        id: 'iv1',
        userId,
        companionId,
        viewedAt: new Date(),
      });

      const result = await CompanionService.viewIntimacy(userId, companionId);

      expect(result.allowed).toBe(false);
      expect(result.nextAvailable).toBeDefined();
    });
  });

  describe('unlockCompanion', () => {
    it('should unlock a free companion', async () => {
      const userId = 'user1';
      const companionId = 'comp1';

      (prisma.userCompanion.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.aICompanion.findUnique as jest.Mock).mockResolvedValue({
        id: companionId,
        name: 'Sakura',
        basePrice: 0,
      });
      (prisma.userCompanion.create as jest.Mock).mockResolvedValue({
        id: 'uc1',
        userId,
        companionId,
        relationshipLevel: 1,
        intimacyPoints: 0,
        companion: { id: companionId, name: 'Sakura' },
      });
      (prisma.companionMemory.create as jest.Mock).mockResolvedValue({});

      const result = await CompanionService.unlockCompanion(userId, companionId);

      expect(result).toBeDefined();
      expect(prisma.userCompanion.create).toHaveBeenCalled();
      expect(prisma.companionMemory.create).toHaveBeenCalled();
    });

    it('should deduct coins for premium companion', async () => {
      const userId = 'user1';
      const companionId = 'comp2';

      (prisma.userCompanion.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.aICompanion.findUnique as jest.Mock).mockResolvedValue({
        id: companionId,
        name: 'Luna',
        basePrice: 888,
      });
      (prisma.wisdomCoin.findUnique as jest.Mock).mockResolvedValue({
        userId,
        balance: 1000,
      });
      (prisma.wisdomCoin.update as jest.Mock).mockResolvedValue({});
      (prisma.coinTransaction.create as jest.Mock).mockResolvedValue({});
      (prisma.userCompanion.create as jest.Mock).mockResolvedValue({
        id: 'uc2',
        userId,
        companionId,
        companion: { id: companionId, name: 'Luna' },
      });
      (prisma.companionMemory.create as jest.Mock).mockResolvedValue({});

      const result = await CompanionService.unlockCompanion(userId, companionId);

      expect(prisma.wisdomCoin.update).toHaveBeenCalledWith({
        where: { userId },
        data: {
          balance: { decrement: 888 },
          totalSpent: { increment: 888 },
        },
      });
      expect(prisma.coinTransaction.create).toHaveBeenCalled();
    });

    it('should throw error if insufficient coins', async () => {
      const userId = 'user1';
      const companionId = 'comp3';

      (prisma.userCompanion.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.aICompanion.findUnique as jest.Mock).mockResolvedValue({
        id: companionId,
        name: 'Natasha',
        basePrice: 1288,
      });
      (prisma.wisdomCoin.findUnique as jest.Mock).mockResolvedValue({
        userId,
        balance: 100,
      });

      await expect(
        CompanionService.unlockCompanion(userId, companionId)
      ).rejects.toThrow('Insufficient wisdom coins');
    });
  });
});