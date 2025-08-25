import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: '登出成功'
  });
  
  // 清除认证cookies
  response.cookies.delete('accessToken');
  response.cookies.delete('refreshToken');
  
  return response;
}