import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);
  
  if (authResult.authenticated) {
    return NextResponse.json({
      authenticated: true,
      user: authResult.user
    });
  }
  
  return NextResponse.json({
    authenticated: false,
    error: authResult.error
  }, { status: 401 });
}