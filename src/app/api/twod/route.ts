import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  try {
    // API ကနေ Data ဆွဲတဲ့အခါ တကယ်လို့ Data က ပုံမှန်မဟုတ်ဘဲ 
    // Null သို့မဟုတ် Undefined ဖြစ်နေရင် Error မတက်အောင် ကာကွယ်ထားတဲ့ ပုံစံပါ
    
    // မှတ်ချက် - ဒီနေရာမှာ တကယ့် Live API URL ရှိရင် fetch နဲ့ ပြန်ချိတ်နိုင်ပါတယ်
    const setData: string | null = "1420.55"; 
    const valueData: string | null = "25600.12";

    const getLastDigit = (input: string | undefined | null): string => {
      if (!input || typeof input !== 'string') return "0";
      // ဒသမနောက်က နောက်ဆုံးဂဏန်းကို ယူတဲ့ logic
      const parts = input.split('.');
      if (parts.length < 2) return "0"; // ဒသမ မပါရင် 0 ပြန်မယ်
      return parts[1].slice(-1);
    };

    const setDigit = getLastDigit(setData);
    const valueDigit = getLastDigit(valueData);
    
    const twod = `${setDigit}${valueDigit}`;

    // Frontend က တိုက်ရိုက်ဖတ်နေတဲ့ key တွေအတိုင်း ပြန်ပေးရပါမယ်
    return NextResponse.json({
      set: setData ?? "----.--",
      value: valueData ?? "----.--",
      twod: twod,
      time: new Date().toLocaleTimeString('en-US', { hour12: false }) // Time ထည့်ပေးလိုက်တယ်
    });

  } catch (error) {
    console.error("2D Route Error:", error);
    return NextResponse.json({ 
      set: "----.--",
      value: "----.--",
      twod: "--",
      time: "--:--:--"
    }, { status: 200 }); // Error တက်ရင်တောင် Format မပျက်အောင် 200 နဲ့ပဲ ပြန်ပေးထားတယ်
  }
}