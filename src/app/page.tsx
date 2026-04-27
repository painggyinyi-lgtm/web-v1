"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [content, setContent] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
        setContent("");
        fetchPosts();
      }
    } catch (error) {
      alert("Error ဖြစ်သွားပါတယ်");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 selection:bg-blue-100">
      {/* Premium Header */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200/60">
        <div className="max-w-4xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              KP ANON
            </h1>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
             <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">🔍</button>
             <button className="p-2 hover:bg-slate-100 rounded-full transition-colors relative">
               🔔 <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
             </button>
             <div className="w-8 h-8 bg-slate-200 rounded-full border border-slate-300"></div>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Modern Post Box */}
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 mb-10 border border-slate-100 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
               <div className="w-12 h-12 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                 🖋️
               </div>
            </div>
            <textarea 
              className="w-full p-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-400 focus:bg-white outline-none transition-all resize-none text-slate-700 placeholder:text-slate-400"
              placeholder="သင်ဘာတွေ စဉ်းစားနေလဲ..."
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div className="mt-4 flex justify-between items-center pl-16">
            <div className="flex gap-2">
               <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">🖼️ Photo</button>
               <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">📎 Attachment</button>
            </div>
            <button 
              onClick={handleSubmit}
              disabled={loading || !content.trim()}
              className={`px-8 py-2.5 rounded-xl font-semibold text-sm tracking-wide transition-all shadow-md ${
                loading || !content.trim() 
                ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" 
                : "bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0 shadow-blue-200"
              }`}
            >
              {loading ? "Publishing..." : "Publish Post"}
            </button>
          </div>
        </div>

        {/* Feed Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] pl-1">Recent Activity</h2>
            <div className="h-px flex-1 bg-slate-200/60"></div>
          </div>
          
          {posts.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                <div className="text-4xl mb-4 opacity-40">🌊</div>
                <p className="text-slate-400 font-medium italic">ငြိမ်သက်နေတယ်... တစ်ခုခု စရေးလိုက်ရအောင်!</p>
             </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm transition-all hover:border-blue-100 hover:shadow-md group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-bold border border-blue-100">
                      U
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 tracking-tight">Anonymous Member</p>
                      <p className="text-[11px] text-slate-400 font-medium">Verified User • Just Now</p>
                    </div>
                  </div>
                  <button className="text-slate-300 hover:text-slate-500 transition-colors">•••</button>
                </div>
                <p className="text-slate-700 text-lg leading-[1.6] pl-1 w-full">
                  {post.content}
                </p>
                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center gap-8 text-slate-400 text-sm font-semibold">
                   <button className="flex items-center gap-2 hover:text-blue-600 transition-colors group/btn">
                     <span className="p-2 bg-slate-50 rounded-lg group-hover/btn:bg-blue-50 transition-colors">👍</span> 
                     12 Likes
                   </button>
                   <button className="flex items-center gap-2 hover:text-blue-600 transition-colors group/btn">
                     <span className="p-2 bg-slate-50 rounded-lg group-hover/btn:bg-blue-50 transition-colors">💬</span> 
                     Comments
                   </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
      
      {/* Pro Footer Overlay */}
      <footer className="py-12 text-center text-slate-400 text-xs tracking-widest font-medium uppercase">
        &copy; 2026 KP ANON PREMIER • BUILT WITH PRECISION
      </footer>
    </div>
  );
}