import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// GET: Post တွေဆွဲမယ် + Online User Count + Reactions ယူမယ်
export async function GET(request: NextRequest) {
  const env = process.env as any;
  const db = env.DB;
  const KV = env.ONLINE_USERS_KV;
  
  const userIp = request.headers.get('cf-connecting-ip') || 'anonymous';

  try {
    // 1. Online User Tracking
    if (KV) {
      await KV.put(`online:${userIp}`, Date.now().toString(), { expirationTtl: 60 });
    }
    const onlineList = KV ? await KV.list({ prefix: "online:" }) : { keys: [] };
    const onlineCount = onlineList.keys.length;

    // 2. Database Logic (reaction_type ပါ ဆွဲထုတ်မယ်)
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
      
      // isLiked ကို myReaction ရှိမရှိနဲ့ စစ်မယ်
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
    console.error("GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Post/Comment တင်မယ် (နဂိုအတိုင်းပဲ)
export async function POST(request: NextRequest) {
  const env = process.env as any;
  const db = env.DB;
  const bucket = env.MY_BUCKET;

  try {
    const formData = await request.formData();
    const content = formData.get('content') as string;
    const post_id = formData.get('post_id') as string | null;
    const file = formData.get('file') as File | null;

    if (post_id) {
      await db.prepare('INSERT INTO comments (post_id, content, created_at) VALUES (?, ?, ?)')
        .bind(post_id, content, new Date().toISOString()).run();
      return NextResponse.json({ success: true, message: "Comment added" });
    } 

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

// PATCH: Multi-Reaction Logic (အသစ်ပြင်ထားတာ)
export async function PATCH(request: NextRequest) {
  const db = (process.env as any).DB;
  const userIp = request.headers.get('cf-connecting-ip') || 'anonymous';
  
  try {
    const { id, reactionType = 'like' } = await request.json();
    
    // ရှိပြီးသား reaction ကို စစ်မယ်
    const existing = await db.prepare(
      "SELECT reaction_type FROM post_likes WHERE post_id = ? AND user_ip = ?"
    ).bind(id, userIp).first();

    if (existing) {
      if (existing.reaction_type === reactionType) {
        // reaction တူရင် ပြန်ဖြုတ်မယ် (Unlike)
        await db.prepare("DELETE FROM post_likes WHERE post_id = ? AND user_ip = ?").bind(id, userIp).run();
        return NextResponse.json({ success: true, reacted: false });
      } else {
        // reaction မတူရင် အမျိုးအစား ပြောင်းမယ်
        await db.prepare("UPDATE post_likes SET reaction_type = ? WHERE post_id = ? AND user_ip = ?")
          .bind(reactionType, id, userIp).run();
        return NextResponse.json({ success: true, reacted: true, type: reactionType });
      }
    } else {
      // အသစ်ထည့်မယ်
      await db.prepare("INSERT INTO post_likes (post_id, user_ip, reaction_type) VALUES (?, ?, ?)")
        .bind(id, userIp, reactionType).run();
      return NextResponse.json({ success: true, reacted: true, type: reactionType });
    }
  } catch (e) {
    return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
  }
}

// DELETE: Admin Only (နဂိုအတိုင်းပဲ)
export async function DELETE(request: NextRequest) {
  const db = (process.env as any).DB;
  try {
    const { id, adminKey } = await request.json();
    const MASTER_ADMIN_KEY = "232003"; 

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