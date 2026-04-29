"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [content, setContent] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [commentInputs, setCommentInputs] = useState<{[key: number]: string}>({});

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

  // Real-time Polling (5 Seconds)
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
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied!");
    }
  };

  // Comment တင်သည့်လုပ်ဆောင်ချက်
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
        setCommentInputs({ ...commentInputs, [postId]: "" });
        fetchPosts();
      }
    } catch (error) {
      console.error("Comment error:", error);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#0f172a] text-slate-100' : 'bg-[#f8fafc] text-slate-900'}`}>
      <nav className={`sticky top-0 z-50 border-b transition-colors duration-300 ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200/60'} backdrop-blur-md`}>
        <div className="max-w-4xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">KP ANON</h1>
          </div>
          <button onClick={toggleTheme} className={`p-2 rounded-xl border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-yellow-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Post Input Box */}
        <div className={`rounded-2xl shadow-xl p-6 mb-10 border transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-slate-200/50'}`}>
          <textarea 
            className={`w-full p-4 rounded-2xl outline-none transition-all resize-none text-lg ${darkMode ? 'bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50/50 border-slate-200 text-slate-700 placeholder:text-slate-400'} border focus:ring-4 focus:ring-blue-500/10`}
            placeholder="အမည်ဝှက်ပြီး တစ်ခုခု ရေးသားပါ..."
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="mt-4 flex justify-between items-center">
            <div className="flex gap-4 text-2xl">
               <button className="hover:scale-110 transition-transform">🖼️</button>
               <button className="hover:scale-110 transition-transform">🎥</button>
            </div>
            <button 
              onClick={handleSubmit}
              disabled={loading || !content.trim()}
              className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${loading || !content.trim() ? "bg-slate-700 text-slate-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/30 active:scale-95"}`}
            >
              {loading ? "Publishing..." : "Publish Post"}
            </button>
          </div>
        </div>

        {/* Feed Section */}
        <div className="space-y-6">
          <h2 className={`text-sm font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Community Activity</h2>
          
          {posts.map((post) => (
            <div key={post.id} className={`rounded-2xl p-6 border shadow-sm transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">U</div>
                  <div>
                    <p className="font-bold">Anonymous Member</p>
                    <p className="text-[10px] opacity-50 font-bold">Just Now</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(post.id)} className="text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors">🗑️</button>
              </div>

              <p className="text-lg leading-relaxed mb-6">{post.content}</p>

              {/* Like/Comment/Share Buttons */}
              <div className="flex items-center gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button onClick={() => handleLike(post.id)} className="flex items-center gap-2 hover:text-blue-500 font-bold text-sm transition-colors">
                  👍 {post.likes || 0}
                </button>
                <button className="flex items-center gap-2 hover:text-blue-500 font-bold text-sm transition-colors">
                  💬 {post.comments?.length || 0}
                </button>
                <button onClick={() => handleShare(post.content)} className="flex items-center gap-2 hover:text-blue-500 font-bold text-sm transition-colors">
                  🔗 Share
                </button>
              </div>

              {/* Comments Display */}
              <div className="mt-4 space-y-2">
                {post.comments?.map((comment: any) => (
                  <div key={comment.id} className={`p-3 rounded-xl text-sm ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                    <span className="font-bold text-blue-500 mr-2">Anon:</span>
                    {comment.content}
                  </div>
                ))}
              </div>

              {/* Comment Input */}
              <div className="mt-4 flex gap-2">
                <input 
                  className={`flex-1 px-4 py-2 rounded-xl text-sm outline-none border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-100 border-transparent focus:bg-white focus:border-blue-200'}`}
                  placeholder="မှတ်ချက်ရေးရန်..."
                  value={commentInputs[post.id] || ""}
                  onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(post.id)}
                />
                <button 
                  onClick={() => handleCommentSubmit(post.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-500 transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}