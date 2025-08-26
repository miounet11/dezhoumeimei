'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, Save, Edit3, Trash2, Calendar, Clock, Tag, Share2, Download, Upload, BookOpen, Filter, Plus, X, Type, Bold, Italic, Link } from 'lucide-react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('note-taking');

/**
 * Note Data Structure
 */
export interface PlayerNote {
  id: string;
  userId: string;
  courseId: string;
  sectionId: string;
  title: string;
  content: string;
  timestamp: Date;
  videoPosition?: number; // seconds in video when note was created
  tags: string[];
  isPrivate: boolean;
  lastModified: Date;
  metadata?: {
    wordCount: number;
    readingTime: number;
    hasLinks: boolean;
    hasFormatting: boolean;
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
}

interface NoteTakingProps {
  userId: string;
  courseId: string;
  currentSectionId: string;
  currentVideoPosition?: number;
  onNoteCreated?: (note: PlayerNote) => void;
  onNoteUpdated?: (note: PlayerNote) => void;
  onNoteDeleted?: (noteId: string) => void;
  className?: string;
}

/**
 * Rich Text Editor Component for Notes
 */
interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Write your note...",
  autoFocus = false,
  className = ""
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [selection, setSelection] = useState<Range | null>(null);

  const handleFormat = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          handleFormat('bold');
          break;
        case 'i':
          e.preventDefault();
          handleFormat('italic');
          break;
        case 'u':
          e.preventDefault();
          handleFormat('underline');
          break;
      }
    }
  }, [handleFormat]);

  const saveSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      setSelection(selection.getRangeAt(0).cloneRange());
    }
  }, []);

  const restoreSelection = useCallback(() => {
    if (selection) {
      const windowSelection = window.getSelection();
      windowSelection?.removeAllRanges();
      windowSelection?.addRange(selection);
    }
  }, [selection]);

  useEffect(() => {
    if (editorRef.current && autoFocus) {
      editorRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div className={`rich-text-editor ${className}`}>
      {/* Formatting Toolbar */}
      <div className={`flex items-center gap-1 p-2 border-b bg-gray-50 transition-opacity ${isFocused ? 'opacity-100' : 'opacity-70'}`}>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            restoreSelection();
            handleFormat('bold');
          }}
          className="p-1.5 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-800"
          title="Bold (Ctrl+B)"
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            restoreSelection();
            handleFormat('italic');
          }}
          className="p-1.5 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-800"
          title="Italic (Ctrl+I)"
        >
          <Italic size={14} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            restoreSelection();
            handleFormat('underline');
          }}
          className="p-1.5 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-800"
          title="Underline (Ctrl+U)"
        >
          <Type size={14} />
        </button>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            restoreSelection();
            const url = prompt('Enter URL:');
            if (url) {
              handleFormat('createLink', url);
            }
          }}
          className="p-1.5 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-800"
          title="Insert Link"
        >
          <Link size={14} />
        </button>
      </div>

      {/* Editor Content */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="min-h-32 p-3 focus:outline-none prose prose-sm max-w-none"
        placeholder={placeholder}
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        onKeyDown={handleKeyDown}
        dangerouslySetInnerHTML={{ __html: value }}
        style={{
          minHeight: '128px',
          lineHeight: '1.6'
        }}
      />
    </div>
  );
};

/**
 * Note Item Component
 */
interface NoteItemProps {
  note: PlayerNote;
  isSelected: boolean;
  onSelect: (note: PlayerNote) => void;
  onEdit: (note: PlayerNote) => void;
  onDelete: (noteId: string) => void;
  onShare: (note: PlayerNote) => void;
}

const NoteItem: React.FC<NoteItemProps> = ({
  note,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onShare
}) => {
  const formatVideoPosition = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getContentPreview = (htmlContent: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  };

  return (
    <div
      onClick={() => onSelect(note)}
      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
        isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      {/* Note Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate">
            {note.title || 'Untitled Note'}
          </h4>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>{note.timestamp.toLocaleDateString()}</span>
            </div>
            {note.videoPosition !== undefined && (
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>{formatVideoPosition(note.videoPosition)}</span>
              </div>
            )}
            {note.metadata && (
              <span>{note.metadata.wordCount} words</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(note);
            }}
            className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
            title="Edit note"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare(note);
            }}
            className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
            title="Share note"
          >
            <Share2 size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Are you sure you want to delete this note?')) {
                onDelete(note.id);
              }
            }}
            className="p-1 hover:bg-gray-100 rounded text-red-500 hover:text-red-700"
            title="Delete note"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Note Content Preview */}
      <div className="text-sm text-gray-700 leading-relaxed">
        {getContentPreview(note.content)}
      </div>

      {/* Tags */}
      {note.tags.length > 0 && (
        <div className="flex items-center gap-1 mt-3 flex-wrap">
          {note.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
            >
              {tag}
            </span>
          ))}
          {note.tags.length > 3 && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
              +{note.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Main NoteTaking Component
 */
export const NoteTaking: React.FC<NoteTakingProps> = ({
  userId,
  courseId,
  currentSectionId,
  currentVideoPosition,
  onNoteCreated,
  onNoteUpdated,
  onNoteDeleted,
  className = ""
}) => {
  const [notes, setNotes] = useState<PlayerNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<PlayerNote | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<NoteSearchFilters>({});
  const [isLoading, setIsLoading] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);

  // Editor state for creating/editing notes
  const [editingNote, setEditingNote] = useState<Partial<PlayerNote>>({
    title: '',
    content: '',
    tags: [],
    isPrivate: true,
    sectionId: currentSectionId,
    videoPosition: currentVideoPosition
  });

  // Load notes on component mount
  useEffect(() => {
    loadNotes();
  }, [userId, courseId]);

  // Update video position when it changes
  useEffect(() => {
    if (isCreating || isEditing) {
      setEditingNote(prev => ({
        ...prev,
        videoPosition: currentVideoPosition
      }));
    }
  }, [currentVideoPosition, isCreating, isEditing]);

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would call the notes-manager service
      // For now, simulate loading from local storage or API
      const storedNotes = localStorage.getItem(`notes_${userId}_${courseId}`);
      if (storedNotes) {
        const parsedNotes = JSON.parse(storedNotes).map((note: any) => ({
          ...note,
          timestamp: new Date(note.timestamp),
          lastModified: new Date(note.lastModified)
        }));
        setNotes(parsedNotes);
        
        // Extract unique tags
        const tags = new Set<string>();
        parsedNotes.forEach((note: PlayerNote) => {
          note.tags.forEach(tag => tags.add(tag));
        });
        setAllTags(Array.from(tags));
      }
    } catch (error) {
      logger.error('Failed to load notes', { error });
    } finally {
      setIsLoading(false);
    }
  };

  const saveNote = async (noteData: Partial<PlayerNote>) => {
    try {
      const now = new Date();
      const noteMetadata = {
        wordCount: getWordCount(noteData.content || ''),
        readingTime: Math.ceil(getWordCount(noteData.content || '') / 200),
        hasLinks: (noteData.content || '').includes('<a '),
        hasFormatting: hasRichFormatting(noteData.content || '')
      };

      if (selectedNote && isEditing) {
        // Update existing note
        const updatedNote: PlayerNote = {
          ...selectedNote,
          ...noteData,
          lastModified: now,
          metadata: noteMetadata
        };
        
        const updatedNotes = notes.map(note => 
          note.id === selectedNote.id ? updatedNote : note
        );
        setNotes(updatedNotes);
        localStorage.setItem(`notes_${userId}_${courseId}`, JSON.stringify(updatedNotes));
        
        setSelectedNote(updatedNote);
        onNoteUpdated?.(updatedNote);
        
      } else {
        // Create new note
        const newNote: PlayerNote = {
          id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          courseId,
          sectionId: currentSectionId,
          title: noteData.title || 'Untitled Note',
          content: noteData.content || '',
          timestamp: now,
          lastModified: now,
          videoPosition: noteData.videoPosition,
          tags: noteData.tags || [],
          isPrivate: noteData.isPrivate ?? true,
          metadata: noteMetadata
        };
        
        const updatedNotes = [...notes, newNote];
        setNotes(updatedNotes);
        localStorage.setItem(`notes_${userId}_${courseId}`, JSON.stringify(updatedNotes));
        
        setSelectedNote(newNote);
        onNoteCreated?.(newNote);
      }

      setIsEditing(false);
      setIsCreating(false);
      setEditingNote({
        title: '',
        content: '',
        tags: [],
        isPrivate: true,
        sectionId: currentSectionId,
        videoPosition: currentVideoPosition
      });

    } catch (error) {
      logger.error('Failed to save note', { error });
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const updatedNotes = notes.filter(note => note.id !== noteId);
      setNotes(updatedNotes);
      localStorage.setItem(`notes_${userId}_${courseId}`, JSON.stringify(updatedNotes));
      
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
      
      onNoteDeleted?.(noteId);
    } catch (error) {
      logger.error('Failed to delete note', { error });
    }
  };

  const shareNote = async (note: PlayerNote) => {
    try {
      // Create shareable content
      const shareData = {
        title: note.title,
        text: `Check out this note from my poker learning: "${note.title}"`,
        url: window.location.href
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(
          `${note.title}\n\n${note.content}\n\nShared from PokerIQ Pro Course`
        );
        alert('Note copied to clipboard!');
      }
    } catch (error) {
      logger.error('Failed to share note', { error });
    }
  };

  const exportNotes = () => {
    try {
      const exportData = {
        courseId,
        exportDate: new Date().toISOString(),
        notes: filteredNotes
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `course_notes_${courseId}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('Failed to export notes', { error });
    }
  };

  // Helper functions
  const getWordCount = (htmlContent: string): number => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const hasRichFormatting = (htmlContent: string): boolean => {
    return /<(b|i|u|strong|em|a)\b[^>]*>/i.test(htmlContent);
  };

  // Filter notes based on search and filters
  const filteredNotes = useMemo(() => {
    let result = notes;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(note =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        note.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      result = result.filter(note =>
        filters.tags!.some(tag => note.tags.includes(tag))
      );
    }

    if (filters.sectionId) {
      result = result.filter(note => note.sectionId === filters.sectionId);
    }

    if (filters.isPrivate !== undefined) {
      result = result.filter(note => note.isPrivate === filters.isPrivate);
    }

    return result.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  }, [notes, searchQuery, filters]);

  return (
    <div className={`note-taking-container ${className}`}>
      <div className="flex h-full">
        {/* Notes List Sidebar */}
        <div className="w-1/3 border-r bg-gray-50">
          {/* Header */}
          <div className="p-4 border-b bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <BookOpen size={18} />
                My Notes
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setIsCreating(true);
                    setIsEditing(false);
                    setSelectedNote(null);
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded text-blue-600"
                  title="Create new note"
                >
                  <Plus size={16} />
                </button>
                <button
                  onClick={exportNotes}
                  className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
                  title="Export notes"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-gray-400" />
              <select
                value={filters.sectionId || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, sectionId: e.target.value || undefined }))}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="">All sections</option>
                <option value={currentSectionId}>Current section</option>
              </select>
            </div>
          </div>

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading notes...</div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? 'No notes match your search' : 'No notes yet'}
              </div>
            ) : (
              filteredNotes.map(note => (
                <NoteItem
                  key={note.id}
                  note={note}
                  isSelected={selectedNote?.id === note.id}
                  onSelect={setSelectedNote}
                  onEdit={(note) => {
                    setSelectedNote(note);
                    setEditingNote(note);
                    setIsEditing(true);
                    setIsCreating(false);
                  }}
                  onDelete={deleteNote}
                  onShare={shareNote}
                />
              ))
            )}
          </div>
        </div>

        {/* Note Editor/Viewer */}
        <div className="flex-1 flex flex-col">
          {(isCreating || isEditing) ? (
            /* Note Editor */
            <div className="h-full flex flex-col">
              {/* Editor Header */}
              <div className="p-4 border-b bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">
                    {isEditing ? 'Edit Note' : 'Create New Note'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setIsCreating(false);
                        setEditingNote({
                          title: '',
                          content: '',
                          tags: [],
                          isPrivate: true,
                          sectionId: currentSectionId,
                          videoPosition: currentVideoPosition
                        });
                      }}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => saveNote(editingNote)}
                      className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-1"
                    >
                      <Save size={14} />
                      Save
                    </button>
                  </div>
                </div>

                {/* Note Metadata */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    value={editingNote.title || ''}
                    onChange={(e) => setEditingNote(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Note title..."
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={editingNote.isPrivate ?? true}
                        onChange={(e) => setEditingNote(prev => ({ ...prev, isPrivate: e.target.checked }))}
                        className="rounded"
                      />
                      Private note
                    </label>
                  </div>
                </div>

                {/* Tags */}
                <div className="mb-4">
                  <label className="block text-sm text-gray-600 mb-2">Tags</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {(editingNote.tags || []).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded flex items-center gap-1"
                      >
                        {tag}
                        <button
                          onClick={() => setEditingNote(prev => ({
                            ...prev,
                            tags: prev.tags?.filter((_, i) => i !== index) || []
                          }))}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      placeholder="Add tag..."
                      className="px-2 py-1 text-xs border border-gray-300 rounded"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const value = (e.target as HTMLInputElement).value.trim();
                          if (value && !(editingNote.tags || []).includes(value)) {
                            setEditingNote(prev => ({
                              ...prev,
                              tags: [...(prev.tags || []), value]
                            }));
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Video Position */}
                {editingNote.videoPosition !== undefined && (
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <Clock size={14} />
                    <span>Timestamp: {Math.floor(editingNote.videoPosition / 60)}:{(editingNote.videoPosition % 60).toFixed(0).padStart(2, '0')}</span>
                  </div>
                )}
              </div>

              {/* Rich Text Editor */}
              <div className="flex-1">
                <RichTextEditor
                  value={editingNote.content || ''}
                  onChange={(content) => setEditingNote(prev => ({ ...prev, content }))}
                  placeholder="Write your note here..."
                  autoFocus
                  className="h-full border-0"
                />
              </div>
            </div>
          ) : selectedNote ? (
            /* Note Viewer */
            <div className="h-full flex flex-col">
              {/* Note Header */}
              <div className="p-4 border-b bg-white">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{selectedNote.title}</h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingNote(selectedNote);
                        setIsEditing(true);
                        setIsCreating(false);
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
                      title="Edit note"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => shareNote(selectedNote)}
                      className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
                      title="Share note"
                    >
                      <Share2 size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this note?')) {
                          deleteNote(selectedNote.id);
                        }
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded text-red-600"
                      title="Delete note"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                {/* Note Metadata */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{selectedNote.timestamp.toLocaleDateString()}</span>
                  </div>
                  {selectedNote.videoPosition !== undefined && (
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{Math.floor(selectedNote.videoPosition / 60)}:{(selectedNote.videoPosition % 60).toFixed(0).padStart(2, '0')}</span>
                    </div>
                  )}
                  {selectedNote.metadata && (
                    <>
                      <span>{selectedNote.metadata.wordCount} words</span>
                      <span>{selectedNote.metadata.readingTime} min read</span>
                    </>
                  )}
                </div>

                {/* Tags */}
                {selectedNote.tags.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {selectedNote.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Note Content */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedNote.content }}
                />
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No note selected</p>
                <p className="text-sm mb-4">Select a note from the sidebar or create a new one</p>
                <button
                  onClick={() => {
                    setIsCreating(true);
                    setIsEditing(false);
                    setSelectedNote(null);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 mx-auto"
                >
                  <Plus size={16} />
                  Create New Note
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteTaking;