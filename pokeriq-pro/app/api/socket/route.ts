import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'WebSocket服务运行在独立端口3001',
    status: 'Socket.IO需要独立的服务器进程',
    instructions: '请运行 npm run socket-server 启动WebSocket服务'
  });
}