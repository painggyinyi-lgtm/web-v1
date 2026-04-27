"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [content, setContent] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Database ကနေ ပို့စ်တွေကို ခေါ်ယူတဲ့ လုပ်ဆောင်ချက်
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

  // ပို့စ်အသစ်တင်တဲ့ လုပ်ဆောင်ချက်
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
        setContent(""); // ရေးထားတာတွေကို ရှင်းပစ်မယ်
        fetchPosts();   // List အသစ်ကို ချက်ချင်းပြန်ပြမယ်
      }
    } catch (error) {
      alert("Error ဖြစ်သွားပါတယ်၊ ပြန်ကြိုးစားကြည့်ပါ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-black">
      {/* Top Navbar */}
      <nav className="bg-white shadow-sm py-3 px-4 sticky top-0 z-20 border-b">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-black text-blue-600">KP ANON</h1>
          <div className="flex gap-2">
             <div className="bg-gray-100 p-2 rounded-full cursor-pointer hover:bg-gray-200">🔍</div>
             <div className="bg-gray-100 p-2 rounded-full cursor-pointer hover:bg-gray-200">🔔</div>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto p-4">
        {/* Post Input Box */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-200">
          <div className="flex gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
              ?
            </div>
            <textarea 
              className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-100 focus:bg-white outline-none transition-all"
              placeholder="အမည်ဝှက်ပြီး ဘာတွေ ပြောချင်လဲ..."
              rows={2}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div className="flex justify-between items-center border-t pt-3">
            <div className="flex gap-4 text-gray-500 text-sm font-semibold ml-2">
               <span>🎥 Video</span>
               <span>🖼️ Photo</span>
            </div>
            <button 
              onClick={handleSubmit}
              disabled={loading || !content.trim()}
              className={`px-6 py-1.5 rounded-lg font-bold text-white transition ${
                loading || !content.trim() ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-95"
              }`}
            >
              {loading ? "ပို့နေသည်..." : "Post"}
            </button>
          </div>
        </div>

        {/* Feed Section */}
        <div className="space-y-4">
          <h2 className="text-gray-500 font-bold text-xs px-1 uppercase tracking-widest">Community Stories</h2>
          
          {posts.length === 0 ? (
             <div className="text-center bg-white p-12 rounded-xl border-2 border-dashed border-gray-200">
                <p className="text-gray-400">ပို့စ်များ မရှိသေးပါ။ တစ်ခုခု စရေးကြည့်ပါ!</p>
             </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-blue-500 font-bold border border-blue-50">
                    User
                  </div>
                  <div className="ml-3">
                    <p className="font-bold text-gray-900 leading-tight">Anonymous Member</p>
                    <p className="text-[11px] text-gray-400 uppercase font-semibold">Just Now</p>
                  </div>
                </div>
                <p className="text-gray-800 text-[17px] leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>
                <div className="mt-4 flex gap-6 border-t pt-3 text-gray-500 text-sm font-semibold">
                   <button className="hover:text-blue-600 flex gap-1 items-center">👍 Like</button>
                   <button className="hover:text-blue-600 flex gap-1 items-center">💬 Comment</button>
                   <button className="hover:text-blue-600 flex gap-1 items-center">🔗 Share</button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}