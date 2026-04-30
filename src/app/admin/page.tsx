"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, MessageSquare, BarChart3, Trash2, Home } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const [adminKey, setAdminKey] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        body: JSON.stringify({ adminKey }),
      });
      const result = await res.json();
      if (result.success) {
        setData(result);
        setIsAuthorized(true);
      } else {
        alert("Wrong Key, Bro!");
      }
    } catch (err) {
      alert("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md p-8 rounded-[32px] bg-slate-900 border border-slate-800 text-center">
          <ShieldCheck size={48} className="mx-auto mb-4 text-indigo-500" />
          <h1 className="text-2xl font-black mb-6">Admin Access</h1>
          <input 
            type="password"
            className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 outline-none mb-4 text-center font-bold tracking-widest"
            placeholder="ENTER ADMIN KEY"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
          />
          <button 
            onClick={handleLogin}
            className="w-full py-4 bg-indigo-600 rounded-2xl font-bold hover:bg-indigo-500 transition-all"
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
            <h1 className="text-3xl font-black text-white">Dashboard</h1>
            <p className="opacity-50">Welcome back, Owner.</p>
          </div>
          <Link href="/" className="p-3 bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-colors">
            <Home size={20} />
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard icon={<BarChart3 />} label="Total Posts" value={data?.stats?.totalPosts} color="text-blue-500" />
          <StatCard icon={<MessageSquare />} label="Comments" value={data?.stats?.totalComments} color="text-purple-500" />
          <StatCard icon={<ShieldCheck />} label="Feedbacks" value={data?.stats?.totalFeedbacks} color="text-green-500" />
        </div>

        {/* Feedbacks List */}
        <h2 className="text-xl font-black mb-6 flex items-center gap-2">
          <MessageSquare size={20} className="text-indigo-500" /> User Feedbacks
        </h2>
        <div className="space-y-4">
          {data?.feedbacks?.map((fb: any) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={fb.id} 
              className="p-6 rounded-[24px] bg-slate-900 border border-slate-800 flex justify-between items-start"
            >
              <div>
                <p className="text-lg font-medium mb-2">{fb.content}</p>
                <div className="flex gap-4 text-xs opacity-40 font-bold uppercase tracking-wider">
                  <span>IP: {fb.user_ip}</span>
                  <span>{new Date(fb.created_at).toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          ))}
          {data?.feedbacks?.length === 0 && <p className="opacity-30">No feedback yet.</p>}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: any) {
  return (
    <div className="p-6 rounded-[32px] bg-slate-900 border border-slate-800 flex items-center gap-6">
      <div className={`p-4 rounded-2xl bg-slate-950 ${color}`}>{icon}</div>
      <div>
        <p className="text-xs font-bold uppercase opacity-40">{label}</p>
        <p className="text-2xl font-black">{value}</p>
      </div>
    </div>
  );
}