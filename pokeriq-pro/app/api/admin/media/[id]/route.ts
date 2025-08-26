/**
 * Admin API - Individual Media File Operations
 * Single file operations for the media management system
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin/permissions';

// Mock media file data (same as in main media route)
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

// Mock database (in production, this would be a real database)
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
  }
];

/**
 * GET /api/admin/media/[id]
 * Get single media file details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userRole = 'SUPER_ADMIN';
    if (!isAdmin(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const mediaId = params.id;
    const mediaFile = mediaFiles.find(f => f.id === mediaId);

    if (!mediaFile) {
      return NextResponse.json(
        { success: false, error: 'Media file not found' },
        { status: 404 }
      );
    }

    // Calculate usage statistics (in production, query actual usage)
    const usageStats = {
      coursesUsing: [
        { id: 'course_1', title: 'Poker Fundamentals', usage: 'thumbnail' },
        { id: 'course_2', title: 'Advanced Strategy', usage: 'content_video' }
      ],
      assessmentsUsing: [
        { id: 'assessment_1', title: 'Basic Quiz', usage: 'question_image' }
      ],
      totalReferences: 3,
      lastUsed: new Date('2024-01-20')
    };

    return NextResponse.json({
      success: true,
      data: {
        ...mediaFile,
        usageStats,
        downloadUrl: `/api/admin/media/${mediaId}/download`
      }
    });

  } catch (error) {
    console.error('Admin media GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch media file' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/media/[id]
 * Update media file metadata
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userRole = 'SUPER_ADMIN';
    if (!isAdmin(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const mediaId = params.id;
    const body = await request.json();
    
    const { originalName, category, tags, metadata } = body;

    const fileIndex = mediaFiles.findIndex(f => f.id === mediaId);
    
    if (fileIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Media file not found' },
        { status: 404 }
      );
    }

    // Update media file metadata
    if (originalName) mediaFiles[fileIndex].originalName = originalName;
    if (category) mediaFiles[fileIndex].category = category;
    if (tags && Array.isArray(tags)) mediaFiles[fileIndex].tags = tags;
    if (metadata) mediaFiles[fileIndex].metadata = { ...mediaFiles[fileIndex].metadata, ...metadata };

    return NextResponse.json({
      success: true,
      data: mediaFiles[fileIndex],
      message: 'Media file updated successfully'
    });

  } catch (error) {
    console.error('Admin media PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update media file' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/media/[id]
 * Delete individual media file
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userRole = 'SUPER_ADMIN';
    if (!isAdmin(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const mediaId = params.id;
    const fileIndex = mediaFiles.findIndex(f => f.id === mediaId);
    
    if (fileIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Media file not found' },
        { status: 404 }
      );
    }

    // Check if file is being used (in production, query actual usage)
    const isUsed = checkFileUsage(mediaId);
    
    if (isUsed) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete media file that is currently in use. Please remove all references first.',
          data: { inUse: true }
        },
        { status: 409 }
      );
    }

    // Remove from mock database
    const deletedFile = mediaFiles.splice(fileIndex, 1)[0];
    
    // In production, also delete the actual file from storage
    // await deleteFileFromStorage(deletedFile.path);

    return NextResponse.json({
      success: true,
      message: 'Media file deleted successfully'
    });

  } catch (error) {
    console.error('Admin media DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete media file' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to check if file is in use
 */
function checkFileUsage(mediaId: string): boolean {
  // In production, this would query the database to check:
  // - Course content references
  // - Assessment question images
  // - User avatars
  // - System configurations
  
  // For demo, return false to allow deletion
  return false;
}