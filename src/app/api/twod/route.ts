import { NextResponse } from 'next/server';

// Cloudflare Workers (Edge Runtime) အတွက် သတ်မှတ်ချက်
export const runtime = 'edge';

export async function GET() {
  try {
    // API ကနေ Data ဆွဲတဲ့အခါ တကယ်လို့ Data က ပုံမှန်မဟုတ်ဘဲ 
    // Null သို့မဟုတ် Undefined ဖြစ်နေရင် Error မတက်အောင် ကာကွယ်ထားတဲ့ ပုံစံပါ
    
    // ဥပမာ API data (မင်းရဲ့ API logic နဲ့ လိုအပ်သလို ပြန်ချိတ်ပါ)
    const setData: string | undefined | null = "1420.55"; 
    const valueData: string | undefined | null = "25600.12";

    // Error လုံးဝ မတက်အောင် logic ကို ခွဲရေးထားတယ်
    const getLastDigit = (input: string | undefined | null): string => {
      if (!input || typeof input !== 'string') return "0";
      const parts = input.split('.');
      const lastPart = parts.pop();
      return lastPart ? lastPart.slice(-1) : "0";
    };

    const setDigit = getLastDigit(setData);
    const valueDigit = getLastDigit(valueData);
    
    // နောက်ဆုံးထွက်မယ့် 2D ဂဏန်း
    const twod = `${setDigit}${valueDigit}`;

    return NextResponse.json({
      success: true,
      data: {
        set: setData ?? "--",
        value: valueData ?? "--",
        twod: twod
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // ဘယ်လို error မျိုးပဲတက်တက် app ကြီး crash မဖြစ်အောင် ဒီကနေ response ပြန်ပေးမယ်
    console.error("2D Route Error:", error);
    return NextResponse.json({ 
      success: false, 
      twod: "--",
      message: "Internal Server Error" 
    }, { status: 500 });
  }
}