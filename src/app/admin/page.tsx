"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, MessageSquare, BarChart3, Home, Zap, Trash2, Clock } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const [adminKey, setAdminKey] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Data Fetch လုပ်တဲ့ Function ကို သီးသန့်ထုတ်လိုက်တယ် (Refresh လုပ်ရလွယ်အောင်)
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminKey }),
      });
      const result = await res.json();
      if (result.success) {
        setData(result);
        setIsAuthorized(true);
      } else {
        alert(result.error || "Wrong Key, Bro!");
      }
    } catch (err) {
      alert("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  // Pin Toggle လုပ်တဲ့ Function
  const handleTogglePin = async (postId: number) => {
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminKey, action: "togglePin", postId }),
      });
      const result = await res.json();
      if (result.success) {
        // အောင်မြင်ရင် data ကို refresh ပြန်လုပ်မယ်
        fetchData();
      } else {
        alert("Failed to toggle pin");
      }
    } catch (err) {
      alert("Error processing request");
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md p-8 rounded-[32px] bg-slate-900 border border-slate-800 text-center shadow-2xl">
          <ShieldCheck size={48} className="mx-auto mb-4 text-indigo-500" />
          <h1 className="text-2xl font-black mb-6">Admin Access</h1>
          <input 
            type="password"
            className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 outline-none mb-4 text-center font-bold tracking-widest focus:border-indigo-500 transition-all"
            placeholder="ENTER ADMIN KEY"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchData()}
          />
          <button 
            onClick={fetchData}
            disabled={loading}
            className="w-full py-4 bg-indigo-600 rounded-2xl font-bold hover:bg-indigo-500 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? "Checking..." : "Authorize"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter">ADMIN PANEL</h1>
            <p className="opacity-50 font-medium">Control center for ANON Network</p>
          </div>
          <Link href="/" className="p-4 bg-slate-800 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-700 transition-all shadow-lg">
            <Home size={24} />
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard icon={<BarChart3 />} label="Total Posts" value={data?.stats?.totalPosts || 0} color="text-blue-500" />
          <StatCard icon={<MessageSquare />} label="Comments" value={data?.stats?.totalComments || 0} color="text-purple-500" />
          <StatCard icon={<ShieldCheck />} label="Feedbacks" value={data?.stats?.totalFeedbacks || 0} color="text-green-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Post Management */}
          <div>
            <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-white">
              <Zap size={20} className="text-yellow-500" /> Post Management
            </h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {data?.allPosts?.map((post: any) => (
                <div key={post.id} className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 flex justify-between items-center group hover:border-slate-700 transition-all">
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-sm font-medium truncate opacity-80">{post.content || "(No text content)"}</p>
                    <p className="text-[10px] opacity-40 font-bold uppercase mt-1">{new Date(post.created_at).toLocaleDateString()}</p>
                  </div>
                  <button 
                    onClick={() => handleTogglePin(post.id)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 ${
                      post.is_pinned 
                      ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/20' 
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    <Zap size={12} fill={post.is_pinned ? "currentColor" : "none"} />
                    {post.is_pinned ? "PINNED" : "PIN"}
                  </button>
                </div>
              ))}
              {(!data?.allPosts || data.allPosts.length === 0) && <p className="opacity-30 italic">No posts found.</p>}
            </div>
          </div>

          {/* Feedback List */}
          <div>
            <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-white">
              <MessageSquare size={20} className="text-indigo-500" /> Recent Feedbacks
            </h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {data?.feedbacks?.map((fb: any) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={fb.id} 
                  className="p-5 rounded-[24px] bg-slate-900 border border-slate-800 hover:border-indigo-500/30 transition-all"
                >
                  <p className="text-md font-medium mb-3 leading-relaxed text-slate-100">{fb.content}</p>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-800/50">
                    <span className="text-[10px] bg-slate-950 px-2 py-1 rounded text-slate-500 font-mono">IP: {fb.user_ip}</span>
                    <span className="text-[10px] opacity-40 font-bold uppercase flex items-center gap-1">
                      <Clock size={10} /> {new Date(fb.created_at).toLocaleString()}
                    </span>
                  </div>
                </motion.div>
              ))}
              {(!data?.feedbacks || data.feedbacks.length === 0) && <p className="opacity-30 italic">No feedback received yet.</p>}
            </div>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>
    </div>
  );
}

function StatCard({ icon, label, value, color }: any) {
  return (
    <div className="p-6 rounded-[32px] bg-slate-900 border border-slate-800 flex items-center gap-6 shadow-xl">
      <div className={`p-4 rounded-2xl bg-slate-950/50 border border-slate-800 ${color}`}>{icon}</div>
      <div>
        <p className="text-[10px] font-black uppercase opacity-40 tracking-wider mb-1">{label}</p>
        <p className="text-3xl font-black text-white leading-none">{value}</p>
      </div>
    </div>
  );
}