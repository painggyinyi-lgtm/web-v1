import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Post အားလုံးကို ယူမယ်
export async function GET() {
  const db = (process.env as any).DB;
  const { results } = await db.prepare('SELECT * FROM posts ORDER BY created_at DESC').all();
  return NextResponse.json(results);
}

// Post အသစ်တင်မယ်
export async function POST(request: NextRequest) {
  const db = (process.env as any).DB;
  const { content, media_url, media_type } = await request.json();
  await db.prepare('INSERT INTO posts (content, media_url, media_type) VALUES (?, ?, ?)')
    .bind(content, media_url, media_type).run();
  return NextResponse.json({ success: true });
}

// Like သို့မဟုတ် Delete လုပ်မယ်
export async function PATCH(request: NextRequest) {
  const db = (process.env as any).DB;
  const { id, action } = await request.json();
  
  if (action === 'like') {
    await db.prepare('UPDATE posts SET likes = likes + 1 WHERE id = ?').bind(id).run();
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const db = (process.env as any).DB;
  const { id } = await request.json();
  await db.prepare('DELETE FROM posts WHERE id = ?').bind(id).run();
  return NextResponse.json({ success: true });
}