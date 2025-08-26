/**
 * Offline Sync Manager - Local Storage & Cross-Device Continuity
 * Handles offline progress storage and synchronization across devices
 */

import { createLogger } from '@/lib/logger';
import { PlayerProgressData, ProgressAnalytics } from '@/components/player/ProgressTracker';
import { AnalyticsEvent } from './analytics-tracker';
import { EventEmitter } from 'events';

const logger = createLogger('offline-sync');

/**
 * Storage Configuration
 */
export interface StorageConfig {
  maxStorageSize: number; // Maximum storage size in MB
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  syncInterval: number; // Sync interval in milliseconds
  retryAttempts: number;
  retryDelay: number;
}

/**
 * Sync Status Types
 */
export type SyncStatus = 
  | 'idle'
  | 'syncing'
  | 'offline'
  | 'conflict'
  | 'error';

/**
 * Offline Data Structure
 */
export interface OfflineProgressData {
  userId: string;
  courseId: string;
  progress: PlayerProgressData;
  analytics: ProgressAnalytics;
  events: AnalyticsEvent[];
  timestamp: Date;
  version: number;
  deviceId: string;
  lastSyncTime: Date | null;
  pendingChanges: PendingChange[];
}

export interface PendingChange {
  id: string;
  type: 'progress' | 'analytics' | 'event';
  data: any;
  timestamp: Date;
  retryCount: number;
}

/**
 * Sync Conflict Resolution
 */
export interface SyncConflict {
  id: string;
  type: 'progress' | 'analytics';
  localData: any;
  remoteData: any;
  timestamp: Date;
  resolution?: 'local' | 'remote' | 'merge';
}

/**
 * Device Session Info
 */
export interface DeviceSession {
  deviceId: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  userAgent: string;
  lastActiveTime: Date;
  syncVersion: number;
}

/**
 * Offline Sync Manager Class
 */
export class OfflineSyncManager extends EventEmitter {
  private userId: string;
  private courseId: string;
  private deviceId: string;
  private storageKey: string;
  private syncKey: string;
  private config: StorageConfig;
  private syncStatus: SyncStatus = 'idle';
  private syncTimer: NodeJS.Timeout | null = null;
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private retryQueue: PendingChange[] = [];
  private conflictQueue: SyncConflict[] = [];

  constructor(
    userId: string,
    courseId: string,
    config: Partial<StorageConfig> = {}
  ) {
    super();
    
    this.userId = userId;
    this.courseId = courseId;
    this.deviceId = this.generateDeviceId();
    this.storageKey = `offline_progress_${userId}_${courseId}`;
    this.syncKey = `sync_meta_${userId}_${courseId}`;
    
    this.config = {
      maxStorageSize: 50, // 50MB
      compressionEnabled: true,
      encryptionEnabled: false,
      syncInterval: 30000, // 30 seconds
      retryAttempts: 3,
      retryDelay: 5000,
      ...config
    };

    this.initialize();
  }

  /**
   * Initialize offline sync manager
   */
  private initialize(): void {
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.syncStatus = 'idle';
        this.emit('online');
        this.startSync();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.syncStatus = 'offline';
        this.emit('offline');
        this.stopSync();
      });

      // Listen for storage events (cross-tab communication)
      window.addEventListener('storage', (event) => {
        if (event.key === this.storageKey || event.key === this.syncKey) {
          this.handleStorageChange(event);
        }
      });

      // Listen for beforeunload to ensure data is saved
      window.addEventListener('beforeunload', () => {
        this.forceSyncToLocal();
      });
    }

    // Initialize storage structure
    this.initializeStorage();

    // Start sync timer if online
    if (this.isOnline) {
      this.startSync();
    }

    logger.info('Offline sync manager initialized', {
      userId: this.userId,
      courseId: this.courseId,
      deviceId: this.deviceId,
      isOnline: this.isOnline
    });
  }

  /**
   * Save progress data to local storage
   */
  async saveProgressOffline(
    progress: PlayerProgressData,
    analytics: ProgressAnalytics,
    events: AnalyticsEvent[] = []
  ): Promise<void> {
    try {
      const offlineData: OfflineProgressData = {
        userId: this.userId,
        courseId: this.courseId,
        progress,
        analytics,
        events: events.slice(-1000), // Keep last 1000 events
        timestamp: new Date(),
        version: this.getNextVersion(),
        deviceId: this.deviceId,
        lastSyncTime: this.getLastSyncTime(),
        pendingChanges: this.getPendingChanges()
      };

      // Compress data if enabled
      const dataToStore = this.config.compressionEnabled 
        ? await this.compressData(offlineData)
        : JSON.stringify(offlineData);

      // Check storage size
      if (this.getStorageSizeUsed() + dataToStore.length > this.config.maxStorageSize * 1024 * 1024) {
        await this.cleanupOldData();
      }

      // Encrypt data if enabled
      const finalData = this.config.encryptionEnabled
        ? await this.encryptData(dataToStore)
        : dataToStore;

      localStorage.setItem(this.storageKey, finalData);

      this.emit('progress_saved_offline', {
        timestamp: new Date(),
        dataSize: dataToStore.length
      });

      logger.info('Progress saved to offline storage', {
        userId: this.userId,
        courseId: this.courseId,
        dataSize: dataToStore.length
      });

    } catch (error) {
      logger.error('Failed to save progress offline', { error });
      this.emit('offline_save_error', { error });
      throw error;
    }
  }

  /**
   * Load progress data from local storage
   */
  async loadProgressOffline(): Promise<OfflineProgressData | null> {
    try {
      const storedData = localStorage.getItem(this.storageKey);
      if (!storedData) return null;

      // Decrypt data if needed
      const decryptedData = this.config.encryptionEnabled
        ? await this.decryptData(storedData)
        : storedData;

      // Decompress data if needed
      const rawData = this.config.compressionEnabled
        ? await this.decompressData(decryptedData)
        : decryptedData;

      const offlineData = JSON.parse(rawData) as OfflineProgressData;

      // Validate data structure
      if (!this.validateOfflineData(offlineData)) {
        logger.warn('Invalid offline data structure, clearing storage');
        localStorage.removeItem(this.storageKey);
        return null;
      }

      logger.info('Progress loaded from offline storage', {
        userId: this.userId,
        courseId: this.courseId,
        version: offlineData.version,
        lastSync: offlineData.lastSyncTime
      });

      return offlineData;

    } catch (error) {
      logger.error('Failed to load progress from offline storage', { error });
      this.emit('offline_load_error', { error });
      return null;
    }
  }

  /**
   * Sync offline data with server
   */
  async syncWithServer(): Promise<void> {
    if (!this.isOnline || this.syncStatus === 'syncing') {
      return;
    }

    this.syncStatus = 'syncing';
    this.emit('sync_started');

    try {
      const offlineData = await this.loadProgressOffline();
      if (!offlineData) {
        this.syncStatus = 'idle';
        return;
      }

      // Check for conflicts
      const serverData = await this.fetchServerData();
      const conflicts = this.detectConflicts(offlineData, serverData);

      if (conflicts.length > 0) {
        this.syncStatus = 'conflict';
        this.conflictQueue.push(...conflicts);
        this.emit('sync_conflicts', { conflicts });
        return;
      }

      // Upload pending changes
      await this.uploadPendingChanges(offlineData.pendingChanges);

      // Update server with latest data
      await this.uploadProgressData(offlineData);

      // Update local sync metadata
      await this.updateSyncMetadata(new Date());

      this.syncStatus = 'idle';
      this.emit('sync_completed', {
        timestamp: new Date(),
        changesSynced: offlineData.pendingChanges.length
      });

      logger.info('Sync completed successfully', {
        userId: this.userId,
        courseId: this.courseId,
        changesSynced: offlineData.pendingChanges.length
      });

    } catch (error) {
      this.syncStatus = 'error';
      this.handleSyncError(error);
    }
  }

  /**
   * Add pending change to sync queue
   */
  addPendingChange(type: 'progress' | 'analytics' | 'event', data: any): void {
    const change: PendingChange = {
      id: this.generateChangeId(),
      type,
      data,
      timestamp: new Date(),
      retryCount: 0
    };

    this.retryQueue.push(change);

    // Try to sync immediately if online
    if (this.isOnline && this.syncStatus === 'idle') {
      setTimeout(() => this.syncWithServer(), 1000);
    }
  }

  /**
   * Resolve sync conflict
   */
  async resolveConflict(conflictId: string, resolution: 'local' | 'remote' | 'merge'): Promise<void> {
    const conflict = this.conflictQueue.find(c => c.id === conflictId);
    if (!conflict) {
      logger.warn('Conflict not found', { conflictId });
      return;
    }

    try {
      let resolvedData: any;

      switch (resolution) {
        case 'local':
          resolvedData = conflict.localData;
          break;
        case 'remote':
          resolvedData = conflict.remoteData;
          break;
        case 'merge':
          resolvedData = await this.mergeConflictData(conflict);
          break;
      }

      // Apply resolved data
      await this.applyResolvedData(conflict.type, resolvedData);

      // Remove from conflict queue
      this.conflictQueue = this.conflictQueue.filter(c => c.id !== conflictId);

      this.emit('conflict_resolved', {
        conflictId,
        resolution,
        timestamp: new Date()
      });

      // Retry sync
      if (this.conflictQueue.length === 0) {
        this.syncStatus = 'idle';
        setTimeout(() => this.syncWithServer(), 1000);
      }

    } catch (error) {
      logger.error('Failed to resolve conflict', { error, conflictId });
      this.emit('conflict_resolution_error', { error, conflictId });
    }
  }

  /**
   * Get current sync status
   */
  getSyncStatus(): {
    status: SyncStatus;
    lastSyncTime: Date | null;
    pendingChanges: number;
    conflicts: number;
    isOnline: boolean;
  } {
    return {
      status: this.syncStatus,
      lastSyncTime: this.getLastSyncTime(),
      pendingChanges: this.retryQueue.length,
      conflicts: this.conflictQueue.length,
      isOnline: this.isOnline
    };
  }

  /**
   * Force immediate sync to local storage
   */
  forceSyncToLocal(): void {
    // This would be called by ProgressManager before important operations
    this.emit('force_local_sync_requested');
  }

  /**
   * Clear all offline data
   */
  clearOfflineData(): void {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.syncKey);
    this.retryQueue = [];
    this.conflictQueue = [];
    
    this.emit('offline_data_cleared');
    
    logger.info('Offline data cleared', {
      userId: this.userId,
      courseId: this.courseId
    });
  }

  /**
   * Get storage usage statistics
   */
  getStorageStats(): {
    usedSpace: number;
    availableSpace: number;
    usagePercentage: number;
    itemCount: number;
  } {
    const used = this.getStorageSizeUsed();
    const available = this.config.maxStorageSize * 1024 * 1024;
    
    return {
      usedSpace: used,
      availableSpace: available - used,
      usagePercentage: (used / available) * 100,
      itemCount: this.getStoredItemCount()
    };
  }

  /**
   * Cleanup and destroy sync manager
   */
  destroy(): void {
    this.stopSync();
    this.forceSyncToLocal();
    this.removeAllListeners();
    
    logger.info('Offline sync manager destroyed', {
      userId: this.userId,
      courseId: this.courseId
    });
  }

  // ===== PRIVATE METHODS =====

  private generateDeviceId(): string {
    const stored = localStorage.getItem('device_id');
    if (stored) return stored;

    const deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('device_id', deviceId);
    return deviceId;
  }

  private generateChangeId(): string {
    return `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeStorage(): void {
    const syncMeta = localStorage.getItem(this.syncKey);
    if (!syncMeta) {
      const initialMeta = {
        version: 1,
        lastSyncTime: null,
        deviceSessions: [{
          deviceId: this.deviceId,
          deviceType: this.detectDeviceType(),
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          lastActiveTime: new Date(),
          syncVersion: 1
        }]
      };
      
      localStorage.setItem(this.syncKey, JSON.stringify(initialMeta));
    }
  }

  private detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop';
    
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private getNextVersion(): number {
    const meta = this.getSyncMetadata();
    return (meta?.version || 0) + 1;
  }

  private getLastSyncTime(): Date | null {
    const meta = this.getSyncMetadata();
    return meta?.lastSyncTime ? new Date(meta.lastSyncTime) : null;
  }

  private getSyncMetadata(): any {
    const stored = localStorage.getItem(this.syncKey);
    return stored ? JSON.parse(stored) : null;
  }

  private getPendingChanges(): PendingChange[] {
    return [...this.retryQueue];
  }

  private getStorageSizeUsed(): number {
    let total = 0;
    for (const key in localStorage) {
      if (key.startsWith(`offline_progress_${this.userId}`) || 
          key.startsWith(`sync_meta_${this.userId}`)) {
        total += localStorage.getItem(key)?.length || 0;
      }
    }
    return total;
  }

  private getStoredItemCount(): number {
    let count = 0;
    for (const key in localStorage) {
      if (key.startsWith(`offline_progress_${this.userId}`) || 
          key.startsWith(`sync_meta_${this.userId}`)) {
        count++;
      }
    }
    return count;
  }

  private validateOfflineData(data: any): boolean {
    return (
      data &&
      typeof data.userId === 'string' &&
      typeof data.courseId === 'string' &&
      data.progress &&
      data.analytics &&
      Array.isArray(data.events) &&
      data.timestamp &&
      typeof data.version === 'number'
    );
  }

  private async compressData(data: any): Promise<string> {
    // Simple compression using JSON stringify (in real implementation, use proper compression)
    return JSON.stringify(data);
  }

  private async decompressData(data: string): Promise<string> {
    // Simple decompression (in real implementation, use proper decompression)
    return data;
  }

  private async encryptData(data: string): Promise<string> {
    // Simple base64 encoding (in real implementation, use proper encryption)
    return btoa(data);
  }

  private async decryptData(data: string): Promise<string> {
    // Simple base64 decoding (in real implementation, use proper decryption)
    return atob(data);
  }

  private async cleanupOldData(): Promise<void> {
    // Remove old offline data to make space
    const cutoffDate = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)); // 7 days ago
    
    for (const key in localStorage) {
      if (key.startsWith('offline_progress_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (new Date(data.timestamp) < cutoffDate) {
            localStorage.removeItem(key);
          }
        } catch {
          // Invalid data, remove it
          localStorage.removeItem(key);
        }
      }
    }
  }

  private handleStorageChange(event: StorageEvent): void {
    // Handle cross-tab synchronization
    if (event.key === this.storageKey && event.newValue) {
      this.emit('cross_tab_update', {
        timestamp: new Date(),
        updatedBy: 'other_tab'
      });
    }
  }

  private startSync(): void {
    if (this.syncTimer) return;

    this.syncTimer = setInterval(() => {
      this.syncWithServer();
    }, this.config.syncInterval);
  }

  private stopSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  private async fetchServerData(): Promise<any> {
    // Mock implementation - would fetch from actual server
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          progress: null,
          analytics: null,
          version: 0,
          lastModified: new Date()
        });
      }, 100);
    });
  }

  private detectConflicts(localData: OfflineProgressData, serverData: any): SyncConflict[] {
    const conflicts: SyncConflict[] = [];

    // Check for progress conflicts
    if (serverData.progress && 
        serverData.lastModified > localData.lastSyncTime &&
        localData.progress.completionRate !== serverData.progress.completionRate) {
      
      conflicts.push({
        id: `conflict_progress_${Date.now()}`,
        type: 'progress',
        localData: localData.progress,
        remoteData: serverData.progress,
        timestamp: new Date()
      });
    }

    return conflicts;
  }

  private async uploadPendingChanges(changes: PendingChange[]): Promise<void> {
    for (const change of changes) {
      try {
        await this.uploadChange(change);
        this.retryQueue = this.retryQueue.filter(c => c.id !== change.id);
      } catch (error) {
        change.retryCount++;
        if (change.retryCount >= this.config.retryAttempts) {
          logger.error('Max retry attempts reached for change', { changeId: change.id });
          this.retryQueue = this.retryQueue.filter(c => c.id !== change.id);
        }
      }
    }
  }

  private async uploadChange(change: PendingChange): Promise<void> {
    // Mock implementation - would upload to actual server
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate
          resolve();
        } else {
          reject(new Error('Upload failed'));
        }
      }, 100);
    });
  }

  private async uploadProgressData(data: OfflineProgressData): Promise<void> {
    // Mock implementation - would upload to actual server
    return new Promise((resolve) => {
      setTimeout(resolve, 200);
    });
  }

  private async updateSyncMetadata(syncTime: Date): Promise<void> {
    const meta = this.getSyncMetadata() || {};
    meta.lastSyncTime = syncTime.toISOString();
    meta.version = (meta.version || 0) + 1;
    
    localStorage.setItem(this.syncKey, JSON.stringify(meta));
  }

  private async mergeConflictData(conflict: SyncConflict): Promise<any> {
    // Implement conflict resolution logic based on data type
    const { localData, remoteData } = conflict;
    
    if (conflict.type === 'progress') {
      return {
        ...remoteData,
        completionRate: Math.max(localData.completionRate, remoteData.completionRate),
        currentSection: Math.max(localData.currentSection, remoteData.currentSection),
        studyTimeMinutes: localData.studyTimeMinutes + remoteData.studyTimeMinutes,
        lastAccessed: new Date()
      };
    }
    
    return remoteData;
  }

  private async applyResolvedData(type: 'progress' | 'analytics', data: any): Promise<void> {
    // Apply resolved data to local storage
    const offlineData = await this.loadProgressOffline();
    if (!offlineData) return;

    if (type === 'progress') {
      offlineData.progress = data;
    } else if (type === 'analytics') {
      offlineData.analytics = data;
    }

    await this.saveProgressOffline(
      offlineData.progress,
      offlineData.analytics,
      offlineData.events
    );
  }

  private handleSyncError(error: any): void {
    logger.error('Sync error occurred', { error });
    
    this.emit('sync_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    });

    // Retry logic
    setTimeout(() => {
      if (this.isOnline) {
        this.syncStatus = 'idle';
        this.syncWithServer();
      }
    }, this.config.retryDelay);
  }
}

/**
 * Factory function to create OfflineSyncManager instance
 */
export function createOfflineSyncManager(
  userId: string,
  courseId: string,
  config?: Partial<StorageConfig>
): OfflineSyncManager {
  return new OfflineSyncManager(userId, courseId, config);
}

export default OfflineSyncManager;