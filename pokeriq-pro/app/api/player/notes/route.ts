import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuthToken } from '../../../../lib/auth/jwt';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const createNoteSchema = z.object({
  courseId: z.string().uuid(),
  chapterId: z.string().uuid().optional(),
  contentId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  timestamp: z.number().min(0).optional(), // Video timestamp in seconds
  isPrivate: z.boolean().default(true),
  tags: z.array(z.string()).optional().default([]),
  metadata: z.record(z.any()).optional()
});

const updateNoteSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(10000).optional(),
  timestamp: z.number().min(0).optional(),
  isPrivate: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
});

const notesQuerySchema = z.object({
  courseId: z.string().uuid().optional(),
  chapterId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  search: z.string().optional(),
  tags: z.string().optional(), // comma-separated
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  sortBy: z.enum(['created', 'updated', 'title', 'timestamp']).default('updated'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

interface StudentNote {
  id: string;
  userId: string;
  courseId: string;
  chapterId?: string;
  contentId?: string;
  title: string;
  content: string;
  timestamp?: number;
  isPrivate: boolean;
  tags: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// POST - Create a new note
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
    const validationResult = createNoteSchema.safeParse(body);
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
      content,
      timestamp,
      isPrivate,
      tags,
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

    // Check note limits (prevent spam)
    const noteCount = await prisma.$queryRaw<[{ count: number }]>`
      SELECT COUNT(*) as count 
      FROM user_progress 
      WHERE "userId" = ${authResult.user.id} 
      AND "courseId" = ${courseId}
      AND jsonb_array_length(COALESCE("testScores"::jsonb->'notes', '[]'::jsonb)) >= 100
    `;

    if (noteCount[0]?.count > 0) {
      return NextResponse.json(
        { error: 'Note limit reached (100 notes per course)', code: 'LIMIT_EXCEEDED' },
        { status: 429 }
      );
    }

    // Generate note ID
    const noteId = crypto.randomUUID();
    
    // Create note data
    const noteData: Omit<StudentNote, 'createdAt' | 'updatedAt'> = {
      id: noteId,
      userId: authResult.user.id,
      courseId,
      chapterId,
      contentId,
      title,
      content,
      timestamp,
      isPrivate,
      tags: tags || [],
      metadata: metadata || {}
    };

    // Store note in user progress JSON field
    await storeNote(authResult.user.id, courseId, noteData);

    // Update user progress last accessed time
    await prisma.userProgress.update({
      where: {
        userId_courseId: {
          userId: authResult.user.id,
          courseId
        }
      },
      data: {
        lastAccessed: new Date()
      }
    });

    // Create response note with timestamps
    const createdNote: StudentNote = {
      ...noteData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return NextResponse.json({
      success: true,
      note: createdNote,
      message: 'Note created successfully'
    });

  } catch (error) {
    console.error('Error creating note:', error);
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

// GET - Retrieve notes
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
      search: searchParams.get('search') || undefined,
      tags: searchParams.get('tags') || undefined,
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder')
    };

    // Validate query parameters
    const validationResult = notesQuerySchema.safeParse(queryParams);
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

    const {
      courseId,
      chapterId,
      userId,
      search,
      tags,
      limit,
      offset,
      sortBy,
      sortOrder
    } = validationResult.data;

    // Verify user access
    if (authResult.user.id !== userId && authResult.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', code: 'ACCESS_DENIED' },
        { status: 403 }
      );
    }

    // Retrieve notes
    const notes = await retrieveNotes({
      userId,
      courseId,
      chapterId,
      search,
      tags: tags ? tags.split(',') : undefined,
      limit,
      offset,
      sortBy,
      sortOrder
    });

    // Get total count for pagination
    const totalCount = await countUserNotes({
      userId,
      courseId,
      chapterId,
      search,
      tags: tags ? tags.split(',') : undefined
    });

    // Calculate pagination info
    const hasMore = (offset + limit) < totalCount;
    const totalPages = Math.ceil(totalCount / limit);
    const currentPage = Math.floor(offset / limit) + 1;

    return NextResponse.json({
      success: true,
      notes,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore,
        totalPages,
        currentPage
      }
    });

  } catch (error) {
    console.error('Error retrieving notes:', error);
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

// PUT - Update note
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
    const { noteId, ...updateData } = body;

    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID required', code: 'MISSING_NOTE_ID' },
        { status: 400 }
      );
    }

    // Validate update data
    const validationResult = updateNoteSchema.safeParse(updateData);
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

    // Find and update the note
    const updatedNote = await updateNote(noteId, authResult.user.id, validationResult.data);
    
    if (!updatedNote) {
      return NextResponse.json(
        { error: 'Note not found or access denied', code: 'NOTE_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      note: updatedNote,
      message: 'Note updated successfully'
    });

  } catch (error) {
    console.error('Error updating note:', error);
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

// DELETE - Delete note
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
    const noteId = searchParams.get('noteId');

    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID required', code: 'MISSING_NOTE_ID' },
        { status: 400 }
      );
    }

    // Delete the note
    const deleted = await deleteNote(noteId, authResult.user.id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Note not found or access denied', code: 'NOTE_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Note deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting note:', error);
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

async function storeNote(userId: string, courseId: string, noteData: Omit<StudentNote, 'createdAt' | 'updatedAt'>) {
  try {
    // Get current notes from user progress
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
    const notes = currentData.notes || [];
    
    // Add timestamps and store
    const noteWithTimestamps = {
      ...noteData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    notes.push(noteWithTimestamps);

    // Update user progress with new note
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
          notes
        }
      }
    });

    return noteWithTimestamps;
  } catch (error) {
    console.error('Error storing note:', error);
    throw error;
  }
}

async function retrieveNotes({
  userId,
  courseId,
  chapterId,
  search,
  tags,
  limit,
  offset,
  sortBy,
  sortOrder
}: {
  userId: string;
  courseId?: string;
  chapterId?: string;
  search?: string;
  tags?: string[];
  limit: number;
  offset: number;
  sortBy: string;
  sortOrder: string;
}): Promise<StudentNote[]> {
  try {
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

    // Extract and filter notes
    let allNotes: StudentNote[] = [];
    
    for (const record of progressRecords) {
      const notes = ((record.testScores as any)?.notes || []) as StudentNote[];
      allNotes.push(...notes);
    }

    // Apply filters
    let filteredNotes = allNotes;

    if (chapterId) {
      filteredNotes = filteredNotes.filter(note => note.chapterId === chapterId);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredNotes = filteredNotes.filter(note => 
        note.title.toLowerCase().includes(searchLower) ||
        note.content.toLowerCase().includes(searchLower) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    if (tags && tags.length > 0) {
      filteredNotes = filteredNotes.filter(note => 
        tags.some(tag => note.tags.includes(tag))
      );
    }

    // Sort notes
    filteredNotes.sort((a, b) => {
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
          aValue = a.timestamp || 0;
          bValue = b.timestamp || 0;
          break;
        default:
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Apply pagination
    return filteredNotes.slice(offset, offset + limit);

  } catch (error) {
    console.error('Error retrieving notes:', error);
    throw error;
  }
}

async function countUserNotes({
  userId,
  courseId,
  chapterId,
  search,
  tags
}: {
  userId: string;
  courseId?: string;
  chapterId?: string;
  search?: string;
  tags?: string[];
}): Promise<number> {
  try {
    const notes = await retrieveNotes({
      userId,
      courseId,
      chapterId,
      search,
      tags,
      limit: 10000, // Large limit to get all
      offset: 0,
      sortBy: 'created',
      sortOrder: 'desc'
    });

    return notes.length;
  } catch (error) {
    console.error('Error counting notes:', error);
    return 0;
  }
}

async function updateNote(noteId: string, userId: string, updateData: any): Promise<StudentNote | null> {
  try {
    // Find all user progress records that might contain the note
    const progressRecords = await prisma.userProgress.findMany({
      where: { userId },
      select: {
        courseId: true,
        testScores: true
      }
    });

    for (const record of progressRecords) {
      const currentData = (record.testScores as any) || {};
      const notes = currentData.notes || [];
      
      const noteIndex = notes.findIndex((note: StudentNote) => note.id === noteId);
      
      if (noteIndex !== -1) {
        // Update the note
        const updatedNote = {
          ...notes[noteIndex],
          ...updateData,
          updatedAt: new Date().toISOString()
        };

        notes[noteIndex] = updatedNote;

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
              notes
            }
          }
        });

        return updatedNote;
      }
    }

    return null; // Note not found
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
}

async function deleteNote(noteId: string, userId: string): Promise<boolean> {
  try {
    // Find all user progress records that might contain the note
    const progressRecords = await prisma.userProgress.findMany({
      where: { userId },
      select: {
        courseId: true,
        testScores: true
      }
    });

    for (const record of progressRecords) {
      const currentData = (record.testScores as any) || {};
      const notes = currentData.notes || [];
      
      const noteIndex = notes.findIndex((note: StudentNote) => note.id === noteId);
      
      if (noteIndex !== -1) {
        // Remove the note
        notes.splice(noteIndex, 1);

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
              notes
            }
          }
        });

        return true;
      }
    }

    return false; // Note not found
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
}