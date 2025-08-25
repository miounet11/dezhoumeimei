import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/unified-auth';
import { PaymentService } from '@/lib/services/payment.service';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { product } = body;

    if (!product || !product.id || !product.price) {
      return NextResponse.json(
        { error: 'Invalid product data' },
        { status: 400 }
      );
    }

    // Create success and cancel URLs
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/payment/cancel`;

    // Create Stripe checkout session
    const checkoutSession = await PaymentService.createStripeCheckout(
      session.user.id,
      {
        ...product,
        currency: product.currency || 'USD'
      },
      successUrl,
      cancelUrl
    );

    return NextResponse.json({
      success: true,
      sessionId: checkoutSession.sessionId,
      url: checkoutSession.url
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}