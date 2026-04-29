"use client";
import { useState, useEffect } from "react";

// မှတ်ချက် - သင့်ရဲ့ R2 Public URL (သို့မဟုတ် Custom Domain) ကို ဒီနေရာမှာ ထည့်ပါ
const R2_URL = "https://pub-xxxxxx.r2.dev"; 

export default function Home() {
  const [content, setContent] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [commentInputs, setCommentInputs] = useState<{ [key: number]: string }>({});
  const [activeCommentBox, setActiveCommentBox] = useState<{ [key: number]: boolean }>({});
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

    const formData = new FormData();
    formData.append("content", content);
    if (selectedFile) {
      formData.append("file", selectedFile);
    }

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData, // FormData ပို့သည့်အခါ JSON.stringify မလိုပါ
      });
      
      if (response.ok) {
        setContent("");
        setSelectedFile(null);
        setPreviewUrl(null);
        fetchPosts();
      }
    } catch (error) {
      alert("တင်လို့မရဖြစ်သွားပါသည်");
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async (postId: number) => {
    const commentText = commentInputs[postId];
    if (!commentText?.trim()) return;

    const formData = new FormData();
    formData.append("post_id", postId.toString());
    formData.append("content", commentText);

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });
      
      if (response.ok) {
        setCommentInputs(prev => ({ ...prev, [postId]: "" }));
        setActiveCommentBox(prev => ({ ...prev, [postId]: false }));
        await fetchPosts();
      }
    } catch (error) {
      console.error("Comment error:", error);
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
      alert("Link copied!");
    }
  };

  const toggleCommentBox = (postId: number) => {
    setActiveCommentBox(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#0f172a] text-slate-100' : 'bg-[#f8fafc] text-slate-900'}`}>
      <nav className={`sticky top-0 z-50 border-b transition-colors duration-300 ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200/60'} backdrop-blur-md`}>
        <div className="max-w-4xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-xl shadow-blue-500/20">
              <span className="text-white font-black text-xl italic">K</span>
            </div>
            <h1 className="text-xl font-black tracking-tighter">KP ANON <span className="text-blue-500 text-[10px] tracking-normal font-bold bg-blue-500/10 px-2 py-0.5 rounded-full ml-1">R2 Ready</span></h1>
          </div>
          <button onClick={toggleTheme} className={`p-2.5 rounded-2xl border transition-all active:scale-90 ${darkMode ? 'bg-slate-800 border-slate-700 text-yellow-400 shadow-lg' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Post Input Box */}
        <div className={`rounded-3xl shadow-2xl p-6 mb-12 border transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <div className="flex gap-4">
            <textarea 
              className={`w-full p-4 rounded-2xl outline-none transition-all resize-none text-lg font-medium ${darkMode ? 'bg-slate-800/40 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'} border focus:ring-4 focus:ring-blue-500/10`}
              placeholder="သင်ဘာတွေ စဉ်းစားနေလဲ..."
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {previewUrl && (
            <div className="mt-4 relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
              <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover" />
              <button onClick={() => {setPreviewUrl(null); setSelectedFile(null);}} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full px-2">✕</button>
            </div>
          )}

          <div className="mt-6 flex justify-between items-center">
            <div className="flex gap-5">
               <label className="cursor-pointer hover:scale-125 transition-transform">
                 <span className="text-2xl">🖼️</span>
                 <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
               </label>
            </div>
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className={`px-10 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${loading ? "bg-slate-700 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-500"}`}
            >
              {loading ? "Posting..." : "Post Now"}
            </button>
          </div>
        </div>

        {/* Post Feed */}
        <div className="space-y-8">
          {posts.map((post) => (
            <div key={post.id} className={`rounded-3xl p-6 border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center text-xl font-black text-blue-500">U</div>
                  <div>
                    <p className="font-black text-[15px]">Anonymous User</p>
                    <p className="text-[10px] opacity-50 font-bold uppercase tracking-tighter">{new Date(post.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(post.id)} className="text-slate-500 hover:text-red-500 transition-colors">🗑️</button>
              </div>

              <p className="text-lg leading-[1.7] font-medium mb-4 whitespace-pre-wrap">{post.content}</p>

              {/* Media Display အပိုင်း - R2 မှ ပုံ/ဗီဒီယို ပြသခြင်း */}
              {post.media_url && (
                <div className="mb-6 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black/5">
                  {post.media_type?.startsWith('image/') ? (
                    <img src={`${R2_URL}/${post.media_url}`} alt="Post media" className="w-full h-auto max-h-[500px] object-contain" />
                  ) : post.media_type?.startsWith('video/') ? (
                    <video src={`${R2_URL}/${post.media_url}`} controls className="w-full h-auto max-h-[500px]" />
                  ) : null}
                </div>
              )}

              <div className="flex items-center gap-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                <button onClick={() => handleLike(post.id)} className="flex items-center gap-2 font-bold text-sm">👍 {post.likes || 0}</button>
                <button onClick={() => toggleCommentBox(post.id)} className="flex items-center gap-2 font-bold text-sm">💬 {post.comments?.length || 0}</button>
                <button onClick={() => handleShare(post.content)} className="flex items-center gap-2 font-bold text-sm text-slate-500">🔗 Share</button>
              </div>

              {/* Comment Box */}
              {activeCommentBox[post.id] && (
                <div className="mt-6 flex gap-3">
                  <input 
                    className={`flex-1 px-5 py-3 rounded-2xl text-sm font-medium outline-none border ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-transparent'}`}
                    placeholder="မှတ်ချက်ပေးရန်..."
                    value={commentInputs[post.id] || ""}
                    onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(post.id)}
                  />
                  <button onClick={() => handleCommentSubmit(post.id)} className="w-12 h-12 flex items-center justify-center bg-blue-600 text-white rounded-2xl">🚀</button>
                </div>
              )}

              {/* Comment List */}
              <div className="mt-6 space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {post.comments?.map((comment: any) => (
                  <div key={comment.id} className={`p-4 rounded-2xl text-[14px] shadow-sm ${darkMode ? 'bg-slate-800/40 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
                    <span className="font-black text-blue-500 mr-2 text-[10px] uppercase italic">Anon</span>
                    {comment.content}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="py-12 text-center text-[10px] font-black uppercase tracking-[0.5em] opacity-30">
        &copy; 2026 KP ANON PREMIER NETWORK
      </footer>
    </div>
  );
}