/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const env = process.env as any;
  const db = env.DB;
  
  try {
    // 1. request ထဲက body ကို အရင်ယူရမယ်
    const body = await request.json();
    const { adminKey, action, postId } = body;
    
    // 2. Admin Key စစ်ဆေးခြင်း
    const MASTER_ADMIN_KEY = env.ADMIN_KEY || "232003"; 
    if (adminKey !== MASTER_ADMIN_KEY) {
      return NextResponse.json({ error: "Access Denied" }, { status: 401 });
    }

    // 3. Logic: Toggle Pin (Post ကို အပေါ်ကပ်ခြင်း/ဖြုတ်ခြင်း)
    if (action === "togglePin" && postId) {
      await db.prepare('UPDATE posts SET is_pinned = CASE WHEN is_pinned = 1 THEN 0 ELSE 1 END WHERE id = ?')
        .bind(postId).run();
      return NextResponse.json({ success: true, message: "Toggle Pin Success" });
    }

    // 4. Dashboard အတွက် လိုအပ်တဲ့ Data တွေ ဆွဲထုတ်ခြင်း
    // Feedbacks စာရင်း
    const { results: feedbacks } = await db.prepare('SELECT * FROM feedbacks ORDER BY created_at DESC').all();
    
    // Manage လုပ်ဖို့ Post စာရင်း (Pin လုပ်ထားတာတွေကို အပေါ်မှာ အရင်ပြမယ်)
    const { results: allPosts } = await db.prepare('SELECT id, content, is_pinned, created_at FROM posts ORDER BY created_at DESC').all();

    // ကိန်းဂဏန်း အချက်အလက်များ
    const { results: statsResults } = await db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM posts) as totalPosts,
        (SELECT COUNT(*) FROM comments) as totalComments,
        (SELECT COUNT(*) FROM feedbacks) as totalFeedbacks
    `).all();

    const stats = statsResults[0];

    // 5. အကုန်အောင်မြင်ရင် Data တွေ ပြန်ပို့ပေးမယ်
    return NextResponse.json({ 
      success: true, 
      feedbacks, 
      allPosts, 
      stats 
    });

  } catch (error: any) {
    // Error တက်ရင် ဒီကနေ ပြန်ပြောမယ်
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}