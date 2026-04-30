"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Image as ImageIcon, Trash2, Share2, MessageCircle, Moon, Sun, Monitor, Heart, Smile, Wow, Frown, Angry, ThumbsUp } from "lucide-react";

const R2_URL = "https://pub-73c20b61589145d9b182874824850bb4.r2.dev"; 

const REACTION_EMOJIS: { [key: string]: any } = {
  like: { icon: ThumbsUp, color: "text-blue-500", label: "👍" },
  love: { icon: Heart, color: "text-red-500", label: "❤️" },
  haha: { icon: Smile, color: "text-yellow-500", label: "😂" },
  wow: { icon: Wow, color: "text-purple-500", label: "😮" },
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
      if (data.posts) setPosts(data.posts);
      if (data.onlineCount) setOnlineCount(data.onlineCount);
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
      const result = await response.json();
      if (response.ok) {
        setContent("");
        setSelectedFile(null);
        setPreviewUrl(null);
        fetchPosts();
      } else {
        alert(result.error || "Error occurred");
      }
    } catch (error) {
      alert("Network error");
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
      
      {/* Dynamic Background Decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 ${darkMode ? 'bg-blue-900' : 'bg-blue-300'}`} />
        <div className={`absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 ${darkMode ? 'bg-purple-900' : 'bg-purple-300'}`} />
      </div>

      <nav className={`sticky top-0 z-50 border-b transition-all duration-300 ${darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-white/70 border-slate-200'} backdrop-blur-xl`}>
        <div className="max-w-4xl mx-auto px-6 h-16 flex justify-between items-center">
          <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-white font-black text-xl italic">K</span>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter">ANON</h1>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-green-500 uppercase">{onlineCount} Active</span>
              </div>
            </div>
          </motion.div>
          
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme} 
            className={`p-2.5 rounded-full border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-yellow-400' : 'bg-white border-slate-200 text-slate-600 shadow-sm'}`}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </motion.button>
        </div>
      </nav>

      <main className="relative max-w-2xl mx-auto px-4 py-10">
        
        {/* Create Post Box */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-[32px] p-6 mb-12 border shadow-2xl transition-all ${darkMode ? 'bg-slate-900/50 border-slate-800 shadow-black/40' : 'bg-white border-white shadow-slate-200'}`}
        >
          <textarea 
            className={`w-full p-4 rounded-2xl outline-none transition-all resize-none text-lg font-medium ${darkMode ? 'bg-transparent text-white' : 'bg-transparent text-slate-700'} placeholder:opacity-50`}
            placeholder="ဒီနေ့ ဘာတွေထူးခြားလဲ..." rows={3} value={content} onChange={(e) => setContent(e.target.value)}
          />
          
          <AnimatePresence>
            {previewUrl && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="mt-4 relative rounded-3xl overflow-hidden border-4 border-slate-100 dark:border-slate-800"
              >
                <img src={previewUrl} alt="Preview" className="w-full h-64 object-cover" />
                <button onClick={() => {setPreviewUrl(null); setSelectedFile(null);}} className="absolute top-3 right-3 bg-black/50 backdrop-blur-md text-white p-2 rounded-full hover:bg-red-500 transition-colors">✕</button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-5">
            <label className="flex items-center gap-2 cursor-pointer text-blue-500 font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 px-4 py-2 rounded-full transition-all">
              <ImageIcon size={20} /> <span className="text-sm">Photo/Video</span>
              <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
            </label>
            <motion.button 
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleSubmit} disabled={loading}
              className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-lg ${loading ? "bg-slate-700" : "bg-blue-600 text-white shadow-blue-500/25 hover:bg-blue-500"}`}
            >
              {loading ? "Posting..." : <><Send size={18} /> Post</>}
            </motion.button>
          </div>
        </motion.div>

        {/* Posts List */}
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
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center text-xl font-black text-blue-400">A</div>
                    <div>
                      <p className="font-black text-[15px] tracking-tight">Anonymous User</p>
                      <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest">{post.created_at ? new Date(post.created_at).toLocaleTimeString() : 'Recently'}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(post.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all"><Trash2 size={18} /></button>
                </div>

                <p className="text-[17px] leading-relaxed font-medium mb-6 whitespace-pre-wrap">{post.content}</p>

                {post.media_url && (
                  <motion.div whileHover={{ scale: 1.01 }} className="mb-6 rounded-[24px] overflow-hidden border dark:border-slate-800 shadow-inner">
                    {post.media_type?.startsWith('image/') ? (
                      <img src={`${R2_URL}/${post.media_url}`} className="w-full h-auto max-h-[500px] object-contain bg-black/20" />
                    ) : (
                      <video src={`${R2_URL}/${post.media_url}`} controls className="w-full h-auto bg-black" />
                    )}
                  </motion.div>
                )}

                <div className="flex items-center gap-2 sm:gap-6 pt-4 border-t dark:border-slate-800 border-slate-50">
                  <div className="relative" onMouseLeave={() => setActiveReactionPicker(null)}>
                    <AnimatePresence>
                      {activeReactionPicker === post.id && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.8 }}
                          className="absolute bottom-full mb-4 left-0 flex bg-white dark:bg-slate-800 shadow-2xl border dark:border-slate-700 p-2 rounded-full gap-2 z-30"
                        >
                          {Object.entries(REACTION_EMOJIS).map(([name, config]) => (
                            <motion.button 
                              key={name} whileHover={{ scale: 1.3 }} whileTap={{ scale: 0.9 }}
                              onClick={() => handleReaction(post.id, name)} 
                              className="text-2xl p-1.5"
                            >
                              {config.label}
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <button 
                      onClick={() => setActiveReactionPicker(activeReactionPicker === post.id ? null : post.id)}
                      className={`flex items-center gap-2 font-bold text-sm py-2 px-4 rounded-full transition-all ${post.isLiked ? 'bg-blue-500/10 text-blue-500' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'}`}
                    >
                      {post.reaction_type ? (
                        <span className="text-xl">{REACTION_EMOJIS[post.reaction_type]?.label}</span>
                      ) : <ThumbsUp size={18} />}
                      <span>{post.likes || 0}</span>
                    </button>
                  </div>

                  <button 
                    onClick={() => setActiveCommentBox({ ...activeCommentBox, [post.id]: !activeCommentBox[post.id] })} 
                    className="flex items-center gap-2 font-bold text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 py-2 px-4 rounded-full transition-all"
                  >
                    <MessageCircle size={18} /> {post.comments?.length || 0}
                  </button>
                  
                  <button onClick={() => handleShare(post.id, post.content)} className="flex items-center gap-2 font-bold text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 py-2 px-4 rounded-full transition-all">
                    <Share2 size={18} />
                  </button>
                </div>

                {/* Comments Section */}
                <AnimatePresence>
                  {activeCommentBox[post.id] && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="mt-6 flex gap-3">
                        <input 
                          className={`flex-1 px-5 py-3 rounded-2xl text-sm outline-none border transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-blue-500' : 'bg-slate-50 border-transparent focus:bg-white focus:border-blue-200'}`}
                          placeholder="ဒီပို့စ်အပေါ် ဘာပြောချင်လဲ..." value={commentInputs[post.id] || ""}
                          onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(post.id)}
                        />
                        <button onClick={() => handleCommentSubmit(post.id)} className="w-12 h-12 flex items-center justify-center bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/30 active:scale-90 transition-transform">
                          <Send size={18} />
                        </button>
                      </div>
                      
                      <div className="mt-6 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {post.comments?.map((comment: any) => (
                          <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} key={comment.id} className={`p-4 rounded-[20px] text-[14px] ${darkMode ? 'bg-slate-800/40 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              <span className="font-black text-[10px] uppercase tracking-tighter opacity-50">Anonymous</span>
                            </div>
                            {comment.content}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3b82f655; border-radius: 10px; }
      `}</style>
    </div>
  );
}