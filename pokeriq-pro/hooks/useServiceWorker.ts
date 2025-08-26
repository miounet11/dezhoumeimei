'use client';

import { useEffect, useState, useCallback } from 'react';

/**
 * Service Worker registration states
 */
export enum ServiceWorkerState {
  Idle = 'idle',
  Installing = 'installing',
  Waiting = 'waiting',
  Active = 'active',
  Error = 'error',
  NotSupported = 'not-supported'
}

/**
 * Service Worker hook configuration
 */
interface ServiceWorkerConfig {
  swPath?: string;
  scope?: string;
  enableNotifications?: boolean;
  enableBackgroundSync?: boolean;
  enablePeriodicSync?: boolean;
  onInstall?: () => void;
  onActivate?: () => void;
  onUpdate?: () => void;
  onError?: (error: Error) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

/**
 * Service Worker hook return type
 */
interface ServiceWorkerHook {
  state: ServiceWorkerState;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  cacheStatus: Record<string, number>;
  registration: ServiceWorkerRegistration | null;
  updateApp: () => Promise<void>;
  clearCache: () => Promise<void>;
  sendMessage: (type: string, payload?: any) => Promise<any>;
  requestNotificationPermission: () => Promise<NotificationPermission>;
  subscribeToNotifications: () => Promise<PushSubscription | null>;
  registerBackgroundSync: (tag: string) => Promise<void>;
}

/**
 * Custom hook for Service Worker integration with React
 * Provides comprehensive PWA functionality and cache management
 */
export function useServiceWorker(config: ServiceWorkerConfig = {}): ServiceWorkerHook {
  const {
    swPath = '/sw.js',
    scope = '/',
    enableNotifications = false,
    enableBackgroundSync = false,
    enablePeriodicSync = false,
    onInstall,
    onActivate,
    onUpdate,
    onError,
    onOffline,
    onOnline
  } = config;

  const [state, setState] = useState<ServiceWorkerState>(
    typeof navigator !== 'undefined' && 'serviceWorker' in navigator
      ? ServiceWorkerState.Idle
      : ServiceWorkerState.NotSupported
  );
  
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<Record<string, number>>({});
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  /**
   * Send message to service worker
   */
  const sendMessage = useCallback(async (type: string, payload?: any): Promise<any> => {
    if (!registration?.active) {
      throw new Error('No active service worker');
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve(event.data);
        }
      };

      registration.active.postMessage(
        { type, payload },
        [messageChannel.port2]
      );
    });
  }, [registration]);

  /**
   * Update the app with new service worker
   */
  const updateApp = useCallback(async () => {
    if (!registration) return;

    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    await registration.update();
    window.location.reload();
  }, [registration]);

  /**
   * Clear all caches
   */
  const clearCache = useCallback(async () => {
    try {
      await sendMessage('CLEAR_CACHE');
      console.log('All caches cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw error;
    }
  }, [sendMessage]);

  /**
   * Request notification permission
   */
  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    const permission = await Notification.requestPermission();
    return permission;
  }, []);

  /**
   * Subscribe to push notifications
   */
  const subscribeToNotifications = useCallback(async (): Promise<PushSubscription | null> => {
    if (!registration || !enableNotifications) {
      return null;
    }

    try {
      const permission = await requestNotificationPermission();
      if (permission !== 'granted') {
        return null;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      });

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error);
      return null;
    }
  }, [registration, enableNotifications, requestNotificationPermission]);

  /**
   * Register background sync
   */
  const registerBackgroundSync = useCallback(async (tag: string) => {
    if (!registration || !enableBackgroundSync || !('sync' in window.ServiceWorkerRegistration.prototype)) {
      throw new Error('Background sync not supported or enabled');
    }

    try {
      await registration.sync.register(tag);
      console.log(`Background sync registered: ${tag}`);
    } catch (error) {
      console.error('Failed to register background sync:', error);
      throw error;
    }
  }, [registration, enableBackgroundSync]);

  /**
   * Update cache status
   */
  const updateCacheStatus = useCallback(async () => {
    try {
      const status = await sendMessage('GET_CACHE_STATUS');
      setCacheStatus(status);
    } catch (error) {
      console.error('Failed to get cache status:', error);
    }
  }, [sendMessage]);

  /**
   * Register service worker
   */
  const registerServiceWorker = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      setState(ServiceWorkerState.NotSupported);
      return;
    }

    try {
      setState(ServiceWorkerState.Installing);

      const registration = await navigator.serviceWorker.register(swPath, { scope });
      setRegistration(registration);

      // Handle different registration states
      if (registration.installing) {
        setState(ServiceWorkerState.Installing);
        registration.installing.addEventListener('statechange', (event) => {
          const sw = event.target as ServiceWorker;
          if (sw.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // Update available
              setIsUpdateAvailable(true);
              onUpdate?.();
            } else {
              // First install
              setState(ServiceWorkerState.Active);
              onInstall?.();
            }
          }
        });
      } else if (registration.waiting) {
        setState(ServiceWorkerState.Waiting);
        setIsUpdateAvailable(true);
        onUpdate?.();
      } else if (registration.active) {
        setState(ServiceWorkerState.Active);
        onActivate?.();
      }

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setIsUpdateAvailable(true);
              onUpdate?.();
            }
          });
        }
      });

      // Register periodic sync if supported and enabled
      if (enablePeriodicSync && 'serviceWorker' in navigator && 'periodicSync' in window.ServiceWorkerRegistration.prototype) {
        try {
          const status = await navigator.permissions.query({ name: 'periodic-background-sync' as PermissionName });
          if (status.state === 'granted') {
            await registration.periodicSync?.register('update-cache', {
              minInterval: 24 * 60 * 60 * 1000, // 24 hours
            });
            console.log('Periodic sync registered');
          }
        } catch (error) {
          console.warn('Periodic sync registration failed:', error);
        }
      }

    } catch (error) {
      setState(ServiceWorkerState.Error);
      onError?.(error as Error);
      console.error('Service worker registration failed:', error);
    }
  }, [swPath, scope, enablePeriodicSync, onInstall, onActivate, onUpdate, onError]);

  // Initialize service worker
  useEffect(() => {
    if (typeof window !== 'undefined') {
      registerServiceWorker();
    }
  }, [registerServiceWorker]);

  // Handle online/offline events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      onOnline?.();
    };

    const handleOffline = () => {
      setIsOnline(false);
      onOffline?.();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onOnline, onOffline]);

  // Update cache status periodically
  useEffect(() => {
    if (state === ServiceWorkerState.Active) {
      updateCacheStatus();
      
      // Update cache status every 5 minutes
      const interval = setInterval(updateCacheStatus, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [state, updateCacheStatus]);

  // Handle service worker messages
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data;
      
      switch (type) {
        case 'CACHE_UPDATED':
          updateCacheStatus();
          break;
        case 'UPDATE_AVAILABLE':
          setIsUpdateAvailable(true);
          onUpdate?.();
          break;
        default:
          console.log('Unknown message from service worker:', type, payload);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [onUpdate, updateCacheStatus]);

  return {
    state,
    isOnline,
    isUpdateAvailable,
    cacheStatus,
    registration,
    updateApp,
    clearCache,
    sendMessage,
    requestNotificationPermission,
    subscribeToNotifications,
    registerBackgroundSync,
  };
}

/**
 * Service Worker Provider component for React context
 */
import React, { createContext, useContext, ReactNode } from 'react';

interface ServiceWorkerContextType extends ServiceWorkerHook {}

const ServiceWorkerContext = createContext<ServiceWorkerContextType | null>(null);

interface ServiceWorkerProviderProps {
  children: ReactNode;
  config?: ServiceWorkerConfig;
}

export function ServiceWorkerProvider({ children, config }: ServiceWorkerProviderProps) {
  const serviceWorker = useServiceWorker(config);

  return (
    <ServiceWorkerContext.Provider value={serviceWorker}>
      {children}
    </ServiceWorkerContext.Provider>
  );
}

/**
 * Hook to use service worker context
 */
export function useServiceWorkerContext(): ServiceWorkerContextType {
  const context = useContext(ServiceWorkerContext);
  if (!context) {
    throw new Error('useServiceWorkerContext must be used within a ServiceWorkerProvider');
  }
  return context;
}

/**
 * Service Worker notification component
 */
interface ServiceWorkerNotificationProps {
  onUpdate?: () => void;
  onOffline?: () => void;
}

export function ServiceWorkerNotification({ onUpdate, onOffline }: ServiceWorkerNotificationProps) {
  const { isUpdateAvailable, isOnline, updateApp } = useServiceWorkerContext();

  if (isUpdateAvailable) {
    return (
      <div className="fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg z-50">
        <p className="mb-2">A new version is available!</p>
        <button
          onClick={() => {
            updateApp();
            onUpdate?.();
          }}
          className="bg-white text-blue-500 px-4 py-2 rounded mr-2"
        >
          Update
        </button>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 right-4 bg-orange-500 text-white p-4 rounded-lg shadow-lg z-50">
        <p>You're offline. Some features may be limited.</p>
        {onOffline && (
          <button
            onClick={onOffline}
            className="bg-white text-orange-500 px-4 py-2 rounded mt-2"
          >
            OK
          </button>
        )}
      </div>
    );
  }

  return null;
}