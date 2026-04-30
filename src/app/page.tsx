"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, Image as ImageIcon, Trash2, Share2, MessageCircle, 
  Moon, Sun, Heart, Smile, Frown, Angry, ThumbsUp, Zap 
} from "lucide-react";

const R2_URL = "https://pub-73c20b61589145d9b182874824850bb4.r2.dev"; 

const REACTION_EMOJIS: { [key: string]: any } = {
  like: { icon: ThumbsUp, color: "text-blue-500", label: "👍" },
  love: { icon: Heart, color: "text-red-500", label: "❤️" },
  haha: { icon: Smile, color: "text-yellow-500", label: "😂" },
  wow: { icon: Zap, color: "text-purple-500", label: "😮" },
  sad: { icon: Frown, color: "text-blue-400", label: "😢" },
  angry: { icon: Angry, color: "text-orange-600", label: "😡" }
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

  // Theme Sync
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
    if (newMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Fetch Posts with useCallback to avoid unnecessary re-renders
  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/posts");
      const data = await res.json();
      if (data.posts) setPosts(data.posts);
      if (data.onlineCount) setOnlineCount(data.onlineCount);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    const interval = setInterval(fetchPosts, 10000);
    return () => clearInterval(interval);
  }, [fetchPosts]);

  const handleReaction = async (id: number, type: string) => {
    try {
      await fetch("/api/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, reactionType: type }),
      });
      setActiveReactionPicker(null);
      fetchPosts();
    } catch (error) { console.error(error); }
  };

  const handleDelete = async (id: number) => {
    const adminKey = prompt("Admin Key ရိုက်ထည့်ပါ (မဖျက်လိုပါက Cancel နှိပ်ပါ)");
    if (!adminKey) return;

    try {
      const res = await fetch("/api/posts", { 
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, adminKey }) 
      });
      const data = await res.json();
      if (data.success) {
        fetchPosts();
      } else {
        alert(data.message || "ဖျက်လို့မရပါ");
      }
    } catch (error) { console.error(error); }
  };

  const handleShare = async (id: number, textContent: string) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'ANON Post',
          text: textContent,
          url: window.location.origin,
        });
      } else {
        navigator.clipboard.writeText(window.location.origin);
        alert("Link copied to clipboard!");
      }
    } catch (error) { console.error(error); }
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
      if (response.ok) {
        setContent("");
        setSelectedFile(null);
        setPreviewUrl(null);
        fetchPosts();
      }
    } catch (error) {
      console.error(error);
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
      if (response.ok) {
        setCommentInputs(prev => ({ ...prev, [postId]: "" }));
        fetchPosts();
      }
    } catch (error) { console.error(error); }
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'bg-[#020617] text-slate-200' : 'bg-[#f1f5f9] text-slate-900'}`}>
      
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 ${darkMode ? 'bg-blue-900' : 'bg-blue-300'}`} />
        <div className={`absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 ${darkMode ? 'bg-purple-900' : 'bg-purple-300'}`} />
      </div>

      <nav className={`sticky top-0 z-50 border-b transition-all duration-300 ${darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-white/70 border-slate-200'} backdrop-blur-xl`}>
        <div className="max-w-4xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-xl italic">K</span>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter">ANON</h1>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-green-500 uppercase">{onlineCount} Active</span>
              </div>
            </div>
          </div>
          
          <button onClick={toggleTheme} className={`p-2.5 rounded-full border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-yellow-400' : 'bg-white border-slate-200 text-slate-600 shadow-sm'}`}>
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </nav>

      <main className="relative max-w-2xl mx-auto px-4 py-10">
        <div className={`rounded-[32px] p-6 mb-12 border shadow-2xl transition-all ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-white'}`}>
          <textarea 
            className={`w-full p-4 rounded-2xl outline-none transition-all resize-none text-lg font-medium bg-transparent ${darkMode ? 'text-white' : 'text-slate-700'}`}
            placeholder="ဒီနေ့ ဘာတွေထူးခြားလဲ..." rows={3} value={content} onChange={(e) => setContent(e.target.value)}
          />
          
          {previewUrl && (
            <div className="mt-4 relative rounded-3xl overflow-hidden border-4 border-slate-100 dark:border-slate-800">
              <img src={previewUrl} alt="Preview" className="w-full h-64 object-cover" />
              <button onClick={() => {setPreviewUrl(null); setSelectedFile(null);}} className="absolute top-3 right-3 bg-black/50 p-2 rounded-full text-white">✕</button>
            </div>
          )}

          <div className="mt-6 flex justify-between items-center border-t dark:border-slate-800 pt-5">
            <label className="flex items-center gap-2 cursor-pointer text-blue-500 font-bold px-4 py-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20">
              <ImageIcon size={20} /> <span className="text-sm">Photo</span>
              <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
            </label>
            <button onClick={handleSubmit} disabled={loading} className={`px-8 py-3 rounded-2xl font-black text-sm uppercase transition-all ${loading ? "bg-slate-700 text-slate-400" : "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/25"}`}>
              {loading ? "Posting..." : "Post"}
            </button>
          </div>
        </div>

        <div className="space-y-8">
          <AnimatePresence mode="popLayout">
            {posts.map((post) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={post.id} 
                className={`rounded-[32px] p-6 border shadow-xl transition-all ${darkMode ? 'bg-slate-900/40 border-slate-800/50' : 'bg-white border-slate-100'}`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-xl font-black text-blue-400">A</div>
                    <div>
                      <p className="font-black text-[15px]">Anonymous</p>
                      <p className="text-[10px] opacity-40 font-bold uppercase">{post.created_at ? new Date(post.created_at).toLocaleTimeString() : 'Recently'}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(post.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
                </div>

                <p className="text-[17px] mb-6 whitespace-pre-wrap">{post.content}</p>

                {post.media_url && (
                  <div className="mb-6 rounded-[24px] overflow-hidden border dark:border-slate-800">
                    {post.media_type?.startsWith('image/') ? (
                      <img src={`${R2_URL}/${post.media_url}`} alt="Post content" className="w-full h-auto max-h-[500px] object-contain bg-black/20" />
                    ) : (
                      <video src={`${R2_URL}/${post.media_url}`} controls className="w-full h-auto bg-black" />
                    )}
                  </div>
                )}

                <div className="flex items-center gap-4 pt-4 border-t dark:border-slate-800">
                  <div className="relative" onMouseLeave={() => setActiveReactionPicker(null)}>
                    <AnimatePresence>
                      {activeReactionPicker === post.id && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full mb-4 left-0 flex bg-white dark:bg-slate-800 shadow-2xl border dark:border-slate-700 p-2 rounded-full gap-2 z-30">
                          {Object.entries(REACTION_EMOJIS).map(([name, config]) => (
                            <button key={name} onClick={() => handleReaction(post.id, name)} className="text-2xl p-1 hover:scale-125 transition-transform">{config.label}</button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <button onClick={() => setActiveReactionPicker(activeReactionPicker === post.id ? null : post.id)} className="flex items-center gap-2 font-bold text-sm py-2 px-4 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                      {post.reaction_type ? <span>{REACTION_EMOJIS[post.reaction_type]?.label}</span> : <ThumbsUp size={18} />}
                      <span>{post.likes || 0}</span>
                    </button>
                  </div>

                  <button onClick={() => setActiveCommentBox(prev => ({ ...prev, [post.id]: !prev[post.id] }))} className="flex items-center gap-2 font-bold text-sm py-2 px-4 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                    <MessageCircle size={18} /> {post.comments?.length || 0}
                  </button>
                  <button onClick={() => handleShare(post.id, post.content)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><Share2 size={18} /></button>
                </div>

                {activeCommentBox[post.id] && (
                  <div className="mt-6">
                    <div className="flex gap-3">
                      <input 
                        className={`flex-1 px-5 py-3 rounded-2xl text-sm outline-none border transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-transparent focus:bg-white text-slate-900'}`}
                        placeholder="Comment something..." value={commentInputs[post.id] || ""}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(post.id)}
                      />
                      <button onClick={() => handleCommentSubmit(post.id)} className="w-12 h-12 flex items-center justify-center bg-blue-600 text-white rounded-2xl shadow-lg">
                        <Send size={18} />
                      </button>
                    </div>
                    <div className="mt-6 space-y-3">
                      {post.comments?.map((comment: any) => (
                        <div key={comment.id} className={`p-4 rounded-[20px] text-[14px] ${darkMode ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                          {comment.content}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      <footer className="py-20 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.8em] opacity-20">
          &copy; 2026 ANON PREMIER NETWORK
        </p>
      </footer>
    </div>
  );
}