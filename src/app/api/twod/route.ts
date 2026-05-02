/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  try {
    // ထိုင်းစတော့ဈေးကွက် (SET) ရဲ့ တရားဝင် API ကို အလကားသုံးမယ်
    const response = await fetch('https://marketdata.set.or.th/mkt/marketsummary.do?language=en&country=US', {
      next: { revalidate: 60 } // ၁ မိနစ်တစ်ခါပဲ Refresh လုပ်မယ်
    });
    
    const html = await response.text();

    // Regex နဲ့ SET Index နဲ့ Value ကို ဖြတ်ယူမယ်
    const setMatch = html.match(/SET Index<\/td>\s*<td[^>]*>([\d,.]+)/);
    const valueMatch = html.match(/Value \(M\.Baht\)<\/td>\s*<td[^>]*>([\d,.]+)/);

    if (setMatch && valueMatch) {
      const set = setMatch[1].replace(',', '');
      const value = valueMatch[1].replace(',', '');
      
      // 2D Logic: SET ရဲ့ နောက်ဆုံးဂဏန်း + Value ရဲ့ နောက်ဆုံးဂဏန်း
      const twod = set.split('.').pop()?.slice(-1) + value.split('.').pop()?.slice(-1);

      return NextResponse.json({
        set,
        value,
        twod,
        time: new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Bangkok' })
      });
    }

    return NextResponse.json({ error: "Data not found" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}