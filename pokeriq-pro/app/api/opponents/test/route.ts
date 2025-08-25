import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET() {
  try {
    const opponents = await prisma.opponent.findMany();
    return NextResponse.json({ 
      success: true,
      count: opponents.length,
      opponents 
    });
  } catch (error) {
    console.error('Test route error:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}