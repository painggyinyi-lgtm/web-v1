import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const env = process.env as any;
  const db = env.DB;
  const userIp = request.headers.get('cf-connecting-ip') || 'anonymous';

  try {
    const { content } = await request.json();

    if (!content || content.trim().length < 5) {
      return NextResponse.json({ error: "အကြံပြုချက်ကို အနည်းဆုံး စာလုံး ၅ လုံး ရေးပေးပါ" }, { status: 400 });
    }

    await db.prepare('INSERT INTO feedbacks (content, user_ip) VALUES (?, ?)')
      .bind(content, userIp).run();

    return NextResponse.json({ success: true, message: "ကျေးဇူးတင်ပါတယ်! Feedback ရရှိပါပြီ။" });
  } catch (error: any) {
    return NextResponse.json({ error: "ပို့လို့မရပါ၊ ခဏနေမှ ပြန်ကြိုးစားကြည့်ပါ" }, { status: 500 });
  }
}