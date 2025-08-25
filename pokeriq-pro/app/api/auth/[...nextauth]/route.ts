import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/unified-auth';

// 使用统一的认证配置
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };