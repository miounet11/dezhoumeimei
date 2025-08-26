/**
 * Bookmark Service - Management for Player Bookmarks
 * Handles all bookmark-related operations with categorization and synchronization
 */

import { createLogger } from '@/lib/logger';
import { EventEmitter } from 'events';

const logger = createLogger('bookmark-service');

/**
 * Bookmark Data Structures
 */
export interface PlayerBookmark {
  id: string;
  userId: string;
  courseId: string;
  sectionId: string;
  title: string;
  description?: string;
  videoPosition?: number; // seconds in video
  timestamp: Date;
  category: string;
  tags: string[];
  isFavorite: boolean;
  color: string;
  createdAt: Date;
  lastAccessed?: Date;
  accessCount: number;
  metadata?: {
    thumbnailUrl?: string;
    sectionTitle?: string;
    contextBefore?: string;
    contextAfter?: string;
    estimatedPosition?: number; // for text content
  };
}

export interface BookmarkCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  isDefault: boolean;
  bookmarkCount: number;
  createdAt: Date;
  sortOrder: number;
}

export interface BookmarkFilters {
  category?: string;
  tags?: string[];
  isFavorite?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  sectionId?: string;
  hasVideoPosition?: boolean;
  color?: string;
  accessedRecently?: boolean; // accessed in last 7 days
}

export interface BookmarkSearchResult {
  bookmarks: PlayerBookmark[];
  totalCount: number;
  hasMore: boolean;
  categories: BookmarkCategory[];
  tags: string[];
}

export type BookmarkSortBy = 'created' | 'accessed' | 'title' | 'position' | 'category' | 'favorite';

/**
 * Bookmark Analytics
 */
export interface BookmarkAnalytics {
  totalBookmarks: number;
  favoriteCount: number;
  bookmarksPerCategory: { [categoryId: string]: number };
  bookmarksPerSection: { [sectionId: string]: number };
  tagsUsage: { [tag: string]: number };
  creationTrend: {
    date: string;
    count: number;
  }[];
  accessPatterns: {
    hour: number;
    count: number;
  }[];
  averageAccessCount: number;
  mostUsedColors: { [color: string]: number };
}

/**
 * Service Options
 */
export interface BookmarkServiceOptions {
  enableOfflineSync: boolean;
  cacheSize: number;
  syncInterval: number; // milliseconds
  autoSync: boolean;
  groupByCategory: boolean;
  defaultCategories: Omit<BookmarkCategory, 'id' | 'bookmarkCount' | 'createdAt'>[];
}

/**
 * Events emitted by BookmarkService
 */
export type BookmarkServiceEventType = 
  | 'bookmark_created'
  | 'bookmark_updated'
  | 'bookmark_deleted'
  | 'bookmark_accessed'
  | 'category_created'
  | 'category_updated'
  | 'category_deleted'
  | 'bookmarks_loaded'
  | 'sync_started'
  | 'sync_completed'
  | 'sync_failed'
  | 'analytics_updated';

export interface BookmarkServiceEvent {
  type: BookmarkServiceEventType;
  data: any;
  timestamp: Date;
  userId: string;
  courseId: string;
}

/**
 * BookmarkService Class
 * Manages all bookmark operations with categorization, favorites, and analytics
 */
export class BookmarkService extends EventEmitter {
  private userId: string;
  private courseId: string;
  private options: BookmarkServiceOptions;
  private bookmarksCache: Map<string, PlayerBookmark> = new Map();
  private categoriesCache: Map<string, BookmarkCategory> = new Map();
  private tagsCache: Set<string> = new Set();
  private isInitialized = false;
  private syncQueue: Array<() => Promise<void>> = [];
  private isSyncing = false;
  private lastSyncTime = 0;
  private syncTimer: NodeJS.Timeout | null = null;
  private pendingChanges: Set<string> = new Set(); // bookmark IDs with pending changes

  constructor(
    userId: string,
    courseId: string,
    options: Partial<BookmarkServiceOptions> = {}
  ) {
    super();
    this.userId = userId;
    this.courseId = courseId;
    this.options = {
      enableOfflineSync: true,
      cacheSize: 500,
      syncInterval: 30000, // 30 seconds
      autoSync: true,
      groupByCategory: true,
      defaultCategories: [
        { name: 'General', description: 'General bookmarks', color: '#6B7280', icon: 'Folder', isDefault: true, sortOrder: 0 },
        { name: 'Key Concepts', description: 'Important concepts', color: '#3B82F6', icon: 'Star', isDefault: true, sortOrder: 1 },
        { name: 'Examples', description: 'Practice examples', color: '#10B981', icon: 'Target', isDefault: true, sortOrder: 2 },
        { name: 'Reviews', description: 'Review points', color: '#F59E0B', icon: 'RotateCcw', isDefault: true, sortOrder: 3 }
      ],
      ...options
    };
  }

  /**
   * Initialize the bookmark service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      logger.info('Initializing bookmark service', {
        userId: this.userId,
        courseId: this.courseId
      });

      // Load bookmarks and categories from storage
      await this.loadBookmarksFromStorage();
      await this.loadCategoriesFromStorage();
      
      // Create default categories if none exist
      if (this.categoriesCache.size === 0) {
        await this.createDefaultCategories();
      }

      // Start background sync if enabled
      if (this.options.enableOfflineSync && this.options.autoSync) {
        this.startBackgroundSync();
      }

      this.isInitialized = true;
      
      this.emit('bookmarks_loaded', {
        type: 'bookmarks_loaded',
        data: { 
          bookmarksCount: this.bookmarksCache.size,
          categoriesCount: this.categoriesCache.size
        },
        timestamp: new Date(),
        userId: this.userId,
        courseId: this.courseId
      });

      logger.info('Bookmark service initialized successfully', {
        userId: this.userId,
        courseId: this.courseId,
        bookmarksCount: this.bookmarksCache.size,
        categoriesCount: this.categoriesCache.size
      });

    } catch (error) {
      logger.error('Failed to initialize bookmark service', { error });
      throw error;
    }
  }

  /**
   * Create a new bookmark
   */
  async createBookmark(
    bookmarkData: Omit<PlayerBookmark, 'id' | 'timestamp' | 'createdAt' | 'accessCount' | 'lastAccessed'>
  ): Promise<PlayerBookmark> {
    try {
      const now = new Date();
      const bookmarkId = `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newBookmark: PlayerBookmark = {
        id: bookmarkId,
        ...bookmarkData,
        timestamp: now,
        createdAt: now,
        accessCount: 0
      };

      // Add to cache
      this.bookmarksCache.set(bookmarkId, newBookmark);
      
      // Update tags cache
      bookmarkData.tags.forEach(tag => this.tagsCache.add(tag));
      
      // Update category bookmark count
      const category = this.categoriesCache.get(bookmarkData.category);
      if (category) {
        category.bookmarkCount++;
        this.categoriesCache.set(category.id, category);
      }
      
      // Mark for sync
      this.pendingChanges.add(bookmarkId);
      
      // Queue sync operation
      this.queueSync(() => this.syncBookmarkToStorage(newBookmark));

      // Emit event
      this.emit('bookmark_created', {
        type: 'bookmark_created',
        data: newBookmark,
        timestamp: now,
        userId: this.userId,
        courseId: this.courseId
      });

      logger.info('Bookmark created', {
        bookmarkId,
        userId: this.userId,
        courseId: this.courseId,
        title: newBookmark.title.substring(0, 50),
        category: bookmarkData.category
      });

      return newBookmark;

    } catch (error) {
      logger.error('Failed to create bookmark', { error, bookmarkData });
      throw error;
    }
  }

  /**
   * Update an existing bookmark
   */
  async updateBookmark(
    bookmarkId: string, 
    updates: Partial<Omit<PlayerBookmark, 'id' | 'timestamp' | 'createdAt' | 'userId' | 'courseId'>>
  ): Promise<PlayerBookmark> {
    try {
      const existingBookmark = this.bookmarksCache.get(bookmarkId);
      if (!existingBookmark) {
        throw new Error(`Bookmark with id ${bookmarkId} not found`);
      }

      const now = new Date();
      
      // Handle category change
      if (updates.category && updates.category !== existingBookmark.category) {
        // Decrease count in old category
        const oldCategory = this.categoriesCache.get(existingBookmark.category);
        if (oldCategory) {
          oldCategory.bookmarkCount = Math.max(0, oldCategory.bookmarkCount - 1);
          this.categoriesCache.set(oldCategory.id, oldCategory);
        }
        
        // Increase count in new category
        const newCategory = this.categoriesCache.get(updates.category);
        if (newCategory) {
          newCategory.bookmarkCount++;
          this.categoriesCache.set(newCategory.id, newCategory);
        }
      }

      const updatedBookmark: PlayerBookmark = {
        ...existingBookmark,
        ...updates,
        lastAccessed: now // Update last accessed time on any update
      };

      // Update cache
      this.bookmarksCache.set(bookmarkId, updatedBookmark);
      
      // Update tags cache
      if (updates.tags) {
        updates.tags.forEach(tag => this.tagsCache.add(tag));
      }
      
      // Mark for sync
      this.pendingChanges.add(bookmarkId);
      
      // Queue sync operation
      this.queueSync(() => this.syncBookmarkToStorage(updatedBookmark));

      // Emit event
      this.emit('bookmark_updated', {
        type: 'bookmark_updated',
        data: { previous: existingBookmark, updated: updatedBookmark },
        timestamp: now,
        userId: this.userId,
        courseId: this.courseId
      });

      logger.info('Bookmark updated', {
        bookmarkId,
        userId: this.userId,
        courseId: this.courseId,
        changes: Object.keys(updates)
      });

      return updatedBookmark;

    } catch (error) {
      logger.error('Failed to update bookmark', { error, bookmarkId, updates });
      throw error;
    }
  }

  /**
   * Delete a bookmark
   */
  async deleteBookmark(bookmarkId: string): Promise<void> {
    try {
      const existingBookmark = this.bookmarksCache.get(bookmarkId);
      if (!existingBookmark) {
        throw new Error(`Bookmark with id ${bookmarkId} not found`);
      }

      // Decrease category bookmark count
      const category = this.categoriesCache.get(existingBookmark.category);
      if (category) {
        category.bookmarkCount = Math.max(0, category.bookmarkCount - 1);
        this.categoriesCache.set(category.id, category);
      }

      // Remove from cache
      this.bookmarksCache.delete(bookmarkId);
      
      // Remove from pending changes
      this.pendingChanges.delete(bookmarkId);
      
      // Queue sync operation
      this.queueSync(() => this.deleteBookmarkFromStorage(bookmarkId));

      // Emit event
      this.emit('bookmark_deleted', {
        type: 'bookmark_deleted',
        data: { deletedBookmark: existingBookmark },
        timestamp: new Date(),
        userId: this.userId,
        courseId: this.courseId
      });

      logger.info('Bookmark deleted', {
        bookmarkId,
        userId: this.userId,
        courseId: this.courseId,
        title: existingBookmark.title.substring(0, 50)
      });

    } catch (error) {
      logger.error('Failed to delete bookmark', { error, bookmarkId });
      throw error;
    }
  }

  /**
   * Access a bookmark (updates access count and last accessed time)
   */
  async accessBookmark(bookmarkId: string): Promise<PlayerBookmark> {
    try {
      const bookmark = this.bookmarksCache.get(bookmarkId);
      if (!bookmark) {
        throw new Error(`Bookmark with id ${bookmarkId} not found`);
      }

      const now = new Date();
      const updatedBookmark: PlayerBookmark = {
        ...bookmark,
        accessCount: bookmark.accessCount + 1,
        lastAccessed: now
      };

      // Update cache
      this.bookmarksCache.set(bookmarkId, updatedBookmark);
      
      // Mark for sync
      this.pendingChanges.add(bookmarkId);
      
      // Queue sync operation
      this.queueSync(() => this.syncBookmarkToStorage(updatedBookmark));

      // Emit event
      this.emit('bookmark_accessed', {
        type: 'bookmark_accessed',
        data: updatedBookmark,
        timestamp: now,
        userId: this.userId,
        courseId: this.courseId
      });

      return updatedBookmark;

    } catch (error) {
      logger.error('Failed to access bookmark', { error, bookmarkId });
      throw error;
    }
  }

  /**
   * Toggle bookmark favorite status
   */
  async toggleFavorite(bookmarkId: string): Promise<PlayerBookmark> {
    const bookmark = this.bookmarksCache.get(bookmarkId);
    if (!bookmark) {
      throw new Error(`Bookmark with id ${bookmarkId} not found`);
    }

    return this.updateBookmark(bookmarkId, { isFavorite: !bookmark.isFavorite });
  }

  /**
   * Search and filter bookmarks
   */
  async searchBookmarks(
    filters: BookmarkFilters = {},
    sortBy: BookmarkSortBy = 'created',
    sortOrder: 'asc' | 'desc' = 'desc',
    limit = 50,
    offset = 0
  ): Promise<BookmarkSearchResult> {
    try {
      let bookmarks = Array.from(this.bookmarksCache.values());

      // Apply filters
      if (filters.category) {
        bookmarks = bookmarks.filter(bookmark => bookmark.category === filters.category);
      }

      if (filters.tags && filters.tags.length > 0) {
        bookmarks = bookmarks.filter(bookmark => 
          filters.tags!.some(tag => bookmark.tags.includes(tag))
        );
      }

      if (filters.isFavorite !== undefined) {
        bookmarks = bookmarks.filter(bookmark => bookmark.isFavorite === filters.isFavorite);
      }

      if (filters.sectionId) {
        bookmarks = bookmarks.filter(bookmark => bookmark.sectionId === filters.sectionId);
      }

      if (filters.hasVideoPosition !== undefined) {
        bookmarks = bookmarks.filter(bookmark => 
          (bookmark.videoPosition !== undefined) === filters.hasVideoPosition
        );
      }

      if (filters.color) {
        bookmarks = bookmarks.filter(bookmark => bookmark.color === filters.color);
      }

      if (filters.accessedRecently) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        bookmarks = bookmarks.filter(bookmark => 
          bookmark.lastAccessed && bookmark.lastAccessed >= sevenDaysAgo
        );
      }

      if (filters.dateRange) {
        bookmarks = bookmarks.filter(bookmark => 
          bookmark.createdAt >= filters.dateRange!.start &&
          bookmark.createdAt <= filters.dateRange!.end
        );
      }

      // Apply sorting
      bookmarks.sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'created':
            comparison = a.createdAt.getTime() - b.createdAt.getTime();
            break;
          case 'accessed':
            comparison = (a.lastAccessed?.getTime() || 0) - (b.lastAccessed?.getTime() || 0);
            break;
          case 'title':
            comparison = a.title.localeCompare(b.title);
            break;
          case 'position':
            comparison = (a.videoPosition || 0) - (b.videoPosition || 0);
            break;
          case 'category':
            const catA = this.categoriesCache.get(a.category)?.name || '';
            const catB = this.categoriesCache.get(b.category)?.name || '';
            comparison = catA.localeCompare(catB);
            break;
          case 'favorite':
            comparison = (a.isFavorite ? 1 : 0) - (b.isFavorite ? 1 : 0);
            break;
        }

        return sortOrder === 'asc' ? comparison : -comparison;
      });

      const totalCount = bookmarks.length;
      const paginatedBookmarks = bookmarks.slice(offset, offset + limit);
      const hasMore = offset + limit < totalCount;

      return {
        bookmarks: paginatedBookmarks,
        totalCount,
        hasMore,
        categories: Array.from(this.categoriesCache.values()).sort((a, b) => a.sortOrder - b.sortOrder),
        tags: Array.from(this.tagsCache).sort()
      };

    } catch (error) {
      logger.error('Failed to search bookmarks', { error, filters });
      throw error;
    }
  }

  /**
   * Get a single bookmark by ID
   */
  async getBookmark(bookmarkId: string): Promise<PlayerBookmark | null> {
    return this.bookmarksCache.get(bookmarkId) || null;
  }

  /**
   * Create a new category
   */
  async createCategory(
    categoryData: Omit<BookmarkCategory, 'id' | 'bookmarkCount' | 'createdAt'>
  ): Promise<BookmarkCategory> {
    try {
      const now = new Date();
      const categoryId = `category_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newCategory: BookmarkCategory = {
        id: categoryId,
        ...categoryData,
        bookmarkCount: 0,
        createdAt: now
      };

      // Add to cache
      this.categoriesCache.set(categoryId, newCategory);
      
      // Queue sync operation
      this.queueSync(() => this.syncCategoriesToStorage());

      // Emit event
      this.emit('category_created', {
        type: 'category_created',
        data: newCategory,
        timestamp: now,
        userId: this.userId,
        courseId: this.courseId
      });

      logger.info('Category created', {
        categoryId,
        name: newCategory.name,
        userId: this.userId,
        courseId: this.courseId
      });

      return newCategory;

    } catch (error) {
      logger.error('Failed to create category', { error, categoryData });
      throw error;
    }
  }

  /**
   * Update a category
   */
  async updateCategory(
    categoryId: string,
    updates: Partial<Omit<BookmarkCategory, 'id' | 'bookmarkCount' | 'createdAt'>>
  ): Promise<BookmarkCategory> {
    try {
      const existingCategory = this.categoriesCache.get(categoryId);
      if (!existingCategory) {
        throw new Error(`Category with id ${categoryId} not found`);
      }

      const updatedCategory: BookmarkCategory = {
        ...existingCategory,
        ...updates
      };

      // Update cache
      this.categoriesCache.set(categoryId, updatedCategory);
      
      // Queue sync operation
      this.queueSync(() => this.syncCategoriesToStorage());

      // Emit event
      this.emit('category_updated', {
        type: 'category_updated',
        data: { previous: existingCategory, updated: updatedCategory },
        timestamp: new Date(),
        userId: this.userId,
        courseId: this.courseId
      });

      logger.info('Category updated', {
        categoryId,
        name: updatedCategory.name,
        changes: Object.keys(updates),
        userId: this.userId,
        courseId: this.courseId
      });

      return updatedCategory;

    } catch (error) {
      logger.error('Failed to update category', { error, categoryId, updates });
      throw error;
    }
  }

  /**
   * Delete a category (only if it's not default and has no bookmarks)
   */
  async deleteCategory(categoryId: string): Promise<void> {
    try {
      const existingCategory = this.categoriesCache.get(categoryId);
      if (!existingCategory) {
        throw new Error(`Category with id ${categoryId} not found`);
      }

      if (existingCategory.isDefault) {
        throw new Error('Cannot delete default category');
      }

      if (existingCategory.bookmarkCount > 0) {
        throw new Error('Cannot delete category with bookmarks');
      }

      // Remove from cache
      this.categoriesCache.delete(categoryId);
      
      // Queue sync operation
      this.queueSync(() => this.syncCategoriesToStorage());

      // Emit event
      this.emit('category_deleted', {
        type: 'category_deleted',
        data: { deletedCategory: existingCategory },
        timestamp: new Date(),
        userId: this.userId,
        courseId: this.courseId
      });

      logger.info('Category deleted', {
        categoryId,
        name: existingCategory.name,
        userId: this.userId,
        courseId: this.courseId
      });

    } catch (error) {
      logger.error('Failed to delete category', { error, categoryId });
      throw error;
    }
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<BookmarkCategory[]> {
    return Array.from(this.categoriesCache.values()).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * Get bookmark analytics
   */
  async getAnalytics(): Promise<BookmarkAnalytics> {
    try {
      const bookmarks = Array.from(this.bookmarksCache.values());
      
      if (bookmarks.length === 0) {
        return {
          totalBookmarks: 0,
          favoriteCount: 0,
          bookmarksPerCategory: {},
          bookmarksPerSection: {},
          tagsUsage: {},
          creationTrend: [],
          accessPatterns: [],
          averageAccessCount: 0,
          mostUsedColors: {}
        };
      }

      // Basic stats
      const favoriteCount = bookmarks.filter(b => b.isFavorite).length;
      const totalAccessCount = bookmarks.reduce((sum, b) => sum + b.accessCount, 0);
      const averageAccessCount = Math.round(totalAccessCount / bookmarks.length);

      // Bookmarks per category
      const bookmarksPerCategory: { [categoryId: string]: number } = {};
      bookmarks.forEach(bookmark => {
        bookmarksPerCategory[bookmark.category] = (bookmarksPerCategory[bookmark.category] || 0) + 1;
      });

      // Bookmarks per section
      const bookmarksPerSection: { [sectionId: string]: number } = {};
      bookmarks.forEach(bookmark => {
        bookmarksPerSection[bookmark.sectionId] = (bookmarksPerSection[bookmark.sectionId] || 0) + 1;
      });

      // Tags usage
      const tagsUsage: { [tag: string]: number } = {};
      bookmarks.forEach(bookmark => {
        bookmark.tags.forEach(tag => {
          tagsUsage[tag] = (tagsUsage[tag] || 0) + 1;
        });
      });

      // Creation trend (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const creationTrend: { [date: string]: number } = {};
      bookmarks.forEach(bookmark => {
        if (bookmark.createdAt >= thirtyDaysAgo) {
          const dateKey = bookmark.createdAt.toISOString().split('T')[0];
          creationTrend[dateKey] = (creationTrend[dateKey] || 0) + 1;
        }
      });

      const creationTrendArray = Object.entries(creationTrend)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Access patterns (by hour)
      const hourCounts = new Array(24).fill(0);
      bookmarks.forEach(bookmark => {
        if (bookmark.lastAccessed) {
          const hour = bookmark.lastAccessed.getHours();
          hourCounts[hour] += bookmark.accessCount;
        }
      });

      const accessPatterns = hourCounts.map((count, hour) => ({ hour, count }));

      // Most used colors
      const mostUsedColors: { [color: string]: number } = {};
      bookmarks.forEach(bookmark => {
        mostUsedColors[bookmark.color] = (mostUsedColors[bookmark.color] || 0) + 1;
      });

      return {
        totalBookmarks: bookmarks.length,
        favoriteCount,
        bookmarksPerCategory,
        bookmarksPerSection,
        tagsUsage,
        creationTrend: creationTrendArray,
        accessPatterns,
        averageAccessCount,
        mostUsedColors
      };

    } catch (error) {
      logger.error('Failed to get analytics', { error });
      throw error;
    }
  }

  /**
   * Export bookmarks to JSON
   */
  async exportBookmarks(filters: BookmarkFilters = {}): Promise<string> {
    try {
      const searchResult = await this.searchBookmarks(filters, 'created', 'desc', Number.MAX_SAFE_INTEGER);
      
      const exportData = {
        exportDate: new Date().toISOString(),
        userId: this.userId,
        courseId: this.courseId,
        totalBookmarks: searchResult.totalCount,
        bookmarks: searchResult.bookmarks.map(bookmark => ({
          ...bookmark,
          timestamp: bookmark.timestamp.toISOString(),
          createdAt: bookmark.createdAt.toISOString(),
          lastAccessed: bookmark.lastAccessed?.toISOString()
        })),
        categories: searchResult.categories.map(category => ({
          ...category,
          createdAt: category.createdAt.toISOString()
        }))
      };

      return JSON.stringify(exportData, null, 2);

    } catch (error) {
      logger.error('Failed to export bookmarks', { error });
      throw error;
    }
  }

  /**
   * Import bookmarks from JSON
   */
  async importBookmarks(jsonData: string, mergeStrategy: 'replace' | 'merge' = 'merge'): Promise<number> {
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.bookmarks || !Array.isArray(importData.bookmarks)) {
        throw new Error('Invalid import data format');
      }

      let importedCount = 0;

      // Import categories first
      if (importData.categories && Array.isArray(importData.categories)) {
        for (const categoryData of importData.categories) {
          try {
            const existingCategory = Array.from(this.categoriesCache.values())
              .find(cat => cat.name === categoryData.name);
            
            if (!existingCategory) {
              const category: BookmarkCategory = {
                ...categoryData,
                id: `category_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                createdAt: new Date(categoryData.createdAt),
                bookmarkCount: 0
              };
              this.categoriesCache.set(category.id, category);
            }
          } catch (categoryError) {
            logger.warn('Failed to import individual category', { categoryError, categoryData });
          }
        }
      }

      // Import bookmarks
      for (const bookmarkData of importData.bookmarks) {
        try {
          // Convert date strings back to Date objects
          const bookmark: PlayerBookmark = {
            ...bookmarkData,
            timestamp: new Date(bookmarkData.timestamp),
            createdAt: new Date(bookmarkData.createdAt),
            lastAccessed: bookmarkData.lastAccessed ? new Date(bookmarkData.lastAccessed) : undefined,
            userId: this.userId, // Override with current user
            courseId: this.courseId // Override with current course
          };

          // Find matching category by name if ID doesn't exist
          if (!this.categoriesCache.has(bookmark.category)) {
            const matchingCategory = Array.from(this.categoriesCache.values())
              .find(cat => cat.name === bookmark.category);
            if (matchingCategory) {
              bookmark.category = matchingCategory.id;
            } else {
              // Use first available category
              const firstCategory = Array.from(this.categoriesCache.values())[0];
              if (firstCategory) {
                bookmark.category = firstCategory.id;
              }
            }
          }

          // Check if bookmark already exists
          const existingBookmark = this.bookmarksCache.get(bookmark.id);
          
          if (existingBookmark) {
            if (mergeStrategy === 'replace' || bookmark.createdAt > existingBookmark.createdAt) {
              await this.updateBookmark(bookmark.id, {
                title: bookmark.title,
                description: bookmark.description,
                sectionId: bookmark.sectionId,
                videoPosition: bookmark.videoPosition,
                category: bookmark.category,
                tags: bookmark.tags,
                isFavorite: bookmark.isFavorite,
                color: bookmark.color
              });
              importedCount++;
            }
          } else {
            // Create new bookmark with original ID
            this.bookmarksCache.set(bookmark.id, bookmark);
            bookmark.tags.forEach(tag => this.tagsCache.add(tag));
            
            // Update category count
            const category = this.categoriesCache.get(bookmark.category);
            if (category) {
              category.bookmarkCount++;
              this.categoriesCache.set(category.id, category);
            }
            
            this.pendingChanges.add(bookmark.id);
            this.queueSync(() => this.syncBookmarkToStorage(bookmark));
            importedCount++;
          }

        } catch (bookmarkError) {
          logger.warn('Failed to import individual bookmark', { bookmarkError, bookmarkData });
        }
      }

      logger.info('Bookmarks imported successfully', {
        userId: this.userId,
        courseId: this.courseId,
        importedCount,
        totalBookmarks: importData.bookmarks.length
      });

      return importedCount;

    } catch (error) {
      logger.error('Failed to import bookmarks', { error });
      throw error;
    }
  }

  /**
   * Force sync all pending changes
   */
  async forceSync(): Promise<void> {
    await this.processSyncQueue();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    this.removeAllListeners();
    this.bookmarksCache.clear();
    this.categoriesCache.clear();
    this.tagsCache.clear();
    this.pendingChanges.clear();
    this.syncQueue = [];
    
    logger.info('Bookmark service destroyed', {
      userId: this.userId,
      courseId: this.courseId
    });
  }

  // ===== PRIVATE METHODS =====

  /**
   * Load bookmarks from local storage
   */
  private async loadBookmarksFromStorage(): Promise<void> {
    try {
      const storageKey = `bookmarks_${this.userId}_${this.courseId}`;
      const storedData = localStorage.getItem(storageKey);
      
      if (storedData) {
        const bookmarks: PlayerBookmark[] = JSON.parse(storedData).map((bookmark: any) => ({
          ...bookmark,
          timestamp: new Date(bookmark.timestamp),
          createdAt: new Date(bookmark.createdAt),
          lastAccessed: bookmark.lastAccessed ? new Date(bookmark.lastAccessed) : undefined
        }));

        // Load into cache
        bookmarks.forEach(bookmark => {
          this.bookmarksCache.set(bookmark.id, bookmark);
          bookmark.tags.forEach(tag => this.tagsCache.add(tag));
        });
      }

    } catch (error) {
      logger.error('Failed to load bookmarks from storage', { error });
    }
  }

  /**
   * Load categories from local storage
   */
  private async loadCategoriesFromStorage(): Promise<void> {
    try {
      const storageKey = `bookmark_categories_${this.userId}_${this.courseId}`;
      const storedData = localStorage.getItem(storageKey);
      
      if (storedData) {
        const categories: BookmarkCategory[] = JSON.parse(storedData).map((category: any) => ({
          ...category,
          createdAt: new Date(category.createdAt)
        }));

        // Load into cache
        categories.forEach(category => {
          this.categoriesCache.set(category.id, category);
        });
      }

    } catch (error) {
      logger.error('Failed to load categories from storage', { error });
    }
  }

  /**
   * Create default categories
   */
  private async createDefaultCategories(): Promise<void> {
    try {
      for (const categoryData of this.options.defaultCategories) {
        await this.createCategory(categoryData);
      }
    } catch (error) {
      logger.error('Failed to create default categories', { error });
    }
  }

  /**
   * Sync bookmark to storage
   */
  private async syncBookmarkToStorage(bookmark: PlayerBookmark): Promise<void> {
    try {
      const storageKey = `bookmarks_${this.userId}_${this.courseId}`;
      const bookmarks = Array.from(this.bookmarksCache.values());
      localStorage.setItem(storageKey, JSON.stringify(bookmarks));
      
      // Remove from pending changes
      this.pendingChanges.delete(bookmark.id);

    } catch (error) {
      logger.error('Failed to sync bookmark to storage', { error, bookmarkId: bookmark.id });
      throw error;
    }
  }

  /**
   * Delete bookmark from storage
   */
  private async deleteBookmarkFromStorage(bookmarkId: string): Promise<void> {
    try {
      const storageKey = `bookmarks_${this.userId}_${this.courseId}`;
      const bookmarks = Array.from(this.bookmarksCache.values());
      localStorage.setItem(storageKey, JSON.stringify(bookmarks));

    } catch (error) {
      logger.error('Failed to delete bookmark from storage', { error, bookmarkId });
      throw error;
    }
  }

  /**
   * Sync categories to storage
   */
  private async syncCategoriesToStorage(): Promise<void> {
    try {
      const storageKey = `bookmark_categories_${this.userId}_${this.courseId}`;
      const categories = Array.from(this.categoriesCache.values());
      localStorage.setItem(storageKey, JSON.stringify(categories));

    } catch (error) {
      logger.error('Failed to sync categories to storage', { error });
      throw error;
    }
  }

  /**
   * Queue sync operation
   */
  private queueSync(syncOperation: () => Promise<void>): void {
    this.syncQueue.push(syncOperation);

    // Process immediately if not too frequent
    if (Date.now() - this.lastSyncTime > 1000) { // 1 second throttle
      this.processSyncQueue();
    }
  }

  /**
   * Process all queued sync operations
   */
  private async processSyncQueue(): Promise<void> {
    if (this.isSyncing || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;
    this.lastSyncTime = Date.now();

    this.emit('sync_started', {
      type: 'sync_started',
      data: { queueSize: this.syncQueue.length },
      timestamp: new Date(),
      userId: this.userId,
      courseId: this.courseId
    });

    try {
      const operations = [...this.syncQueue];
      this.syncQueue = [];

      await Promise.all(operations.map(op => op()));

      this.emit('sync_completed', {
        type: 'sync_completed',
        data: { operationsProcessed: operations.length },
        timestamp: new Date(),
        userId: this.userId,
        courseId: this.courseId
      });

    } catch (error) {
      logger.error('Sync failed', { error });
      
      this.emit('sync_failed', {
        type: 'sync_failed',
        data: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date(),
        userId: this.userId,
        courseId: this.courseId
      });
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Start background sync
   */
  private startBackgroundSync(): void {
    this.syncTimer = setInterval(() => {
      if (this.pendingChanges.size > 0) {
        this.processSyncQueue();
      }
    }, this.options.syncInterval);
  }
}

/**
 * Factory function to create BookmarkService instance
 */
export function createBookmarkService(
  userId: string,
  courseId: string,
  options: Partial<BookmarkServiceOptions> = {}
): BookmarkService {
  return new BookmarkService(userId, courseId, options);
}

export default BookmarkService;