import Stripe from 'stripe';
import prisma from '@/lib/db/prisma';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

export interface PaymentProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  type: 'companion' | 'coins' | 'diamonds' | 'vip' | 'outfit';
  metadata?: any;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export class PaymentService {
  // Create Stripe checkout session
  static async createStripeCheckout(
    userId: string,
    product: PaymentProduct,
    successUrl: string,
    cancelUrl: string
  ): Promise<{ sessionId: string; url: string }> {
    try {
      // Create transaction record
      const transaction = await prisma.transaction.create({
        data: {
          userId,
          type: 'purchase',
          amount: product.price,
          currency: product.currency,
          itemType: product.type,
          itemId: product.id,
          status: 'pending',
          paymentMethod: 'stripe',
        }
      });

      // Create Stripe session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card', 'alipay', 'wechat_pay'],
        line_items: [
          {
            price_data: {
              currency: product.currency.toLowerCase(),
              product_data: {
                name: product.name,
                description: product.description,
                metadata: {
                  type: product.type,
                  productId: product.id,
                }
              },
              unit_amount: Math.round(product.price * 100), // Convert to cents
            },
            quantity: 1,
          }
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId,
          transactionId: transaction.id,
          productId: product.id,
          productType: product.type,
        },
        customer_email: await this.getUserEmail(userId),
      });

      // Update transaction with Stripe session ID
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { transactionId: session.id }
      });

      return {
        sessionId: session.id,
        url: session.url || ''
      };
    } catch (error) {
      console.error('Stripe checkout error:', error);
      throw new Error('Failed to create payment session');
    }
  }

  // Handle Stripe webhook
  static async handleStripeWebhook(
    signature: string,
    payload: string
  ): Promise<PaymentResult> {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );

      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object as Stripe.Checkout.Session;
          return await this.handlePaymentSuccess(session);
        
        case 'checkout.session.expired':
        case 'checkout.session.async_payment_failed':
          const failedSession = event.data.object as Stripe.Checkout.Session;
          return await this.handlePaymentFailure(failedSession);
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Webhook error:', error);
      return { 
        success: false, 
        error: 'Webhook processing failed' 
      };
    }
  }

  // Process successful payment
  private static async handlePaymentSuccess(
    session: Stripe.Checkout.Session
  ): Promise<PaymentResult> {
    const { userId, transactionId, productId, productType } = session.metadata || {};
    
    if (!userId || !transactionId) {
      return { 
        success: false, 
        error: 'Missing metadata' 
      };
    }

    try {
      // Update transaction status
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'completed',
          completedAt: new Date()
        }
      });

      // Process the purchase based on type
      switch (productType) {
        case 'companion':
          await this.unlockCompanion(userId, productId!);
          break;
        
        case 'coins':
          await this.addCoins(userId, session.amount_total! / 100);
          break;
        
        case 'diamonds':
          await this.addDiamonds(userId, session.amount_total! / 100);
          break;
        
        case 'vip':
          await this.activateVIP(userId, productId!);
          break;
        
        case 'outfit':
          await this.unlockOutfit(userId, productId!);
          break;
      }

      return { 
        success: true, 
        transactionId 
      };
    } catch (error) {
      console.error('Payment processing error:', error);
      return { 
        success: false, 
        error: 'Failed to process payment' 
      };
    }
  }

  // Handle failed payment
  private static async handlePaymentFailure(
    session: Stripe.Checkout.Session
  ): Promise<PaymentResult> {
    const { transactionId } = session.metadata || {};
    
    if (transactionId) {
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'failed' }
      });
    }

    return { 
      success: false, 
      error: 'Payment failed' 
    };
  }

  // Helper: Get user email
  private static async getUserEmail(userId: string): Promise<string | undefined> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });
    return user?.email;
  }

  // Helper: Unlock companion
  private static async unlockCompanion(userId: string, companionId: string): Promise<void> {
    const companion = await prisma.aICompanion.findUnique({
      where: { id: companionId }
    });

    if (!companion) {
      throw new Error('Companion not found');
    }

    // Create user-companion relationship
    await prisma.userCompanion.create({
      data: {
        userId,
        companionId,
        relationshipLevel: 1,
        intimacyPoints: 0,
        totalInteractions: 0,
        currentMood: 'happy',
        isPrimary: false
      }
    });

    // Create welcome memory
    await prisma.companionMemory.create({
      data: {
        userCompanionId: userId,
        memoryType: 'milestone',
        title: 'Purchase Complete',
        description: `You welcomed ${companion.name} into your life`,
        importance: 8
      }
    });
  }

  // Helper: Add wisdom coins
  private static async addCoins(userId: string, amount: number): Promise<void> {
    const coinAmount = Math.floor(amount * 100); // Convert price to coins
    
    await prisma.wisdomCoin.upsert({
      where: { userId },
      update: {
        balance: { increment: coinAmount },
        totalEarned: { increment: coinAmount }
      },
      create: {
        userId,
        balance: coinAmount,
        totalEarned: coinAmount,
        totalSpent: 0
      }
    });

    // Record coin transaction
    await prisma.coinTransaction.create({
      data: {
        userId,
        amount: coinAmount,
        transactionType: 'purchase',
        description: `Purchased ${coinAmount} wisdom coins`
      }
    });
  }

  // Helper: Add diamonds
  private static async addDiamonds(userId: string, amount: number): Promise<void> {
    const diamondAmount = Math.floor(amount * 10); // Convert price to diamonds
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        diamonds: { increment: diamondAmount }
      }
    });
  }

  // Helper: Activate VIP
  private static async activateVIP(userId: string, packageId: string): Promise<void> {
    const vipDays = packageId === 'vip_month' ? 30 : packageId === 'vip_year' ? 365 : 7;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + vipDays);

    await prisma.user.update({
      where: { id: userId },
      data: {
        vipLevel: 1,
        vipExpiry: expiryDate
      }
    });
  }

  // Helper: Unlock outfit
  private static async unlockOutfit(userId: string, outfitId: string): Promise<void> {
    const outfit = await prisma.companionOutfit.findUnique({
      where: { id: outfitId }
    });

    if (!outfit) {
      throw new Error('Outfit not found');
    }

    // Find user's companion for this outfit
    const userCompanion = await prisma.userCompanion.findFirst({
      where: {
        userId,
        companionId: outfit.companionId
      }
    });

    if (!userCompanion) {
      throw new Error('You don\'t own this companion');
    }

    // Add outfit to unlocked list
    await prisma.userCompanion.update({
      where: { id: userCompanion.id },
      data: {
        unlockedOutfits: {
          push: outfitId
        }
      }
    });
  }

  // Get user's purchase history
  static async getPurchaseHistory(userId: string): Promise<any[]> {
    return await prisma.transaction.findMany({
      where: {
        userId,
        type: 'purchase',
        status: 'completed'
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  // Check VIP status
  static async checkVIPStatus(userId: string): Promise<{
    isVIP: boolean;
    level: number;
    expiryDate?: Date;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        vipLevel: true,
        vipExpiry: true
      }
    });

    if (!user || !user.vipExpiry) {
      return { isVIP: false, level: 0 };
    }

    const isActive = user.vipExpiry > new Date();
    
    if (!isActive) {
      // VIP expired, reset
      await prisma.user.update({
        where: { id: userId },
        data: {
          vipLevel: 0,
          vipExpiry: null
        }
      });
      return { isVIP: false, level: 0 };
    }

    return {
      isVIP: true,
      level: user.vipLevel,
      expiryDate: user.vipExpiry
    };
  }
}