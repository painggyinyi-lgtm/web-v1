"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, Image as ImageIcon, Trash2, Share2, MessageCircle, 
  Moon, Sun, Heart, Smile, Frown, Angry, ThumbsUp, Zap, MessageSquare, Eye,
  TrendingUp, X, LayoutGrid, Rss, Clock
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
  const [activeTab, setActiveTab] = useState("feed"); 
  const [content, setContent] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false); 
  const [commentInputs, setCommentInputs] = useState<{ [key: number]: string }>({});
  const [activeCommentBox, setActiveCommentBox] = useState<{ [key: number]: boolean }>({});
  const [activeReactionPicker, setActiveReactionPicker] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [twodData, setTwodData] = useState<any>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  
  const trackedPosts = useRef<Set<number>>(new Set());

  // Theme logic
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme");
    const isDark = savedTheme === "dark" || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add("dark");
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    if (next) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  const fetch2D = useCallback(async () => {
    try {
      const res = await fetch("/api/twod");
      if (res.ok) {
        const data = await res.json();
        setTwodData(data);
      }
    } catch (error) { console.error("2D Fetch error:", error); }
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/posts");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      if (data.posts) {
        setPosts(data.posts);
        data.posts.forEach((post: any) => {
          if (!trackedPosts.current.has(post.id)) {
            fetch(`/api/posts?track=${post.id}`, { method: 'GET' }).catch(() => {});
            trackedPosts.current.add(post.id);
          }
        });
      }
      if (data.onlineCount !== undefined) setOnlineCount(data.onlineCount);
    } catch (error) { console.error("Fetch error:", error); }
  }, []);

  // Data Fetching Interval
  useEffect(() => {
    if (!mounted) return;
    
    const tick = () => {
      if (activeTab === "2d3d") fetch2D();
      else fetchPosts();
    };

    tick();
    const intervalTime = activeTab === "2d3d" ? 5000 : 15000;
    const intervalId = setInterval(tick, intervalTime);
    
    return () => clearInterval(intervalId);
  }, [mounted, activeTab, fetchPosts, fetch2D]);

  // Cleanup Preview URL
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  // Handlers (Pin, Reaction, Delete, etc.)
  const handlePin = async (id: number) => {
    const adminKey = prompt("Admin Key ရိုက်ထည့်ပါ");
    if (!adminKey) return;
    try {
      const res = await fetch("/api/posts", { 
        method: "PATCH", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, adminKey, action: "pin" })
      });
      if (res.ok) fetchPosts();
    } catch (error) { alert("Server error!"); }
  };

  const handleReaction = async (id: number, type: string) => {
    try {
      const res = await fetch("/api/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, reactionType: type }),
      });
      if (res.ok) {
        setActiveReactionPicker(null);
        fetchPosts();
      }
    } catch (error) { console.error(error); }
  };

  const submitFeedback = async () => {
    if (!feedbackText.trim() || feedbackText.length < 5) return;
    setIsSubmittingFeedback(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: feedbackText }),
      });
      if (res.ok) {
        setFeedbackText("");
        setShowFeedback(false);
        alert("ကျေးဇူးတင်ပါတယ်! Feedback ပို့ပြီးပါပြီ။");
      }
    } finally { setIsSubmittingFeedback(false); }
  };

  const handleDelete = async (id: number) => {
    const adminKey = prompt("Admin Key ရိုက်ထည့်ပါ");
    if (!adminKey) return;
    try {
      const res = await fetch("/api/posts", { 
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, adminKey }) 
      });
      if (res.ok) fetchPosts();
    } catch (error) { console.error(error); }
  };

  const handleShare = async (id: number, textContent: string) => {
    const shareUrl = `${window.location.origin}/post/${id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'ANON Post', text: textContent.substring(0, 100), url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert("Link copied to clipboard!");
      }
    } catch (error) { console.error(error); }
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
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        fetchPosts();
      }
    } finally { setLoading(false); }
  };

  const handleCommentSubmit = async (postId: number) => {
    const commentText = commentInputs[postId];
    if (!commentText?.trim()) return;
    try {
      const response = await fetch("/api/comments", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, content: commentText }) 
      });
      if (response.ok) {
        setCommentInputs(prev => ({ ...prev, [postId]: "" }));
        fetchPosts();
      }
    } catch (error) { console.error(error); }
  };

  if (!mounted) return null;

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'bg-[#020617] text-slate-200' : 'bg-[#f1f5f9] text-slate-900'}`}>
      
      {/* Navigation */}
      <nav className={`sticky top-0 z-50 border-b transition-all duration-300 ${darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-white/70 border-slate-200'} backdrop-blur-xl`}>
        <div className="max-w-4xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-xl italic">K</span>
              </div>
              <h1 className="hidden md:block text-xl font-black tracking-tighter">ANON</h1>
            </div>

            <div className={`flex p-1 rounded-2xl ${darkMode ? 'bg-slate-900/50' : 'bg-slate-200/50'}`}>
              <button 
                onClick={() => setActiveTab("feed")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'feed' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600' : 'opacity-50 hover:opacity-100'}`}
              >
                <Rss size={14} /> <span className="hidden sm:inline uppercase">Feed</span>
              </button>
              <button 
                onClick={() => setActiveTab("2d3d")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${activeTab === '2d3d' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600' : 'opacity-50 hover:opacity-100'}`}
              >
                <LayoutGrid size={14} /> <span className="hidden sm:inline uppercase">2D/3D</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
               <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-green-500 uppercase">{onlineCount} Active</span>
               </div>
            </div>
            <button onClick={toggleTheme} className={`p-2.5 rounded-full border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-yellow-400' : 'bg-white border-slate-200 text-slate-600 shadow-sm'}`}>
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </nav>

      <main className="relative max-w-4xl mx-auto px-4 py-10">
        
        {/* --- 2D/3D CONTENT TAB --- */}
        {activeTab === "2d3d" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {twodData ? (
              <div className="space-y-8">
                {/* Header Info */}
                <div className="flex flex-wrap justify-between items-center gap-4 px-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-500/20 rounded-xl text-indigo-400 border border-indigo-500/30">
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-widest text-indigo-400">Thai 2D Live</h2>
                      <p className="text-[10px] font-bold opacity-50">{twodData?.time || "Updating..."}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm font-bold bg-white/5 backdrop-blur-md border border-white/5 py-3 px-6 rounded-2xl">
                    <div className="flex flex-col items-center"><span className="text-[9px] uppercase opacity-40 mb-1">Set</span><span className="text-indigo-400">{twodData?.set || "---"}</span></div>
                    <div className="w-[1px] h-8 bg-white/10"></div>
                    <div className="flex flex-col items-center"><span className="text-[9px] uppercase opacity-40 mb-1">Value</span><span className="text-indigo-400">{twodData?.value || "---"}</span></div>
                  </div>
                </div>

                {/* Main Results Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Morning Result */}
                  <div className={`relative overflow-hidden rounded-[40px] border p-10 shadow-2xl transition-all ${darkMode ? 'bg-slate-950/80 border-white/5' : 'bg-white border-slate-100'}`}>
                    <div className="absolute -top-4 -right-4 p-6 opacity-[0.03] rotate-12"><Clock size={120} /></div>
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-500 mb-6">Morning (12:01 PM)</p>
                    <div className="flex items-center gap-4">
                      <span className="text-8xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-blue-400 to-blue-600">
                        {twodData?.morning || twodData?.twod || "--"}
                      </span>
                      {twodData?.morning && <span className="w-4 h-4 bg-green-500 rounded-full animate-ping"></span>}
                    </div>
                    <div className="mt-10 h-2 w-full bg-slate-500/10 rounded-full overflow-hidden">
                      <motion.div initial={{ x: "-100%" }} animate={{ x: "0%" }} transition={{ duration: 1 }} className="h-full bg-gradient-to-r from-blue-500 to-indigo-500" />
                    </div>
                  </div>

                  {/* Evening Result */}
                  <div className={`relative overflow-hidden rounded-[40px] border p-10 shadow-2xl transition-all ${darkMode ? 'bg-slate-950/80 border-white/5' : 'bg-white border-slate-100'}`}>
                    <div className="absolute -top-4 -right-4 p-6 opacity-[0.03] rotate-12"><Clock size={120} /></div>
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-purple-500 mb-6">Evening (04:30 PM)</p>
                    <div className="flex items-center gap-4">
                      <span className="text-8xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-purple-400 to-purple-600">
                        {twodData?.evening || "--"}
                      </span>
                    </div>
                    <div className="mt-10 h-2 w-full bg-slate-500/10 rounded-full overflow-hidden">
                      <div className="h-full w-full bg-gradient-to-r from-purple-500/20 to-pink-500/20" />
                    </div>
                  </div>
                </div>

                <div className={`p-6 rounded-[24px] border border-dashed transition-all ${darkMode ? 'bg-slate-900/20 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <p className="text-[10px] text-center uppercase font-bold tracking-widest opacity-40">
                    Live data is synchronized with Thai Stock Exchange
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                <div className="text-center opacity-40 font-black uppercase tracking-[0.3em] text-xs">Connecting to Live Feed...</div>
              </div>
            )}
          </motion.div>
        )}

        {/* --- FEED CONTENT TAB --- */}
        {activeTab === "feed" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
            {/* Input Section */}
            <div className={`rounded-[32px] p-6 mb-12 border shadow-2xl transition-all ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-white'}`}>
              <textarea 
                className={`w-full p-4 rounded-2xl outline-none transition-all resize-none text-lg font-medium bg-transparent ${darkMode ? 'text-white' : 'text-slate-700'}`}
                placeholder="ဒီနေ့ ဘာတွေထူးခြားလဲ..." rows={3} value={content} onChange={(e) => setContent(e.target.value)}
              />
              {previewUrl && (
                <div className="mt-4 relative rounded-3xl overflow-hidden border-4 border-slate-100 dark:border-slate-800">
                  <img src={previewUrl} alt="Preview" className="w-full h-64 object-cover" />
                  <button onClick={() => {
                    setPreviewUrl(null); 
                    setSelectedFile(null);
                  }} className="absolute top-3 right-3 bg-black/50 p-2 rounded-full text-white hover:bg-black transition-colors">
                    <X size={18} />
                  </button>
                </div>
              )}
              <div className="mt-6 flex justify-between items-center border-t dark:border-slate-800 pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-blue-500 font-bold px-4 py-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                  <ImageIcon size={20} /> <span className="text-sm">Photo</span>
                  <input type="file" className="hidden" accept="image/*,video/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) { 
                      setSelectedFile(file); 
                      setPreviewUrl(URL.createObjectURL(file)); 
                    }
                  }} />
                </label>
                <button onClick={handleSubmit} disabled={loading || (!content.trim() && !selectedFile)} className={`px-8 py-3 rounded-2xl font-black text-sm uppercase transition-all ${loading ? "bg-slate-700 text-slate-400 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/25 active:scale-95"}`}>
                  {loading ? "Posting..." : "Post"}
                </button>
              </div>
            </div>

            {/* Posts List */}
            <div className="space-y-8">
              <AnimatePresence mode="popLayout">
                {posts.map((post) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={post.id} 
                    className={`relative rounded-[32px] p-6 border shadow-xl transition-all ${
                      post.is_pinned 
                      ? 'bg-gradient-to-br from-indigo-900/30 to-slate-900/30 border-indigo-500/50 ring-2 ring-indigo-500/10' 
                      : (darkMode ? 'bg-slate-900/40 border-slate-800/50' : 'bg-white border-slate-100')
                    }`}
                  >
                    {post.is_pinned && (
                      <div className="absolute -top-3 left-8 px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black rounded-full flex items-center gap-1.5 shadow-xl z-10 border border-indigo-400">
                        <Zap size={12} fill="currentColor" /> FEATURED POST
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black ${post.is_pinned ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-blue-400'}`}>
                          {post.is_pinned ? <Zap size={20} fill="currentColor" /> : "A"}
                        </div>
                        <div>
                          <p className="font-black text-[15px]">Anonymous {post.is_pinned && " (Admin)"}</p>
                          <div className="flex items-center gap-2 opacity-40">
                            <p className="text-[10px] font-bold uppercase">{new Date(post.created_at).toLocaleString()}</p>
                            <span className="w-1 h-1 bg-slate-500 rounded-full" />
                            <div className="flex items-center gap-1">
                              <Eye size={12} />
                              <span className="text-[10px] font-bold">{post.views || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handlePin(post.id)} className={`p-2 transition-colors ${post.is_pinned ? 'text-yellow-400' : 'text-slate-400 hover:text-yellow-500'}`}>
                          <Zap size={18} fill={post.is_pinned ? "currentColor" : "none"} />
                        </button>
                        <button onClick={() => handleDelete(post.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                      </div>
                    </div>

                    <p className={`text-[17px] mb-6 whitespace-pre-wrap leading-relaxed ${post.is_pinned ? 'font-medium text-white' : ''}`}>{post.content}</p>

                    {post.media_url && (
                      <div className="mb-6 rounded-[24px] overflow-hidden border dark:border-slate-800 shadow-inner bg-black/5">
                        {post.media_type?.startsWith('image/') ? (
                          <img src={`${R2_URL}/${post.media_url}`} alt="Post content" className="w-full h-auto max-h-[550px] object-contain" loading="lazy" />
                        ) : (
                          <video src={`${R2_URL}/${post.media_url}`} controls className="w-full h-auto bg-black" />
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-4 border-t dark:border-slate-800/50">
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
                        <button onClick={() => setActiveReactionPicker(activeReactionPicker === post.id ? null : post.id)} className="flex items-center gap-2 font-bold text-sm py-2.5 px-4 rounded-full bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-200 transition-all">
                          {post.reaction_type ? <span>{REACTION_EMOJIS[post.reaction_type]?.label}</span> : <ThumbsUp size={18} className="text-slate-400" />}
                          <span>{post.likes || 0}</span>
                        </button>
                      </div>

                      <button onClick={() => setActiveCommentBox(prev => ({ ...prev, [post.id]: !prev[post.id] }))} className="flex items-center gap-2 font-bold text-sm py-2.5 px-4 rounded-full bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-200 transition-all">
                        <MessageCircle size={18} className="text-slate-400" /> {post.comments?.length || 0}
                      </button>
                      
                      <button onClick={() => handleShare(post.id, post.content)} className="p-2.5 bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-200 rounded-full transition-all"><Share2 size={18} /></button>
                    </div>

                    <AnimatePresence>
                      {activeCommentBox[post.id] && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 overflow-hidden">
                          <div className="flex gap-3">
                            <input 
                              className={`flex-1 px-5 py-3 rounded-2xl text-sm outline-none border transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500' : 'bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 text-slate-900 shadow-inner'}`}
                              placeholder="စကားပြောကြည့်ပါ..." value={commentInputs[post.id] || ""}
                              onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                              onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(post.id)}
                            />
                            <button onClick={() => handleCommentSubmit(post.id)} className="w-12 h-12 flex items-center justify-center bg-indigo-600 text-white rounded-2xl shadow-lg hover:bg-indigo-500 transition-all active:scale-90">
                              <Send size={18} />
                            </button>
                          </div>
                          <div className="mt-6 space-y-3 max-h-[300px] overflow-y-auto pr-2 text-left">
                            {post.comments && post.comments.length > 0 ? (
                              post.comments.map((comment: any) => (
                                <div key={comment.id} className={`p-4 rounded-[20px] text-[14px] leading-relaxed ${darkMode ? 'bg-slate-800/60' : 'bg-slate-100'}`}>
                                  {comment.content}
                                </div>
                              ))
                            ) : (
                              <p className="text-center text-sm opacity-40 py-4 italic">မှတ်ချက် မရှိသေးပါ။</p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </main>

      {/* Feedback FAB */}
      <button onClick={() => setShowFeedback(true)} className="fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 border-4 border-white dark:border-slate-900">
        <MessageSquare size={26} />
      </button>

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedback && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className={`w-full max-w-md p-8 rounded-[40px] border shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h3 className="text-3xl font-black mb-2 tracking-tighter">Feedback</h3>
              <p className="text-sm opacity-60 mb-8">ဒီ Web ကို ပိုကောင်းအောင် ဘာတွေထပ်လုပ်ပေးရမလဲ?</p>
              <textarea 
                className={`w-full p-5 rounded-[24px] outline-none border transition-all resize-none font-medium ${darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500' : 'bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 text-slate-900 shadow-inner'}`}
                placeholder="အကြံပေးချက် ရေးရန်..." rows={4} value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)}
              />
              <div className="flex gap-4 mt-8">
                <button onClick={() => setShowFeedback(false)} className="flex-1 py-4 rounded-2xl font-bold opacity-50 hover:opacity-100 transition-all">Cancel</button>
                <button onClick={submitFeedback} disabled={isSubmittingFeedback} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-500/40 hover:bg-indigo-500 active:scale-95 transition-all">
                  {isSubmittingFeedback ? "Sending..." : "Submit"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="py-20 text-center">
        <p className="text-[10px] font-black uppercase tracking-[1em] opacity-20">
          &copy; 2026 ANON PREMIER NETWORK
        </p>
      </footer>
    </div>
  );
}