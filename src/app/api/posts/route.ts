/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// XSS Attack ကာကွယ်ရေးအတွက် Input သန့်စင်ခြင်း
function sanitizeInput(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// GET: Posts + Online Status
export async function GET(request: NextRequest) {
  const env = process.env as any;
  const db = env.DB;
  const KV = env.ONLINE_USERS_KV;
  const userIp = request.headers.get('cf-connecting-ip') || 'anonymous';

  try {
    // 1. Online Tracking (KV ရှိမှ လုပ်မယ်)
    if (KV) {
      await KV.put(`online:${userIp}`, Date.now().toString(), { expirationTtl: 60 });
    }
    const onlineList = KV ? await KV.list({ prefix: "online:" }) : { keys: [] };
    const onlineCount = onlineList.keys.length;

    // 2. Fetch Posts (Pinned posts stay on top)
    const { results: posts } = await db.prepare(`
      SELECT p.*, 
      (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes,
      (SELECT reaction_type FROM post_likes WHERE post_id = p.id AND user_ip = ? LIMIT 1) as myReaction
      FROM posts p 
      ORDER BY is_pinned DESC, created_at DESC
    `).bind(userIp).all();
    
    // 3. Comments များကို တစ်ခါတည်း ဆွဲယူခြင်း
    const postsWithComments = await Promise.all((posts || []).map(async (post: any) => {
      const { results: comments } = await db.prepare('SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC')
        .bind(post.id).all();
      
      return { 
        ...post, 
        comments: comments || [], 
        isLiked: !!post.myReaction,
        reaction_type: post.myReaction || null 
      };
    }));

    return NextResponse.json({
      posts: postsWithComments,
      onlineCount: onlineCount || 1
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Fetch Error" }, { status: 500 });
  }
}

// POST: Create Post or Comment with Rate Limiting
export async function POST(request: NextRequest) {
  const env = process.env as any;
  const db = env.DB;
  const KV = env.ONLINE_USERS_KV;
  const bucket = env.MY_BUCKET;
  const userIp = request.headers.get('cf-connecting-ip') || 'anonymous';

  try {
    const formData = await request.formData();
    const rawContent = (formData.get('content') as string) || "";
    const post_id = formData.get('post_id') as string | null;
    const file = formData.get('file') as File | null;
    const content = sanitizeInput(rawContent);

    if (!content.trim() && !file) {
      return NextResponse.json({ error: "စာသား သို့မဟုတ် ပုံ ထည့်ပါ" }, { status: 400 });
    }

    // Rate Limiting Logic (KV သုံးထားသည်)
    if (KV) {
      if (post_id) {
        const commentKey = `limit:comment:${userIp}`;
        const current = parseInt(await KV.get(commentKey) || "0");
        if (current >= 5) return NextResponse.json({ error: "ခေတ္တနားပြီးမှ Comment ပြန်ပေးပါ" }, { status: 429 });
        await KV.put(commentKey, (current + 1).toString(), { expirationTtl: 60 });
      } else {
        const postLimitKey = `limit:post:${userIp}`;
        if (await KV.get(postLimitKey)) return NextResponse.json({ error: "၅ မိနစ်လျှင် တစ်ကြိမ်သာ တင်နိုင်ပါသည်" }, { status: 429 });
        await KV.put(postLimitKey, "true", { expirationTtl: 300 });
      }
    }

    // Comment တင်ခြင်း
    if (post_id) {
      await db.prepare('INSERT INTO comments (post_id, content, created_at) VALUES (?, ?, ?)')
        .bind(post_id, content, new Date().toISOString()).run();
      return NextResponse.json({ success: true });
    } 

    // Media Upload (R2 Bucket)
    let media_url = null;
    let media_type = null;
    if (file && file.size > 0) {
      if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "ဖိုင်ဆိုဒ် 10MB ထက် မကျော်ရပါ" }, { status: 400 });
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      await bucket.put(fileName, file.stream(), { httpMetadata: { contentType: file.type } });
      media_url = fileName; 
      media_type = file.type;
    }

    // Post အသစ် သိမ်းခြင်း
    await db.prepare('INSERT INTO posts (content, media_url, media_type, created_at, is_pinned) VALUES (?, ?, ?, ?, 0)')
      .bind(content, media_url, media_type, new Date().toISOString()).run();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Post တင်ခြင်း မအောင်မြင်ပါ" }, { status: 500 });
  }
}

// PATCH: Reactions AND Admin Pinning
export async function PATCH(request: NextRequest) {
  const env = process.env as any;
  const db = env.DB;
  const userIp = request.headers.get('cf-connecting-ip') || 'anonymous';
  const MASTER_ADMIN_KEY = env.ADMIN_KEY || "232003";
  
  try {
    const body = await request.json();
    const { id, reactionType, adminKey } = body;

    // Pinning Logic
    if (adminKey !== undefined) {
      if (adminKey !== MASTER_ADMIN_KEY) {
        return NextResponse.json({ message: "Admin Key မှားယွင်းနေပါသည်" }, { status: 401 });
      }
      const post = await db.prepare("SELECT is_pinned FROM posts WHERE id = ?").bind(id).first();
      if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

      const nextStatus = post.is_pinned ? 0 : 1;
      await db.prepare("UPDATE posts SET is_pinned = ? WHERE id = ?").bind(nextStatus, id).run();
      return NextResponse.json({ success: true, pinned: !!nextStatus });
    }

    // Reaction Logic
    const type = reactionType || 'like';
    const existing = await db.prepare("SELECT reaction_type FROM post_likes WHERE post_id = ? AND user_ip = ?").bind(id, userIp).first();

    if (existing) {
      if (existing.reaction_type === type) {
        await db.prepare("DELETE FROM post_likes WHERE post_id = ? AND user_ip = ?").bind(id, userIp).run();
        return NextResponse.json({ success: true, reacted: false });
      } else {
        await db.prepare("UPDATE post_likes SET reaction_type = ? WHERE post_id = ? AND user_ip = ?").bind(type, id, userIp).run();
        return NextResponse.json({ success: true, reacted: true, type });
      }
    } else {
      await db.prepare("INSERT INTO post_likes (post_id, user_ip, reaction_type) VALUES (?, ?, ?)").bind(id, userIp, type).run();
      return NextResponse.json({ success: true, reacted: true, type });
    }
  } catch (error: any) {
    return NextResponse.json({ error: "Reaction error" }, { status: 500 });
  }
}

// DELETE: Post + Likes + Comments
export async function DELETE(request: NextRequest) {
  const env = process.env as any;
  const db = env.DB;
  const MASTER_ADMIN_KEY = env.ADMIN_KEY || "232003"; 
  
  try {
    const { id, adminKey } = await request.json();

    if (adminKey !== MASTER_ADMIN_KEY) {
      return NextResponse.json({ message: "Admin Key မှားယွင်းနေပါသည်" }, { status: 401 });
    }

    // Transaction သဘောမျိုး အကုန်ဖျက်မယ်
    await db.batch([
      db.prepare('DELETE FROM post_likes WHERE post_id = ?').bind(id),
      db.prepare('DELETE FROM comments WHERE post_id = ?').bind(id),
      db.prepare('DELETE FROM posts WHERE id = ?').bind(id)
    ]);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "ဖျက်၍ မရပါ" }, { status: 500 });
  }
}