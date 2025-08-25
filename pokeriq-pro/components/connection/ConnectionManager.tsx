'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button, message, Modal } from 'antd';
import { 
  WifiOutlined, 
  DisconnectOutlined, 
  LoadingOutlined,
  WarningOutlined 
} from '@ant-design/icons';

// 连接状态类型
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

// 连接管理Hook
export function useConnectionManager(socket: any, autoReconnect = true) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [lastConnected, setLastConnected] = useState<Date | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [networkOnline, setNetworkOnline] = useState(navigator.onLine);
  
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 10;
  const reconnectDelays = [1000, 2000, 4000, 8000, 16000, 32000]; // 指数退避
  
  // 网络状态监听
  useEffect(() => {
    const handleOnline = () => {
      setNetworkOnline(true);
      if (autoReconnect && socket && !socket.connected) {
        reconnectSocket();
      }
    };
    
    const handleOffline = () => {
      setNetworkOnline(false);
      setStatus('disconnected');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [socket, autoReconnect]);

  // Socket事件监听
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      setStatus('connected');
      setLastConnected(new Date());
      setReconnectAttempts(0);
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    const handleDisconnect = (reason: string) => {
      setStatus('disconnected');
      console.log('Socket断开连接:', reason);
      
      // 只在非手动断开时自动重连
      if (autoReconnect && reason !== 'io client disconnect' && networkOnline) {
        scheduleReconnect();
      }
    };

    const handleConnectError = (error: Error) => {
      setStatus('error');
      console.error('Socket连接错误:', error);
      
      if (autoReconnect && networkOnline) {
        scheduleReconnect();
      }
    };

    const handleReconnect = () => {
      setStatus('connected');
      setReconnectAttempts(0);
      message.success('重新连接成功！');
    };

    const handleReconnectAttempt = (attemptNumber: number) => {
      setStatus('reconnecting');
      setReconnectAttempts(attemptNumber);
    };

    const handleReconnectError = (error: Error) => {
      console.error('重连失败:', error);
    };

    const handleReconnectFailed = () => {
      setStatus('error');
      message.error('重连失败，请检查网络连接');
    };

    // 注册事件监听器
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('reconnect', handleReconnect);
    socket.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('reconnect_error', handleReconnectError);
    socket.on('reconnect_failed', handleReconnectFailed);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('reconnect', handleReconnect);
      socket.off('reconnect_attempt', handleReconnectAttempt);
      socket.off('reconnect_error', handleReconnectError);
      socket.off('reconnect_failed', handleReconnectFailed);
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [socket, autoReconnect, networkOnline]);

  // 计划重连
  const scheduleReconnect = useCallback(() => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      setStatus('error');
      return;
    }

    const delayIndex = Math.min(reconnectAttempts, reconnectDelays.length - 1);
    const delay = reconnectDelays[delayIndex];

    setStatus('reconnecting');
    
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectSocket();
    }, delay);
  }, [reconnectAttempts]);

  // 手动重连
  const reconnectSocket = useCallback(() => {
    if (!socket || !networkOnline) return;
    
    setStatus('reconnecting');
    socket.connect();
  }, [socket, networkOnline]);

  // 手动断开连接
  const disconnectSocket = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setStatus('disconnected');
    }
  }, [socket]);

  return {
    status,
    lastConnected,
    reconnectAttempts,
    networkOnline,
    reconnectSocket,
    disconnectSocket,
  };
}

// 连接状态指示器组件
interface ConnectionIndicatorProps {
  status: ConnectionStatus;
  lastConnected: Date | null;
  reconnectAttempts: number;
  onReconnect?: () => void;
  className?: string;
}

export function ConnectionIndicator({ 
  status, 
  lastConnected, 
  reconnectAttempts,
  onReconnect,
  className = ''
}: ConnectionIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: <WifiOutlined className="text-green-500" />,
          text: '已连接',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
        };
      case 'connecting':
      case 'reconnecting':
        return {
          icon: <LoadingOutlined className="text-yellow-500" spin />,
          text: status === 'connecting' ? '连接中...' : `重连中... (${reconnectAttempts})`,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
        };
      case 'disconnected':
        return {
          icon: <DisconnectOutlined className="text-gray-500" />,
          text: '未连接',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
        };
      case 'error':
        return {
          icon: <WarningOutlined className="text-red-500" />,
          text: '连接错误',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
        };
      default:
        return {
          icon: <DisconnectOutlined className="text-gray-500" />,
          text: '未知状态',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${config.bgColor} ${className}`}>
      {config.icon}
      <span className={`text-sm font-medium ${config.color}`}>
        {config.text}
      </span>
      {(status === 'disconnected' || status === 'error') && onReconnect && (
        <Button 
          size="small" 
          type="link" 
          onClick={onReconnect}
          className="p-0 h-auto"
        >
          重连
        </Button>
      )}
      {lastConnected && status === 'connected' && (
        <span className="text-xs text-gray-500">
          {lastConnected.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}

// 连接状态模态框组件
interface ConnectionModalProps {
  visible: boolean;
  status: ConnectionStatus;
  reconnectAttempts: number;
  onReconnect: () => void;
  onClose: () => void;
}

export function ConnectionModal({
  visible,
  status,
  reconnectAttempts,
  onReconnect,
  onClose
}: ConnectionModalProps) {
  const isError = status === 'error' || status === 'disconnected';
  
  return (
    <Modal
      open={visible}
      title="连接状态"
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
        ...(isError ? [
          <Button key="reconnect" type="primary" onClick={onReconnect}>
            重新连接
          </Button>
        ] : []),
      ]}
    >
      <div className="text-center py-4">
        <ConnectionIndicator
          status={status}
          lastConnected={null}
          reconnectAttempts={reconnectAttempts}
          className="justify-center mb-4"
        />
        
        {status === 'error' && (
          <div className="text-gray-600">
            <p>连接服务器时遇到问题。</p>
            <p className="mt-2 text-sm">请检查网络连接并重试。</p>
          </div>
        )}
        
        {status === 'reconnecting' && (
          <div className="text-gray-600">
            <p>正在尝试重新连接...</p>
            <p className="mt-2 text-sm">第 {reconnectAttempts} 次尝试</p>
          </div>
        )}
        
        {status === 'connected' && (
          <div className="text-green-600">
            <p>连接正常！</p>
          </div>
        )}
      </div>
    </Modal>
  );
}

// 网络状态提示组件
export function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(false);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // 初始检查
    if (!navigator.onLine) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner || isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white text-center py-2">
      <div className="flex items-center justify-center space-x-2">
        <WarningOutlined />
        <span>网络连接已断开，请检查网络设置</span>
      </div>
    </div>
  );
}