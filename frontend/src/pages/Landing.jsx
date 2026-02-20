import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Zap, Shield, Brain, FileText, Users, BarChart3, Mic, Globe,
  ChevronRight, Star, ArrowRight, CheckCircle, Sun, Moon, Menu, X,
  Cpu, Lock, Languages, HeartHandshake, Wheat, MapPin, Phone, Mail
} from 'lucide-react';

/* ─── Color helpers ─────────────────────────────────────── */
const C = (isDark) => ({
  bg:         isDark ? '#0a0a0f'                  : '#f4f6fb',
  bgCard:     isDark ? 'rgba(17,17,24,0.85)'       : 'rgba(255,255,255,0.97)',
  bgGlass:    isDark ? 'rgba(255,255,255,0.04)'    : 'rgba(99,102,241,0.06)',
  border:     isDark ? 'rgba(255,255,255,0.08)'    : 'rgba(0,0,0,0.10)',
  borderGlow: 'rgba(99,102,241,0.35)',
  text:       isDark ? '#f0f0f5'                   : '#0f0f1a',
  textSec:    isDark ? '#8b8b9e'                   : '#4a4a6a',
  textMute:   isDark ? '#5a5a6e'                   : '#9090aa',
  navBg:      isDark ? 'rgba(10,10,15,0.92)'       : 'rgba(255,255,255,0.94)',
  sectionAlt: isDark ? 'rgba(255,255,255,0.025)'   : 'rgba(99,102,241,0.03)',
});

const GRAD = 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)';
const FADE_UP = { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } } };
const STAGGER = { hidden: {}, visible: { transition: { staggerChildren: 0.09 } } };

function Animated({ children, id, style }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.section id={id} ref={ref} initial="hidden" animate={inView ? 'visible' : 'hidden'} variants={STAGGER} style={style}>
      {children}
    </motion.section>
  );
}

function Label({ text, c }) {
  return <motion.p variants={FADE_UP} style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6366f1', marginBottom: '10px' }}>{text}</motion.p>;
}
function Title({ children, c }) {
  return <motion.h2 variants={FADE_UP} style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 800, letterSpacing: '-0.03em', color: c.text, lineHeight: 1.15, marginBottom: '14px' }}>{children}</motion.h2>;
}
function Sub({ children, c }) {
  return <motion.p variants={FADE_UP} style={{ fontSize: '1.05rem', color: c.textSec, maxWidth: '580px', lineHeight: 1.72, marginBottom: '44px' }}>{children}</motion.p>;
}

/* ─── Data ───────────────────────────────────────────────── */
const FEATURES = [
  { icon: Mic,      label: 'Voice AI Input',        desc: 'Farmers speak in any language — Whisper ASR transcribes and feeds the eligibility engine instantly.' },
  { icon: FileText, label: 'RAG Document Engine',   desc: 'Government PDFs are chunked into a vector database, enabling precise, citation-backed eligibility answers.' },
  { icon: Brain,    label: 'LLM Eligibility Engine', desc: 'Groq-powered LLaMA 3.3 analyzes farmer profiles against scheme rules with strict realism scoring.' },
  { icon: BarChart3,label: 'Admin Analytics',        desc: 'Population-level insights: scheme adoption, common demographics, and eligibility trends at your fingertips.' },
  { icon: Shield,   label: 'JWT + RBAC Security',   desc: 'Role-based access separates farmer and admin views. Bcrypt hashing with strict complexity enforcement.' },
  { icon: Globe,    label: 'Google OAuth Login',    desc: 'Farmers can sign in with one tap via Google — no extra password required for seamless onboarding.' },
];

const AUDIENCE = [
  { icon: Wheat,         grad: ['#6366f1','#8b5cf6'], title: 'Marginal Farmers',    desc: 'Check eligibility for PM-KISAN, PM-KUSUM, AIF, KMY and more in seconds — by typing or speaking your details.' },
  { icon: Users,         grad: ['#10b981','#06b6d4'], title: 'District Officers',   desc: 'Monitor scheme adoption at scale and identify which demographics are currently underserved.' },
  { icon: FileText,      grad: ['#f59e0b','#6366f1'], title: 'Policy Analysts',     desc: 'Upload new scheme PDFs to instantly expand the knowledge base and test eligibility criteria in real time.' },
  { icon: HeartHandshake,grad: ['#f43f5e','#e11d48'], title: 'NGOs & Gram Sabhas', desc: 'Help rural communities understand which state and central schemes they qualify for, at zero cost.' },
];

const TECH = [
  { icon: Cpu,       title: 'Groq LLaMA 3.3 70B',    desc: 'Sub-second LLM inference for reliable, consistent eligibility judgments at scale.' },
  { icon: Lock,      title: 'Enterprise-Grade Security', desc: 'End-to-end JWT auth, strict password policy, and bcrypt hashing on every account.' },
  { icon: Languages, title: 'Multilingual Voice',      desc: 'Whisper ASR handles multiple Indian regional languages for truly inclusive access.' },
  { icon: MapPin,    title: 'State-Aware Logic',       desc: 'District dropdowns are state-aware. Rules reflect both central and state government clauses.' },
];

const CHECKLIST = [
  'Custom RAG (no LangChain dependency)',
  'MongoDB Atlas Vector Search',
  'Nodemailer SMTP email lifecycle',
  'Google OAuth 2.0 Single Sign-On',
  'GZIP response compression',
  'Memory API caching (apicache)',
  'JWT Role-Based Access Control',
  'Vite code-split production builds',
];

/* ─── Component ──────────────────────────────────────────── */
export default function Landing() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isDark = theme === 'dark';
  const c = C(isDark);

  useEffect(() => {
    if (user) navigate('/dashboard/');
  }, [user, navigate]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const NAV_LINKS = [
    { label: 'Features', href: '#features' },
    { label: 'Who We Serve', href: '#audience' },
    { label: 'Technology', href: '#technology' },
    { label: 'Contact', href: '#contact' },
  ];

  const scrollTo = (href) => {
    setMenuOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', background: c.bg, color: c.text, fontFamily: '"Inter", sans-serif', transition: 'background 0.3s ease, color 0.2s ease' }}>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        background: scrolled ? c.navBg : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? `1px solid ${c.border}` : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', height: '66px', padding: '0 28px', gap: '24px' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '0 0 auto' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}>
              <Zap size={18} color="white" />
            </div>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              <span style={{ background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Niti</span>
              <span style={{ color: c.text }}>Setu</span>
            </span>
          </div>

          {/* Desktop nav */}
          <div style={{ display: 'flex', gap: '2px', flex: 1, justifyContent: 'center' }}>
            {NAV_LINKS.map(l => (
              <button key={l.label} onClick={() => scrollTo(l.href)} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '8px 16px',
                borderRadius: '8px', fontSize: '0.9rem', fontWeight: 500, color: c.textSec,
                transition: 'all 0.2s',
              }}
                onMouseOver={e => { e.currentTarget.style.color = c.text; e.currentTarget.style.background = c.bgGlass; }}
                onMouseOut={e => { e.currentTarget.style.color = c.textSec; e.currentTarget.style.background = 'none'; }}
              >{l.label}</button>
            ))}
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={toggleTheme} title="Toggle theme" style={{
              background: c.bgGlass, border: `1px solid ${c.border}`, borderRadius: '8px',
              padding: '8px', cursor: 'pointer', color: c.textSec,
              display: 'flex', alignItems: 'center', transition: 'all 0.2s',
            }}>
              {isDark ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} color="#6366f1" />}
            </button>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} style={{
                background: GRAD, color: '#ffffff', border: 'none', borderRadius: '10px',
                padding: '9px 22px', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
              }}>Sign In</motion.button>
            </Link>
            {/* Hamburger */}
            <button onClick={() => setMenuOpen(!menuOpen)} style={{
              background: 'none', border: `1px solid ${c.border}`, borderRadius: '8px',
              padding: '8px', cursor: 'pointer', color: c.textSec, display: 'none',
            }} className="hamburger-btn">
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div style={{ background: c.navBg, borderTop: `1px solid ${c.border}`, padding: '12px 28px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {NAV_LINKS.map(l => (
              <button key={l.label} onClick={() => scrollTo(l.href)} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '12px 14px',
                borderRadius: '8px', textAlign: 'left', fontSize: '0.95rem', fontWeight: 500, color: c.textSec,
              }}>{l.label}</button>
            ))}
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <div style={{ paddingTop: '130px', textAlign: 'center', padding: '130px 28px 80px', position: 'relative', overflow: 'hidden', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ position: 'absolute', top: '5%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', borderRadius: '50%', background: isDark ? 'radial-gradient(ellipse, rgba(99,102,241,0.2) 0%, transparent 70%)' : 'radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75 }} style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.28)', borderRadius: '100px', padding: '6px 18px', marginBottom: '28px' }}>
            <Star size={12} color="#6366f1" />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6366f1', letterSpacing: '0.06em', textTransform: 'uppercase' }}>AI-Powered Agricultural Scheme Eligibility</span>
          </div>

          <h1 style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '22px', color: c.text }}>
            Every Farmer Deserves to Know<br />
            <span style={{ background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Their Benefits
            </span>
          </h1>

          <p style={{ fontSize: '1.1rem', color: c.textSec, maxWidth: '580px', margin: '0 auto 36px', lineHeight: 1.75 }}>
            Niti-Setu uses voice AI and a scheme-document RAG engine to instantly tell any farmer — in plain language — which schemes they qualify for and exactly why.
          </p>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" style={{ textDecoration: 'none' }}>
              <motion.button whileHover={{ scale: 1.04, boxShadow: '0 12px 40px rgba(99,102,241,0.5)' }} whileTap={{ scale: 0.97 }} style={{
                background: GRAD, color: '#ffffff', border: 'none', borderRadius: '12px',
                padding: '13px 30px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
              }}>
                Get Started Free <ArrowRight size={18} />
              </motion.button>
            </Link>
            <button onClick={() => scrollTo('#features')} style={{
              background: c.bgCard, color: c.text,
              border: `1px solid ${c.border}`, borderRadius: '12px',
              padding: '13px 30px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
              onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'}
              onMouseOut={e => e.currentTarget.style.borderColor = c.border}
            >
              See How It Works
            </button>
          </div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} style={{ display: 'flex', gap: '36px', justifyContent: 'center', marginTop: '60px', flexWrap: 'wrap' }}>
            {[['4+','Central Schemes Indexed'],['<1s','Avg Response Time'],['6+','Social Categories'],['100%','Open Source']].map(([v, l]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#6366f1', letterSpacing: '-0.03em' }}>{v}</p>
                <p style={{ fontSize: '0.78rem', color: c.textMute, marginTop: '4px' }}>{l}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* ── Features ── */}
      <Animated id="features" style={{ padding: '88px max(28px, calc((100vw - 1200px)/2))', background: c.sectionAlt }}>
        <Label text="Platform Capabilities" c={c} />
        <Title c={c}>Built for Real Governance Needs</Title>
        <Sub c={c}>A complete stack for farmer eligibility — from voice input to citation-backed AI decisions and admin analytics.</Sub>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '18px' }}>
          {FEATURES.map(f => (
            <motion.div key={f.label} variants={FADE_UP}
              whileHover={{ borderColor: 'rgba(99,102,241,0.4)', y: -4, boxShadow: '0 8px 32px rgba(99,102,241,0.12)' }}
              style={{ background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: '16px', padding: '24px', transition: 'all 0.25s ease', cursor: 'default' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <f.icon size={22} color="#6366f1" />
              </div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: c.text, marginBottom: '8px' }}>{f.label}</h3>
              <p style={{ fontSize: '0.87rem', color: c.textSec, lineHeight: 1.65 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </Animated>

      {/* ── Who We Serve ── */}
      <Animated id="audience" style={{ padding: '88px max(28px, calc((100vw - 1200px)/2))' }}>
        <Label text="Who We Serve" c={c} />
        <Title c={c}>Empowering Every Stakeholder</Title>
        <Sub c={c}>From the individual farmer to the district collector, Niti-Setu bridges every level of the agricultural governance chain.</Sub>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '18px' }}>
          {AUDIENCE.map(a => (
            <motion.div key={a.title} variants={FADE_UP} style={{ background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: '16px', padding: '26px 22px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `linear-gradient(135deg, ${a.grad[0]}, ${a.grad[1]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <a.icon size={22} color="white" />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: c.text, marginBottom: '8px' }}>{a.title}</h3>
              <p style={{ fontSize: '0.87rem', color: c.textSec, lineHeight: 1.65 }}>{a.desc}</p>
            </motion.div>
          ))}
        </div>
      </Animated>

      {/* ── Technology ── */}
      <Animated id="technology" style={{ padding: '88px max(28px, calc((100vw - 1200px)/2))', background: c.sectionAlt }}>
        <Label text="Technology & Security" c={c} />
        <Title c={c}>Robust, Accurate, Scalable</Title>
        <Sub c={c}>Niti-Setu is engineered for the real requirements of government-grade document retrieval and AI-powered reasoning.</Sub>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(258px, 1fr))', gap: '18px', marginBottom: '28px' }}>
          {TECH.map(t => (
            <motion.div key={t.title} variants={FADE_UP} style={{ background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: '16px', padding: '24px' }}>
              <t.icon size={24} color="#6366f1" style={{ marginBottom: '14px' }} />
              <h3 style={{ fontWeight: 700, color: c.text, marginBottom: '8px' }}>{t.title}</h3>
              <p style={{ fontSize: '0.87rem', color: c.textSec, lineHeight: 1.65 }}>{t.desc}</p>
            </motion.div>
          ))}
        </div>
        <motion.div variants={FADE_UP} style={{ background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: '18px', padding: '28px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '14px' }}>
          {CHECKLIST.map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.87rem', color: c.textSec }}>{item}</span>
            </div>
          ))}
        </motion.div>
      </Animated>

      {/* ── CTA ── */}
      <Animated id="contact" style={{ padding: '80px max(28px, calc((100vw - 860px)/2))' }}>
        <motion.div variants={FADE_UP} style={{
          background: isDark
            ? 'linear-gradient(135deg, rgba(99,102,241,0.14), rgba(139,92,246,0.08))'
            : 'linear-gradient(135deg, rgba(99,102,241,0.07), rgba(139,92,246,0.04))',
          border: `1px solid rgba(99,102,241,0.3)`,
          borderRadius: '24px', padding: '60px 36px', textAlign: 'center',
        }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6366f1', marginBottom: '10px' }}>Ready to Start?</p>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.03em', color: c.text, lineHeight: 1.15, marginBottom: '14px' }}>Transform Farmer Access Today</h2>
          <p style={{ fontSize: '1.05rem', color: c.textSec, maxWidth: '520px', margin: '0 auto 36px', lineHeight: 1.72 }}>
            Register as a farmer to check your eligibility instantly, or reach out to discuss deploying Niti-Setu for your district or organization.
          </p>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '36px' }}>
            <Link to="/register" style={{ textDecoration: 'none' }}>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} style={{
                background: GRAD, color: '#ffffff', border: 'none', borderRadius: '12px',
                padding: '13px 30px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: '0 4px 18px rgba(99,102,241,0.4)',
              }}>
                Register as Farmer <ArrowRight size={18} />
              </motion.button>
            </Link>
            <a href="mailto:contact@nitisetu.in" style={{ textDecoration: 'none' }}>
              <button style={{
                background: c.bgCard, color: c.text, border: `1px solid ${c.border}`,
                borderRadius: '12px', padding: '13px 30px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
              }}>Contact Us</button>
            </a>
          </div>

          <div style={{ display: 'flex', gap: '28px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[[Mail, 'contact@nitisetu.in'], [Phone, '+91-1800-XXX-XXXX (Toll Free)'], [MapPin, 'Nagpur | Pune | Bengaluru']].map(([Icon, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon size={15} color="#6366f1" />
                <span style={{ fontSize: '0.84rem', color: c.textSec }}>{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </Animated>

      {/* ── Footer ── */}
      <footer style={{ borderTop: `1px solid ${c.border}`, padding: '40px max(28px, calc((100vw - 1200px)/2)) 28px', background: c.bg }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '28px', marginBottom: '32px' }}>
          <div style={{ maxWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={16} color="white" />
              </div>
              <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                <span style={{ background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Niti</span>
                <span style={{ color: c.text }}>Setu</span>
              </span>
            </div>
            <p style={{ fontSize: '0.84rem', color: c.textMute, lineHeight: 1.65 }}>
              AI-powered agricultural scheme eligibility engine — bridging Indian farmers to the benefits they deserve.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '44px', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: c.text, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>Quick Links</p>
              {['Features','Who We Serve','Technology','Contact'].map(l => (
                <button key={l} onClick={() => scrollTo(`#${l.toLowerCase().replace(/ /g,'')}`)} style={{ display: 'block', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.87rem', color: c.textMute, padding: '4px 0', textAlign: 'left', transition: 'color 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.color = c.text}
                  onMouseOut={e => e.currentTarget.style.color = c.textMute}
                >{l}</button>
              ))}
            </div>
            <div>
              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: c.text, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>Portal</p>
              {[['Sign In','/login'],['Register','/register']].map(([l, to]) => (
                <Link key={l} to={to} style={{ display: 'block', fontSize: '0.87rem', color: c.textMute, padding: '4px 0', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.color = c.text}
                  onMouseOut={e => e.currentTarget.style.color = c.textMute}
                >{l}</Link>
              ))}
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <p style={{ fontSize: '0.78rem', color: c.textMute }}>© 2026 Niti-Setu. An initiative for inclusive agricultural access in India.</p>
          <p style={{ fontSize: '0.78rem', color: c.textMute }}>Built with ❤️ for rural India.</p>
        </div>
      </footer>

      <style>{`
        @media (max-width: 700px) {
          nav > div > div:nth-child(2) { display: none !important; }
          .hamburger-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
