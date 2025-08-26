/**
 * Notes Manager Service - CRUD Operations for Player Notes
 * Handles all note-related operations with database sync and caching
 */

import { createLogger } from '@/lib/logger';
import { EventEmitter } from 'events';

const logger = createLogger('notes-manager');

/**
 * Note Data Structure
 */
export interface PlayerNote {
  id: string;
  userId: string;
  courseId: string;
  sectionId: string;
  title: string;
  content: string; // HTML content
  timestamp: Date;
  videoPosition?: number; // seconds in video when note was created
  tags: string[];
  isPrivate: boolean;
  lastModified: Date;
  metadata?: {
    wordCount: number;
    readingTime: number; // estimated reading time in minutes
    hasLinks: boolean;
    hasFormatting: boolean;
    version: number; // for version control
  };
}

export interface NoteSearchFilters {
  query?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  sectionId?: string;
  isPrivate?: boolean;
  hasVideoPosition?: boolean;
}

export interface NoteSearchResult {
  notes: PlayerNote[];
  totalCount: number;
  hasMore: boolean;
  tags: string[]; // available tags for filtering
}

export interface NotesManagerOptions {
  enableOfflineSync: boolean;
  cacheSize: number;
  syncInterval: number; // milliseconds
  autoSave: boolean;
  autoSaveInterval: number; // milliseconds
}

/**
 * Note Statistics and Analytics
 */
export interface NoteAnalytics {
  totalNotes: number;
  totalWords: number;
  avgWordsPerNote: number;
  notesPerSection: { [sectionId: string]: number };
  tagsUsage: { [tag: string]: number };
  creationTrend: {
    date: string;
    count: number;
  }[];
  mostActiveHours: number[]; // hours of day when most notes are created
}

/**
 * Events emitted by NotesManager
 */
export type NotesManagerEventType = 
  | 'note_created'
  | 'note_updated' 
  | 'note_deleted'
  | 'notes_loaded'
  | 'sync_started'
  | 'sync_completed'
  | 'sync_failed'
  | 'cache_updated'
  | 'analytics_updated';

export interface NotesManagerEvent {
  type: NotesManagerEventType;
  data: any;
  timestamp: Date;
  userId: string;
  courseId: string;
}

/**
 * NotesManager Class
 * Manages all note operations with caching, offline sync, and real-time updates
 */
export class NotesManager extends EventEmitter {
  private userId: string;
  private courseId: string;
  private options: NotesManagerOptions;
  private notesCache: Map<string, PlayerNote> = new Map();
  private tagsCache: Set<string> = new Set();
  private isInitialized = false;
  private syncQueue: Array<() => Promise<void>> = [];
  private isSyncing = false;
  private lastSyncTime = 0;
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private syncTimer: NodeJS.Timeout | null = null;
  private pendingChanges: Set<string> = new Set(); // note IDs with pending changes

  constructor(
    userId: string, 
    courseId: string, 
    options: Partial<NotesManagerOptions> = {}
  ) {
    super();
    this.userId = userId;
    this.courseId = courseId;
    this.options = {
      enableOfflineSync: true,
      cacheSize: 1000,
      syncInterval: 30000, // 30 seconds
      autoSave: true,
      autoSaveInterval: 10000, // 10 seconds
      ...options
    };
  }

  /**
   * Initialize the notes manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      logger.info('Initializing notes manager', {
        userId: this.userId,
        courseId: this.courseId
      });

      // Load notes from storage
      await this.loadNotesFromStorage();
      
      // Start background sync if enabled
      if (this.options.enableOfflineSync) {
        this.startBackgroundSync();
      }

      // Start auto-save if enabled
      if (this.options.autoSave) {
        this.startAutoSave();
      }

      this.isInitialized = true;
      
      this.emit('notes_loaded', {
        type: 'notes_loaded',
        data: { count: this.notesCache.size },
        timestamp: new Date(),
        userId: this.userId,
        courseId: this.courseId
      });

      logger.info('Notes manager initialized successfully', {
        userId: this.userId,
        courseId: this.courseId,
        notesCount: this.notesCache.size
      });

    } catch (error) {
      logger.error('Failed to initialize notes manager', { error });
      throw error;
    }
  }

  /**
   * Create a new note
   */
  async createNote(noteData: Omit<PlayerNote, 'id' | 'timestamp' | 'lastModified' | 'metadata'>): Promise<PlayerNote> {
    try {
      const now = new Date();
      const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newNote: PlayerNote = {
        id: noteId,
        ...noteData,
        timestamp: now,
        lastModified: now,
        metadata: this.generateNoteMetadata(noteData.content)
      };

      // Add to cache
      this.notesCache.set(noteId, newNote);
      
      // Update tags cache
      noteData.tags.forEach(tag => this.tagsCache.add(tag));
      
      // Mark for sync
      this.pendingChanges.add(noteId);
      
      // Queue sync operation
      this.queueSync(() => this.syncNoteToStorage(newNote));

      // Emit event
      this.emit('note_created', {
        type: 'note_created',
        data: newNote,
        timestamp: now,
        userId: this.userId,
        courseId: this.courseId
      });

      logger.info('Note created', {
        noteId,
        userId: this.userId,
        courseId: this.courseId,
        title: newNote.title.substring(0, 50)
      });

      return newNote;

    } catch (error) {
      logger.error('Failed to create note', { error, noteData });
      throw error;
    }
  }

  /**
   * Update an existing note
   */
  async updateNote(noteId: string, updates: Partial<Omit<PlayerNote, 'id' | 'timestamp' | 'userId' | 'courseId'>>): Promise<PlayerNote> {
    try {
      const existingNote = this.notesCache.get(noteId);
      if (!existingNote) {
        throw new Error(`Note with id ${noteId} not found`);
      }

      const now = new Date();
      const updatedNote: PlayerNote = {
        ...existingNote,
        ...updates,
        lastModified: now,
        metadata: updates.content 
          ? this.generateNoteMetadata(updates.content)
          : existingNote.metadata
      };

      // Update cache
      this.notesCache.set(noteId, updatedNote);
      
      // Update tags cache
      if (updates.tags) {
        updates.tags.forEach(tag => this.tagsCache.add(tag));
      }
      
      // Mark for sync
      this.pendingChanges.add(noteId);
      
      // Queue sync operation
      this.queueSync(() => this.syncNoteToStorage(updatedNote));

      // Emit event
      this.emit('note_updated', {
        type: 'note_updated',
        data: { previous: existingNote, updated: updatedNote },
        timestamp: now,
        userId: this.userId,
        courseId: this.courseId
      });

      logger.info('Note updated', {
        noteId,
        userId: this.userId,
        courseId: this.courseId,
        changes: Object.keys(updates)
      });

      return updatedNote;

    } catch (error) {
      logger.error('Failed to update note', { error, noteId, updates });
      throw error;
    }
  }

  /**
   * Delete a note
   */
  async deleteNote(noteId: string): Promise<void> {
    try {
      const existingNote = this.notesCache.get(noteId);
      if (!existingNote) {
        throw new Error(`Note with id ${noteId} not found`);
      }

      // Remove from cache
      this.notesCache.delete(noteId);
      
      // Remove from pending changes
      this.pendingChanges.delete(noteId);
      
      // Queue sync operation
      this.queueSync(() => this.deleteNoteFromStorage(noteId));

      // Emit event
      this.emit('note_deleted', {
        type: 'note_deleted',
        data: { deletedNote: existingNote },
        timestamp: new Date(),
        userId: this.userId,
        courseId: this.courseId
      });

      logger.info('Note deleted', {
        noteId,
        userId: this.userId,
        courseId: this.courseId,
        title: existingNote.title.substring(0, 50)
      });

    } catch (error) {
      logger.error('Failed to delete note', { error, noteId });
      throw error;
    }
  }

  /**
   * Get a single note by ID
   */
  async getNote(noteId: string): Promise<PlayerNote | null> {
    return this.notesCache.get(noteId) || null;
  }

  /**
   * Search and filter notes
   */
  async searchNotes(
    filters: NoteSearchFilters = {},
    limit = 50,
    offset = 0
  ): Promise<NoteSearchResult> {
    try {
      let notes = Array.from(this.notesCache.values());

      // Apply filters
      if (filters.query) {
        const query = filters.query.toLowerCase();
        notes = notes.filter(note => 
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query) ||
          note.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }

      if (filters.tags && filters.tags.length > 0) {
        notes = notes.filter(note => 
          filters.tags!.some(tag => note.tags.includes(tag))
        );
      }

      if (filters.sectionId) {
        notes = notes.filter(note => note.sectionId === filters.sectionId);
      }

      if (filters.isPrivate !== undefined) {
        notes = notes.filter(note => note.isPrivate === filters.isPrivate);
      }

      if (filters.hasVideoPosition !== undefined) {
        notes = notes.filter(note => 
          (note.videoPosition !== undefined) === filters.hasVideoPosition
        );
      }

      if (filters.dateRange) {
        notes = notes.filter(note => 
          note.timestamp >= filters.dateRange!.start &&
          note.timestamp <= filters.dateRange!.end
        );
      }

      // Sort by last modified (newest first)
      notes.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

      const totalCount = notes.length;
      const paginatedNotes = notes.slice(offset, offset + limit);
      const hasMore = offset + limit < totalCount;

      return {
        notes: paginatedNotes,
        totalCount,
        hasMore,
        tags: Array.from(this.tagsCache)
      };

    } catch (error) {
      logger.error('Failed to search notes', { error, filters });
      throw error;
    }
  }

  /**
   * Get all unique tags
   */
  async getAllTags(): Promise<string[]> {
    return Array.from(this.tagsCache).sort();
  }

  /**
   * Get notes analytics
   */
  async getAnalytics(): Promise<NoteAnalytics> {
    try {
      const notes = Array.from(this.notesCache.values());
      
      if (notes.length === 0) {
        return {
          totalNotes: 0,
          totalWords: 0,
          avgWordsPerNote: 0,
          notesPerSection: {},
          tagsUsage: {},
          creationTrend: [],
          mostActiveHours: []
        };
      }

      // Calculate basic stats
      const totalWords = notes.reduce((sum, note) => sum + (note.metadata?.wordCount || 0), 0);
      const avgWordsPerNote = Math.round(totalWords / notes.length);

      // Notes per section
      const notesPerSection: { [sectionId: string]: number } = {};
      notes.forEach(note => {
        notesPerSection[note.sectionId] = (notesPerSection[note.sectionId] || 0) + 1;
      });

      // Tags usage
      const tagsUsage: { [tag: string]: number } = {};
      notes.forEach(note => {
        note.tags.forEach(tag => {
          tagsUsage[tag] = (tagsUsage[tag] || 0) + 1;
        });
      });

      // Creation trend (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const creationTrend: { [date: string]: number } = {};
      notes.forEach(note => {
        if (note.timestamp >= thirtyDaysAgo) {
          const dateKey = note.timestamp.toISOString().split('T')[0];
          creationTrend[dateKey] = (creationTrend[dateKey] || 0) + 1;
        }
      });

      const creationTrendArray = Object.entries(creationTrend)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Most active hours
      const hourCounts = new Array(24).fill(0);
      notes.forEach(note => {
        const hour = note.timestamp.getHours();
        hourCounts[hour]++;
      });

      return {
        totalNotes: notes.length,
        totalWords,
        avgWordsPerNote,
        notesPerSection,
        tagsUsage,
        creationTrend: creationTrendArray,
        mostActiveHours: hourCounts
      };

    } catch (error) {
      logger.error('Failed to get analytics', { error });
      throw error;
    }
  }

  /**
   * Export notes to JSON
   */
  async exportNotes(filters: NoteSearchFilters = {}): Promise<string> {
    try {
      const searchResult = await this.searchNotes(filters, Number.MAX_SAFE_INTEGER);
      
      const exportData = {
        exportDate: new Date().toISOString(),
        userId: this.userId,
        courseId: this.courseId,
        totalNotes: searchResult.totalCount,
        notes: searchResult.notes.map(note => ({
          ...note,
          timestamp: note.timestamp.toISOString(),
          lastModified: note.lastModified.toISOString()
        }))
      };

      return JSON.stringify(exportData, null, 2);

    } catch (error) {
      logger.error('Failed to export notes', { error });
      throw error;
    }
  }

  /**
   * Import notes from JSON
   */
  async importNotes(jsonData: string, mergeStrategy: 'replace' | 'merge' = 'merge'): Promise<number> {
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.notes || !Array.isArray(importData.notes)) {
        throw new Error('Invalid import data format');
      }

      let importedCount = 0;

      for (const noteData of importData.notes) {
        try {
          // Convert date strings back to Date objects
          const note: PlayerNote = {
            ...noteData,
            timestamp: new Date(noteData.timestamp),
            lastModified: new Date(noteData.lastModified),
            userId: this.userId, // Override with current user
            courseId: this.courseId // Override with current course
          };

          // Check if note already exists
          const existingNote = this.notesCache.get(note.id);
          
          if (existingNote) {
            if (mergeStrategy === 'replace' || note.lastModified > existingNote.lastModified) {
              await this.updateNote(note.id, {
                title: note.title,
                content: note.content,
                sectionId: note.sectionId,
                videoPosition: note.videoPosition,
                tags: note.tags,
                isPrivate: note.isPrivate
              });
              importedCount++;
            }
          } else {
            // Create new note with original ID
            this.notesCache.set(note.id, note);
            note.tags.forEach(tag => this.tagsCache.add(tag));
            this.pendingChanges.add(note.id);
            this.queueSync(() => this.syncNoteToStorage(note));
            importedCount++;
          }

        } catch (noteError) {
          logger.warn('Failed to import individual note', { noteError, noteData });
        }
      }

      logger.info('Notes imported successfully', {
        userId: this.userId,
        courseId: this.courseId,
        importedCount,
        totalNotes: importData.notes.length
      });

      return importedCount;

    } catch (error) {
      logger.error('Failed to import notes', { error });
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
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }

    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    this.removeAllListeners();
    this.notesCache.clear();
    this.tagsCache.clear();
    this.pendingChanges.clear();
    this.syncQueue = [];
    
    logger.info('Notes manager destroyed', {
      userId: this.userId,
      courseId: this.courseId
    });
  }

  // ===== PRIVATE METHODS =====

  /**
   * Generate note metadata
   */
  private generateNoteMetadata(content: string): PlayerNote['metadata'] {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    const wordCount = textContent.trim().split(/\s+/).filter(word => word.length > 0).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200)); // 200 words per minute
    const hasLinks = /<a\s+[^>]*href/i.test(content);
    const hasFormatting = /<(b|i|u|strong|em|mark|code)\b[^>]*>/i.test(content);

    return {
      wordCount,
      readingTime,
      hasLinks,
      hasFormatting,
      version: 1
    };
  }

  /**
   * Load notes from local storage
   */
  private async loadNotesFromStorage(): Promise<void> {
    try {
      const storageKey = `notes_${this.userId}_${this.courseId}`;
      const storedData = localStorage.getItem(storageKey);
      
      if (storedData) {
        const notes: PlayerNote[] = JSON.parse(storedData).map((note: any) => ({
          ...note,
          timestamp: new Date(note.timestamp),
          lastModified: new Date(note.lastModified)
        }));

        // Load into cache
        notes.forEach(note => {
          this.notesCache.set(note.id, note);
          note.tags.forEach(tag => this.tagsCache.add(tag));
        });

        // Respect cache size limit
        if (this.notesCache.size > this.options.cacheSize) {
          const sortedNotes = Array.from(this.notesCache.values())
            .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
            .slice(this.options.cacheSize);

          this.notesCache.clear();
          this.tagsCache.clear();

          sortedNotes.forEach(note => {
            this.notesCache.set(note.id, note);
            note.tags.forEach(tag => this.tagsCache.add(tag));
          });
        }
      }

    } catch (error) {
      logger.error('Failed to load notes from storage', { error });
    }
  }

  /**
   * Sync note to storage
   */
  private async syncNoteToStorage(note: PlayerNote): Promise<void> {
    try {
      const storageKey = `notes_${this.userId}_${this.courseId}`;
      const notes = Array.from(this.notesCache.values());
      localStorage.setItem(storageKey, JSON.stringify(notes));
      
      // Remove from pending changes
      this.pendingChanges.delete(note.id);

    } catch (error) {
      logger.error('Failed to sync note to storage', { error, noteId: note.id });
      throw error;
    }
  }

  /**
   * Delete note from storage
   */
  private async deleteNoteFromStorage(noteId: string): Promise<void> {
    try {
      const storageKey = `notes_${this.userId}_${this.courseId}`;
      const notes = Array.from(this.notesCache.values());
      localStorage.setItem(storageKey, JSON.stringify(notes));

    } catch (error) {
      logger.error('Failed to delete note from storage', { error, noteId });
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

  /**
   * Start auto-save
   */
  private startAutoSave(): void {
    this.autoSaveTimer = setInterval(() => {
      if (this.pendingChanges.size > 0) {
        this.processSyncQueue();
      }
    }, this.options.autoSaveInterval);
  }
}

/**
 * Factory function to create NotesManager instance
 */
export function createNotesManager(
  userId: string, 
  courseId: string, 
  options: Partial<NotesManagerOptions> = {}
): NotesManager {
  return new NotesManager(userId, courseId, options);
}

export default NotesManager;