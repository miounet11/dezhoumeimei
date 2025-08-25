'use client';

import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '@/lib/auth/auth-context';
import { CompanionProvider } from '@/components/layout/CompanionProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <CompanionProvider>
          {children}
        </CompanionProvider>
      </AuthProvider>
    </SessionProvider>
  );
}