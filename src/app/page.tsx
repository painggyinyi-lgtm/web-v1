"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [content, setContent] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Theme ကို စစ်ဆေးပြီး အသုံးပြုခြင်း
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    if (darkMode) {
      setDarkMode(false);
      localStorage.setItem("theme", "light");
      document.documentElement.classList.remove("dark");
    } else {
      setDarkMode(true);
      localStorage.setItem("theme", "dark");
      document.documentElement.classList.add("dark");
    }
  };

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
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#0f172a] text-slate-100' : 'bg-[#f8fafc] text-slate-900'}`}>
      {/* Premium Header */}
      <nav className={`sticky top-0 z-50 border-b transition-colors duration-300 ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200/60'} backdrop-blur-md`}>
        <div className="max-w-4xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <h1 className={`text-xl font-bold tracking-tight ${darkMode ? 'text-white' : 'bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'}`}>
              KP ANON
            </h1>
          </div>

          <div className="flex items-center gap-4">
             {/* Theme Toggle Button */}
             <button 
               onClick={toggleTheme}
               className={`p-2 rounded-xl border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'}`}
             >
               {darkMode ? "☀️ Light" : "🌙 Dark"}
             </button>
             <div className={`w-8 h-8 rounded-full border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-200 border-slate-300'}`}></div>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Modern Post Box */}
        <div className={`rounded-2xl shadow-xl p-6 mb-10 border transition-all ${darkMode ? 'bg-slate-900 border-slate-800 shadow-black/20' : 'bg-white border-slate-100 shadow-slate-200/50'}`}>
          <div className="flex gap-4">
            <div className="flex-shrink-0">
               <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-2xl transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                 🖋️
               </div>
            </div>
            <textarea 
              className={`w-full p-4 rounded-2xl outline-none transition-all resize-none text-lg ${darkMode ? 'bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:bg-slate-800' : 'bg-slate-50/50 border-slate-200 text-slate-700 placeholder:text-slate-400 focus:bg-white'} border focus:ring-4 focus:ring-blue-500/10`}
              placeholder="သင်ဘာတွေ စဉ်းစားနေလဲ..."
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div className="mt-4 flex justify-between items-center pl-16">
            <div className="flex gap-2">
               <button className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${darkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}>🖼️ Photo</button>
            </div>
            <button 
              onClick={handleSubmit}
              disabled={loading || !content.trim()}
              className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${
                loading || !content.trim() 
                ? "bg-slate-700 text-slate-500 cursor-not-allowed" 
                : "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/30 active:scale-95"
              }`}
            >
              {loading ? "Publishing..." : "Publish Post"}
            </button>
          </div>
        </div>

        {/* Feed Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <h2 className={`text-sm font-bold uppercase tracking-[0.2em] pl-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Recent Activity</h2>
            <div className={`h-px flex-1 ${darkMode ? 'bg-slate-800' : 'bg-slate-200/60'}`}></div>
          </div>
          
          {posts.length === 0 ? (
             <div className={`text-center py-20 rounded-3xl border border-dashed ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-300'}`}>
                <p className="text-slate-500 font-medium italic">တစ်ခုခု စရေးလိုက်ရအောင်!</p>
             </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className={`rounded-2xl p-6 border shadow-sm transition-all hover:shadow-md ${darkMode ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-100 hover:border-blue-100'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold border ${darkMode ? 'bg-slate-800 border-slate-700 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                      U
                    </div>
                    <div>
                      <p className={`font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>Anonymous Member</p>
                      <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Just Now</p>
                    </div>
                  </div>
                </div>
                <p className={`text-lg leading-[1.6] pl-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  {post.content}
                </p>
                <div className={`mt-6 pt-4 border-t flex items-center gap-8 text-sm font-bold ${darkMode ? 'border-slate-800 text-slate-500' : 'border-slate-50 text-slate-400'}`}>
                   <button className="hover:text-blue-500 transition-colors">👍 Like</button>
                   <button className="hover:text-blue-500 transition-colors">💬 Comment</button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <footer className={`py-12 text-center text-xs tracking-[0.3em] font-bold uppercase ${darkMode ? 'text-slate-600' : 'text-slate-300'}`}>
        &copy; 2026 KP ANON PREMIER
      </footer>
    </div>
  );
}