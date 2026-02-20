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

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
};

function Section({ children, id, style }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section
      id={id}
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={stagger}
      style={{ padding: '96px 0', ...style }}
    >
      {children}
    </motion.section>
  );
}

function SectionLabel({ children }) {
  return (
    <motion.p variants={fadeUp} style={{
      fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.12em',
      textTransform: 'uppercase', color: 'var(--accent-indigo)',
      marginBottom: '12px'
    }}>{children}</motion.p>
  );
}

function SectionTitle({ children }) {
  return (
    <motion.h2 variants={fadeUp} style={{
      fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 800,
      letterSpacing: '-0.03em', color: 'var(--text-primary)',
      lineHeight: 1.2, marginBottom: '16px'
    }}>{children}</motion.h2>
  );
}

function SectionSubtitle({ children }) {
  return (
    <motion.p variants={fadeUp} style={{
      fontSize: '1.05rem', color: 'var(--text-secondary)',
      maxWidth: '600px', lineHeight: 1.7, marginBottom: '48px'
    }}>{children}</motion.p>
  );
}

const features = [
  { icon: Mic, label: 'Voice AI Input', desc: 'Farmers speak in their native language; our Whisper-powered engine transcribes and processes instantly.' },
  { icon: FileText, label: 'RAG Document Engine', desc: 'Government PDFs are ingested and chunked into a vector database for precise, citation-backed eligibility answers.' },
  { icon: Brain, label: 'LLM Eligibility Engine', desc: 'Groq-powered LLaMA analyzes farmer profiles against scheme rules with strict realism scoring.' },
  { icon: BarChart3, label: 'Analytics Dashboard', desc: 'Admins get population-level insights: scheme adoption, common demographics, and eligibility trends.' },
  { icon: Shield, label: 'JWT + RBAC Security', desc: 'Role-based access separates farmer and admin views. Passwords are bcrypt-hashed with strict complexity rules.' },
  { icon: Globe, label: 'Google OAuth Login', desc: 'Farmers can register or sign in with one tap via their Google account — no password required.' },
];

const audiences = [
  { icon: Wheat, title: 'Marginal Farmers', desc: 'Check eligibility for PM-KISAN, PM-KUSUM, AIF, KMY and more in seconds — by typing or speaking your details.' },
  { icon: Users, title: 'District Officers', desc: 'Monitor scheme adoption at scale. Identify which demographics are most underserved by current programs.' },
  { icon: FileText, title: 'Policy Analysts', desc: 'Upload new PDFs to instantly expand the scheme knowledge base and test eligibility criteria in real time.' },
  { icon: HeartHandshake, title: 'NGOs & Gram Sabhas', desc: 'Help rural communities understand which central and state schemes they qualify for, at no cost.' },
];

const techPillars = [
  { icon: Cpu, title: 'Groq LLaMA 3.3 70B', desc: 'Sub-second LLM inference for reliable eligibility judgments at scale.' },
  { icon: Lock, title: 'Government-Grade Security', desc: 'End-to-end JWT auth, strict password policy, and bcrypt hashing.' },
  { icon: Languages, title: 'Multilingual Voice', desc: 'Whisper ASR handles regional Indian languages for inclusive access.' },
  { icon: MapPin, title: 'State-Aware Logic', desc: 'District dropdowns are state-aware. Scheme rules reflect both central and state government clauses.' },
];

export default function Landing() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Who We Serve', href: '#audience' },
    { label: 'Technology', href: '#technology' },
    { label: 'Contact', href: '#contact' },
  ];

  const scrollTo = (href) => {
    setMenuOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  const isDark = theme === 'dark';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: '"Inter", sans-serif' }}>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        transition: 'all 0.3s ease',
        background: scrolled
          ? (isDark ? 'rgba(10,10,15,0.9)' : 'rgba(255,255,255,0.92)')
          : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border-glass)' : '1px solid transparent',
        padding: '0 max(24px, calc((100vw - 1200px)/2))',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', height: '68px', gap: '32px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '0 0 auto' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}>
              <Zap size={18} color="white" />
            </div>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              <span style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Niti</span>
              <span style={{ color: 'var(--text-primary)' }}>Setu</span>
            </span>
          </div>

          {/* Nav Links — desktop */}
          <div style={{ display: 'flex', gap: '4px', flex: 1, justifyContent: 'center' }} className="hide-mobile">
            {navLinks.map(l => (
              <button key={l.label} onClick={() => scrollTo(l.href)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '8px 16px', borderRadius: '8px', fontSize: '0.9rem',
                fontWeight: 500, color: 'var(--text-secondary)',
                transition: 'all 0.2s',
              }}
                onMouseOver={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-glass)'; }}
                onMouseOut={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'none'; }}
              >{l.label}</button>
            ))}
          </div>

          {/* CTA + Theme toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
            <button onClick={toggleTheme} style={{
              background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
              borderRadius: '8px', padding: '8px', cursor: 'pointer',
              color: 'var(--text-secondary)', display: 'flex', alignItems: 'center',
              transition: 'all 0.2s',
            }}
              title="Toggle theme"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <Link to="/login" style={{ textDecoration: 'none' }}>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} style={{
                background: 'var(--gradient-primary)', color: 'white',
                border: 'none', borderRadius: '10px', padding: '9px 20px',
                fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
              }}>Sign In</motion.button>
            </Link>

            {/* Hamburger */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="show-mobile" style={{
              background: 'none', border: '1px solid var(--border-glass)', borderRadius: '8px',
              padding: '8px', cursor: 'pointer', color: 'var(--text-secondary)',
              display: 'none',
            }}>
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{
            background: isDark ? 'rgba(10,10,15,0.98)' : 'rgba(255,255,255,0.98)',
            borderTop: '1px solid var(--border-glass)', padding: '16px 24px',
            display: 'flex', flexDirection: 'column', gap: '4px',
          }}>
            {navLinks.map(l => (
              <button key={l.label} onClick={() => scrollTo(l.href)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '12px 16px', borderRadius: '8px', textAlign: 'left',
                fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-secondary)',
              }}>{l.label}</button>
            ))}
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <div style={{ paddingTop: '140px', paddingBottom: '80px', textAlign: 'center', padding: '140px max(24px, calc((100vw - 800px)/2)) 80px', position: 'relative', overflow: 'hidden' }}>
        {/* Background glow blob */}
        <div style={{
          position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
          width: '700px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: '100px', padding: '6px 16px', marginBottom: '28px',
            fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-indigo)', letterSpacing: '0.05em',
          }}>
            <Star size={12} /> AI-Powered Agricultural Scheme Eligibility
          </div>

          <h1 style={{
            fontSize: 'clamp(2.4rem, 6vw, 4rem)', fontWeight: 900,
            letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '24px',
            color: 'var(--text-primary)',
          }}>
            Every Farmer Deserves to Know<br />
            <span style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Their Benefits
            </span>
          </h1>

          <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 40px', lineHeight: 1.7 }}>
            Niti-Setu uses voice AI and a government-document RAG engine to instantly tell any farmer — in plain language — which schemes they are eligible for and why.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" style={{ textDecoration: 'none' }}>
              <motion.button whileHover={{ scale: 1.04, boxShadow: '0 12px 40px rgba(99,102,241,0.5)' }} whileTap={{ scale: 0.97 }} style={{
                background: 'var(--gradient-primary)', color: 'white',
                border: 'none', borderRadius: '14px', padding: '14px 32px',
                fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
              }}>
                Get Started Free <ArrowRight size={18} />
              </motion.button>
            </Link>
            <button onClick={() => scrollTo('#features')} style={{
              background: 'var(--bg-glass)', color: 'var(--text-primary)',
              border: '1px solid var(--border-glass)', borderRadius: '14px',
              padding: '14px 32px', fontSize: '1.05rem', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
              onMouseOver={e => e.currentTarget.style.borderColor = 'var(--border-glow)'}
              onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-glass)'}
            >
              See How It Works
            </button>
          </div>

          {/* Stats bar */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{
            display: 'flex', gap: '40px', justifyContent: 'center', marginTop: '60px',
            flexWrap: 'wrap',
          }}>
            {[
              { value: '4+', label: 'Central Schemes Indexed' },
              { value: '<1s', label: 'Avg Response Time' },
              { value: '6+', label: 'Social Categories' },
              { value: '100%', label: 'Open Source' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-indigo)', letterSpacing: '-0.03em' }}>{s.value}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{s.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* ── Features ── */}
      <Section id="features" style={{ padding: '96px max(24px, calc((100vw - 1200px)/2))' }}>
        <SectionLabel>Platform Capabilities</SectionLabel>
        <SectionTitle>Built for Real Governance Needs</SectionTitle>
        <SectionSubtitle>A complete stack for farmer eligibility — from voice input to citation-backed AI decisions to admin analytics.</SectionSubtitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {features.map(f => (
            <motion.div key={f.label} variants={fadeUp} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
              borderRadius: '16px', padding: '24px', backdropFilter: 'blur(12px)',
              transition: 'all 0.3s ease',
            }}
              whileHover={{ borderColor: 'var(--border-glow)', translateY: -4, boxShadow: 'var(--shadow-glow)' }}
            >
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <f.icon size={22} style={{ color: 'var(--accent-indigo)' }} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{f.label}</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── Who We Serve ── */}
      <Section id="audience" style={{ padding: '96px max(24px, calc((100vw - 1200px)/2))', background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
        <SectionLabel>Who We Serve</SectionLabel>
        <SectionTitle>Empowering Every Stakeholder</SectionTitle>
        <SectionSubtitle>From the individual farmer to the district collector, Niti-Setu serves every level of the agricultural governance chain.</SectionSubtitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
          {audiences.map((a, i) => (
            <motion.div key={a.title} variants={fadeUp} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
              borderRadius: '16px', padding: '28px 24px',
            }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `linear-gradient(135deg, ${['#6366f1','#10b981','#f59e0b','#f43f5e'][i]} 0%, ${['#8b5cf6','#06b6d4','#6366f1','#e11d48'][i]} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                <a.icon size={22} color="white" />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{a.title}</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{a.desc}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── Technology ── */}
      <Section id="technology" style={{ padding: '96px max(24px, calc((100vw - 1200px)/2))' }}>
        <SectionLabel>Technology & Security</SectionLabel>
        <SectionTitle>Robust, Accurate, Scalable</SectionTitle>
        <SectionSubtitle>Niti-Setu is engineered for the real requirements of government-grade document retrieval and AI reasoning.</SectionSubtitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px', marginBottom: '48px' }}>
          {techPillars.map(t => (
            <motion.div key={t.title} variants={fadeUp} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
              borderRadius: '16px', padding: '24px',
            }}>
              <t.icon size={24} style={{ color: 'var(--accent-indigo)', marginBottom: '14px' }} />
              <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{t.title}</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{t.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Tech checklist */}
        <motion.div variants={fadeUp} style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
          borderRadius: '20px', padding: '32px', display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px',
        }}>
          {[
            'Custom RAG (no LangChain dependency)',
            'MongoDB Atlas Vector Search',
            'Nodemailer SMTP email lifecycle',
            'Google OAuth 2.0 Single Sign-On',
            'GZIP response compression',
            'Memory API caching (apicache)',
            'JWT Role-Based Access Control',
            'Vite code-split production builds',
          ].map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle size={16} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{item}</span>
            </div>
          ))}
        </motion.div>
      </Section>

      {/* ── CTA ── */}
      <Section id="contact" style={{ padding: '80px max(24px, calc((100vw - 800px)/2))', textAlign: 'center' }}>
        <motion.div variants={fadeUp} style={{
          background: isDark
            ? 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))'
            : 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))',
          border: '1px solid var(--border-glow)',
          borderRadius: '24px', padding: '64px 40px',
        }}>
          <SectionLabel>Get Started Today</SectionLabel>
          <SectionTitle>Ready to Transform Farmer Access?</SectionTitle>
          <SectionSubtitle>Register as a farmer to check your eligibility instantly, or contact us to deploy Niti-Setu for your district.</SectionSubtitle>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '8px' }}>
            <Link to="/register" style={{ textDecoration: 'none' }}>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} style={{
                background: 'var(--gradient-primary)', color: 'white',
                border: 'none', borderRadius: '14px', padding: '14px 32px',
                fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
              }}>
                Register as Farmer <ArrowRight size={18} />
              </motion.button>
            </Link>
            <a href="mailto:contact@nitisetu.gov.in" style={{ textDecoration: 'none' }}>
              <button style={{
                background: 'var(--bg-glass)', color: 'var(--text-primary)',
                border: '1px solid var(--border-glass)', borderRadius: '14px',
                padding: '14px 32px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
              }}>
                Contact Us
              </button>
            </a>
          </div>

          <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', marginTop: '40px', flexWrap: 'wrap' }}>
            {[
              { icon: Mail, label: 'contact@nitisetu.gov.in' },
              { icon: Phone, label: '+91-1800-XXX-XXXX (Toll Free)' },
              { icon: MapPin, label: 'Ministry of Agriculture, New Delhi' },
            ].map(c => (
              <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <c.icon size={16} style={{ color: 'var(--accent-indigo)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{c.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </Section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid var(--border-glass)',
        padding: '40px max(24px, calc((100vw - 1200px)/2)) 32px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '32px', marginBottom: '40px' }}>
          {/* Brand */}
          <div style={{ maxWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={16} color="white" />
              </div>
              <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                <span style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Niti</span>
                <span style={{ color: 'var(--text-primary)' }}>Setu</span>
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              AI-powered agricultural scheme eligibility engine for India's farming communities.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>Quick Links</p>
              {['Features', 'Who We Serve', 'Technology', 'Contact'].map(l => (
                <button key={l} onClick={() => scrollTo(`#${l.toLowerCase().replace(/ /g, '')}`)} style={{
                  display: 'block', background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '0.88rem', color: 'var(--text-muted)', padding: '4px 0',
                  textAlign: 'left', transition: 'color 0.2s',
                }}
                  onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >{l}</button>
              ))}
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>Portal</p>
              {[['Sign In', '/login'], ['Register', '/register']].map(([l, to]) => (
                <Link key={l} to={to} style={{ display: 'block', fontSize: '0.88rem', color: 'var(--text-muted)', padding: '4px 0', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >{l}</Link>
              ))}
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>© 2026 Niti-Setu. Ministry of Agriculture & Farmers Welfare, Government of India.</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>An initiative for inclusive agricultural governance.</p>
        </div>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
