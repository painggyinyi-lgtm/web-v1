"use client";
import { useState, useEffect } from "react";

// R2 Public URL
const R2_URL = "https://pub-73c20b61589145d9b182874824850bb4.r2.dev"; 

// Reaction Emojis Mapping
const REACTION_EMOJIS: { [key: string]: string } = {
  like: '👍',
  love: '❤️',
  haha: '😂',
  wow: '😮',
  sad: '😢',
  angry: '😡'
};

export default function Home() {
  const [content, setContent] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [commentInputs, setCommentInputs] = useState<{ [key: number]: string }>({});
  const [activeCommentBox, setActiveCommentBox] = useState<{ [key: number]: boolean }>({});
  const [activeReactionPicker, setActiveReactionPicker] = useState<number | null>(null);
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
      if (data.posts && Array.isArray(data.posts)) {
        setPosts(data.posts);
      }
      if (data.onlineCount !== undefined) {
        setOnlineCount(data.onlineCount);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  useEffect(() => {
    fetchPosts();
    const interval = setInterval(fetchPosts, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleReaction = async (id: number, type: string) => {
    try {
      await fetch("/api/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, reactionType: type }),
      });
      setActiveReactionPicker(null);
      fetchPosts();
    } catch (error) {
      console.error("Reaction error:", error);
    }
  };

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
    if (selectedFile) formData.append("file", selectedFile);

    try {
      const response = await fetch("/api/posts", { method: "POST", body: formData });
      const result = await response.json();

      if (response.ok) {
        setContent("");
        setSelectedFile(null);
        setPreviewUrl(null);
        fetchPosts();
      } else {
        // Backend ကပို့တဲ့ Rate Limit Error (သို့) တခြား error ပြမယ်
        alert(result.error || "တင်လို့မရဖြစ်သွားပါသည်");
      }
    } catch (error) {
      alert("Network error ဖြစ်သွားပါသည်");
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
      const response = await fetch("/api/posts", { method: "POST", body: formData });
      const result = await response.json();

      if (response.ok) {
        setCommentInputs(prev => ({ ...prev, [postId]: "" }));
        setActiveCommentBox(prev => ({ ...prev, [postId]: false }));
        fetchPosts();
      } else {
        alert(result.error || "Comment ပေးလို့မရပါ");
      }
    } catch (error) {
      console.error("Comment error:", error);
    }
  };

  const handleDelete = async (id: number) => {
    const adminKey = prompt("ဒီပို့စ်ကို ဖျက်ဖို့ Admin Key ရိုက်ထည့်ပါ -");
    if (adminKey === null) return;
    try {
      const response = await fetch("/api/posts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, adminKey }), 
      });
      const result = await response.json();
      if (response.ok && result.success) {
        alert("ဖျက်သိမ်းပြီးပါပြီ");
        fetchPosts();
      } else {
        alert(result.message || "Key မှားနေသဖြင့် ဖျက်လို့မရပါ");
      }
    } catch (error) {
      alert("Error ဖြစ်သွားပါသည်");
    }
  };

  const handleShare = (postId: number, text: string) => {
    const shareUrl = `${window.location.origin}/#post-${postId}`;
    if (navigator.share) {
      navigator.share({ title: 'KP ANON Post', text: text, url: shareUrl }).catch(() => null);
    } else {
      navigator.clipboard.writeText(`${text}\n\nRead more: ${shareUrl}`);
      alert("Link copied!");
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#0f172a] text-slate-100' : 'bg-[#f8fafc] text-slate-900'}`}>
      <nav className={`sticky top-0 z-50 border-b transition-colors duration-300 ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200/60'} backdrop-blur-md`}>
        <div className="max-w-4xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-xl shadow-blue-500/20">
              <span className="text-white font-black text-xl italic">K</span>
            </div>
            <div>
               <h1 className="text-xl font-black tracking-tighter flex items-center gap-1">
                 ANON <span className="text-blue-500 text-[10px] tracking-normal font-bold bg-blue-500/10 px-2 py-0.5 rounded-full">v 1.0</span>
               </h1>
               <div className="flex items-center gap-1.5 mt-[-2px]">
                 <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                 <span className="text-[9px] font-black uppercase text-green-500 tracking-wider">{onlineCount} Users Online</span>
               </div>
            </div>
          </div>
          <button onClick={toggleTheme} className={`p-2.5 rounded-2xl border transition-all active:scale-90 flex items-center gap-2 text-xs font-bold ${darkMode ? 'bg-slate-800 border-slate-700 text-yellow-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Post Box */}
        <div className={`rounded-3xl shadow-2xl p-6 mb-12 border transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <textarea 
            className={`w-full p-4 rounded-2xl outline-none transition-all resize-none text-lg font-medium border ${darkMode ? 'bg-slate-800/40 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'} focus:ring-4 focus:ring-blue-500/10`}
            placeholder="သင်ဘာတွေ စဉ်းစားနေလဲ..." rows={3} value={content} onChange={(e) => setContent(e.target.value)}
          />
          {previewUrl && (
            <div className="mt-4 relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
              <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover" />
              <button onClick={() => {setPreviewUrl(null); setSelectedFile(null);}} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full px-2">✕</button>
            </div>
          )}
          <div className="mt-6 flex justify-between items-center">
            <label className="cursor-pointer hover:scale-125 transition-transform"><span className="text-2xl">🖼️</span><input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileChange} /></label>
            <button onClick={handleSubmit} disabled={loading} className={`px-10 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${loading ? "bg-slate-700" : "bg-blue-600 text-white hover:bg-blue-500"}`}>
              {loading ? "Posting..." : "Post Now"}
            </button>
          </div>
        </div>

        {/* Posts List */}
        <div className="space-y-8">
          {posts.map((post) => (
            <div key={post.id} id={`post-${post.id}`} className={`rounded-3xl p-6 border shadow-sm transition-all duration-500 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-700 flex items-center justify-center text-xl font-black text-blue-500">U</div>
                  <div>
                    <p className="font-black text-[15px]">Anonymous User</p>
                    <p className="text-[10px] opacity-50 font-bold uppercase tracking-tighter">{post.created_at ? new Date(post.created_at).toLocaleTimeString() : 'Just now'}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(post.id)} className="text-slate-500 hover:text-red-500">🗑️</button>
              </div>

              <p className="text-lg leading-[1.7] font-medium mb-4 whitespace-pre-wrap">{post.content}</p>

              {post.media_url && (
                <div className="mb-6 rounded-2xl overflow-hidden border dark:border-slate-800 bg-black/5">
                  {post.media_type?.startsWith('image/') ? (
                    <img src={`${R2_URL}/${post.media_url}`} className="w-full h-auto max-h-[500px] object-contain" />
                  ) : (
                    <video src={`${R2_URL}/${post.media_url}`} controls className="w-full h-auto max-h-[500px]" />
                  )}
                </div>
              )}

              {/* Reaction & Action Bar */}
              <div className="flex items-center gap-6 pt-5 border-t dark:border-slate-800 border-slate-100">
                <div className="relative group" onMouseLeave={() => setActiveReactionPicker(null)}>
                  {(activeReactionPicker === post.id) && (
                    <div className="absolute bottom-full mb-3 left-0 flex bg-white dark:bg-slate-800 shadow-2xl border dark:border-slate-700 p-2.5 rounded-full gap-3 animate-in fade-in zoom-in duration-200 z-20">
                      {Object.entries(REACTION_EMOJIS).map(([name, emoji]) => (
                        <button 
                          key={name} 
                          onClick={() => handleReaction(post.id, name)} 
                          className="hover:scale-150 transition-transform text-2xl px-1.5 active:scale-90"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                  <button 
                    onClick={() => setActiveReactionPicker(activeReactionPicker === post.id ? null : post.id)}
                    className={`flex items-center gap-2 font-bold text-sm cursor-pointer py-1 px-2 rounded-lg transition-colors ${post.isLiked ? 'text-blue-500 bg-blue-500/5' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <span className="text-xl">
                      {post.reaction_type ? REACTION_EMOJIS[post.reaction_type] : '👍'}
                    </span>
                    <span>{post.likes || 0}</span>
                  </button>
                </div>

                <button onClick={() => setActiveCommentBox({ ...activeCommentBox, [post.id]: !activeCommentBox[post.id] })} className="flex items-center gap-2 font-bold text-sm hover:text-blue-500 transition-colors">💬 {post.comments?.length || 0}</button>
                <button onClick={() => handleShare(post.id, post.content)} className="flex items-center gap-2 font-bold text-sm text-slate-500 hover:text-blue-500">🔗 Share</button>
              </div>

              {activeCommentBox[post.id] && (
                <div className="mt-6 flex gap-3 animate-in fade-in slide-in-from-top-2">
                  <input 
                    className={`flex-1 px-5 py-3 rounded-2xl text-sm outline-none border ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-transparent'}`}
                    placeholder="မှတ်ချက်ပေးရန်..." value={commentInputs[post.id] || ""}
                    onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(post.id)}
                  />
                  <button onClick={() => handleCommentSubmit(post.id)} className="w-12 h-12 flex items-center justify-center bg-blue-600 text-white rounded-2xl">🚀</button>
                </div>
              )}

              <div className="mt-6 space-y-3 max-h-[250px] overflow-y-auto pr-2">
                {post.comments?.map((comment: any) => (
                  <div key={comment.id} className={`p-4 rounded-2xl text-[14px] ${darkMode ? 'bg-slate-800/40 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
                    <span className="font-black text-blue-500 mr-2 text-[10px] uppercase">Anon</span>
                    {comment.content}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="py-12 text-center text-[10px] font-black uppercase tracking-[0.5em] opacity-30">
        &copy; 2026 ANON PREMIER NETWORK
      </footer>
    </div>
  );
}