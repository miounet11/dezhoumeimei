'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Bookmark, BookmarkCheck, Plus, Search, Filter, Edit3, Trash2, 
  Share2, Download, Upload, Folder, FolderPlus, Star, Clock, 
  Calendar, Tag, ArrowUp, ArrowDown, Grid, List, MoreVertical,
  PlayCircle, Eye, Copy, ExternalLink
} from 'lucide-react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('bookmark-manager');

/**
 * Bookmark Data Structure
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
}

export type BookmarkSortBy = 'created' | 'accessed' | 'title' | 'position' | 'category';
export type BookmarkViewMode = 'grid' | 'list';

interface BookmarkManagerProps {
  userId: string;
  courseId: string;
  currentSectionId: string;
  currentVideoPosition?: number;
  onBookmarkClick?: (bookmark: PlayerBookmark) => void;
  onJumpToPosition?: (position: number, sectionId: string) => void;
  className?: string;
}

/**
 * Category Management Component
 */
interface CategoryManagerProps {
  categories: BookmarkCategory[];
  onAddCategory: (category: Omit<BookmarkCategory, 'id' | 'bookmarkCount' | 'createdAt'>) => void;
  onEditCategory: (categoryId: string, updates: Partial<BookmarkCategory>) => void;
  onDeleteCategory: (categoryId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  isOpen,
  onClose
}) => {
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: 'Folder'
  });
  const [editingCategory, setEditingCategory] = useState<BookmarkCategory | null>(null);

  const colorOptions = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6B7280'
  ];

  const handleAddCategory = () => {
    if (newCategory.name.trim()) {
      onAddCategory({
        ...newCategory,
        isDefault: false
      });
      setNewCategory({ name: '', description: '', color: '#3B82F6', icon: 'Folder' });
    }
  };

  const handleEditCategory = (category: BookmarkCategory) => {
    if (editingCategory && editingCategory.id === category.id) {
      onEditCategory(category.id, editingCategory);
      setEditingCategory(null);
    } else {
      setEditingCategory(category);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Manage Categories</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Add New Category */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-3">Add New Category</h4>
            <div className="space-y-3">
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Category name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <input
                type="text"
                value={newCategory.description}
                onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Color:</span>
                <div className="flex gap-2">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewCategory(prev => ({ ...prev, color }))}
                      className={`w-6 h-6 rounded border-2 ${
                        newCategory.color === color ? 'border-gray-400' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <button
                  onClick={handleAddCategory}
                  disabled={!newCategory.name.trim()}
                  className="ml-auto px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Categories List */}
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {categories.map(category => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: category.color }}
                  />
                  {editingCategory?.id === category.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory(prev => prev ? { ...prev, name: e.target.value } : null)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium">{category.name}</div>
                      <div className="text-sm text-gray-600">
                        {category.bookmarkCount} bookmark{category.bookmarkCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="p-1 text-gray-600 hover:text-blue-600"
                  >
                    <Edit3 size={14} />
                  </button>
                  {!category.isDefault && (
                    <button
                      onClick={() => onDeleteCategory(category.id)}
                      className="p-1 text-gray-600 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Bookmark Item Component
 */
interface BookmarkItemProps {
  bookmark: PlayerBookmark;
  categories: BookmarkCategory[];
  viewMode: BookmarkViewMode;
  onEdit: (bookmark: PlayerBookmark) => void;
  onDelete: (bookmarkId: string) => void;
  onToggleFavorite: (bookmarkId: string) => void;
  onJumpTo: (bookmark: PlayerBookmark) => void;
  onShare: (bookmark: PlayerBookmark) => void;
  onCopy: (bookmark: PlayerBookmark) => void;
}

const BookmarkItem: React.FC<BookmarkItemProps> = ({
  bookmark,
  categories,
  viewMode,
  onEdit,
  onDelete,
  onToggleFavorite,
  onJumpTo,
  onShare,
  onCopy
}) => {
  const category = categories.find(cat => cat.id === bookmark.category);
  const [showMenu, setShowMenu] = useState(false);

  const formatVideoPosition = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  if (viewMode === 'grid') {
    return (
      <div 
        className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
        style={{ borderLeftColor: bookmark.color, borderLeftWidth: '4px' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {bookmark.isFavorite && (
              <Star size={14} className="text-yellow-500 fill-current" />
            )}
            <h4 className="font-medium text-gray-900 truncate flex-1">
              {bookmark.title}
            </h4>
          </div>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100"
            >
              <MoreVertical size={14} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-6 bg-white border rounded-lg shadow-lg py-1 z-10 min-w-32">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onJumpTo(bookmark);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <PlayCircle size={14} />
                  Jump to
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(bookmark);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit3 size={14} />
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(bookmark.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Star size={14} />
                  {bookmark.isFavorite ? 'Unfavorite' : 'Favorite'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare(bookmark);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Share2 size={14} />
                  Share
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopy(bookmark);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Copy size={14} />
                  Copy
                </button>
                <hr className="my-1" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this bookmark?')) {
                      onDelete(bookmark.id);
                    }
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {bookmark.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {bookmark.description}
          </p>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-3">
            {bookmark.videoPosition !== undefined && (
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>{formatVideoPosition(bookmark.videoPosition)}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>{formatDate(bookmark.timestamp)}</span>
            </div>
          </div>
          {bookmark.accessCount > 0 && (
            <span>{bookmark.accessCount} views</span>
          )}
        </div>

        {/* Category and Tags */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {category && (
              <span 
                className="px-2 py-1 text-xs rounded"
                style={{ 
                  backgroundColor: `${category.color}20`, 
                  color: category.color 
                }}
              >
                {category.name}
              </span>
            )}
          </div>
          {bookmark.tags.length > 0 && (
            <div className="flex items-center gap-1">
              {bookmark.tags.slice(0, 2).map((tag, index) => (
                <span key={index} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                  {tag}
                </span>
              ))}
              {bookmark.tags.length > 2 && (
                <span className="text-xs text-gray-500">+{bookmark.tags.length - 2}</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="bg-white border rounded-lg p-3 hover:shadow-sm transition-shadow cursor-pointer group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div 
            className="w-3 h-12 rounded"
            style={{ backgroundColor: bookmark.color }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {bookmark.isFavorite && (
                <Star size={14} className="text-yellow-500 fill-current" />
              )}
              <h4 className="font-medium text-gray-900 truncate">
                {bookmark.title}
              </h4>
            </div>
            {bookmark.description && (
              <p className="text-sm text-gray-600 truncate mb-1">
                {bookmark.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {bookmark.videoPosition !== undefined && (
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{formatVideoPosition(bookmark.videoPosition)}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar size={12} />
                <span>{formatDate(bookmark.timestamp)}</span>
              </div>
              {category && (
                <span 
                  className="px-2 py-0.5 rounded"
                  style={{ 
                    backgroundColor: `${category.color}20`, 
                    color: category.color 
                  }}
                >
                  {category.name}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onJumpTo(bookmark);
            }}
            className="p-2 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100"
            title="Jump to position"
          >
            <PlayCircle size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(bookmark.id);
            }}
            className={`p-2 opacity-0 group-hover:opacity-100 ${
              bookmark.isFavorite ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
            }`}
            title={bookmark.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star size={16} className={bookmark.isFavorite ? 'fill-current' : ''} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(bookmark);
            }}
            className="p-2 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100"
            title="Edit bookmark"
          >
            <Edit3 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Main BookmarkManager Component
 */
export const BookmarkManager: React.FC<BookmarkManagerProps> = ({
  userId,
  courseId,
  currentSectionId,
  currentVideoPosition,
  onBookmarkClick,
  onJumpToPosition,
  className = ""
}) => {
  // State management
  const [bookmarks, setBookmarks] = useState<PlayerBookmark[]>([]);
  const [categories, setCategories] = useState<BookmarkCategory[]>([]);
  const [selectedBookmark, setSelectedBookmark] = useState<PlayerBookmark | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<BookmarkFilters>({});
  const [sortBy, setSortBy] = useState<BookmarkSortBy>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<BookmarkViewMode>('grid');
  const [isLoading, setIsLoading] = useState(false);

  // Editor state
  const [editingBookmark, setEditingBookmark] = useState<Partial<PlayerBookmark>>({
    title: '',
    description: '',
    category: '',
    tags: [],
    color: '#3B82F6',
    isFavorite: false,
    videoPosition: currentVideoPosition
  });

  // Default categories
  const defaultCategories: Omit<BookmarkCategory, 'id' | 'bookmarkCount' | 'createdAt'>[] = [
    { name: 'General', description: 'General bookmarks', color: '#6B7280', isDefault: true },
    { name: 'Key Concepts', description: 'Important concepts', color: '#3B82F6', isDefault: true },
    { name: 'Examples', description: 'Practice examples', color: '#10B981', isDefault: true },
    { name: 'Reviews', description: 'Review points', color: '#F59E0B', isDefault: true }
  ];

  // Initialize data
  useEffect(() => {
    loadData();
  }, [userId, courseId]);

  // Update video position for new bookmarks
  useEffect(() => {
    if (isCreating || isEditing) {
      setEditingBookmark(prev => ({
        ...prev,
        videoPosition: currentVideoPosition
      }));
    }
  }, [currentVideoPosition, isCreating, isEditing]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load bookmarks from storage
      const storedBookmarks = localStorage.getItem(`bookmarks_${userId}_${courseId}`);
      if (storedBookmarks) {
        const parsedBookmarks = JSON.parse(storedBookmarks).map((bookmark: any) => ({
          ...bookmark,
          timestamp: new Date(bookmark.timestamp),
          createdAt: new Date(bookmark.createdAt),
          lastAccessed: bookmark.lastAccessed ? new Date(bookmark.lastAccessed) : undefined
        }));
        setBookmarks(parsedBookmarks);
      }

      // Load categories from storage or create defaults
      const storedCategories = localStorage.getItem(`bookmark_categories_${userId}_${courseId}`);
      if (storedCategories) {
        const parsedCategories = JSON.parse(storedCategories).map((category: any) => ({
          ...category,
          createdAt: new Date(category.createdAt)
        }));
        setCategories(parsedCategories);
      } else {
        // Create default categories
        const newCategories = defaultCategories.map(cat => ({
          ...cat,
          id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          bookmarkCount: 0,
          createdAt: new Date()
        }));
        setCategories(newCategories);
        localStorage.setItem(
          `bookmark_categories_${userId}_${courseId}`, 
          JSON.stringify(newCategories)
        );
      }

    } catch (error) {
      logger.error('Failed to load bookmark data', { error });
    } finally {
      setIsLoading(false);
    }
  };

  const updateCategoryCounts = useCallback((updatedBookmarks: PlayerBookmark[]) => {
    const categoryCounts: { [key: string]: number } = {};
    updatedBookmarks.forEach(bookmark => {
      categoryCounts[bookmark.category] = (categoryCounts[bookmark.category] || 0) + 1;
    });

    setCategories(prev => prev.map(cat => ({
      ...cat,
      bookmarkCount: categoryCounts[cat.id] || 0
    })));
  }, []);

  const saveBookmark = async (bookmarkData: Partial<PlayerBookmark>) => {
    try {
      const now = new Date();

      if (selectedBookmark && isEditing) {
        // Update existing bookmark
        const updatedBookmark: PlayerBookmark = {
          ...selectedBookmark,
          ...bookmarkData,
          lastAccessed: now
        };
        
        const updatedBookmarks = bookmarks.map(bookmark => 
          bookmark.id === selectedBookmark.id ? updatedBookmark : bookmark
        );
        setBookmarks(updatedBookmarks);
        updateCategoryCounts(updatedBookmarks);
        localStorage.setItem(`bookmarks_${userId}_${courseId}`, JSON.stringify(updatedBookmarks));
        
        setSelectedBookmark(updatedBookmark);
        
      } else {
        // Create new bookmark
        const newBookmark: PlayerBookmark = {
          id: `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          courseId,
          sectionId: currentSectionId,
          title: bookmarkData.title || 'Untitled Bookmark',
          description: bookmarkData.description || '',
          videoPosition: bookmarkData.videoPosition,
          timestamp: now,
          createdAt: now,
          category: bookmarkData.category || categories[0]?.id || '',
          tags: bookmarkData.tags || [],
          isFavorite: bookmarkData.isFavorite || false,
          color: bookmarkData.color || '#3B82F6',
          accessCount: 0
        };
        
        const updatedBookmarks = [...bookmarks, newBookmark];
        setBookmarks(updatedBookmarks);
        updateCategoryCounts(updatedBookmarks);
        localStorage.setItem(`bookmarks_${userId}_${courseId}`, JSON.stringify(updatedBookmarks));
        
        setSelectedBookmark(newBookmark);
      }

      setIsEditing(false);
      setIsCreating(false);
      resetEditingState();

    } catch (error) {
      logger.error('Failed to save bookmark', { error });
    }
  };

  const deleteBookmark = async (bookmarkId: string) => {
    try {
      const updatedBookmarks = bookmarks.filter(bookmark => bookmark.id !== bookmarkId);
      setBookmarks(updatedBookmarks);
      updateCategoryCounts(updatedBookmarks);
      localStorage.setItem(`bookmarks_${userId}_${courseId}`, JSON.stringify(updatedBookmarks));
      
      if (selectedBookmark?.id === bookmarkId) {
        setSelectedBookmark(null);
      }
    } catch (error) {
      logger.error('Failed to delete bookmark', { error });
    }
  };

  const toggleFavorite = async (bookmarkId: string) => {
    try {
      const updatedBookmarks = bookmarks.map(bookmark => 
        bookmark.id === bookmarkId 
          ? { ...bookmark, isFavorite: !bookmark.isFavorite }
          : bookmark
      );
      setBookmarks(updatedBookmarks);
      localStorage.setItem(`bookmarks_${userId}_${courseId}`, JSON.stringify(updatedBookmarks));

      if (selectedBookmark?.id === bookmarkId) {
        setSelectedBookmark(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
      }
    } catch (error) {
      logger.error('Failed to toggle favorite', { error });
    }
  };

  const jumpToBookmark = (bookmark: PlayerBookmark) => {
    // Update access count
    const updatedBookmarks = bookmarks.map(b => 
      b.id === bookmark.id 
        ? { ...b, accessCount: b.accessCount + 1, lastAccessed: new Date() }
        : b
    );
    setBookmarks(updatedBookmarks);
    localStorage.setItem(`bookmarks_${userId}_${courseId}`, JSON.stringify(updatedBookmarks));

    // Notify parent component
    onBookmarkClick?.(bookmark);
    if (bookmark.videoPosition !== undefined && onJumpToPosition) {
      onJumpToPosition(bookmark.videoPosition, bookmark.sectionId);
    }
  };

  const shareBookmark = async (bookmark: PlayerBookmark) => {
    try {
      const shareText = `${bookmark.title}\n${bookmark.description || ''}\nFrom: PokerIQ Pro Course`;
      
      if (navigator.share) {
        await navigator.share({
          title: bookmark.title,
          text: shareText,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        alert('Bookmark copied to clipboard!');
      }
    } catch (error) {
      logger.error('Failed to share bookmark', { error });
    }
  };

  const copyBookmark = async (bookmark: PlayerBookmark) => {
    try {
      const copyText = `${bookmark.title}\n${bookmark.description || ''}\nPosition: ${
        bookmark.videoPosition ? `${Math.floor(bookmark.videoPosition / 60)}:${(bookmark.videoPosition % 60).toFixed(0).padStart(2, '0')}` : 'N/A'
      }`;
      
      await navigator.clipboard.writeText(copyText);
      alert('Bookmark details copied to clipboard!');
    } catch (error) {
      logger.error('Failed to copy bookmark', { error });
    }
  };

  const resetEditingState = () => {
    setEditingBookmark({
      title: '',
      description: '',
      category: categories[0]?.id || '',
      tags: [],
      color: '#3B82F6',
      isFavorite: false,
      videoPosition: currentVideoPosition
    });
  };

  // Category management functions
  const addCategory = (categoryData: Omit<BookmarkCategory, 'id' | 'bookmarkCount' | 'createdAt'>) => {
    const newCategory: BookmarkCategory = {
      ...categoryData,
      id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      bookmarkCount: 0,
      createdAt: new Date()
    };

    const updatedCategories = [...categories, newCategory];
    setCategories(updatedCategories);
    localStorage.setItem(`bookmark_categories_${userId}_${courseId}`, JSON.stringify(updatedCategories));
  };

  const editCategory = (categoryId: string, updates: Partial<BookmarkCategory>) => {
    const updatedCategories = categories.map(cat => 
      cat.id === categoryId ? { ...cat, ...updates } : cat
    );
    setCategories(updatedCategories);
    localStorage.setItem(`bookmark_categories_${userId}_${courseId}`, JSON.stringify(updatedCategories));
  };

  const deleteCategory = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category || category.isDefault) return;

    if (category.bookmarkCount > 0) {
      alert('Cannot delete category with bookmarks. Please move bookmarks first.');
      return;
    }

    const updatedCategories = categories.filter(cat => cat.id !== categoryId);
    setCategories(updatedCategories);
    localStorage.setItem(`bookmark_categories_${userId}_${courseId}`, JSON.stringify(updatedCategories));
  };

  const exportBookmarks = () => {
    try {
      const exportData = {
        courseId,
        exportDate: new Date().toISOString(),
        bookmarks: filteredBookmarks,
        categories
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookmarks_${courseId}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('Failed to export bookmarks', { error });
    }
  };

  // Filter and sort bookmarks
  const filteredBookmarks = useMemo(() => {
    let result = bookmarks;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(bookmark =>
        bookmark.title.toLowerCase().includes(query) ||
        bookmark.description?.toLowerCase().includes(query) ||
        bookmark.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply filters
    if (filters.category) {
      result = result.filter(bookmark => bookmark.category === filters.category);
    }

    if (filters.tags && filters.tags.length > 0) {
      result = result.filter(bookmark =>
        filters.tags!.some(tag => bookmark.tags.includes(tag))
      );
    }

    if (filters.isFavorite !== undefined) {
      result = result.filter(bookmark => bookmark.isFavorite === filters.isFavorite);
    }

    if (filters.sectionId) {
      result = result.filter(bookmark => bookmark.sectionId === filters.sectionId);
    }

    if (filters.hasVideoPosition !== undefined) {
      result = result.filter(bookmark => 
        (bookmark.videoPosition !== undefined) === filters.hasVideoPosition
      );
    }

    // Apply sorting
    result.sort((a, b) => {
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
          const catA = categories.find(cat => cat.id === a.category)?.name || '';
          const catB = categories.find(cat => cat.id === b.category)?.name || '';
          comparison = catA.localeCompare(catB);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [bookmarks, searchQuery, filters, sortBy, sortOrder, categories]);

  return (
    <div className={`bookmark-manager ${className}`}>
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Bookmark size={18} />
            Bookmarks ({filteredBookmarks.length})
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsCreating(true);
                setIsEditing(false);
                setSelectedBookmark(null);
                resetEditingState();
              }}
              className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              title="Add bookmark"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => setShowCategoryManager(true)}
              className="p-2 text-gray-600 hover:text-gray-800 border rounded"
              title="Manage categories"
            >
              <FolderPlus size={16} />
            </button>
            <button
              onClick={exportBookmarks}
              className="p-2 text-gray-600 hover:text-gray-800 border rounded"
              title="Export bookmarks"
            >
              <Download size={16} />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bookmarks..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            {/* Filters */}
            <div className="flex items-center gap-3">
              <select
                value={filters.category || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value || undefined }))}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="">All categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.bookmarkCount})
                  </option>
                ))}
              </select>

              <select
                value={filters.isFavorite === undefined ? '' : filters.isFavorite.toString()}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  isFavorite: e.target.value === '' ? undefined : e.target.value === 'true' 
                }))}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="">All bookmarks</option>
                <option value="true">Favorites only</option>
                <option value="false">Non-favorites</option>
              </select>

              <select
                value={filters.sectionId || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, sectionId: e.target.value || undefined }))}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="">All sections</option>
                <option value={currentSectionId}>Current section</option>
              </select>
            </div>

            {/* View Controls */}
            <div className="flex items-center gap-2">
              <select
                value={`${sortBy}_${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('_');
                  setSortBy(newSortBy as BookmarkSortBy);
                  setSortOrder(newSortOrder as 'asc' | 'desc');
                }}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="created_desc">Newest first</option>
                <option value="created_asc">Oldest first</option>
                <option value="title_asc">Title A-Z</option>
                <option value="title_desc">Title Z-A</option>
                <option value="accessed_desc">Recently accessed</option>
                <option value="position_asc">Position</option>
              </select>

              <div className="border rounded overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                  title="Grid view"
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                  title="List view"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bookmarks Content */}
      <div className="flex-1 overflow-hidden">
        {(isCreating || isEditing) ? (
          /* Bookmark Editor */
          <div className="p-4 bg-gray-50 h-full overflow-y-auto">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-semibold">
                    {isEditing ? 'Edit Bookmark' : 'Create New Bookmark'}
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setIsCreating(false);
                        resetEditingState();
                      }}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => saveBookmark(editingBookmark)}
                      disabled={!editingBookmark.title?.trim()}
                      className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      Save Bookmark
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={editingBookmark.title || ''}
                      onChange={(e) => setEditingBookmark(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter bookmark title..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={editingBookmark.description || ''}
                      onChange={(e) => setEditingBookmark(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Optional description..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Category and Color */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={editingBookmark.category || ''}
                        onChange={(e) => setEditingBookmark(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Color
                      </label>
                      <div className="flex gap-2">
                        {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'].map(color => (
                          <button
                            key={color}
                            onClick={() => setEditingBookmark(prev => ({ ...prev, color }))}
                            className={`w-8 h-8 rounded border-2 ${
                              editingBookmark.color === color ? 'border-gray-400' : 'border-gray-200'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(editingBookmark.tags || []).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded flex items-center gap-1"
                        >
                          {tag}
                          <button
                            onClick={() => setEditingBookmark(prev => ({
                              ...prev,
                              tags: prev.tags?.filter((_, i) => i !== index) || []
                            }))}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Add tags (press Enter)..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const value = (e.target as HTMLInputElement).value.trim();
                          if (value && !(editingBookmark.tags || []).includes(value)) {
                            setEditingBookmark(prev => ({
                              ...prev,
                              tags: [...(prev.tags || []), value]
                            }));
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                  </div>

                  {/* Options */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingBookmark.isFavorite || false}
                        onChange={(e) => setEditingBookmark(prev => ({ ...prev, isFavorite: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">Mark as favorite</span>
                    </label>
                    
                    {editingBookmark.videoPosition !== undefined && (
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock size={14} />
                        <span>
                          Position: {Math.floor(editingBookmark.videoPosition / 60)}:{(editingBookmark.videoPosition % 60).toFixed(0).padStart(2, '0')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Bookmarks List */
          <div className="p-4 h-full overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading bookmarks...</div>
            ) : filteredBookmarks.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Bookmark size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No bookmarks yet</p>
                <p className="text-sm mb-4">
                  {searchQuery ? 'No bookmarks match your search' : 'Create your first bookmark to get started'}
                </p>
                <button
                  onClick={() => {
                    setIsCreating(true);
                    setIsEditing(false);
                    setSelectedBookmark(null);
                    resetEditingState();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create Bookmark
                </button>
              </div>
            ) : (
              <div className={
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'space-y-3'
              }>
                {filteredBookmarks.map(bookmark => (
                  <BookmarkItem
                    key={bookmark.id}
                    bookmark={bookmark}
                    categories={categories}
                    viewMode={viewMode}
                    onEdit={(bookmark) => {
                      setSelectedBookmark(bookmark);
                      setEditingBookmark(bookmark);
                      setIsEditing(true);
                      setIsCreating(false);
                    }}
                    onDelete={deleteBookmark}
                    onToggleFavorite={toggleFavorite}
                    onJumpTo={jumpToBookmark}
                    onShare={shareBookmark}
                    onCopy={copyBookmark}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Manager Modal */}
      <CategoryManager
        categories={categories}
        onAddCategory={addCategory}
        onEditCategory={editCategory}
        onDeleteCategory={deleteCategory}
        isOpen={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
      />
    </div>
  );
};

export default BookmarkManager;