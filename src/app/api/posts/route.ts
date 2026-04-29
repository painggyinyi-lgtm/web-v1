import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Post အားလုံးကို ယူမယ် (Comments ပါ ပါအောင် ယူရပါမယ်)
export async function GET() {
  const db = (process.env as any).DB;
  
  // Post တွေကို အရင်ယူမယ်
  const { results: posts } = await db.prepare('SELECT * FROM posts ORDER BY created_at DESC').all();
  
  // Post တစ်ခုချင်းစီအတွက် Comments တွေကို Fetch လုပ်ပြီး ထည့်ပေးမယ်
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
  const data = await request.json();

  // အကယ်၍ post_id ပါလာရင် ဒါဟာ Comment ပေးတာဖြစ်တယ်
  if (data.post_id) {
    await db.prepare('INSERT INTO comments (post_id, content, created_at) VALUES (?, ?, ?)')
      .bind(data.post_id, data.content, new Date().toISOString()).run();
    return NextResponse.json({ success: true, message: "Comment added" });
  } 
  
  // post_id မပါရင် Post အသစ်တင်တာဖြစ်တယ်
  else {
    await db.prepare('INSERT INTO posts (content, media_url, media_type, likes) VALUES (?, ?, ?, ?)')
      .bind(data.content, data.media_url || null, data.media_type || null, 0).run();
    return NextResponse.json({ success: true, message: "Post created" });
  }
}

// Like လုပ်မယ်
export async function PATCH(request: NextRequest) {
  const db = (process.env as any).DB;
  const { id, action } = await request.json();
  
  if (action === 'like') {
    await db.prepare('UPDATE posts SET likes = likes + 1 WHERE id = ?').bind(id).run();
  }
  return NextResponse.json({ success: true });
}

// Delete လုပ်မယ်
export async function DELETE(request: NextRequest) {
  const db = (process.env as any).DB;
  const { id } = await request.json();
  await db.prepare('DELETE FROM posts WHERE id = ?').bind(id).run();
  // Post ကိုဖျက်ရင် သက်ဆိုင်ရာ comment တွေကိုပါ တစ်ခါတည်းဖျက်တာ ပိုကောင်းပါတယ်
  await db.prepare('DELETE FROM comments WHERE post_id = ?').bind(id).run();
  return NextResponse.json({ success: true });
}