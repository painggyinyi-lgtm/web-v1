"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [content, setContent] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [commentInputs, setCommentInputs] = useState<{ [key: number]: string }>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/posts");
      const data = await res.json();
      if (Array.isArray(data)) setPosts(data);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  useEffect(() => {
    fetchPosts();
    const interval = setInterval(fetchPosts, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !selectedFile) return;
    setLoading(true);
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content,
          media_url: null, 
          media_type: null 
        }),
      });
      
      if (response.ok) {
        setContent("");
        setSelectedFile(null);
        setPreviewUrl(null);
        fetchPosts();
      } else {
        const err = await response.json();
        alert("Error: " + err.error);
      }
    } catch (error) {
      alert("Network Error ဖြစ်သွားပါတယ်");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (id: number) => {
    await fetch("/api/posts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: 'like' }),
    });
    fetchPosts();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("ဒီပို့စ်ကို ဖျက်မှာ သေချာလား?")) return;
    await fetch("/api/posts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchPosts();
  };

  const handleShare = (text: string) => {
    if (navigator.share) {
      navigator.share({ title: 'KP ANON Post', text: text, url: window.location.href });
    } else {
      navigator.clipboard.writeText(`${window.location.href}\n\n${text}`);
      alert("Link copied to clipboard!");
    }
  };

  // --- ပြင်ဆင်ထားသော Comment Submit Function ---
  const handleCommentSubmit = async (postId: number) => {
    const commentText = commentInputs[postId];
    if (!commentText?.trim()) return;

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, content: commentText }),
      });
      
      if (response.ok) {
        // Comment box ကို ရှင်းထုတ်တယ်
        setCommentInputs(prev => ({ ...prev, [postId]: "" }));
        // အချက်အလက်အသစ်တွေ ချက်ချင်းပေါ်လာအောင် fetch လုပ်တယ်
        await fetchPosts();
      } else {
        const err = await response.json();
        console.error("Comment failed:", err.error);
      }
    } catch (error) {
      console.error("Comment error:", error);
    }
  };
  // ------------------------------------------

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#0f172a] text-slate-100' : 'bg-[#f8fafc] text-slate-900'}`}>
      <nav className={`sticky top-0 z-50 border-b transition-colors duration-300 ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200/60'} backdrop-blur-md`}>
        <div className="max-w-4xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-xl shadow-blue-500/20">
              <span className="text-white font-black text-xl italic">K</span>
            </div>
            <h1 className="text-xl font-black tracking-tighter">KP ANON <span className="text-blue-500 text-[10px] tracking-normal font-bold bg-blue-500/10 px-2 py-0.5 rounded-full ml-1">v1.0</span></h1>
          </div>
          <button onClick={toggleTheme} className={`p-2.5 rounded-2xl border transition-all active:scale-90 ${darkMode ? 'bg-slate-800 border-slate-700 text-yellow-400 shadow-lg shadow-yellow-500/10' : 'bg-slate-100 border-slate-200 text-slate-600 shadow-sm'}`}>
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className={`rounded-3xl shadow-2xl p-6 mb-12 border transition-all ${darkMode ? 'bg-slate-900 border-slate-800 shadow-black/40' : 'bg-white border-slate-100 shadow-slate-200/50'}`}>
          <div className="flex gap-4">
            <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 items-center justify-center text-white text-xl shadow-lg">✍️</div>
            <textarea 
              className={`w-full p-4 rounded-2xl outline-none transition-all resize-none text-lg font-medium ${darkMode ? 'bg-slate-800/40 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-400'} border focus:ring-4 focus:ring-blue-500/10`}
              placeholder="သင်ဘာတွေ စဉ်းစားနေလဲ..."
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {previewUrl && (
            <div className="mt-4 relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
              <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover" />
              <button onClick={() => {setPreviewUrl(null); setSelectedFile(null);}} className="absolute top-2 right-2 bg-red-50 text-white p-1 rounded-full shadow-lg">✕</button>
            </div>
          )}

          <div className="mt-6 flex justify-between items-center pl-1">
            <div className="flex gap-5">
               <label className="cursor-pointer hover:scale-125 transition-transform">
                 <span className="text-2xl">🖼️</span>
                 <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
               </label>
               <button className="text-2xl hover:scale-125 transition-transform opacity-50 cursor-not-allowed">🎥</button>
            </div>
            <button 
              onClick={handleSubmit}
              disabled={loading || (!content.trim() && !selectedFile)}
              className={`px-10 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${loading || (!content.trim() && !selectedFile) ? "bg-slate-700 text-slate-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-500 shadow-xl shadow-blue-500/30 active:scale-95"}`}
            >
              {loading ? "Posting..." : "Post Now"}
            </button>
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <h2 className={`text-xs font-black uppercase tracking-[0.3em] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Recent Updates</h2>
            <div className={`h-px flex-1 ${darkMode ? 'bg-slate-800' : 'bg-slate-200/60'}`}></div>
          </div>
          
          {posts.map((post) => (
            <div key={post.id} className={`rounded-3xl p-6 border shadow-sm transition-all animate-in fade-in duration-500 ${darkMode ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-100 hover:border-blue-100'}`}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-xl font-black text-blue-500">U</div>
                  <div>
                    <p className="font-black text-[15px]">Anonymous User</p>
                    <p className="text-[10px] opacity-50 font-bold uppercase tracking-tighter">Verified Member • {new Date(post.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(post.id)} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${darkMode ? 'hover:bg-red-500/10 text-slate-600 hover:text-red-500' : 'hover:bg-red-50 text-slate-400 hover:text-red-500'}`}>🗑️</button>
              </div>

              <p className="text-lg leading-[1.7] font-medium mb-6 whitespace-pre-wrap">{post.content}</p>

              <div className="flex items-center gap-2 sm:gap-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                <button onClick={() => handleLike(post.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${darkMode ? 'bg-slate-800 hover:bg-blue-500/10 text-blue-400' : 'bg-blue-50 hover:bg-blue-100 text-blue-600'}`}>
                  👍 {post.likes || 0}
                </button>
                <button className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                  💬 {post.comments?.length || 0}
                </button>
                <button onClick={() => handleShare(post.content)} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all hover:scale-105 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  🔗 Share
                </button>
              </div>

              <div className="mt-6 space-y-3">
                {post.comments?.map((comment: any) => (
                  <div key={comment.id} className={`p-4 rounded-2xl text-[14px] leading-relaxed shadow-sm ${darkMode ? 'bg-slate-800/40 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
                    <span className="font-black text-blue-500 mr-2 uppercase text-[10px] tracking-widest italic">Anon</span>
                    {comment.content}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <input 
                  className={`flex-1 px-5 py-3 rounded-2xl text-sm font-medium outline-none border transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-blue-600' : 'bg-slate-100 border-transparent focus:bg-white focus:border-blue-300'}`}
                  placeholder="မှတ်ချက်ပေးရန်..."
                  value={commentInputs[post.id] || ""}
                  onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(post.id)}
                />
                <button 
                  onClick={() => handleCommentSubmit(post.id)}
                  className="w-12 h-12 flex items-center justify-center bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/20 hover:bg-blue-500 active:scale-90 transition-all"
                >
                  🚀
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className={`py-12 text-center text-[10px] font-black uppercase tracking-[0.5em] opacity-30`}>
        &copy; 2026 KP ANON PREMIER NETWORK
      </footer>
    </div>
  );
}