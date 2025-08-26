import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuthToken } from '../../../../lib/auth/jwt';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const createBookmarkSchema = z.object({
  courseId: z.string().uuid(),
  chapterId: z.string().uuid().optional(),
  contentId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  timestamp: z.number().min(0), // Video timestamp in seconds
  category: z.enum(['important', 'review', 'question', 'reference', 'custom']).default('reference'),
  customCategory: z.string().max(50).optional(),
  tags: z.array(z.string()).optional().default([]),
  isPublic: z.boolean().default(false),
  metadata: z.record(z.any()).optional()
});

const updateBookmarkSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  timestamp: z.number().min(0).optional(),
  category: z.enum(['important', 'review', 'question', 'reference', 'custom']).optional(),
  customCategory: z.string().max(50).optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  metadata: z.record(z.any()).optional()
});

const bookmarksQuerySchema = z.object({
  courseId: z.string().uuid().optional(),
  chapterId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  tags: z.string().optional(), // comma-separated
  startTime: z.coerce.number().optional(),
  endTime: z.coerce.number().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  sortBy: z.enum(['created', 'updated', 'title', 'timestamp']).default('timestamp'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  includePublic: z.boolean().default(false)
});

const exportBookmarksSchema = z.object({
  courseId: z.string().uuid().optional(),
  chapterId: z.string().uuid().optional(),
  format: z.enum(['json', 'csv', 'txt']).default('json'),
  categories: z.array(z.string()).optional(),
  dateRange: z.object({
    start: z.string().optional(),
    end: z.string().optional()
  }).optional()
});

interface Bookmark {
  id: string;
  userId: string;
  courseId: string;
  chapterId?: string;
  contentId?: string;
  title: string;
  description?: string;
  timestamp: number;
  category: string;
  customCategory?: string;
  tags: string[];
  isPublic: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  // Virtual fields
  courseName?: string;
  chapterName?: string;
  formattedTime?: string;
}

// POST - Create a new bookmark
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuthToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = createBookmarkSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input', 
          details: validationResult.error.format(),
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    const {
      courseId,
      chapterId,
      contentId,
      title,
      description,
      timestamp,
      category,
      customCategory,
      tags,
      isPublic,
      metadata
    } = validationResult.data;

    // Verify user has access to the course
    const hasAccess = await verifyUserCourseAccess(authResult.user.id, courseId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Course access denied', code: 'ACCESS_DENIED' },
        { status: 403 }
      );
    }

    // Check bookmark limits (prevent spam)
    const bookmarkCount = await countUserBookmarks(authResult.user.id, courseId);
    if (bookmarkCount >= 500) {
      return NextResponse.json(
        { error: 'Bookmark limit reached (500 bookmarks per course)', code: 'LIMIT_EXCEEDED' },
        { status: 429 }
      );
    }

    // Check for duplicate bookmarks at the same timestamp
    const duplicateExists = await checkDuplicateBookmark(
      authResult.user.id,
      courseId,
      chapterId,
      timestamp
    );

    if (duplicateExists) {
      return NextResponse.json(
        { 
          error: 'Bookmark already exists at this timestamp', 
          code: 'DUPLICATE_BOOKMARK',
          suggestUpdate: true
        },
        { status: 409 }
      );
    }

    // Generate bookmark ID
    const bookmarkId = crypto.randomUUID();
    
    // Create bookmark data
    const bookmarkData: Omit<Bookmark, 'createdAt' | 'updatedAt' | 'courseName' | 'chapterName' | 'formattedTime'> = {
      id: bookmarkId,
      userId: authResult.user.id,
      courseId,
      chapterId,
      contentId,
      title,
      description,
      timestamp,
      category: category === 'custom' ? 'custom' : category,
      customCategory: category === 'custom' ? customCategory : undefined,
      tags: tags || [],
      isPublic,
      metadata: metadata || {}
    };

    // Store bookmark
    const createdBookmark = await storeBookmark(authResult.user.id, courseId, bookmarkData);

    // Update user progress last accessed time
    await updateUserProgressAccess(authResult.user.id, courseId);

    return NextResponse.json({
      success: true,
      bookmark: createdBookmark,
      message: 'Bookmark created successfully'
    });

  } catch (error) {
    console.error('Error creating bookmark:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        code: 'SERVER_ERROR',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET - Retrieve bookmarks
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuthToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryParams = {
      courseId: searchParams.get('courseId') || undefined,
      chapterId: searchParams.get('chapterId') || undefined,
      userId: searchParams.get('userId') || authResult.user.id,
      category: searchParams.get('category') || undefined,
      search: searchParams.get('search') || undefined,
      tags: searchParams.get('tags') || undefined,
      startTime: searchParams.get('startTime'),
      endTime: searchParams.get('endTime'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
      includePublic: searchParams.get('includePublic') === 'true'
    };

    // Validate query parameters
    const validationResult = bookmarksQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid query parameters', 
          details: validationResult.error.format(),
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    const validatedParams = validationResult.data;

    // Verify user access
    if (authResult.user.id !== validatedParams.userId && authResult.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', code: 'ACCESS_DENIED' },
        { status: 403 }
      );
    }

    // Retrieve bookmarks
    const bookmarks = await retrieveBookmarks(validatedParams);

    // Get total count for pagination
    const totalCount = await countBookmarks(validatedParams);

    // Calculate pagination info
    const hasMore = (validatedParams.offset + validatedParams.limit) < totalCount;
    const totalPages = Math.ceil(totalCount / validatedParams.limit);
    const currentPage = Math.floor(validatedParams.offset / validatedParams.limit) + 1;

    // Get category summary
    const categorySummary = await getCategorySummary(
      validatedParams.userId!,
      validatedParams.courseId,
      validatedParams.chapterId
    );

    return NextResponse.json({
      success: true,
      bookmarks,
      categorySummary,
      pagination: {
        total: totalCount,
        limit: validatedParams.limit,
        offset: validatedParams.offset,
        hasMore,
        totalPages,
        currentPage
      }
    });

  } catch (error) {
    console.error('Error retrieving bookmarks:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        code: 'SERVER_ERROR',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update bookmark
export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuthToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bookmarkId, ...updateData } = body;

    if (!bookmarkId) {
      return NextResponse.json(
        { error: 'Bookmark ID required', code: 'MISSING_BOOKMARK_ID' },
        { status: 400 }
      );
    }

    // Validate update data
    const validationResult = updateBookmarkSchema.safeParse(updateData);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input', 
          details: validationResult.error.format(),
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    // Find and update the bookmark
    const updatedBookmark = await updateBookmark(bookmarkId, authResult.user.id, validationResult.data);
    
    if (!updatedBookmark) {
      return NextResponse.json(
        { error: 'Bookmark not found or access denied', code: 'BOOKMARK_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      bookmark: updatedBookmark,
      message: 'Bookmark updated successfully'
    });

  } catch (error) {
    console.error('Error updating bookmark:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        code: 'SERVER_ERROR',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Delete bookmark
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuthToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const bookmarkId = searchParams.get('bookmarkId');

    if (!bookmarkId) {
      return NextResponse.json(
        { error: 'Bookmark ID required', code: 'MISSING_BOOKMARK_ID' },
        { status: 400 }
      );
    }

    // Delete the bookmark
    const deleted = await deleteBookmark(bookmarkId, authResult.user.id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Bookmark not found or access denied', code: 'BOOKMARK_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Bookmark deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting bookmark:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        code: 'SERVER_ERROR',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Helper Functions

async function verifyUserCourseAccess(userId: string, courseId: string): Promise<boolean> {
  try {
    const userProgress = await prisma.userProgress.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      },
      include: {
        course: {
          select: { isActive: true }
        }
      }
    });

    return userProgress !== null && userProgress.course.isActive;
  } catch (error) {
    console.error('Course access verification error:', error);
    return false;
  }
}

async function countUserBookmarks(userId: string, courseId: string): Promise<number> {
  try {
    const userProgress = await prisma.userProgress.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      },
      select: { testScores: true }
    });

    const bookmarks = ((userProgress?.testScores as any)?.bookmarks || []) as Bookmark[];
    return bookmarks.length;
  } catch (error) {
    console.error('Error counting bookmarks:', error);
    return 0;
  }
}

async function checkDuplicateBookmark(
  userId: string,
  courseId: string,
  chapterId?: string,
  timestamp?: number
): Promise<boolean> {
  try {
    const userProgress = await prisma.userProgress.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      },
      select: { testScores: true }
    });

    const bookmarks = ((userProgress?.testScores as any)?.bookmarks || []) as Bookmark[];
    
    return bookmarks.some(bookmark => 
      bookmark.chapterId === chapterId && 
      Math.abs(bookmark.timestamp - (timestamp || 0)) < 5 // Within 5 seconds
    );
  } catch (error) {
    console.error('Error checking duplicate bookmark:', error);
    return false;
  }
}

async function storeBookmark(
  userId: string, 
  courseId: string, 
  bookmarkData: Omit<Bookmark, 'createdAt' | 'updatedAt' | 'courseName' | 'chapterName' | 'formattedTime'>
) {
  try {
    // Get current bookmarks from user progress
    const userProgress = await prisma.userProgress.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      },
      select: { testScores: true }
    });

    const currentData = (userProgress?.testScores as any) || {};
    const bookmarks = currentData.bookmarks || [];
    
    // Add timestamps and enhanced data
    const bookmarkWithTimestamps: Bookmark = {
      ...bookmarkData,
      createdAt: new Date(),
      updatedAt: new Date(),
      formattedTime: formatTimestamp(bookmarkData.timestamp)
    };

    bookmarks.push(bookmarkWithTimestamps);

    // Sort bookmarks by timestamp for better organization
    bookmarks.sort((a: Bookmark, b: Bookmark) => a.timestamp - b.timestamp);

    // Update user progress with new bookmark
    await prisma.userProgress.update({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      },
      data: {
        testScores: {
          ...currentData,
          bookmarks
        }
      }
    });

    return bookmarkWithTimestamps;
  } catch (error) {
    console.error('Error storing bookmark:', error);
    throw error;
  }
}

async function retrieveBookmarks(params: any): Promise<Bookmark[]> {
  try {
    const {
      userId,
      courseId,
      chapterId,
      category,
      search,
      tags,
      startTime,
      endTime,
      limit,
      offset,
      sortBy,
      sortOrder,
      includePublic
    } = params;

    // Query user progress records
    const whereClause: any = { userId };
    if (courseId) {
      whereClause.courseId = courseId;
    }

    const progressRecords = await prisma.userProgress.findMany({
      where: whereClause,
      select: {
        courseId: true,
        testScores: true,
        course: {
          select: {
            title: true
          }
        }
      }
    });

    // Extract and filter bookmarks
    let allBookmarks: Bookmark[] = [];
    
    for (const record of progressRecords) {
      const bookmarks = ((record.testScores as any)?.bookmarks || []) as Bookmark[];
      // Add course name to each bookmark
      const bookmarksWithCourse = bookmarks.map((bookmark: Bookmark) => ({
        ...bookmark,
        courseName: record.course.title,
        formattedTime: formatTimestamp(bookmark.timestamp)
      }));
      allBookmarks.push(...bookmarksWithCourse);
    }

    // Apply filters
    let filteredBookmarks = allBookmarks;

    if (chapterId) {
      filteredBookmarks = filteredBookmarks.filter(bookmark => bookmark.chapterId === chapterId);
    }

    if (category) {
      filteredBookmarks = filteredBookmarks.filter(bookmark => bookmark.category === category);
    }

    if (startTime !== undefined) {
      filteredBookmarks = filteredBookmarks.filter(bookmark => bookmark.timestamp >= startTime);
    }

    if (endTime !== undefined) {
      filteredBookmarks = filteredBookmarks.filter(bookmark => bookmark.timestamp <= endTime);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredBookmarks = filteredBookmarks.filter(bookmark => 
        bookmark.title.toLowerCase().includes(searchLower) ||
        bookmark.description?.toLowerCase().includes(searchLower) ||
        bookmark.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    if (tags) {
      const tagList = tags.split(',');
      filteredBookmarks = filteredBookmarks.filter(bookmark => 
        tagList.some(tag => bookmark.tags.includes(tag.trim()))
      );
    }

    // Sort bookmarks
    filteredBookmarks.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'created':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'updated':
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'timestamp':
          aValue = a.timestamp;
          bValue = b.timestamp;
          break;
        default:
          aValue = a.timestamp;
          bValue = b.timestamp;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Apply pagination
    return filteredBookmarks.slice(offset, offset + limit);

  } catch (error) {
    console.error('Error retrieving bookmarks:', error);
    throw error;
  }
}

async function countBookmarks(params: any): Promise<number> {
  try {
    const bookmarks = await retrieveBookmarks({
      ...params,
      limit: 10000, // Large limit to get all
      offset: 0
    });

    return bookmarks.length;
  } catch (error) {
    console.error('Error counting bookmarks:', error);
    return 0;
  }
}

async function getCategorySummary(userId: string, courseId?: string, chapterId?: string) {
  try {
    const bookmarks = await retrieveBookmarks({
      userId,
      courseId,
      chapterId,
      limit: 10000,
      offset: 0,
      sortBy: 'timestamp',
      sortOrder: 'asc'
    });

    const summary = bookmarks.reduce((acc: any, bookmark: Bookmark) => {
      const category = bookmark.category || 'uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    return summary;
  } catch (error) {
    console.error('Error getting category summary:', error);
    return {};
  }
}

async function updateBookmark(bookmarkId: string, userId: string, updateData: any): Promise<Bookmark | null> {
  try {
    // Find all user progress records that might contain the bookmark
    const progressRecords = await prisma.userProgress.findMany({
      where: { userId },
      select: {
        courseId: true,
        testScores: true
      }
    });

    for (const record of progressRecords) {
      const currentData = (record.testScores as any) || {};
      const bookmarks = currentData.bookmarks || [];
      
      const bookmarkIndex = bookmarks.findIndex((bookmark: Bookmark) => bookmark.id === bookmarkId);
      
      if (bookmarkIndex !== -1) {
        // Update the bookmark
        const updatedBookmark = {
          ...bookmarks[bookmarkIndex],
          ...updateData,
          updatedAt: new Date(),
          formattedTime: updateData.timestamp ? formatTimestamp(updateData.timestamp) : bookmarks[bookmarkIndex].formattedTime
        };

        bookmarks[bookmarkIndex] = updatedBookmark;

        // Re-sort if timestamp changed
        if (updateData.timestamp !== undefined) {
          bookmarks.sort((a: Bookmark, b: Bookmark) => a.timestamp - b.timestamp);
        }

        // Save back to database
        await prisma.userProgress.update({
          where: {
            userId_courseId: {
              userId,
              courseId: record.courseId
            }
          },
          data: {
            testScores: {
              ...currentData,
              bookmarks
            }
          }
        });

        return updatedBookmark;
      }
    }

    return null; // Bookmark not found
  } catch (error) {
    console.error('Error updating bookmark:', error);
    throw error;
  }
}

async function deleteBookmark(bookmarkId: string, userId: string): Promise<boolean> {
  try {
    // Find all user progress records that might contain the bookmark
    const progressRecords = await prisma.userProgress.findMany({
      where: { userId },
      select: {
        courseId: true,
        testScores: true
      }
    });

    for (const record of progressRecords) {
      const currentData = (record.testScores as any) || {};
      const bookmarks = currentData.bookmarks || [];
      
      const bookmarkIndex = bookmarks.findIndex((bookmark: Bookmark) => bookmark.id === bookmarkId);
      
      if (bookmarkIndex !== -1) {
        // Remove the bookmark
        bookmarks.splice(bookmarkIndex, 1);

        // Save back to database
        await prisma.userProgress.update({
          where: {
            userId_courseId: {
              userId,
              courseId: record.courseId
            }
          },
          data: {
            testScores: {
              ...currentData,
              bookmarks
            }
          }
        });

        return true;
      }
    }

    return false; // Bookmark not found
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    throw error;
  }
}

async function updateUserProgressAccess(userId: string, courseId: string) {
  try {
    await prisma.userProgress.update({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      },
      data: {
        lastAccessed: new Date()
      }
    });
  } catch (error) {
    console.error('Error updating user progress access:', error);
  }
}

function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}