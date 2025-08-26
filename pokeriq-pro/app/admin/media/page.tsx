/**
 * Admin Media Library Page
 * File upload, organization, and management interface
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminPage } from '@/components/admin/AdminLayout';

interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  category: string;
  tags: string[];
  uploadedBy: string;
  uploadedAt: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    thumbnail?: string;
  };
}

interface MediaStats {
  totalFiles: number;
  totalSize: number;
  categories: {
    video: number;
    image: number;
    audio: number;
    document: number;
  };
}

export default function AdminMediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [stats, setStats] = useState<MediaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    mimeType: ''
  });

  // Mock data for development
  const mockFiles: MediaFile[] = [
    {
      id: '1',
      filename: 'poker-basics-video.mp4',
      originalName: 'Poker Basics Tutorial.mp4',
      mimeType: 'video/mp4',
      size: 25600000,
      url: '/media/videos/poker-basics-video.mp4',
      category: 'video',
      tags: ['poker', 'basics', 'tutorial'],
      uploadedBy: 'admin',
      uploadedAt: '2024-01-15T10:00:00Z',
      metadata: {
        duration: 1800,
        thumbnail: '/media/thumbnails/poker-basics-thumb.jpg'
      }
    },
    {
      id: '2',
      filename: 'hand-rankings-chart.png',
      originalName: 'Hand Rankings Chart.png',
      mimeType: 'image/png',
      size: 1024000,
      url: '/media/images/hand-rankings-chart.png',
      category: 'image',
      tags: ['chart', 'reference', 'hand-rankings'],
      uploadedBy: 'admin',
      uploadedAt: '2024-01-10T12:30:00Z',
      metadata: {
        width: 1920,
        height: 1080
      }
    },
    {
      id: '3',
      filename: 'course-notes.pdf',
      originalName: 'Advanced Strategy Course Notes.pdf',
      mimeType: 'application/pdf',
      size: 512000,
      url: '/media/documents/course-notes.pdf',
      category: 'document',
      tags: ['notes', 'strategy', 'advanced'],
      uploadedBy: 'content_admin',
      uploadedAt: '2024-01-08T14:20:00Z'
    }
  ];

  const mockStats: MediaStats = {
    totalFiles: 3,
    totalSize: 27136000,
    categories: {
      video: 1,
      image: 1,
      audio: 0,
      document: 1
    }
  };

  useEffect(() => {
    fetchMediaFiles();
  }, [filters]);

  const fetchMediaFiles = async () => {
    try {
      setLoading(true);
      
      // For development, use mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Apply filters to mock data
      let filteredFiles = mockFiles;
      
      if (filters.search) {
        filteredFiles = filteredFiles.filter(file =>
          file.originalName.toLowerCase().includes(filters.search.toLowerCase()) ||
          file.tags.some(tag => tag.toLowerCase().includes(filters.search.toLowerCase()))
        );
      }
      
      if (filters.category) {
        filteredFiles = filteredFiles.filter(file => file.category === filters.category);
      }
      
      if (filters.mimeType) {
        filteredFiles = filteredFiles.filter(file => file.mimeType.includes(filters.mimeType));
      }
      
      setFiles(filteredFiles);
      setStats(mockStats);
    } catch (error) {
      console.error('Failed to fetch media files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = useCallback(async (uploadFiles: FileList) => {
    setUploading(true);
    
    try {
      const formData = new FormData();
      Array.from(uploadFiles).forEach(file => {
        formData.append('files', file);
      });
      formData.append('category', 'auto');
      
      // In production, call API:
      // const response = await fetch('/api/admin/media', {
      //   method: 'POST',
      //   body: formData
      // });
      
      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Files uploaded:', Array.from(uploadFiles).map(f => f.name));
      fetchMediaFiles(); // Refresh the list
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFileUpload(droppedFiles);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string, category: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (category === 'document') return '📋';
    return '📁';
  };

  const renderGridView = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {files.map((file) => (
        <div
          key={file.id}
          className={`bg-white border-2 rounded-lg p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
            selectedFiles.has(file.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          }`}
          onClick={() => {
            const newSelected = new Set(selectedFiles);
            if (selectedFiles.has(file.id)) {
              newSelected.delete(file.id);
            } else {
              newSelected.add(file.id);
            }
            setSelectedFiles(newSelected);
          }}
        >
          <div className="text-center">
            {file.mimeType.startsWith('image/') ? (
              <div className="w-full h-32 bg-gray-100 rounded mb-3 overflow-hidden">
                <img
                  src={file.url}
                  alt={file.originalName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiAxNkMxNC4yMDkxIDE2IDE2IDEyLjIwOTEgMTYgMTBDMTYgNy43OTA5IDE0LjIwOTEgNiAxMiA2QzkuNzkwODYgNiA4IDcuNzkwOSA4IDEwQzggMTIuMjA5MSA5Ljc5MDg2IDE2IDEyIDE2WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-32 bg-gray-100 rounded mb-3 flex items-center justify-center">
                <span className="text-4xl">{getFileIcon(file.mimeType, file.category)}</span>
              </div>
            )}
            
            <h4 className="text-sm font-medium text-gray-900 truncate" title={file.originalName}>
              {file.originalName}
            </h4>
            <p className="text-xs text-gray-500 mt-1">{formatFileSize(file.size)}</p>
            
            {file.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {file.tags.slice(0, 2).map(tag => (
                  <span
                    key={tag}
                    className="inline-block bg-gray-100 text-gray-600 text-xs px-1 py-0.5 rounded"
                  >
                    {tag}
                  </span>
                ))}
                {file.tags.length > 2 && (
                  <span className="text-xs text-gray-400">
                    +{file.tags.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left">
              <input
                type="checkbox"
                checked={files.length > 0 && selectedFiles.size === files.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedFiles(new Set(files.map(f => f.id)));
                  } else {
                    setSelectedFiles(new Set());
                  }
                }}
                className="rounded border-gray-300"
              />
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Size
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Uploaded
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {files.map((file) => (
            <tr key={file.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <input
                  type="checkbox"
                  checked={selectedFiles.has(file.id)}
                  onChange={(e) => {
                    const newSelected = new Set(selectedFiles);
                    if (e.target.checked) {
                      newSelected.add(file.id);
                    } else {
                      newSelected.delete(file.id);
                    }
                    setSelectedFiles(newSelected);
                  }}
                  className="rounded border-gray-300"
                />
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <span className="text-xl mr-3">{getFileIcon(file.mimeType, file.category)}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{file.originalName}</div>
                    <div className="text-sm text-gray-500">{file.filename}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                  {file.category}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {formatFileSize(file.size)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {new Date(file.uploadedAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <button className="text-blue-600 hover:text-blue-800">
                    View
                  </button>
                  <span>|</span>
                  <button className="text-blue-600 hover:text-blue-800">
                    Edit
                  </button>
                  <span>|</span>
                  <button className="text-red-600 hover:text-red-800">
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <AdminPage>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Media Library</h1>
          <p className="text-gray-600">Upload and manage course media files</p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Files</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalFiles}</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600">📁</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Storage Used</p>
                  <p className="text-2xl font-bold text-gray-900">{formatFileSize(stats.totalSize)}</p>
                </div>
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600">💾</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Images</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.categories.image}</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600">🖼️</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Videos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.categories.video}</p>
                </div>
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-red-600">🎥</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Documents</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.categories.document}</p>
                </div>
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-yellow-600">📄</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Area */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              uploading ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {uploading ? (
              <div className="space-y-2">
                <div className="text-4xl">⏳</div>
                <p className="text-blue-600 font-medium">Uploading files...</p>
                <div className="w-48 mx-auto bg-blue-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-4xl">📁</div>
                <p className="text-gray-600 font-medium">Drop files here or click to upload</p>
                <p className="text-sm text-gray-500">
                  Supports images, videos, audio files, and documents (max 50MB each)
                </p>
                <label className="inline-block">
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileUpload(e.target.files);
                      }
                    }}
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                  />
                  <span className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 cursor-pointer inline-block">
                    Choose Files
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Search files..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="audio">Audio</option>
                <option value="document">Documents</option>
              </select>

              <button
                onClick={fetchMediaFiles}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                🔄 Refresh
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">View:</span>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
              >
                ▦
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
              >
                ☰
              </button>
            </div>
          </div>

          {selectedFiles.size > 0 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-blue-800 font-medium">
                  {selectedFiles.size} file(s) selected
                </span>
                <div className="flex items-center space-x-2">
                  <button className="text-blue-600 hover:text-blue-800 text-sm">
                    Organize
                  </button>
                  <button className="text-blue-600 hover:text-blue-800 text-sm">
                    Tag
                  </button>
                  <button className="text-red-600 hover:text-red-800 text-sm">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Files Display */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-500">Loading media files...</p>
          </div>
        ) : (
          <div>
            {viewMode === 'grid' ? renderGridView() : renderListView()}
            
            {files.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <div className="text-4xl mb-4">📂</div>
                <p className="text-gray-500">No media files found</p>
                <p className="text-sm text-gray-400 mt-1">Upload some files to get started</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminPage>
  );
}