"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [content, setContent] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // စာမျက်နှာဖွင့်လိုက်တာနဲ့ ပို့စ်တွေကို Database ကနေ ခေါ်ယူမယ်
  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/posts");
      const data = await res.json();
      setPosts(data);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // ပို့စ်တင်တဲ့ လုပ်ဆောင်ချက်
  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        setContent(""); // စာရိုက်ကွက်ကို ပြန်ရှင်းမယ်
        fetchPosts();   // List အသစ်ကို ချက်ချင်းပြန်ခေါ်မယ်
      }
    } catch (error) {
      alert("Error ဖြစ်သွားပါတယ်၊ ပြန်ကြိုးစားကြည့်ပါ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Top Navbar */}
      <nav className="bg-white shadow-md py-3 px-4 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-black text-blue-600 tracking-tighter">KP ANON</h1>
          <div className="bg-gray-200 p-2 rounded-full cursor-pointer hover:bg-gray-300 transition">
             🔔
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto p-4">
        {/* Post Input Box - Facebook Style */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-200">
          <div className="flex gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
              ?
            </div>
            <textarea 
              className="flex-1 p-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 text-lg resize-none outline-none"
              placeholder="အမည်ဝှက်ပြီး ဘာတွေ ပြောချင်လဲ..."
              rows={2}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div className="flex justify-between items-center border-t pt-3">
            <div className="flex gap-2 text-gray-500 text-sm">
               📸 <span className="hidden sm:inline">Photo</span>
               📍 <span className="hidden sm:inline">Check-in</span>
            </div>
            <button 
              onClick={handleSubmit}
              disabled={loading || !content.trim()}
              className={`px-8 py-2 rounded-lg font-bold text-white transition shadow-sm ${
                loading || !content.trim() ? "bg-gray-300" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "ပို့နေသည်..." : "Post"}
            </button>
          </div>
        </div>

        {/* Feed Section */}
        <div className="space-y-4">
          <h2 className="text-gray-500 font-bold text-sm px-1 uppercase tracking-wider">Recent Stories</h2>
          
          {posts.length === 0 ? (
             <div className="text-center bg-white p-10 rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-400">ပို့စ်များ မရှိသေးပါ။ တစ်ခုခု အရင်စရေးကြည့်ပါ!</p>
             </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 transition hover:border-blue-200">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-blue-500 border border-blue-50">
                    ID
                  </div>
                  <div className="ml-3">
                    <p className="font-bold text-gray-900">Anonymous User</p>
                    <p className="text-[10px] text-gray-400 uppercase">{new Date(post.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
                <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap px-1">
                  {post.content}
                </p>
                <div className="mt-4 flex gap-4 border-t pt-3 text-gray-500 text-sm font-medium">
                   <span>👍 Like</span>
                   <span>💬 Comment</span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}