import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Post အားလုံးကို ယူမယ် (Comments ရော၊ Like Count ရော၊ ကိုယ်တိုင် Like ထားသလားပါ စစ်မယ်)
export async function GET(request: NextRequest) {
  const db = (process.env as any).DB;
  const userIp = request.headers.get('cf-connecting-ip') || 'anonymous';

  // posts table ကအချက်အလက်တွေအပြင် Like အရေအတွက်ကို subquery နဲ့တွက်မယ်
  // လက်ရှိ user က like ထားသလားဆိုတာကိုပါ true/false ထုတ်ပေးမယ်
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

  return NextResponse.json(postsWithComments);
}

// Post သို့မဟုတ် Comment အသစ်တင်မယ်
export async function POST(request: NextRequest) {
  const db = (process.env as any).DB;
  const bucket = (process.env as any).MY_BUCKET;

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

    await db.prepare('INSERT INTO posts (content, media_url, media_type) VALUES (?, ?, ?)')
      .bind(content, media_url, media_type).run();

    return NextResponse.json({ success: true, message: "Post created" });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// Like Logic အသစ် (တစ်ယောက်တစ်ခါပဲ ပေးလို့ရအောင် Toggle လုပ်မယ်)
export async function PATCH(request: NextRequest) {
  const db = (process.env as any).DB;
  const userIp = request.headers.get('cf-connecting-ip') || 'anonymous';
  const { id } = await request.json(); // id သည် post_id ဖြစ်သည်
  
  try {
    // ၁။ အရင်ရှိမရှိ စစ်မယ်
    const existingLike = await db.prepare(
      "SELECT id FROM post_likes WHERE post_id = ? AND user_ip = ?"
    ).bind(id, userIp).first();

    if (existingLike) {
      // ၂။ ရှိပြီးသားဆိုရင် Unlike လုပ်မယ် (ဖျက်မယ်)
      await db.prepare(
        "DELETE FROM post_likes WHERE post_id = ? AND user_ip = ?"
      ).bind(id, userIp).run();
      return NextResponse.json({ success: true, liked: false });
    } else {
      // ၃။ မရှိသေးရင် Like လုပ်မယ် (အသစ်ထည့်မယ်)
      await db.prepare(
        "INSERT INTO post_likes (post_id, user_ip) VALUES (?, ?)"
      ).bind(id, userIp).run();
      return NextResponse.json({ success: true, liked: true });
    }
  } catch (e) {
    return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
  }
}

// Delete လုပ်မယ်
export async function DELETE(request: NextRequest) {
  const db = (process.env as any).DB;
  const { id } = await request.json();
  
  // Like တွေကိုပါ တစ်ခါတည်း ရှင်းပစ်မယ်
  await db.prepare('DELETE FROM post_likes WHERE post_id = ?').bind(id).run();
  await db.prepare('DELETE FROM posts WHERE id = ?').bind(id).run();
  await db.prepare('DELETE FROM comments WHERE post_id = ?').bind(id).run();
  return NextResponse.json({ success: true });
}