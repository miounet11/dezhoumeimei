import React from 'react';
import Link from 'next/link';
import { Typography } from 'antd';

const { Text } = Typography;

interface LogoProps {
  collapsed: boolean;
}

// Server Component - 静态logo组件
export default function Logo({ collapsed }: LogoProps) {
  return (
    <div
      style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {!collapsed ? (
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24 }}>🃏</span>
          <Text strong style={{ color: '#fff', fontSize: 18 }}>
            PokerIQ Pro
          </Text>
        </Link>
      ) : (
        <Link href="/dashboard">
          <span style={{ fontSize: 24 }}>🃏</span>
        </Link>
      )}
    </div>
  );
}