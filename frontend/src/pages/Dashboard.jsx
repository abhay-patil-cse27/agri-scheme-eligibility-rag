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
} from "lucide-react";
import { Link } from "react-router-dom";
import { getSchemes, getProfiles, getHealth } from "../services/api";

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
            CHUNKS
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
            PROCESSED
          </p>
          <p
            style={{
              fontSize: "0.85rem",
              fontWeight: 500,
              color: "var(--accent-emerald)",
            }}
          >
            Active
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const [schemes, setSchemes] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, p, h] = await Promise.all([
          getSchemes(),
          getProfiles(),
          getHealth(),
        ]);
        setSchemes(s.data || []);
        setProfiles(p.data || []);
        setHealth(h);
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
          Welcome to <span className="gradient-text">NitiSetu</span>
        </h1>
        <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>
          Voice-powered scheme eligibility engine — AI meets agricultural policy
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
          label="Schemes Loaded"
          value={schemes.length}
          color="#6366f1"
          index={0}
        />
        <StatCard
          icon={BarChart3}
          label="Document Chunks"
          value={totalChunks.toLocaleString()}
          color="#8b5cf6"
          index={1}
        />
        <StatCard
          icon={Users}
          label="Farmer Profiles"
          value={profiles.length}
          color="#10b981"
          index={2}
        />
        <StatCard
          icon={Zap}
          label="System Status"
          value={health?.status === "ok" ? "Online" : "Offline"}
          color="#f59e0b"
          index={3}
        />
      </div>

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
              Check Scheme Eligibility
            </h2>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
              Use voice or form input to check farmer eligibility — get results
              with PDF citations in under 5 seconds
            </p>
          </div>
          <Link to="/check" style={{ textDecoration: "none" }}>
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
              Start Check <ArrowRight size={18} />
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
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Loaded Schemes</h2>
        <Link
          to="/schemes"
          style={{
            fontSize: "0.85rem",
            color: "var(--accent-indigo)",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          View all →
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
                No schemes uploaded yet. Go to Schemes page to upload PDFs.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
