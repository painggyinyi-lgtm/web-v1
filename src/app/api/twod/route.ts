import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  try {
    // Thai 2D Live Data ရယူရန် Public API တစ်ခုကို အသုံးပြုခြင်း
    // မှတ်ချက် - ဒီ API Link က အပြောင်းအလဲ ရှိနိုင်ပါတယ်။
    const response = await fetch('https://api.thaistock2d.com/live', {
      next: { revalidate: 0 } // Cache မလုပ်ဘဲ အမြဲတမ်း data အသစ်ယူရန်
    });

    if (!response.ok) throw new Error('Network response was not ok');
    
    const result = await response.json();
    
    // API ကနေ ရလာတဲ့ Live data များ
    const setData = result.live.set;     // ဥပမာ: "1420.55"
    const valueData = result.live.value; // ဥပမာ: "25600.12"
    const twod = result.live.twod;       // ဥပမာ: "52"
    const time = result.live.time;       // ဥပမာ: "12:05:00"

    return NextResponse.json({
      set: setData || "----.--",
      value: valueData || "----.--",
      twod: twod || "--",
      time: time || "Updating..."
    });

  } catch (error) {
    console.error("2D Fetch Error:", error);
    
    // API အလုပ်မလုပ်တဲ့အခါ app error မတက်အောင် default data ပြန်ပေးခြင်း
    return NextResponse.json({ 
      set: "Server",
      value: "Error",
      twod: "!!",
      time: "Offline"
    });
  }
}