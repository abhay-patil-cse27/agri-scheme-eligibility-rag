import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Users,
  FileText,
  Zap,
  Clock,
  TrendingUp,
  ArrowRight,
  PieChart as PieChartIcon
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getSchemes, getProfiles, getHealth, getAnalytics } from "../services/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f43f5e'];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

function StatCard({ icon: Icon, label, value, color, index }) {
  return (
    <motion.div
      className="glass-card"
      custom={index}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      style={{
        padding: "24px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "14px",
          background: `${color}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `1px solid ${color}25`,
        }}
      >
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <p
          style={{
            fontSize: "0.8rem",
            color: "var(--text-muted)",
            fontWeight: 500,
            marginBottom: "4px",
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontSize: "1.6rem",
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          {value}
        </p>
      </div>
    </motion.div>
  );
}

function SchemeCard({ scheme, index }) {
  const { t } = useTranslation();
  const categoryColors = {
    income_support: "#10b981",
    infrastructure: "#6366f1",
    energy: "#f59e0b",
    other: "#8b5cf6",
  };
  const color = categoryColors[scheme.category] || "#8b5cf6";

  return (
    <motion.div
      className="glass-card"
      custom={index + 4}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      style={{ padding: "24px" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "start",
          marginBottom: "16px",
        }}
      >
        <div>
          <h3
            style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "4px" }}
          >
            {scheme.name}
          </h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {scheme.description || "Government scheme"}
          </p>
        </div>
        <span
          className="badge"
          style={{
            background: `${color}15`,
            color,
            border: `1px solid ${color}25`,
          }}
        >
          {scheme.category?.replace("_", " ") || "Other"}
        </span>
      </div>
      <div style={{ display: "flex", gap: "24px" }}>
        <div>
          <p
            style={{
              fontSize: "0.7rem",
              color: "var(--text-muted)",
              marginBottom: "2px",
            }}
          >
            {t('db_chunks')}
          </p>
          <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>
            {scheme.totalChunks}
          </p>
        </div>
        <div>
          <p
            style={{
              fontSize: "0.7rem",
              color: "var(--text-muted)",
              marginBottom: "2px",
            }}
          >
            {t('db_processed')}
          </p>
          <p
            style={{
              fontSize: "0.85rem",
              fontWeight: 500,
              color: "var(--accent-emerald)",
            }}
          >
            {t('db_active')}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [schemes, setSchemes] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [health, setHealth] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, p, h, a] = await Promise.allSettled([
          getSchemes(),
          getProfiles(),
          getHealth(),
          getAnalytics()
        ]);
        if (s.status === 'fulfilled') setSchemes(s.value.data || []);
        if (p.status === 'fulfilled') setProfiles(p.value.data || []);
        if (h.status === 'fulfilled') setHealth(h.value);
        if (a.status === 'fulfilled' && a.value?.success) setAnalytics(a.value.data);
      } catch (e) {
        console.error("Dashboard load error:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalChunks = schemes.reduce((sum, s) => sum + (s.totalChunks || 0), 0);

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: "32px" }}
      >
        <h1
          style={{
            fontSize: "1.8rem",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            marginBottom: "8px",
          }}
        >
          {t('db_welcome')} <span className="gradient-text">{t('app_name')}</span>
        </h1>
        <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>
          {t('db_subtitle')}
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <StatCard
          icon={FileText}
          label={t('db_schemes_loaded')}
          value={analytics?.rawStats?.totalSchemes || schemes.length}
          color="#6366f1"
          index={0}
        />
        <StatCard
          icon={BarChart3}
          label={t('db_total_checks')}
          value={analytics?.rawStats?.totalChecks || 0}
          color="#8b5cf6"
          index={1}
        />
        <StatCard
          icon={Users}
          label={t('db_farmer_profiles')}
          value={analytics?.rawStats?.totalProfiles || profiles.length}
          color="#10b981"
          index={2}
        />
        <StatCard
          icon={Zap}
          label={t('db_system_status')}
          value={health?.status === "ok" ? t('db_online') : t('db_offline')}
          color="#f59e0b"
          index={3}
        />
      </div>

      {/* ── Analytics Visualizations ── */}
      {analytics && (
        <motion.div
           initial="hidden" animate="visible" variants={fadeUp} custom={4}
           style={{ marginBottom: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            {/* Checks Over Time */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} color="var(--accent-indigo)" />
                {t('db_checks_chart')}
              </h3>
              <div style={{ width: '100%', height: 300 }}>
                {analytics.checksOverTime.length > 0 ? (
                  <ResponsiveContainer>
                    <BarChart data={analytics.checksOverTime} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" vertical={false} />
                      <XAxis dataKey="_id" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: '12px', backdropFilter: 'blur(10px)', color: 'var(--text-primary)' }}
                        itemStyle={{ color: 'var(--accent-indigo)' }}
                      />
                      <Bar dataKey="count" name="Total Checks" fill="var(--accent-indigo)" radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                   <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>{t('db_no_data')}</div>
                )}
              </div>
            </div>

            {/* Eligibility Split */}
            <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieChartIcon size={18} color="var(--accent-emerald)" />
                {t('db_eligibility_split')}
              </h3>
              <div style={{ flex: 1, width: '100%', minHeight: 250 }}>
                {(analytics.eligibilitySplit.eligible > 0 || analytics.eligibilitySplit.notEligible > 0) ? (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Eligible', value: analytics.eligibilitySplit.eligible },
                          { name: 'Not Eligible', value: analytics.eligibilitySplit.notEligible }
                        ]}
                        cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                      >
                        <Cell fill="var(--accent-emerald)" />
                        <Cell fill="var(--accent-rose)" />
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>{t('db_no_data')}</div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--accent-emerald)' }} /><span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('db_eligible')} ({analytics.eligibilitySplit.eligible})</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--accent-rose)' }} /><span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('db_not_eligible')} ({analytics.eligibilitySplit.notEligible})</span></div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Top schemes */}
            <div className="glass-card" style={{ padding: '24px' }}>
               <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="var(--accent-sky)" />
                {t('db_top_schemes')}
              </h3>
              <div style={{ width: '100%', height: 300 }}>
                {analytics.topSchemes.length > 0 ? (
                   <ResponsiveContainer>
                    <BarChart layout="vertical" data={analytics.topSchemes} margin={{ top: 5, right: 20, bottom: 5, left: 100 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" horizontal={false} />
                      <XAxis type="number" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis dataKey="_id" type="category" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} width={150} tickFormatter={(v) => v.length > 20 ? v.substring(0, 20) + '...' : v} />
                      <Tooltip 
                        contentStyle={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: '12px' }}
                         cursor={{fill: 'var(--border-glass)', opacity: 0.4}}
                      />
                      <Bar dataKey="count" name="Matches" fill="var(--accent-sky)" radius={[0, 4, 4, 0]} barSize={24}>
                        {analytics.topSchemes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>{t('db_no_data')}</div>
                )}
              </div>
            </div>

            {/* Demographics by State */}
            <div className="glass-card" style={{ padding: '24px' }}>
               <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={18} color="#f59e0b" />
                {t('db_farmer_by_state')}
              </h3>
              <div style={{ width: '100%', height: 300 }}>
                {analytics.profilesByState.length > 0 ? (
                   <ResponsiveContainer>
                    <BarChart data={analytics.profilesByState} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" vertical={false} />
                      <XAxis dataKey="_id" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => v.length > 10 ? v.substring(0, 10) + '...' : v} />
                      <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: '12px' }}
                        cursor={{fill: 'var(--border-glass)', opacity: 0.4}}
                      />
                      <Bar dataKey="count" name="Farmers" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={36}>
                        {analytics.profilesByState.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                   <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>{t('db_no_data')}</div>
                )}
              </div>
            </div>

          </div>
        </motion.div>
      )}

      {/* Quick Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="gradient-border"
        style={{
          padding: "32px",
          marginBottom: "32px",
          background: "var(--bg-card)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "1.2rem",
                fontWeight: 700,
                marginBottom: "8px",
              }}
            >
              <Zap
                size={20}
                style={{
                  display: "inline",
                  marginRight: "8px",
                  color: "var(--accent-indigo)",
                }}
              />
              {t('db_check_title')}
            </h2>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
              {t('db_check_desc')}
            </p>
          </div>
          <Link to="/dashboard/check" style={{ textDecoration: "none" }}>
            <motion.button
              className="btn-glow"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                whiteSpace: "nowrap",
              }}
            >
              {t('db_start_check')} <ArrowRight size={18} />
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* Schemes Grid */}
      <div
        style={{
          marginBottom: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>{t('db_loaded_schemes')}</h2>
        <Link
          to="/dashboard/schemes"
          style={{
            fontSize: "0.85rem",
            color: "var(--accent-indigo)",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          {t('db_view_all')}
        </Link>
      </div>

      {loading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "16px",
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="shimmer"
              style={{ height: "130px", borderRadius: "16px" }}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "16px",
          }}
        >
          {schemes.map((scheme, i) => (
            <SchemeCard key={scheme._id} scheme={scheme} index={i} />
          ))}
          {schemes.length === 0 && (
            <div
              className="glass-card"
              style={{
                padding: "40px",
                textAlign: "center",
                gridColumn: "1 / -1",
              }}
            >
              <FileText
                size={40}
                style={{ color: "var(--text-muted)", margin: "0 auto 12px" }}
              />
              <p style={{ color: "var(--text-secondary)" }}>
              {t('db_no_schemes')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
