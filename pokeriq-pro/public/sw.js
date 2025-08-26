/**
 * Advanced Service Worker for PokerIQ Pro
 * Provides intelligent caching, offline support, and performance optimization
 */

const CACHE_NAME = 'pokeriq-pro-v1.1.0';
const DYNAMIC_CACHE = 'pokeriq-pro-dynamic-v1.1.0';
const STATIC_CACHE = 'pokeriq-pro-static-v1.1.0';
const API_CACHE = 'pokeriq-pro-api-v1.1.0';
const IMAGE_CACHE = 'pokeriq-pro-images-v1.1.0';

// Cache strategies configuration
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/_next/static/css/',
  '/_next/static/chunks/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// API endpoints to cache with different strategies
const API_CACHE_CONFIG = {
  '/api/user/profile': { strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE, maxAge: 300000 }, // 5 minutes
  '/api/dashboard/': { strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE, maxAge: 600000 }, // 10 minutes
  '/api/courses': { strategy: CACHE_STRATEGIES.CACHE_FIRST, maxAge: 3600000 }, // 1 hour
  '/api/assessments': { strategy: CACHE_STRATEGIES.NETWORK_FIRST, maxAge: 300000 }, // 5 minutes
  '/api/achievements': { strategy: CACHE_STRATEGIES.CACHE_FIRST, maxAge: 1800000 }, // 30 minutes
  '/api/leaderboard': { strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE, maxAge: 300000 }, // 5 minutes
};

// Cache size limits
const CACHE_LIMITS = {
  [DYNAMIC_CACHE]: 50,
  [API_CACHE]: 100,
  [IMAGE_CACHE]: 200
};

// Utility functions
const isStaticAsset = (url) => {
  return url.includes('/_next/static/') || 
         url.includes('.css') || 
         url.includes('.js') || 
         url.includes('.woff') ||
         url.includes('.woff2');
};

const isApiRequest = (url) => {
  return url.includes('/api/');
};

const isImageRequest = (url) => {
  return url.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)$/i) ||
         url.includes('/_next/image');
};

const isNavigationRequest = (request) => {
  return request.mode === 'navigate';
};

// Cache management utilities
const limitCacheSize = async (cacheName, maxItems) => {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxItems) {
    const keysToDelete = keys.slice(0, keys.length - maxItems);
    await Promise.all(keysToDelete.map(key => cache.delete(key)));
  }
};

const cleanupExpiredCaches = async () => {
  const cacheNames = await caches.keys();
  const currentCaches = [CACHE_NAME, DYNAMIC_CACHE, STATIC_CACHE, API_CACHE, IMAGE_CACHE];
  
  const expiredCaches = cacheNames.filter(name => !currentCaches.includes(name));
  
  await Promise.all(
    expiredCaches.map(cacheName => caches.delete(cacheName))
  );
};

// Caching strategies implementation
const cacheFirst = async (request, cacheName = DYNAMIC_CACHE) => {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.warn('Cache First: Network request failed', error);
    throw error;
  }
};

const networkFirst = async (request, cacheName = DYNAMIC_CACHE) => {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.warn('Network First: Network request failed, trying cache', error);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
};

const staleWhileRevalidate = async (request, cacheName = DYNAMIC_CACHE) => {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Fetch from network in background
  const networkResponsePromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(error => {
    console.warn('Stale While Revalidate: Background fetch failed', error);
  });
  
  // Return cached version immediately if available
  return cachedResponse || networkResponsePromise;
};

// Get appropriate caching strategy for API requests
const getApiCacheStrategy = (url) => {
  for (const [pattern, config] of Object.entries(API_CACHE_CONFIG)) {
    if (url.includes(pattern)) {
      return config;
    }
  }
  return { strategy: CACHE_STRATEGIES.NETWORK_FIRST, maxAge: 300000 };
};

// Main request handler
const handleRequest = async (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    return fetch(request);
  }
  
  // Handle different types of requests
  if (isStaticAsset(url.href)) {
    return cacheFirst(request, STATIC_CACHE);
  }
  
  if (isImageRequest(url.href)) {
    const response = await cacheFirst(request, IMAGE_CACHE);
    // Cleanup image cache if it gets too large
    limitCacheSize(IMAGE_CACHE, CACHE_LIMITS[IMAGE_CACHE]);
    return response;
  }
  
  if (isApiRequest(url.href)) {
    const config = getApiCacheStrategy(url.href);
    
    switch (config.strategy) {
      case CACHE_STRATEGIES.CACHE_FIRST:
        return cacheFirst(request, API_CACHE);
      case CACHE_STRATEGIES.NETWORK_FIRST:
        return networkFirst(request, API_CACHE);
      case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
        return staleWhileRevalidate(request, API_CACHE);
      default:
        return networkFirst(request, API_CACHE);
    }
  }
  
  // Handle navigation requests (page requests)
  if (isNavigationRequest(request)) {
    try {
      const networkResponse = await fetch(request);
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    } catch (error) {
      console.warn('Navigation request failed, trying cache', error);
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Return offline page if available
      const offlinePage = await caches.match('/offline');
      if (offlinePage) {
        return offlinePage;
      }
      
      throw error;
    }
  }
  
  // Default to network first for other requests
  return networkFirst(request, DYNAMIC_CACHE);
};

// Service Worker Event Listeners

// Install event
self.addEventListener('install', (event) => {
  console.log('PokerIQ Pro Service Worker installing...');
  
  event.waitUntil(
    (async () => {
      const staticCache = await caches.open(STATIC_CACHE);
      
      // Cache static assets
      try {
        await staticCache.addAll(STATIC_ASSETS.filter(asset => 
          !asset.includes('/_next/static/') // Skip dynamic static assets for now
        ));
      } catch (error) {
        console.warn('Failed to cache some static assets:', error);
      }
      
      // Skip waiting to activate immediately
      self.skipWaiting();
    })()
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('PokerIQ Pro Service Worker activating...');
  
  event.waitUntil(
    (async () => {
      // Clean up old caches
      await cleanupExpiredCaches();
      
      // Take control of all pages immediately
      self.clients.claim();
    })()
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  // Only handle requests from the same origin
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(handleRequest(event));
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
    event.waitUntil(
      // Handle offline actions when connection is restored
      handleBackgroundSync()
    );
  }
});

const handleBackgroundSync = async () => {
  // Implement offline action sync here
  // For example, sync user progress, submitted assessments, etc.
  console.log('Handling background sync...');
};

// Push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        data: data.data,
        actions: data.actions || []
      })
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-cache') {
    event.waitUntil(updateCache());
  }
});

const updateCache = async () => {
  // Update critical cached resources
  try {
    const cache = await caches.open(API_CACHE);
    
    // Update user profile
    const profileResponse = await fetch('/api/user/profile');
    if (profileResponse.ok) {
      cache.put('/api/user/profile', profileResponse.clone());
    }
    
    // Update dashboard data
    const dashboardResponse = await fetch('/api/dashboard/analytics');
    if (dashboardResponse.ok) {
      cache.put('/api/dashboard/analytics', dashboardResponse.clone());
    }
  } catch (error) {
    console.warn('Failed to update cache in background:', error);
  }
};

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'GET_CACHE_STATUS':
      getCacheStatus().then(status => {
        event.ports[0].postMessage(status);
      });
      break;
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
    default:
      console.warn('Unknown message type:', type);
  }
});

const getCacheStatus = async () => {
  const cacheNames = await caches.keys();
  const status = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    status[cacheName] = keys.length;
  }
  
  return status;
};

const clearAllCaches = async () => {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
};