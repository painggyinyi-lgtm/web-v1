/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const env = process.env as any;
  const db = env.DB;
  
  try {
    const { adminKey } = await request.json();
    const MASTER_ADMIN_KEY = env.ADMIN_KEY || "232003"; 

    if (adminKey !== MASTER_ADMIN_KEY) {
      return NextResponse.json({ error: "Access Denied" }, { status: 401 });
    }

    // Feedback တွေရော၊ Post အရေအတွက်တွေကိုပါ ဆွဲထုတ်မယ်
    const { results: feedbacks } = await db.prepare('SELECT * FROM feedbacks ORDER BY created_at DESC').all();
    const { results: stats } = await db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM posts) as totalPosts,
        (SELECT COUNT(*) FROM comments) as totalComments,
        (SELECT COUNT(*) FROM feedbacks) as totalFeedbacks
    `).all();

    return NextResponse.json({ success: true, feedbacks, stats: stats[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}