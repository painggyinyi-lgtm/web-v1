"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [content, setContent] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Theme စစ်ဆေးခြင်း
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
    document.documentElement.classList.toggle("dark");
  };

  // Real-time ဆန်ဆန်ဖြစ်အောင် ၅ စက္ကန့်တစ်ခါ အလိုအလျောက် Update လုပ်မယ် (Polling)
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
    const interval = setInterval(fetchPosts, 5000); 
    return () => clearInterval(interval);
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

  // Like လုပ်ဆောင်ချက်
  const handleLike = async (id: number) => {
    await fetch("/api/posts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: 'like' }),
    });
    fetchPosts();
  };

  // Delete လုပ်ဆောင်ချက်
  const handleDelete = async (id: number) => {
    if (!confirm("ဒီပို့စ်ကို ဖျက်မှာ သေချာလား?")) return;
    await fetch("/api/posts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchPosts();
  };

  // Share လုပ်ဆောင်ချက်
  const handleShare = (text: string) => {
    if (navigator.share) {
      navigator.share({
        title: 'KP ANON Post',
        text: text,
        url: window.location.href,
      });
    } else {
      alert("Link copied to clipboard!");
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#0f172a] text-slate-100' : 'bg-[#f8fafc] text-slate-900'}`}>
      <nav className={`sticky top-0 z-50 border-b transition-colors duration-300 ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200/60'} backdrop-blur-md`}>
        <div className="max-w-4xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">KP ANON</h1>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={toggleTheme} className={`p-2 rounded-xl border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-yellow-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
               {darkMode ? "☀️ Light" : "🌙 Dark"}
             </button>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className={`rounded-2xl shadow-xl p-6 mb-10 border transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <div className="flex gap-4">
            <textarea 
              className={`w-full p-4 rounded-2xl outline-none transition-all resize-none text-lg ${darkMode ? 'bg-slate-800/50 border-slate-700 text-white' : 'bg-slate-50/50 border-slate-200 text-slate-700'} border focus:ring-4 focus:ring-blue-500/10`}
              placeholder="အမည်ဝှက်ပြီး တစ်ခုခု ရေးသားပါ..."
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div className="mt-4 flex justify-between items-center pl-2">
            <div className="flex gap-2 text-xl cursor-not-allowed opacity-50">
               <span>🖼️</span> <span>🎥</span>
            </div>
            <button 
              onClick={handleSubmit}
              disabled={loading || !content.trim()}
              className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${loading || !content.trim() ? "bg-slate-700 text-slate-500" : "bg-blue-600 text-white active:scale-95"}`}
            >
              {loading ? "Publishing..." : "Publish Post"}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className={`text-sm font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Recent Activity</h2>
          
          {posts.length === 0 ? (
             <div className="text-center py-20 opacity-50 italic">No posts yet...</div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className={`rounded-2xl p-6 border shadow-sm transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white font-bold">U</div>
                    <div>
                      <p className="font-bold">Anonymous Member</p>
                      <p className="text-[10px] opacity-50 font-bold uppercase">Just Now</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(post.id)} className="text-red-400 hover:bg-red-50 p-2 rounded-lg transition-colors">🗑️ Delete</button>
                </div>
                <p className="text-lg leading-relaxed mb-6">{post.content}</p>
                <div className="flex items-center gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                   <button onClick={() => handleLike(post.id)} className="flex items-center gap-2 hover:text-blue-500 font-bold text-sm">
                     👍 {post.likes || 0} Likes
                   </button>
                   <button className="flex items-center gap-2 hover:text-blue-500 font-bold text-sm opacity-50">💬 Comment</button>
                   <button onClick={() => handleShare(post.content)} className="flex items-center gap-2 hover:text-blue-500 font-bold text-sm">🔗 Share</button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}