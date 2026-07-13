import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { postId, results } = body;

    const allSuccess = results.every((r: { status: string }) => r.status === 'published');

    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;
    let totalReaches = 0;

    for (const result of results) {
      if (result.status === 'published' && result.engagement) {
        totalLikes += result.engagement.likes || 0;
        totalComments += result.engagement.comments || 0;
        totalShares += result.engagement.shares || 0;
        totalReaches += result.engagement.reaches || 0;
      }
    }

    const updatedPost = await db.scheduledPost.update({
      where: { id: postId },
      data: {
        status: allSuccess ? 'published' : 'failed',
        publishedAt: allSuccess ? new Date() : null,
        likes: totalLikes,
        comments: totalComments,
        shares: totalShares,
        reaches: totalReaches,
      },
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error('Error updating post status:', error);
    return NextResponse.json({ error: 'Failed to update post status' }, { status: 500 });
  }
}
