import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Post အားလုံးကို ယူမယ် (Comments ပါ ပါအောင် ယူရပါမယ်)
export async function GET() {
  const db = (process.env as any).DB;
  
  const { results: posts } = await db.prepare('SELECT * FROM posts ORDER BY created_at DESC').all();
  
  const postsWithComments = await Promise.all(posts.map(async (post: any) => {
    const { results: comments } = await db.prepare('SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC')
      .bind(post.id).all();
    return { ...post, comments };
  }));

  return NextResponse.json(postsWithComments);
}

// Post သို့မဟုတ် Comment အသစ်တင်မယ် (R2 File Upload Logic ပါဝင်သည်)
export async function POST(request: NextRequest) {
  const db = (process.env as any).DB;
  const bucket = (process.env as any).MY_BUCKET; // R2 Binding

  try {
    const formData = await request.formData();
    const content = formData.get('content') as string;
    const post_id = formData.get('post_id') as string | null;
    const file = formData.get('file') as File | null;

    // ၁။ အကယ်၍ post_id ပါလာရင် ဒါဟာ Comment ပေးတာဖြစ်တယ်
    if (post_id) {
      await db.prepare('INSERT INTO comments (post_id, content, created_at) VALUES (?, ?, ?)')
        .bind(post_id, content, new Date().toISOString()).run();
      return NextResponse.json({ success: true, message: "Comment added" });
    } 

    // ၂။ post_id မပါရင် Post အသစ်တင်တာဖြစ်တယ် (Media file ပါရင် R2 ထဲ သိမ်းမယ်)
    let media_url = null;
    let media_type = null;

    if (file && file.size > 0) {
      // File name ကို unique ဖြစ်အောင် timestamp ထည့်မယ်
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      
      // R2 Bucket ထဲသို့ တိုက်ရိုက် သိမ်းဆည်းခြင်း
      await bucket.put(fileName, file.stream(), {
        httpMetadata: { contentType: file.type }
      });

      // R2 Public URL သတ်မှတ်ခြင်း (Custom Domain ရှိလျှင် ထို domain ကို သုံးပါ)
      // ဥပမာ- https://pub-xxxx.r2.dev/ သို့မဟုတ် custom domain
      media_url = fileName; 
      media_type = file.type;
    }

    await db.prepare('INSERT INTO posts (content, media_url, media_type, likes) VALUES (?, ?, ?, ?)')
      .bind(content, media_url, media_type, 0).run();

    return NextResponse.json({ success: true, message: "Post created" });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
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
  
  // R2 ထဲက file ကိုပါ ဖျက်ချင်ရင် ဒီမှာ bucket.delete(fileName) ထည့်နိုင်ပါတယ်
  
  await db.prepare('DELETE FROM posts WHERE id = ?').bind(id).run();
  await db.prepare('DELETE FROM comments WHERE post_id = ?').bind(id).run();
  return NextResponse.json({ success: true });
}