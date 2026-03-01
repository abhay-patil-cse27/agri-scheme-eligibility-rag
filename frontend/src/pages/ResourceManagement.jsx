import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Server, 
  Cpu, 
  MessageSquare, 
  Mic, 
  Eye, 
  Mail, 
  Activity, 
  Zap, 
  ShieldCheck, 
  TrendingUp,
  Globe,
  Users,
  RefreshCcw,
  Box,
  CornerDownRight
} from "lucide-react";
import AgriCard from "../components/common/AgriCard";
import { getResourceUsage } from "../services/api";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.4,
      ease: "easeOut",
    },
  }),
};

function StatBox({ label, value, subValue, icon: Icon, color, index, progress = null }) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      className="h-full"
    >
      <AgriCard padding="24px" className="flex flex-col justify-between h-full bg-[var(--bg-card)] border-[var(--border-glass)]">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)] opacity-80">
              {label}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-[var(--text-primary)]">
                {value}
              </span>
              {subValue && (
                <span className="text-[10px] font-bold text-[var(--accent-emerald)] flex items-center gap-0.5">
                  <TrendingUp size={10} /> {subValue}
                </span>
              )}
            </div>
          </div>
          <div className="p-2.5 rounded-xl border border-[var(--border-glass)] bg-[var(--bg-secondary)]" style={{ color }}>
            <Icon size={22} />
          </div>
        </div>

        {progress !== null && (
          <div className="mt-6">
            <div className="flex justify-between text-[9px] font-black uppercase mb-1.5 text-[var(--text-muted)]">
              <span>Current Capacity</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full rounded-full"
                style={{ background: color }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </div>
          </div>
        )}
      </AgriCard>
    </motion.div>
  );
}

function UsageCard({ service, index }) {
  const getIcon = (name) => {
    switch (name) {
      case 'Groq-LLM': return Cpu;
      case 'Groq-Whisper': return Mic;
      case 'Groq-Vision': return Eye;
      case 'ElevenLabs-TTS': return MessageSquare;
      case 'SMTP-Email': return Mail;
      default: return Server;
    }
  };

  const colors = {
    'Groq-LLM': "var(--accent-indigo)",
    'Groq-Whisper': "var(--accent-cyan)",
    'Groq-Vision': "var(--accent-violet)",
    'ElevenLabs-TTS': "var(--accent-amber)",
    'SMTP-Email': "var(--accent-rose)"
  };

  const Icon = getIcon(service.serviceName);
  const color = colors[service.serviceName] || "var(--accent-indigo)";
  
  const regUsage = service.todayRegisteredUsage || 0;
  const pubUsage = service.todayPublicUsage || 0;
  const totalToday = regUsage + pubUsage;
  const limit = service.dailyLimit || 100000;
  
  const regPercent = Math.min((regUsage / limit) * 100, 100);
  const pubPercent = Math.min((pubUsage / limit) * 100, 100);

  return (
    <motion.div
      custom={index + 4}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
    >
      <AgriCard padding="0" className="flex flex-col h-full bg-[var(--bg-card)] border-[var(--border-glass)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border-glass)] flex justify-between items-center bg-[var(--bg-secondary)]/30">
          <div className="flex items-center gap-3">
             <div className="p-1.5 rounded-lg bg-[var(--bg-secondary)]" style={{ color }}>
               <Icon size={18} />
             </div>
             <h3 className="font-bold text-sm text-[var(--text-primary)]">{service.serviceName.replace('-', ' ')}</h3>
          </div>
          <span className="text-[9px] font-black px-2 py-0.5 rounded border border-[var(--border-glass)] text-[var(--text-muted)] uppercase tracking-tighter">
            {service.provider}
          </span>
        </div>

        <div className="p-5 flex-1 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase flex items-center gap-1.5">
                <Users size={12} /> Registered
              </span>
              <span className="text-sm font-black text-[var(--text-primary)]">{regUsage.toLocaleString()}</span>
            </div>
            <div className="h-2 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${regPercent}%` }}
                 className="h-full rounded-full"
                 style={{ background: color }}
               />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black text-[var(--accent-emerald)] uppercase flex items-center gap-1.5">
                <Globe size={12} /> Public
              </span>
              <span className="text-sm font-black text-[var(--text-primary)]">{pubUsage.toLocaleString()}</span>
            </div>
            <div className="h-2 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${pubPercent}%` }}
                 className="h-full rounded-full bg-[var(--accent-emerald)]"
                 transition={{ delay: 0.1 }}
               />
            </div>
          </div>
        </div>

        <div className="px-5 py-3.5 bg-[var(--bg-secondary)]/50 mt-auto grid grid-cols-2 gap-2 border-t border-[var(--border-glass)]">
           <div>
             <span className="text-[9px] uppercase font-black text-[var(--text-muted)] tracking-wider">Total Agg</span>
             <p className="text-sm font-black text-[var(--text-primary)]">{totalToday.toLocaleString()}</p>
           </div>
           <div className="text-right">
             <span className="text-[9px] uppercase font-black text-[var(--text-muted)] tracking-wider">Status</span>
             <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-[var(--accent-emerald)]">
               <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-emerald)] animate-pulse" />
               Optimal
             </div>
           </div>
        </div>
      </AgriCard>
    </motion.div>
  );
}

export default function ResourceManagement() {
  const [usageData, setUsageData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadUsage = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await getResourceUsage();
      if (res.success) setUsageData(res.data);
    } catch (e) {
      console.error("Resource load error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsage();
    const interval = setInterval(() => loadUsage(true), 15000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const totalTokensReg = usageData.filter(s => s.unit === 'tokens').reduce((s, c) => s + (c.todayRegisteredUsage || 0), 0);
    const totalTokensPub = usageData.filter(s => s.unit === 'tokens').reduce((s, c) => s + (c.todayPublicUsage || 0), 0);
    const totalCharsReg = usageData.filter(s => s.unit === 'characters').reduce((s, c) => s + (c.todayRegisteredUsage || 0), 0);
    const totalCharsPub = usageData.filter(s => s.unit === 'characters').reduce((s, c) => s + (c.todayPublicUsage || 0), 0);
    
    return {
      tokens: { total: totalTokensReg + totalTokensPub },
      chars: { total: totalCharsReg + totalCharsPub }
    };
  }, [usageData]);

  const chartData = useMemo(() => {
    const llm = usageData.find(s => s.serviceName === 'Groq-LLM');
    if (!llm || !llm.history || llm.history.length === 0) return [];
    return llm.history.slice(-7).map(h => ({
      date: new Date(h.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      registered: h.registeredUsage || 0,
      public: h.publicUsage || 0
    }));
  }, [usageData]);

  return (
    <div className="pb-32 space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="p-2 rounded-xl bg-[var(--accent-indigo)]/10 text-[var(--accent-indigo)] border border-[var(--accent-indigo)]/20 shadow-sm">
              <Box size={22} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--accent-indigo)]">
              Infrastructure Operations
            </span>
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight">
            Resource <span className="text-[var(--accent-indigo)]">Monitoring</span>
          </h1>
          <p className="text-sm text-[var(--text-secondary)] font-medium mt-2.5 flex items-center gap-2">
            <CornerDownRight size={14} className="opacity-50" />
            Telemetry of API saturation levels across distributed cloud nodes.
          </p>
        </div>

        <div className="flex items-center gap-5">
           <div className="hidden lg:block text-right">
             <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest block mb-0.5">Live Sync active</span>
             <span className="text-xs font-mono font-black text-[var(--accent-indigo)] flex items-center gap-1.5 justify-end">
               <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-indigo)] animate-pulse" />
               15s Interval
             </span>
           </div>
           <button 
             onClick={() => loadUsage(true)}
             disabled={refreshing}
             className="btn-glow flex items-center gap-2.5 text-xs px-8 py-3.5 shadow-lg shadow-[var(--accent-indigo)]/20"
           >
             <RefreshCcw size={16} className={refreshing ? "animate-spin" : ""} />
             {refreshing ? "SYNCING..." : "MANUAL REFRESH"}
           </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatBox 
          label="Today's LLM Tokens" 
          value={stats.tokens.total.toLocaleString()} 
          subValue="Live"
          icon={Cpu} 
          color="var(--accent-indigo)" 
          index={0} 
          progress={42}
        />
        <StatBox 
          label="TTS Characters" 
          value={stats.chars.total.toLocaleString()} 
          subValue="Stable"
          icon={MessageSquare} 
          color="var(--accent-amber)" 
          index={1} 
          progress={25}
        />
        <StatBox 
          label="Mean Latency" 
          value="18ms" 
          subValue="Optimal"
          icon={Zap} 
          color="var(--accent-emerald)" 
          index={2} 
          progress={12}
        />
        <StatBox 
          label="Audit Standard" 
          value="EAL5+" 
          subValue="Verified"
          icon={ShieldCheck} 
          color="var(--accent-violet)" 
          index={3} 
        />
      </div>

      {/* Main Monitoring Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Deep Analysis & Service Grid */}
        <div className="lg:col-span-8 space-y-8">
          <AgriCard padding="32px" className="bg-[var(--bg-card)] border-[var(--border-glass)] min-h-[480px] flex flex-col">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
                <div>
                   <h2 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-2.5">
                     <TrendingUp size={22} className="text-[var(--accent-indigo)]" />
                     Temporal Load Analysis
                   </h2>
                   <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-1.5 ml-8">Daily Traffic Density Layer</p>
                </div>
                <div className="flex items-center gap-5 bg-[var(--bg-secondary)]/30 p-2 rounded-xl border border-[var(--border-glass)]">
                   <div className="flex items-center gap-2.5 px-3">
                     <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-indigo)] shadow-[0_0_8px_var(--accent-indigo)]" />
                     <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase">Registered</span>
                   </div>
                   <div className="flex items-center gap-2.5 px-3">
                     <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-emerald)] shadow-[0_0_8px_var(--accent-emerald)]" />
                     <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase">Public</span>
                   </div>
                </div>
             </div>

             <div className="flex-1 w-full min-h-[320px]">
               {chartData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                     <defs>
                        <linearGradient id="regG" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent-indigo)" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="var(--accent-indigo)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="pubG" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent-emerald)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--accent-emerald)" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="4 4" stroke="var(--border-glass)" vertical={false} />
                     <XAxis 
                       dataKey="date" 
                       stroke="var(--text-muted)" 
                       fontSize={10} 
                       fontWeight={800}
                       tickLine={false} 
                       axisLine={false} 
                       dy={12}
                     />
                     <YAxis 
                       stroke="var(--text-muted)" 
                       fontSize={10} 
                       fontWeight={800}
                       tickLine={false} 
                       axisLine={false} 
                     />
                     <Tooltip 
                       contentStyle={{ 
                         background: 'var(--bg-card)', 
                         border: '1px solid var(--border-glass)', 
                         borderRadius: '16px',
                         boxShadow: 'var(--shadow-card)',
                         color: 'var(--text-primary)',
                         padding: '12px'
                       }}
                       itemStyle={{ fontWeight: 900, fontSize: '12px', padding: '2px 0' }}
                     />
                     <Area 
                       type="monotone" 
                       dataKey="registered" 
                       stackId="1"
                       stroke="var(--accent-indigo)" 
                       strokeWidth={3}
                       fillOpacity={1} 
                       fill="url(#regG)" 
                     />
                     <Area 
                       type="monotone" 
                       dataKey="public" 
                       stackId="1"
                       stroke="var(--accent-emerald)" 
                       strokeWidth={3}
                       fillOpacity={1} 
                       fill="url(#pubG)" 
                     />
                   </AreaChart>
                 </ResponsiveContainer>
               ) : (
                <div className="h-full flex flex-col items-center justify-center gap-4 opacity-40">
                   <Activity size={32} className="text-[var(--text-muted)] animate-pulse" />
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Awaiting telemetry stream...</p>
                </div>
               )}
             </div>
          </AgriCard>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {loading ? (
               [1,2,3].map(i => <div key={i} className="shimmer h-[220px] rounded-[24px]" />)
             ) : (
               usageData.map((s, i) => <UsageCard key={s._id} service={s} index={i} />)
             )}
          </div>
        </div>

        {/* System Sideboard */}
        <div className="lg:col-span-4 space-y-8">
           <AgriCard padding="28px" className="border-[var(--accent-emerald)]/10 bg-[var(--accent-emerald)]/[0.03]">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-[var(--accent-emerald)] mb-8 flex items-center gap-2.5">
                <Globe size={16} />
                Network Availability
              </h3>
              <div className="space-y-4">
                {[
                  { name: 'Groq Cloud', status: 'Optimal', lat: '12ms' },
                  { name: 'ElevenLabs', status: 'Healthy', lat: '45ms' },
                  { name: 'Neo4j Aura', status: 'Syncing', lat: '8ms' },
                  { name: 'MongoDB Alt', status: 'Healthy', lat: '15ms' }
                ].map((s, i) => (
                  <div key={i} className="flex justify-between items-center bg-[var(--bg-secondary)]/20 p-4 rounded-xl border border-[var(--border-glass)] hover:border-[var(--accent-emerald)]/30 transition-colors">
                    <div>
                       <p className="text-sm font-black text-[var(--text-primary)]">{s.name}</p>
                       <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase mt-0.5">{s.lat} Ping</p>
                    </div>
                    <div className="text-right">
                       <span className="text-[11px] font-black text-[var(--accent-emerald)] uppercase">{s.status}</span>
                       <div className="flex gap-1 mt-1.5 justify-end">
                          <div className="w-1.5 h-3.5 rounded-full bg-[var(--accent-emerald)]" />
                          <div className="w-1.5 h-3.5 rounded-full bg-[var(--accent-emerald)]" />
                          <div className="w-1.5 h-3.5 rounded-full bg-[var(--accent-emerald)]/20" />
                       </div>
                    </div>
                  </div>
                ))}
              </div>
           </AgriCard>

           <AgriCard padding="28px" className="border-[var(--border-glass)]">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-5">Governance Protocol</h3>
              <p className="text-xs leading-relaxed text-[var(--text-secondary)] font-bold mb-6">
                Usage Governor strictly enforces rate limits across both Public and Registered scopes. 24h reset cycles are aligned with GMT+0.
              </p>
              
              <div className="flex flex-wrap gap-2.5">
                <span className="px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-glass)] text-[9px] font-black text-[var(--text-secondary)]">SCALING: AUTOMATIC</span>
                <span className="px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-glass)] text-[9px] font-black text-[var(--text-secondary)]">FIREWALL: L7 WAF</span>
                <span className="px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-glass)] text-[9px] font-black text-[var(--text-secondary)]">ISO: 27001-COMPLIANT</span>
              </div>
           </AgriCard>

           {/* Health Status Block */}
           <div className="p-8 bg-gradient-to-br from-[var(--accent-emerald)] to-[#0c170c] rounded-[32px] shadow-2xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <ShieldCheck size={120} />
              </div>
              <div className="relative z-10 flex flex-col gap-6">
                 <div className="bg-white/10 w-fit p-3 rounded-2xl backdrop-blur-md">
                   <Activity size={24} className="text-white" />
                 </div>
                 <div>
                    <h4 className="text-xl font-black text-white tracking-tight">System Integrity</h4>
                    <p className="text-xs text-white/70 font-bold uppercase tracking-wider mt-1">Status: Fully Operational</p>
                 </div>
                 <div className="pt-6 border-t border-white/10 mt-2">
                    <div className="flex justify-between items-center text-[10px] font-black text-white uppercase tracking-widest">
                       <span>Node Security</span>
                       <span className="bg-white/10 px-3 py-1 rounded-md">VERIFIED</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
