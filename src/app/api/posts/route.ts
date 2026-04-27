import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge'; // Cloudflare အတွက် လိုအပ်ပါတယ်

export async function GET(request: NextRequest) {
  const db = (process.env as any).DB;
  const { results } = await db.prepare('SELECT * FROM posts ORDER BY created_at DESC').all();
  return NextResponse.json(results);
}

export async function POST(request: NextRequest) {
  const db = (process.env as any).DB;
  const { content } = await request.json();

  if (!content) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  await db.prepare('INSERT INTO posts (content) VALUES (?)').bind(content).run();
  return NextResponse.json({ success: true });
}