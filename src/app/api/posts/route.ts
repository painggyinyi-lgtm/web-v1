import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// GET: Post တွေဆွဲမယ် + Online User Count တွက်မယ်
export async function GET(request: NextRequest) {
  const env = process.env as any;
  const db = env.DB;
  const KV = env.ONLINE_USERS_KV; // KV ကို လှမ်းယူတယ်
  
  const userIp = request.headers.get('cf-connecting-ip') || 'anonymous';

  try {
    // --- Online User Tracking Logic ---
    if (KV) {
      // ၁။ လက်ရှိ User ရဲ့ IP ကို KV ထဲမှာ Online ဖြစ်နေကြောင်း မှတ်မယ် (သက်တမ်း ၆၀ စက္ကန့်)
      await KV.put(`online:${userIp}`, Date.now().toString(), { expirationTtl: 60 });
    }

    // ၂။ Online ဖြစ်နေတဲ့ User Key အားလုံးကို List လုပ်မယ်
    const onlineList = KV ? await KV.list({ prefix: "online:" }) : { keys: [] };
    const onlineCount = onlineList.keys.length;

    // --- Original Database Logic ---
    const { results: posts } = await db.prepare(`
      SELECT p.*, 
      (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes,
      (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id AND user_ip = ?) > 0 as isLiked
      FROM posts p 
      ORDER BY created_at DESC
    `).bind(userIp).all();
    
    const postsWithComments = await Promise.all(posts.map(async (post: any) => {
      const { results: comments } = await db.prepare('SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC')
        .bind(post.id).all();
      return { ...post, comments };
    }));

    // Posts data ရော onlineCount ကိုပါ တစ်ခါတည်း ပြန်ပို့မယ်
    return NextResponse.json({
      posts: postsWithComments,
      onlineCount: onlineCount || 1 // အနည်းဆုံး ၁ ယောက် (ကိုယ်တိုင်) ပြထားမယ်
    });

  } catch (error: any) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Post သို့မဟုတ် Comment အသစ်တင်မယ်
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
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PATCH: Like Logic
export async function PATCH(request: NextRequest) {
  const db = (process.env as any).DB;
  const userIp = request.headers.get('cf-connecting-ip') || 'anonymous';
  const { id } = await request.json();
  
  try {
    const existingLike = await db.prepare(
      "SELECT id FROM post_likes WHERE post_id = ? AND user_ip = ?"
    ).bind(id, userIp).first();

    if (existingLike) {
      await db.prepare("DELETE FROM post_likes WHERE post_id = ? AND user_ip = ?").bind(id, userIp).run();
      return NextResponse.json({ success: true, liked: false });
    } else {
      await db.prepare("INSERT INTO post_likes (post_id, user_ip) VALUES (?, ?)").bind(id, userIp).run();
      return NextResponse.json({ success: true, liked: true });
    }
  } catch (e) {
    return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
  }
}

// DELETE: Admin Only
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