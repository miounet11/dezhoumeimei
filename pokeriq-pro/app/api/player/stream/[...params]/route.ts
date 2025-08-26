import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuthToken } from '../../../../../lib/auth/jwt';
import crypto from 'crypto';
import { z } from 'zod';

const prisma = new PrismaClient();

// Video streaming configuration
const STREAMING_CONFIG = {
  CDN_BASE_URL: process.env.CDN_BASE_URL || 'https://cdn.example.com',
  STREAM_TOKEN_SECRET: process.env.STREAM_TOKEN_SECRET || 'your-secret-key',
  MAX_CONCURRENT_STREAMS: parseInt(process.env.MAX_CONCURRENT_STREAMS || '3'),
  STREAM_DURATION_LIMIT: 8 * 60 * 60 * 1000, // 8 hours in milliseconds
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || ['https://pokeriq.pro'],
  RATE_LIMIT_REQUESTS: 100, // requests per minute
  RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute
};

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Active streams tracking (in production, use Redis)
const activeStreams = new Map<string, { userId: string; startTime: number; courseId: string }>();

// Validation schemas
const streamParamsSchema = z.object({
  courseId: z.string().uuid(),
  chapterId: z.string().uuid(),
  contentId: z.string().uuid(),
  quality: z.enum(['240p', '360p', '480p', '720p', '1080p', 'auto']).optional().default('auto'),
  format: z.enum(['hls', 'dash', 'mp4']).optional().default('hls'),
});

const streamTokenSchema = z.object({
  userId: z.string().uuid(),
  courseId: z.string().uuid(),
  contentId: z.string().uuid(),
  expires: z.number(),
  quality: z.string(),
  format: z.string(),
  sessionId: z.string(),
  ip: z.string().optional(),
});

// GET - Stream video content
export async function GET(request: NextRequest, { params }: { params: { params: string[] } }) {
  try {
    const startTime = Date.now();
    
    // Parse URL parameters
    const [action, ...pathParams] = params.params;
    
    if (action === 'manifest') {
      return handleManifestRequest(request, pathParams);
    } else if (action === 'segment') {
      return handleSegmentRequest(request, pathParams);
    } else if (action === 'auth') {
      return handleAuthRequest(request, pathParams);
    } else {
      return NextResponse.json(
        { error: 'Invalid streaming endpoint', code: 'INVALID_ENDPOINT' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Streaming error:', error);
    return NextResponse.json(
      { 
        error: 'Streaming service error', 
        code: 'STREAMING_ERROR',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Handle manifest requests (HLS/DASH)
async function handleManifestRequest(request: NextRequest, pathParams: string[]) {
  // Verify authentication and streaming token
  const authResult = await verifyStreamingAccess(request, pathParams);
  if (!authResult.success) {
    return authResult.response;
  }

  const { user, courseId, contentId, quality, format } = authResult.data;

  try {
    // Get video content details
    const videoContent = await getVideoContentDetails(courseId, contentId);
    if (!videoContent) {
      return NextResponse.json(
        { error: 'Video content not found', code: 'CONTENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Generate streaming manifest
    const manifest = await generateStreamingManifest({
      videoContent,
      quality,
      format,
      userId: user.id,
      courseId,
      contentId
    });

    // Set appropriate headers
    const headers: HeadersInit = {
      'Content-Type': format === 'hls' ? 'application/vnd.apple.mpegurl' : 'application/dash+xml',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    };

    // Add security headers for premium content
    if (videoContent.isPremium) {
      headers['X-Content-Protection'] = 'premium';
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate, private';
    }

    return new NextResponse(manifest, { headers });

  } catch (error) {
    console.error('Manifest generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate manifest', code: 'MANIFEST_ERROR' },
      { status: 500 }
    );
  }
}

// Handle video segment requests
async function handleSegmentRequest(request: NextRequest, pathParams: string[]) {
  // Verify streaming token
  const tokenResult = await verifyStreamingToken(request);
  if (!tokenResult.success) {
    return tokenResult.response;
  }

  const { userId, courseId, contentId, sessionId } = tokenResult.data;

  try {
    // Check if stream is still active
    const streamKey = `${userId}_${sessionId}`;
    const activeStream = activeStreams.get(streamKey);
    
    if (!activeStream) {
      return NextResponse.json(
        { error: 'Stream session expired', code: 'SESSION_EXPIRED' },
        { status: 401 }
      );
    }

    // Check stream duration limit
    if (Date.now() - activeStream.startTime > STREAMING_CONFIG.STREAM_DURATION_LIMIT) {
      activeStreams.delete(streamKey);
      return NextResponse.json(
        { error: 'Stream duration limit exceeded', code: 'DURATION_LIMIT' },
        { status: 403 }
      );
    }

    // Extract segment information from path
    const segmentPath = pathParams.join('/');
    const segmentInfo = parseSegmentPath(segmentPath);
    
    if (!segmentInfo) {
      return NextResponse.json(
        { error: 'Invalid segment path', code: 'INVALID_SEGMENT' },
        { status: 400 }
      );
    }

    // Proxy segment request to CDN with authentication
    const segmentResponse = await proxySegmentRequest({
      contentId,
      segmentInfo,
      userId
    });

    // Log streaming access
    logStreamingAccess(userId, courseId, contentId, segmentInfo);

    return segmentResponse;

  } catch (error) {
    console.error('Segment streaming error:', error);
    return NextResponse.json(
      { error: 'Segment streaming failed', code: 'SEGMENT_ERROR' },
      { status: 500 }
    );
  }
}

// Handle authentication requests
async function handleAuthRequest(request: NextRequest, pathParams: string[]) {
  const authResult = await verifyAuthToken(request);
  if (!authResult.success) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('courseId');
  const chapterId = searchParams.get('chapterId');
  const contentId = searchParams.get('contentId');
  const quality = searchParams.get('quality') || 'auto';
  const format = searchParams.get('format') || 'hls';

  if (!courseId || !contentId) {
    return NextResponse.json(
      { error: 'Missing required parameters', code: 'MISSING_PARAMS' },
      { status: 400 }
    );
  }

  try {
    // Verify user has access to this course
    const hasAccess = await verifyUserCourseAccess(authResult.user.id, courseId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Course access denied', code: 'ACCESS_DENIED' },
        { status: 403 }
      );
    }

    // Check concurrent streaming limits
    const activeUserStreams = Array.from(activeStreams.values())
      .filter(stream => stream.userId === authResult.user.id).length;
    
    if (activeUserStreams >= STREAMING_CONFIG.MAX_CONCURRENT_STREAMS) {
      return NextResponse.json(
        { error: 'Maximum concurrent streams exceeded', code: 'STREAM_LIMIT' },
        { status: 429 }
      );
    }

    // Generate streaming session
    const sessionId = crypto.randomUUID();
    const streamingToken = generateStreamingToken({
      userId: authResult.user.id,
      courseId,
      contentId,
      quality,
      format,
      sessionId,
      ip: getClientIP(request)
    });

    // Register active stream
    const streamKey = `${authResult.user.id}_${sessionId}`;
    activeStreams.set(streamKey, {
      userId: authResult.user.id,
      startTime: Date.now(),
      courseId
    });

    // Clean up expired streams
    cleanupExpiredStreams();

    return NextResponse.json({
      success: true,
      streamingToken,
      sessionId,
      manifestUrl: `/api/player/stream/manifest/${streamingToken}`,
      expiresAt: Date.now() + (60 * 60 * 1000), // 1 hour
      maxConcurrentStreams: STREAMING_CONFIG.MAX_CONCURRENT_STREAMS,
      currentActiveStreams: activeUserStreams + 1
    });

  } catch (error) {
    console.error('Auth request error:', error);
    return NextResponse.json(
      { error: 'Authentication failed', code: 'AUTH_ERROR' },
      { status: 500 }
    );
  }
}

// Helper Functions

async function verifyStreamingAccess(request: NextRequest, pathParams: string[]) {
  try {
    // Extract streaming token from path or query
    const token = pathParams[0] || new URL(request.url).searchParams.get('token');
    
    if (!token) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Streaming token required', code: 'TOKEN_REQUIRED' },
          { status: 401 }
        )
      };
    }

    // Verify streaming token
    const tokenResult = verifyStreamingTokenString(token);
    if (!tokenResult.success) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Invalid streaming token', code: 'INVALID_TOKEN' },
          { status: 401 }
        )
      };
    }

    // Rate limiting
    const rateLimitResult = checkRateLimit(tokenResult.data.userId, request);
    if (!rateLimitResult.success) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Rate limit exceeded', code: 'RATE_LIMIT' },
          { status: 429 }
        )
      };
    }

    // Verify origin
    const origin = request.headers.get('origin');
    if (origin && !STREAMING_CONFIG.ALLOWED_ORIGINS.includes(origin)) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Origin not allowed', code: 'ORIGIN_DENIED' },
          { status: 403 }
        )
      };
    }

    return {
      success: true,
      data: tokenResult.data
    };

  } catch (error) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Access verification failed', code: 'VERIFICATION_ERROR' },
        { status: 500 }
      )
    };
  }
}

async function verifyStreamingToken(request: NextRequest) {
  const token = request.headers.get('x-streaming-token') || 
                new URL(request.url).searchParams.get('token');
  
  if (!token) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Streaming token required', code: 'TOKEN_REQUIRED' },
        { status: 401 }
      )
    };
  }

  const result = verifyStreamingTokenString(token);
  if (!result.success) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid streaming token', code: 'INVALID_TOKEN' },
        { status: 401 }
      )
    };
  }

  return { success: true, data: result.data };
}

function generateStreamingToken(data: {
  userId: string;
  courseId: string;
  contentId: string;
  quality: string;
  format: string;
  sessionId: string;
  ip?: string;
}): string {
  const payload = {
    ...data,
    expires: Date.now() + (60 * 60 * 1000), // 1 hour
    iat: Date.now()
  };

  const jsonPayload = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', STREAMING_CONFIG.STREAM_TOKEN_SECRET)
    .update(jsonPayload)
    .digest('hex');

  return Buffer.from(jsonPayload).toString('base64') + '.' + signature;
}

function verifyStreamingTokenString(token: string) {
  try {
    const [payloadBase64, signature] = token.split('.');
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', STREAMING_CONFIG.STREAM_TOKEN_SECRET)
      .update(Buffer.from(payloadBase64, 'base64').toString())
      .digest('hex');

    if (signature !== expectedSignature) {
      return { success: false, error: 'Invalid signature' };
    }

    // Check expiration
    if (payload.expires < Date.now()) {
      return { success: false, error: 'Token expired' };
    }

    // Validate payload
    const validationResult = streamTokenSchema.safeParse(payload);
    if (!validationResult.success) {
      return { success: false, error: 'Invalid token payload' };
    }

    return { success: true, data: validationResult.data };
  } catch (error) {
    return { success: false, error: 'Token parsing failed' };
  }
}

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

async function getVideoContentDetails(courseId: string, contentId: string) {
  try {
    // This would fetch video content details from your content storage
    // For now, return a mock structure
    return {
      id: contentId,
      courseId,
      isPremium: true,
      duration: 3600, // seconds
      qualities: ['240p', '360p', '480p', '720p', '1080p'],
      formats: ['hls', 'dash'],
      cdnPath: `courses/${courseId}/content/${contentId}`
    };
  } catch (error) {
    console.error('Error getting video content:', error);
    return null;
  }
}

async function generateStreamingManifest({
  videoContent,
  quality,
  format,
  userId,
  courseId,
  contentId
}: {
  videoContent: any;
  quality: string;
  format: string;
  userId: string;
  courseId: string;
  contentId: string;
}): Promise<string> {
  
  if (format === 'hls') {
    // Generate HLS manifest
    return generateHLSManifest(videoContent, quality, userId, courseId, contentId);
  } else {
    // Generate DASH manifest
    return generateDASHManifest(videoContent, quality, userId, courseId, contentId);
  }
}

function generateHLSManifest(
  videoContent: any, 
  quality: string, 
  userId: string, 
  courseId: string, 
  contentId: string
): string {
  const baseUrl = `/api/player/stream/segment`;
  const token = generateStreamingToken({
    userId,
    courseId,
    contentId,
    quality,
    format: 'hls',
    sessionId: crypto.randomUUID()
  });

  // Simplified HLS manifest - in production, this would be more complex
  return `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:10.0,
${baseUrl}/segment0.ts?token=${token}
#EXTINF:10.0,
${baseUrl}/segment1.ts?token=${token}
#EXTINF:10.0,
${baseUrl}/segment2.ts?token=${token}
#EXT-X-ENDLIST
`;
}

function generateDASHManifest(
  videoContent: any, 
  quality: string, 
  userId: string, 
  courseId: string, 
  contentId: string
): string {
  // Simplified DASH manifest
  return `<?xml version="1.0" encoding="UTF-8"?>
<MPD xmlns="urn:mpeg:dash:schema:mpd:2011" type="static">
  <Period>
    <AdaptationSet>
      <Representation>
        <BaseURL>/api/player/stream/segment/</BaseURL>
        <SegmentTemplate media="segment$Number$.m4s" startNumber="0" />
      </Representation>
    </AdaptationSet>
  </Period>
</MPD>`;
}

function parseSegmentPath(segmentPath: string) {
  // Parse segment path to extract segment number, quality, etc.
  const match = segmentPath.match(/segment(\d+)\.(ts|m4s)$/);
  if (!match) return null;

  return {
    segmentNumber: parseInt(match[1]),
    format: match[2],
    quality: '720p' // Would be extracted from path in real implementation
  };
}

async function proxySegmentRequest({
  contentId,
  segmentInfo,
  userId
}: {
  contentId: string;
  segmentInfo: any;
  userId: string;
}) {
  // In production, this would proxy to your CDN or video storage
  // For now, return a placeholder response
  
  const headers: HeadersInit = {
    'Content-Type': segmentInfo.format === 'ts' ? 'video/MP2T' : 'video/mp4',
    'Cache-Control': 'public, max-age=3600',
    'Access-Control-Allow-Origin': '*',
  };

  // Return empty video segment (in production, fetch from CDN)
  return new NextResponse(new Uint8Array(0), { headers });
}

function checkRateLimit(userId: string, request: NextRequest) {
  const now = Date.now();
  const key = `${userId}_${getClientIP(request)}`;
  const limit = rateLimitStore.get(key);

  if (!limit || now > limit.resetTime) {
    // Reset or create new limit
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + STREAMING_CONFIG.RATE_LIMIT_WINDOW
    });
    return { success: true };
  }

  if (limit.count >= STREAMING_CONFIG.RATE_LIMIT_REQUESTS) {
    return { success: false };
  }

  limit.count++;
  return { success: true };
}

function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] || 
         request.headers.get('x-real-ip') || 
         'unknown';
}

function cleanupExpiredStreams() {
  const now = Date.now();
  for (const [key, stream] of activeStreams.entries()) {
    if (now - stream.startTime > STREAMING_CONFIG.STREAM_DURATION_LIMIT) {
      activeStreams.delete(key);
    }
  }
}

function logStreamingAccess(userId: string, courseId: string, contentId: string, segmentInfo: any) {
  // Log streaming access for analytics
  console.log(`Stream access: ${userId} - ${courseId}/${contentId} - segment ${segmentInfo.segmentNumber}`);
}