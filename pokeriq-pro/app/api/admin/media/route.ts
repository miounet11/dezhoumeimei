/**
 * Admin API - Media Management
 * File upload, organization, and management for the CMS
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { isAdmin } from '@/lib/admin/permissions';

// Mock database for media files (in production, use actual database)
interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  category: string;
  tags: string[];
  uploadedBy: string;
  uploadedAt: Date;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    thumbnail?: string;
  };
}

// In-memory storage for demo (in production, use database)
const mediaFiles: MediaFile[] = [
  {
    id: '1',
    filename: 'poker-basics-video.mp4',
    originalName: 'poker-basics-video.mp4',
    mimeType: 'video/mp4',
    size: 25600000,
    path: '/media/videos/poker-basics-video.mp4',
    url: '/media/videos/poker-basics-video.mp4',
    category: 'video',
    tags: ['poker', 'basics', 'tutorial'],
    uploadedBy: 'admin',
    uploadedAt: new Date('2024-01-15'),
    metadata: {
      duration: 1800,
      thumbnail: '/media/thumbnails/poker-basics-thumb.jpg'
    }
  },
  {
    id: '2',
    filename: 'hand-rankings-chart.png',
    originalName: 'hand-rankings-chart.png',
    mimeType: 'image/png',
    size: 1024000,
    path: '/media/images/hand-rankings-chart.png',
    url: '/media/images/hand-rankings-chart.png',
    category: 'image',
    tags: ['chart', 'reference', 'hand-rankings'],
    uploadedBy: 'admin',
    uploadedAt: new Date('2024-01-10'),
    metadata: {
      width: 1920,
      height: 1080
    }
  }
];

/**
 * GET /api/admin/media
 * List media files with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const userRole = 'SUPER_ADMIN';
    if (!isAdmin(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category');
    const mimeType = searchParams.get('mimeType');

    let filteredFiles = mediaFiles;

    // Apply filters
    if (search) {
      filteredFiles = filteredFiles.filter(file => 
        file.originalName.toLowerCase().includes(search.toLowerCase()) ||
        file.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
      );
    }

    if (category) {
      filteredFiles = filteredFiles.filter(file => file.category === category);
    }

    if (mimeType) {
      filteredFiles = filteredFiles.filter(file => file.mimeType.includes(mimeType));
    }

    // Apply pagination
    const skip = (page - 1) * limit;
    const paginatedFiles = filteredFiles.slice(skip, skip + limit);

    // Calculate storage statistics
    const stats = {
      totalFiles: mediaFiles.length,
      totalSize: mediaFiles.reduce((sum, file) => sum + file.size, 0),
      categories: {
        video: mediaFiles.filter(f => f.category === 'video').length,
        image: mediaFiles.filter(f => f.category === 'image').length,
        audio: mediaFiles.filter(f => f.category === 'audio').length,
        document: mediaFiles.filter(f => f.category === 'document').length
      }
    };

    return NextResponse.json({
      success: true,
      data: {
        files: paginatedFiles,
        stats,
        pagination: {
          total: filteredFiles.length,
          page,
          pages: Math.ceil(filteredFiles.length / limit),
          limit
        }
      }
    });

  } catch (error) {
    console.error('Admin media GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch media files' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/media
 * Upload new media files
 */
export async function POST(request: NextRequest) {
  try {
    const userRole = 'SUPER_ADMIN';
    if (!isAdmin(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const category = formData.get('category') as string || 'uncategorized';
    const tags = (formData.get('tags') as string || '').split(',').filter(tag => tag.trim());

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      );
    }

    const uploadResults = [];

    for (const file of files) {
      try {
        // Validate file
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
          uploadResults.push({
            filename: file.name,
            success: false,
            error: 'File too large (max 50MB)'
          });
          continue;
        }

        // Determine file category from mime type
        let fileCategory = category;
        if (category === 'auto') {
          if (file.type.startsWith('image/')) fileCategory = 'image';
          else if (file.type.startsWith('video/')) fileCategory = 'video';
          else if (file.type.startsWith('audio/')) fileCategory = 'audio';
          else if (file.type.includes('document') || file.type.includes('pdf')) fileCategory = 'document';
          else fileCategory = 'other';
        }

        // Generate safe filename
        const timestamp = Date.now();
        const safeFilename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        // Create directory structure
        const uploadDir = path.join(process.cwd(), 'public', 'media', fileCategory);
        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true });
        }

        // Save file
        const filePath = path.join(uploadDir, safeFilename);
        const bytes = await file.arrayBuffer();
        await writeFile(filePath, Buffer.from(bytes));

        // Create media record
        const mediaFile: MediaFile = {
          id: `media_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
          filename: safeFilename,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          path: `/media/${fileCategory}/${safeFilename}`,
          url: `/media/${fileCategory}/${safeFilename}`,
          category: fileCategory,
          tags,
          uploadedBy: 'admin', // In production, get from session
          uploadedAt: new Date(),
          metadata: await generateMetadata(file, filePath)
        };

        // Add to mock database
        mediaFiles.push(mediaFile);

        uploadResults.push({
          filename: file.name,
          success: true,
          data: mediaFile
        });

      } catch (fileError) {
        uploadResults.push({
          filename: file.name,
          success: false,
          error: 'Upload failed'
        });
      }
    }

    const successCount = uploadResults.filter(r => r.success).length;
    const failCount = uploadResults.filter(r => !r.success).length;

    return NextResponse.json({
      success: successCount > 0,
      data: {
        results: uploadResults,
        summary: {
          total: files.length,
          successful: successCount,
          failed: failCount
        }
      },
      message: `${successCount} files uploaded successfully${failCount > 0 ? `, ${failCount} failed` : ''}`
    });

  } catch (error) {
    console.error('Admin media POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Upload failed' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/media
 * Bulk organize media files
 */
export async function PUT(request: NextRequest) {
  try {
    const userRole = 'SUPER_ADMIN';
    if (!isAdmin(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, fileIds, category, tags } = body;

    if (!action || !fileIds || !Array.isArray(fileIds)) {
      return NextResponse.json(
        { success: false, error: 'Action and file IDs are required' },
        { status: 400 }
      );
    }

    let updatedCount = 0;

    for (const fileId of fileIds) {
      const fileIndex = mediaFiles.findIndex(f => f.id === fileId);
      if (fileIndex === -1) continue;

      switch (action) {
        case 'categorize':
          if (category) {
            mediaFiles[fileIndex].category = category;
            updatedCount++;
          }
          break;
        
        case 'tag':
          if (tags && Array.isArray(tags)) {
            mediaFiles[fileIndex].tags = [...new Set([...mediaFiles[fileIndex].tags, ...tags])];
            updatedCount++;
          }
          break;
        
        case 'untag':
          if (tags && Array.isArray(tags)) {
            mediaFiles[fileIndex].tags = mediaFiles[fileIndex].tags.filter(tag => !tags.includes(tag));
            updatedCount++;
          }
          break;
      }
    }

    return NextResponse.json({
      success: true,
      data: { updatedCount },
      message: `${updatedCount} files updated successfully`
    });

  } catch (error) {
    console.error('Admin media PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to organize files' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/media
 * Delete media files
 */
export async function DELETE(request: NextRequest) {
  try {
    const userRole = 'SUPER_ADMIN';
    if (!isAdmin(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { fileIds } = body;

    if (!fileIds || !Array.isArray(fileIds)) {
      return NextResponse.json(
        { success: false, error: 'File IDs are required' },
        { status: 400 }
      );
    }

    let deletedCount = 0;

    for (const fileId of fileIds) {
      const fileIndex = mediaFiles.findIndex(f => f.id === fileId);
      if (fileIndex !== -1) {
        // In production, also delete the actual file from storage
        mediaFiles.splice(fileIndex, 1);
        deletedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      data: { deletedCount },
      message: `${deletedCount} files deleted successfully`
    });

  } catch (error) {
    console.error('Admin media DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete files' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to generate metadata for uploaded files
 */
async function generateMetadata(file: File, filePath: string): Promise<any> {
  const metadata: any = {};

  try {
    if (file.type.startsWith('image/')) {
      // For images, you would typically use a library like 'sharp' to get dimensions
      // For demo, return mock data
      metadata.width = 1920;
      metadata.height = 1080;
    } else if (file.type.startsWith('video/')) {
      // For videos, you would use ffmpeg or similar to get duration and generate thumbnails
      metadata.duration = 300; // 5 minutes
      metadata.thumbnail = '/media/thumbnails/default-video-thumb.jpg';
    } else if (file.type.startsWith('audio/')) {
      metadata.duration = 180; // 3 minutes
    }
  } catch (error) {
    console.error('Error generating metadata:', error);
  }

  return metadata;
}