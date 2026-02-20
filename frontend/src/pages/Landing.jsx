import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Zap, Shield, Brain, FileText, Users, BarChart3, Mic, Globe,
  Star, ArrowRight, CheckCircle, Sun, Moon, Menu, X,
  Cpu, Lock, Languages, HeartHandshake, Wheat, MapPin,
  Github, Sprout, TrendingUp, Clock
} from 'lucide-react';

/* ─── Agricultural color system ─────────────────────────── */
const C = (isDark) => ({
  bg:         isDark ? '#060d06'                      : '#faf7ee',
  bg2:        isDark ? '#0c170c'                      : '#f2ead8',
  bgCard:     isDark ? 'rgba(12,24,12,0.92)'          : 'rgba(255,253,244,0.97)',
  bgGlass:    isDark ? 'rgba(34,197,94,0.05)'         : 'rgba(101,67,33,0.07)',
  border:     isDark ? 'rgba(34,197,94,0.12)'         : 'rgba(101,67,33,0.18)',
  borderGlow: isDark ? 'rgba(34,197,94,0.3)'          : 'rgba(22,101,52,0.32)',
  text:       isDark ? '#e8f5e0'                      : '#1a2a0e',
  textSec:    isDark ? '#6b9a60'                      : '#3d5c28',
  textMute:   isDark ? '#3d5e38'                      : '#8a7750',
  navBg:      isDark ? 'rgba(6,13,6,0.94)'            : 'rgba(250,247,238,0.97)',
  sectionAlt: isDark ? 'rgba(255,255,255,0.025)'      : 'rgba(101,67,33,0.055)',
});

const GREEN_GRAD  = 'linear-gradient(135deg, #166534 0%, #16a34a 50%, #4ade80 100%)';
const GOLD_GRAD   = 'linear-gradient(135deg, #92400e 0%, #ca8a04 60%, #fbbf24 100%)';
const HERO_GRAD = (isDark) => isDark
  ? 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(22,163,74,0.22) 0%, rgba(6,13,6,0) 70%)'
  : 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(180,120,40,0.13) 0%, rgba(250,247,238,0) 70%)';

const FU = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } };
const S  = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

function InView({ children, id, style }) {
  const ref = useRef(null);
  const ok  = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.section id={id} ref={ref} initial="hidden" animate={ok ? 'visible' : 'hidden'} variants={S} style={style}>
      {children}
    </motion.section>
  );
}

/* ─── Smooth wavy divider ─────────────────────────────────── */
function Wave({ fill, flip }) {
  return (
    <div style={{ lineHeight: 0, transform: flip ? 'scaleY(-1)' : 'none' }}>
      <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '60px' }}>
        <path d="M0,32 C240,60 480,0 720,32 C960,60 1200,0 1440,32 L1440,60 L0,60 Z" fill={fill} />
      </svg>
    </div>
  );
}

/* ─── Data ───────────────────────────────────────────────── */
const WHY = [
  { icon: Clock,      val: '< 1s',  label: 'Eligibility answer',   sub: 'Powered by Groq LLaMA 3.3' },
  { icon: FileText,   val: '4+',    label: 'Central schemes',       sub: 'PM-KISAN, KUSUM, AIF, KMY' },
  { icon: Sprout,     val: '6+',    label: 'Social categories',     sub: 'OBC, SC/ST, EWS, Minority…' },
  { icon: TrendingUp, val: '100%',  label: 'Open source',           sub: 'By students, for farmers' },
];

const FEATURES = [
  { icon: Mic,      label: 'Voice Input',           desc: 'Speak in your language — Whisper AI transcribes and processes your details instantly.' },
  { icon: Brain,    label: 'Intelligent Matching',  desc: 'LLaMA 3.3 reads scheme PDFs and matches your profile against real eligibility clauses.' },
  { icon: FileText, label: 'Citation-Backed',       desc: 'Every answer cites the exact scheme section so you know the reasoning — not just the result.' },
  { icon: BarChart3,label: 'Admin Dashboard',       desc: 'District-level analytics: scheme adoption trends, demographic breakdowns, history logs.' },
  { icon: Shield,   label: 'Secure & Private',      desc: 'JWT auth with strict RBAC. Farmer data stays private — admins see only aggregated insights.' },
  { icon: Globe,    label: 'Google Sign-In',        desc: 'One-tap Google login — no password set-up needed for farmers accessing for the first time.' },
];

const AUDIENCE = [
  { icon: Wheat,         g: GREEN_GRAD, title: 'Marginal Farmers',   desc: 'Type or speak your farm details and get a clear list of eligible schemes with exact benefit amounts — in seconds.' },
  { icon: Users,         g: GOLD_GRAD,  title: 'District Officers',  desc: 'Monitor which schemes are gaining traction, identify underserved populations, and track historical checks.' },
  { icon: FileText,      g: GREEN_GRAD, title: 'Policy Analysts',    desc: 'Upload new scheme PDFs to instantly expand the knowledge base and stress-test eligibility logic.' },
  { icon: HeartHandshake,g: GOLD_GRAD,  title: 'NGOs & Gram Sabhas', desc: 'Run bulk eligibility checks on behalf of rural communities to identify overlooked benefit gaps.' },
];

/* ─── Main Component ─────────────────────────────────────── */
export default function Landing() {
  const { user }             = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate             = useNavigate();
  const [open, setOpen]      = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const heroRef              = useRef(null);
  const { scrollYProgress }  = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY                = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);

  const isDark = theme === 'dark';
  const c      = C(isDark);

  useEffect(() => { if (user) navigate('/dashboard/'); }, [user, navigate]);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const go = (id) => { setOpen(false); document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' }); };

  const NAV = [
    { label: 'Features', id: '#features' },
    { label: 'Who We Serve', id: '#audience' },
    { label: 'Technology', id: '#technology' },
    { label: 'Contact', id: '#contact' },
  ];

  /* ── shared section wrapper ── */
  const sec = (extra = {}) => ({
    padding: '96px max(28px, calc((100vw - 1180px)/2))',
    transition: 'background 0.35s ease',
    ...extra,
  });

  return (
    <div style={{ minHeight: '100vh', background: c.bg, color: c.text, fontFamily: '"Inter", sans-serif', transition: 'background 0.35s ease, color 0.25s ease' }}>

      {/* ══ Navbar ══ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        background: scrolled ? c.navBg : 'transparent',
        backdropFilter: scrolled ? 'blur(18px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(18px)' : 'none',
        borderBottom: `1px solid ${scrolled ? c.border : 'transparent'}`,
        transition: 'all 0.35s ease',
      }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'flex', alignItems: 'center', height: '64px', padding: '0 28px' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '0 0 auto', marginRight: '32px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: GREEN_GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(22,163,74,0.4)' }}>
              <Sprout size={18} color="white" />
            </div>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
              <span style={{ background: GREEN_GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Niti</span>
              <span style={{ color: c.text }}>Setu</span>
            </span>
          </div>

          {/* Desktop links */}
          <div style={{ display: 'flex', gap: '2px', flex: 1 }}>
            {NAV.map(n => (
              <button key={n.id} onClick={() => go(n.id)} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '8px 14px',
                borderRadius: '8px', fontSize: '0.9rem', fontWeight: 500, color: c.textSec,
                transition: 'color 0.2s, background 0.2s',
              }}
                onMouseOver={e => { e.currentTarget.style.color = c.text; e.currentTarget.style.background = c.bgGlass; }}
                onMouseOut={e => { e.currentTarget.style.color = c.textSec; e.currentTarget.style.background = 'none'; }}
              >{n.label}</button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <motion.button whileTap={{ scale: 0.9 }} onClick={toggleTheme} title="Toggle theme" style={{
              background: c.bgGlass, border: `1px solid ${c.border}`, borderRadius: '8px',
              padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center',
              transition: 'all 0.2s',
            }}>
              {isDark ? <Sun size={16} color="#fbbf24" /> : <Moon size={16} color="#166534" />}
            </motion.button>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} style={{
                background: GREEN_GRAD, color: '#fff', border: 'none', borderRadius: '10px',
                padding: '9px 22px', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(22,163,74,0.4)',
              }}>Sign In</motion.button>
            </Link>
            <button onClick={() => setOpen(!open)} style={{ background: 'none', border: `1px solid ${c.border}`, borderRadius: '8px', padding: '8px', cursor: 'pointer', color: c.textSec, display: 'none' }} className="ns-hamburger">
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {open && (
          <div style={{ background: c.navBg, borderTop: `1px solid ${c.border}`, padding: '10px 28px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {NAV.map(n => (
              <button key={n.id} onClick={() => go(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '12px 14px', borderRadius: '8px', textAlign: 'left', fontSize: '0.95rem', fontWeight: 500, color: c.textSec }}>{n.label}</button>
            ))}
          </div>
        )}
      </nav>

      {/* ══ Hero ══ */}
      <div ref={heroRef} style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <motion.div style={{ y: heroY, position: 'absolute', inset: 0, background: HERO_GRAD(isDark), zIndex: 0 }} />

        {/* decorative grain dots */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle, ${isDark ? 'rgba(34,197,94,0.06)' : 'rgba(22,101,52,0.05)'} 1px, transparent 1px)`, backgroundSize: '36px 36px', zIndex: 0 }} />

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} style={{ position: 'relative', zIndex: 1, maxWidth: '820px', margin: '0 auto', padding: '160px 28px 100px', textAlign: 'center' }}>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.5 }} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: isDark ? 'rgba(22,163,74,0.12)' : 'rgba(22,101,52,0.08)', border: `1px solid ${c.border}`, borderRadius: '100px', padding: '6px 18px', marginBottom: '32px' }}>
            <Wheat size={13} color={isDark ? '#4ade80' : '#166534'} />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isDark ? '#4ade80' : '#166534', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Agricultural Scheme Intelligence</span>
          </motion.div>

          <h1 style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.08, marginBottom: '24px', color: c.text }}>
            India's Farmers Deserve<br />
            <span style={{ background: GREEN_GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', display: 'inline-block' }}>Every Benefit They've Earned</span>
          </h1>

          <p style={{ fontSize: '1.1rem', color: c.textSec, maxWidth: '560px', margin: '0 auto 40px', lineHeight: 1.78 }}>
            Tell us about your land, income, and family in seconds — by typing or speaking. Niti-Setu reads the actual scheme documents and tells you exactly which benefits you qualify for, and why.
          </p>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" style={{ textDecoration: 'none' }}>
              <motion.button whileHover={{ scale: 1.05, boxShadow: '0 16px 48px rgba(22,163,74,0.45)' }} whileTap={{ scale: 0.97 }} style={{
                background: GREEN_GRAD, color: '#fff', border: 'none', borderRadius: '14px',
                padding: '14px 32px', fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '10px',
                boxShadow: '0 6px 24px rgba(22,163,74,0.4)', transition: 'box-shadow 0.3s',
              }}>
                Check Your Eligibility <ArrowRight size={18} />
              </motion.button>
            </Link>
            <button onClick={() => go('#features')} style={{
              background: c.bgCard, color: c.text, border: `1px solid ${c.border}`,
              borderRadius: '14px', padding: '14px 30px', fontSize: '1rem', fontWeight: 600,
              cursor: 'pointer', backdropFilter: 'blur(8px)', transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
              onMouseOver={e => { e.currentTarget.style.borderColor = c.borderGlow; e.currentTarget.style.boxShadow = `0 0 0 3px ${isDark ? 'rgba(34,197,94,0.08)' : 'rgba(22,101,52,0.06)'}` }}
              onMouseOut={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.boxShadow = 'none'; }}
            >
              Learn How It Works
            </button>
          </div>

          {/* Stats strip */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.6 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: c.border, borderRadius: '18px', overflow: 'hidden', marginTop: '72px', border: `1px solid ${c.border}` }}>
            {WHY.map(w => (
              <div key={w.val} style={{ background: c.bgCard, padding: '20px 14px', textAlign: 'center', backdropFilter: 'blur(8px)' }}>
                <p style={{ fontSize: '1.75rem', fontWeight: 900, background: GREEN_GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '-0.03em' }}>{w.val}</p>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: c.text, marginTop: '2px' }}>{w.label}</p>
                <p style={{ fontSize: '0.72rem', color: c.textMute, marginTop: '3px' }}>{w.sub}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      <Wave fill={c.bg2} />

      {/* ══ Features ══ */}
      <InView id="features" style={{ ...sec(), background: c.bg2 }}>
        <motion.div variants={FU}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: isDark ? '#4ade80' : '#166534' }}>How It Works</span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.03em', color: c.text, lineHeight: 1.15, marginTop: '10px', marginBottom: '12px' }}>A Complete Picture, Not Just a Yes or No</h2>
          <p style={{ fontSize: '1rem', color: c.textSec, maxWidth: '560px', lineHeight: 1.75, marginBottom: '48px' }}>Built on real government documents — not guesswork. Every eligibility answer comes with the clause it was drawn from.</p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {FEATURES.map((f, i) => (
            <motion.div key={f.label} variants={FU}
              whileHover={{ y: -6, borderColor: c.borderGlow, boxShadow: `0 12px 40px ${isDark ? 'rgba(34,197,94,0.1)' : 'rgba(22,101,52,0.08)'}` }}
              style={{ background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: '18px', padding: '26px 22px', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '13px', background: i % 2 === 0 ? 'rgba(22,163,74,0.12)' : 'rgba(202,138,4,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <f.icon size={22} color={i % 2 === 0 ? (isDark ? '#4ade80' : '#166534') : '#ca8a04'} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: c.text, marginBottom: '8px' }}>{f.label}</h3>
              <p style={{ fontSize: '0.87rem', color: c.textSec, lineHeight: 1.68 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </InView>

      <Wave fill={c.bg} flip />

      {/* ══ Who We Serve ══ */}
      <InView id="audience" style={{ ...sec(), background: c.bg }}>
        <motion.div variants={FU}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: isDark ? '#4ade80' : '#166534' }}>Who We Serve</span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.03em', color: c.text, lineHeight: 1.15, marginTop: '10px', marginBottom: '12px' }}>From the Field to the District Office</h2>
          <p style={{ fontSize: '1rem', color: c.textSec, maxWidth: '540px', lineHeight: 1.75, marginBottom: '48px' }}>Niti-Setu is built for everyone across the agricultural support chain — not just administrators.</p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
          {AUDIENCE.map(a => (
            <motion.div key={a.title} variants={FU}
              whileHover={{ y: -5, boxShadow: `0 12px 36px ${isDark ? 'rgba(34,197,94,0.08)' : 'rgba(22,101,52,0.06)'}` }}
              style={{ background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: '18px', padding: '26px 22px', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: a.g, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px', boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}>
                <a.icon size={22} color="white" />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: c.text, marginBottom: '8px' }}>{a.title}</h3>
              <p style={{ fontSize: '0.87rem', color: c.textSec, lineHeight: 1.68 }}>{a.desc}</p>
            </motion.div>
          ))}
        </div>
      </InView>

      <Wave fill={c.bg2} />

      {/* ══ Technology ══ */}
      <InView id="technology" style={{ ...sec(), background: c.bg2 }}>
        <motion.div variants={FU}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: isDark ? '#4ade80' : '#166534' }}>Under the Hood</span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.03em', color: c.text, lineHeight: 1.15, marginTop: '10px', marginBottom: '48px' }}>Serious Engineering for Real-World Needs</h2>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {[
            { icon: Cpu,       title: 'Groq LLaMA 3.3 70B',     desc: 'Sub-second LLM inference for reliable eligibility judgment on any farm profile.' },
            { icon: Lock,      title: 'Bcrypt + JWT Security',   desc: 'All passwords bcrypt-hashed. Role-based access splits farmer and admin views completely.' },
            { icon: Languages, title: 'Whisper Voice AI',         desc: 'Multilingual speech recognition — farmers can dictate in their regional language.' },
            { icon: Brain,     title: 'Custom RAG Pipeline',      desc: 'No LangChain. Built from scratch: PDF → chunks → embeddings → Atlas vector search.' },
          ].map(t => (
            <motion.div key={t.title} variants={FU} style={{ background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: '16px', padding: '22px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '11px', background: 'rgba(22,163,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <t.icon size={20} color={isDark ? '#4ade80' : '#166534'} />
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: c.text, marginBottom: '6px' }}>{t.title}</h3>
              <p style={{ fontSize: '0.85rem', color: c.textSec, lineHeight: 1.65 }}>{t.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* checklist card */}
        <motion.div variants={FU} style={{ background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: '20px', padding: '28px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
          {['Custom RAG (no LangChain)','MongoDB Atlas Vector Search','Nodemailer SMTP email lifecycle','Google OAuth 2.0 Login','GZIP response compression','Memory API caching','JWT Role-Based Access Control','Vite code-split production builds'].map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle size={15} color={isDark ? '#4ade80' : '#166534'} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.86rem', color: c.textSec }}>{item}</span>
            </div>
          ))}
        </motion.div>
      </InView>

      <Wave fill={c.bg} flip />

      {/* ══ CTA / Contact ══ */}
      <InView id="contact" style={{ ...sec({ padding: '80px max(28px, calc((100vw - 820px)/2))' }), background: c.bg }}>
        <motion.div variants={FU} style={{
          borderRadius: '24px', padding: '60px 40px', textAlign: 'center',
          background: isDark
            ? 'linear-gradient(160deg, rgba(22,101,52,0.18) 0%, rgba(12,24,12,0.6) 60%)'
            : 'linear-gradient(160deg, rgba(22,163,74,0.08) 0%, rgba(246,250,242,0.8) 60%)',
          border: `1px solid ${c.borderGlow}`,
          boxShadow: isDark ? '0 0 60px rgba(22,163,74,0.06)' : '0 0 60px rgba(22,163,74,0.04)',
        }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: isDark ? '#4ade80' : '#166534', display: 'block', marginBottom: '12px' }}>Open Source · Built in India</span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.03em', color: c.text, lineHeight: 1.12, marginBottom: '16px' }}>
            Ready to Bridge Farmers<br />to Their Schemes?
          </h2>
          <p style={{ fontSize: '1rem', color: c.textSec, maxWidth: '480px', margin: '0 auto 36px', lineHeight: 1.78 }}>
            Register as a farmer to check your eligibility right now, or explore the source code to understand how it works — everything is open.
          </p>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '44px' }}>
            <Link to="/register" style={{ textDecoration: 'none' }}>
              <motion.button whileHover={{ scale: 1.05, boxShadow: '0 14px 40px rgba(22,163,74,0.45)' }} whileTap={{ scale: 0.97 }} style={{
                background: GREEN_GRAD, color: '#fff', border: 'none', borderRadius: '12px',
                padding: '13px 30px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: '0 4px 18px rgba(22,163,74,0.4)',
              }}>
                Check My Eligibility <ArrowRight size={17} />
              </motion.button>
            </Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} style={{
                background: c.bgCard, color: c.text, border: `1px solid ${c.border}`,
                borderRadius: '12px', padding: '13px 30px', fontSize: '1rem', fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <Github size={17} /> View on GitHub
              </motion.button>
            </a>
          </div>

          {/* Contact info — legitimate & minimal */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: c.bgGlass, border: `1px solid ${c.border}`, borderRadius: '100px', padding: '10px 20px' }}>
            <MapPin size={15} color={isDark ? '#4ade80' : '#166534'} />
            <span style={{ fontSize: '0.88rem', color: c.textSec, fontWeight: 500 }}>Kolhapur, Maharashtra, India</span>
            <span style={{ color: c.textMute }}>·</span>
            <span style={{ fontSize: '0.83rem', color: c.textMute }}>A student project for agricultural equity</span>
          </div>
        </motion.div>
      </InView>

      {/* ══ Footer ══ */}
      <footer style={{ borderTop: `1px solid ${c.border}`, background: isDark ? '#060d06' : '#ede6d0', padding: '36px max(28px, calc((100vw - 1180px)/2)) 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px', marginBottom: '28px' }}>
          <div style={{ maxWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: GREEN_GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sprout size={15} color="white" />
              </div>
              <span style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                <span style={{ background: GREEN_GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Niti</span>
                <span style={{ color: c.text }}>Setu</span>
              </span>
            </div>
            <p style={{ fontSize: '0.83rem', color: c.textMute, lineHeight: 1.65 }}>Helping Indian farmers discover the welfare schemes they're entitled to — through voice, AI, and open data.</p>
          </div>

          <div style={{ display: 'flex', gap: '44px', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: c.text, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Navigate</p>
              {NAV.map(n => (
                <button key={n.id} onClick={() => go(n.id)} style={{ display: 'block', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.86rem', color: c.textMute, padding: '4px 0', textAlign: 'left', transition: 'color 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.color = c.text}
                  onMouseOut={e => e.currentTarget.style.color = c.textMute}
                >{n.label}</button>
              ))}
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: c.text, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Portal</p>
              {[['Sign In', '/login'], ['Register', '/register']].map(([l, to]) => (
                <Link key={l} to={to} style={{ display: 'block', fontSize: '0.86rem', color: c.textMute, padding: '4px 0', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.color = c.text}
                  onMouseOut={e => e.currentTarget.style.color = c.textMute}
                >{l}</Link>
              ))}
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <p style={{ fontSize: '0.78rem', color: c.textMute }}>© 2026 Niti-Setu. All rights reserved.</p>
          <p style={{ fontSize: '0.78rem', color: c.textMute }}>Made with ❤️ in Kolhapur, Maharashtra.</p>
        </div>
      </footer>

      <style>{`
        @media (max-width: 680px) {
          nav > div > div:nth-child(2) { display: none !important; }
          .ns-hamburger { display: flex !important; }
        }
        @media (max-width: 520px) {
          div[style*="grid-template-columns: repeat(4"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
