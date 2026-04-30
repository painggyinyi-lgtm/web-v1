import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// GET: Post တွေဆွဲမယ် + Online User Count + Reactions ယူမယ်
export async function GET(request: NextRequest) {
  const env = process.env as any;
  const db = env.DB;
  const KV = env.ONLINE_USERS_KV;
  
  const userIp = request.headers.get('cf-connecting-ip') || 'anonymous';

  try {
    // 1. Online User Tracking (၁ မိနစ်စာ သိမ်းမယ်)
    if (KV) {
      await KV.put(`online:${userIp}`, Date.now().toString(), { expirationTtl: 60 });
    }
    const onlineList = KV ? await KV.list({ prefix: "online:" }) : { keys: [] };
    const onlineCount = onlineList.keys.length;

    // 2. Database Logic
    const { results: posts } = await db.prepare(`
      SELECT p.*, 
      (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes,
      (SELECT reaction_type FROM post_likes WHERE post_id = p.id AND user_ip = ? LIMIT 1) as myReaction
      FROM posts p 
      ORDER BY created_at DESC
    `).bind(userIp).all();
    
    const postsWithComments = await Promise.all(posts.map(async (post: any) => {
      const { results: comments } = await db.prepare('SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC')
        .bind(post.id).all();
      
      return { 
        ...post, 
        comments, 
        isLiked: !!post.myReaction,
        reaction_type: post.myReaction || null 
      };
    }));

    return NextResponse.json({
      posts: postsWithComments,
      onlineCount: onlineCount || 1
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Rate Limiting ပါဝင်သော Post/Comment တင်ခြင်း
export async function POST(request: NextRequest) {
  const env = process.env as any;
  const db = env.DB;
  const KV = env.ONLINE_USERS_KV;
  const bucket = env.MY_BUCKET;
  const userIp = request.headers.get('cf-connecting-ip') || 'anonymous';

  try {
    const formData = await request.formData();
    const content = formData.get('content') as string;
    const post_id = formData.get('post_id') as string | null;
    const file = formData.get('file') as File | null;

    if (!content && !file) return NextResponse.json({ error: "စာသား သို့မဟုတ် ပုံ ထည့်ပါ" }, { status: 400 });

    // --- RATE LIMITING LOGIC (KV ကို သုံးထားတယ်) ---
    if (KV) {
      if (post_id) {
        // Comment Limit: ၁ မိနစ် ၃ ခု
        const commentLimitKey = `limit:comment:${userIp}`;
        const currentCount = parseInt(await KV.get(commentLimitKey) || "0");
        if (currentCount >= 3) {
          return NextResponse.json({ error: "မကြာခဏ Comment ပေးခြင်းမှ ခဏနားပါ" }, { status: 429 });
        }
        await KV.put(commentLimitKey, (currentCount + 1).toString(), { expirationTtl: 60 });
      } else {
        // Post Limit: ၅ မိနစ် ၁ ခု
        const postLimitKey = `limit:post:${userIp}`;
        const alreadyPosted = await KV.get(postLimitKey);
        if (alreadyPosted) {
          return NextResponse.json({ error: "၅ မိနစ်လျှင် တစ်ကြိမ်သာ Post တင်နိုင်ပါသည်" }, { status: 429 });
        }
        await KV.put(postLimitKey, "true", { expirationTtl: 300 }); // 300s = 5 mins
      }
    }

    // Comment တင်ခြင်း
    if (post_id) {
      await db.prepare('INSERT INTO comments (post_id, content, created_at) VALUES (?, ?, ?)')
        .bind(post_id, content, new Date().toISOString()).run();
      return NextResponse.json({ success: true, message: "Comment added" });
    } 

    // Post တင်ခြင်း + Media
    let media_url = null;
    let media_type = null;

    if (file && file.size > 0) {
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      await bucket.put(fileName, file.stream(), {
        httpMetadata: { contentType: file.type }
      });
      media_url = fileName; 
      media_type = file.type;
    }

    await db.prepare('INSERT INTO posts (content, media_url, media_type, created_at) VALUES (?, ?, ?, ?)')
      .bind(content, media_url, media_type, new Date().toISOString()).run();

    return NextResponse.json({ success: true, message: "Post created" });
  } catch (error) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PATCH: Multi-Reaction Logic (နဂိုအတိုင်း)
export async function PATCH(request: NextRequest) {
  const db = (process.env as any).DB;
  const userIp = request.headers.get('cf-connecting-ip') || 'anonymous';
  
  try {
    const { id, reactionType = 'like' } = await request.json();
    const existing = await db.prepare("SELECT reaction_type FROM post_likes WHERE post_id = ? AND user_ip = ?").bind(id, userIp).first();

    if (existing) {
      if (existing.reaction_type === reactionType) {
        await db.prepare("DELETE FROM post_likes WHERE post_id = ? AND user_ip = ?").bind(id, userIp).run();
        return NextResponse.json({ success: true, reacted: false });
      } else {
        await db.prepare("UPDATE post_likes SET reaction_type = ? WHERE post_id = ? AND user_ip = ?").bind(reactionType, id, userIp).run();
        return NextResponse.json({ success: true, reacted: true, type: reactionType });
      }
    } else {
      await db.prepare("INSERT INTO post_likes (post_id, user_ip, reaction_type) VALUES (?, ?, ?)").bind(id, userIp, reactionType).run();
      return NextResponse.json({ success: true, reacted: true, type: reactionType });
    }
  } catch (e) {
    return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
  }
}

// DELETE: Admin Only (လုံခြုံရေး ပိုကောင်းအောင် ပြင်ထားတယ်)
export async function DELETE(request: NextRequest) {
  const db = (process.env as any).DB;
  const env = process.env as any;
  try {
    const { id, adminKey } = await request.json();
    
    // Cloudflare Variables ထဲမှာ ADMIN_KEY ဆိုပြီး သတ်မှတ်ထားရင် ပိုကောင်းပါတယ်။ 
    // မရှိရင် default အနေနဲ့ "232003" ကို သုံးထားမယ်။
    const MASTER_ADMIN_KEY = env.ADMIN_KEY || "232003"; 

    if (adminKey !== MASTER_ADMIN_KEY) {
      return NextResponse.json({ success: false, message: "Admin Key မှားယွင်းနေပါသည်" }, { status: 401 });
    }

    await db.prepare('DELETE FROM post_likes WHERE post_id = ?').bind(id).run();
    await db.prepare('DELETE FROM posts WHERE id = ?').bind(id).run();
    await db.prepare('DELETE FROM comments WHERE post_id = ?').bind(id).run();
    
    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete" }, { status: 500 });
  }
}