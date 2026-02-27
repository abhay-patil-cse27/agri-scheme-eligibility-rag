import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Sprout, User, Bot, Sparkles, HelpCircle, ArrowRight, Volume2, VolumeX, Globe, Mic, MicOff } from 'lucide-react';
import { sendChatMessage } from '../services/chatService';
import { generateSpeech } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import AgriCard from '../components/common/AgriCard';

const ChatDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { id: 1, text: t('chat_dash_welcome', "Welcome to Krishi Mitra Support. I am your specialized AI agricultural assistant. You can ask me about farming techniques, government schemes, or how to use this app."), sender: 'ai' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoSpeech, setIsAutoSpeech] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef(null);
  const messagesEndRef = useRef(null);
  const { i18n } = useTranslation();
  
  // Voice Dictation States
  const [isDictating, setIsDictating] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onresult = (event) => {
        const tr = event.results[0][0].transcript;
        setInputValue(prev => prev ? prev + ' ' + tr : tr);
      };

      recognition.onerror = (event) => {
        console.error('Dictation Error:', event.error);
        setIsDictating(false);
      };

      recognition.onend = () => setIsDictating(false);
      recognitionRef.current = recognition;
    }
  }, []);

  // Update language when it changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = i18n.language || 'en-IN';
    }
  }, [i18n.language]);

  const toggleDictation = () => {
    if (!recognitionRef.current) {
      alert("Speech Recognition is not supported in this browser.");
      return;
    }
    if (isDictating) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsDictating(true);
    }
  };


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text) => {
    if (!text.trim()) return;

    const userMessage = { id: Date.now(), text, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const history = messages.slice(-10).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const response = await sendChatMessage(text, history, i18n.language);
      
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        text: response, 
        sender: 'ai' 
      }]);

      if (isAutoSpeech) {
        speakResponse(response);
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        text: "System is experiencing heavy load. Please try again.", 
        sender: 'ai' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickLinks = [
    t('chat_link_pmkisan', "What is PM-Kisan?"),
    t('chat_link_rag', "How to use RAG search?"),
    t('chat_link_crops', "Best crops for this season"),
    t('chat_link_profile', "How to update profile?")
  ];

  const speakResponse = async (text) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    setIsSpeaking(true);
    try {
      const lang = i18n.language.split('-')[0];
      const audioBlob = await generateSpeech(text, lang);
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      audioRef.current = audio;
      
      audio.onended = () => setIsSpeaking(false);
      audio.play();
    } catch (err) {
      console.error("Speech error:", err);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsSpeaking(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>
            <span className="gradient-text">Krishi Mitra</span> {t('chat_dash_title', 'Full Assistant')}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>{t('chat_dash_subtitle', 'Dedicated AI workspace for farming intelligence and app support')}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          {isSpeaking && (
             <div className="waveform">
               <div className="waveform-bar"></div>
               <div className="waveform-bar"></div>
               <div className="waveform-bar"></div>
               <div className="waveform-bar"></div>
               <div className="waveform-bar"></div>
             </div>
          )}
          <button 
            onClick={() => setIsAutoSpeech(!isAutoSpeech)}
            style={{
              background: isAutoSpeech ? 'rgba(139, 92, 246, 0.1)' : 'var(--bg-secondary)',
              color: isAutoSpeech ? 'var(--accent-violet)' : 'var(--text-secondary)',
              border: `1px solid ${isAutoSpeech ? 'var(--accent-violet)' : 'var(--border-glass)'}`,
              padding: '8px 16px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            {isAutoSpeech ? <Volume2 size={18} /> : <VolumeX size={18} />}
            {isAutoSpeech ? 'Auto-Speech On' : 'Auto-Speech Off'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', flex: 1, minHeight: 0 }}>
        {/* Main Chat Area */}
        <AgriCard style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {messages.map(msg => (
              <div 
                key={msg.id} 
                style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start'
                }}
              >
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '12px', 
                  background: msg.sender === 'user' ? 'var(--accent-indigo)' : 'var(--bg-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  border: '1px solid var(--border-glass)'
                }}>
                  {msg.sender === 'user' ? <User size={20} color="#064e3b" /> : <Bot size={20} color="var(--accent-indigo)" />}
                </div>
                <div style={{ 
                  maxWidth: '70%', 
                  padding: '16px 20px', 
                  borderRadius: '16px',
                  background: msg.sender === 'user' ? 'rgba(74, 222, 128, 0.1)' : 'var(--bg-secondary)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                  boxShadow: 'none'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={20} color="var(--accent-indigo)" />
                </div>
                <div className="typing-indicator" style={{ padding: '16px' }}>
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '24px', background: 'var(--bg-primary)', borderTop: '1px solid var(--border-glass)' }}>
            <div style={{ 
              background: 'var(--bg-secondary)', 
              borderRadius: '16px', 
              padding: '8px 8px 8px 16px', 
              display: 'flex', 
              alignItems: 'center',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-glow)'
            }}>
              <input 
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend(inputValue)}
                placeholder={t('chat_dash_placeholder', "Ask Krishi Mitra about schemes, weather, or agriculture...")}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', padding: '12px 0' }}
              />
              <button 
                onClick={toggleDictation}
                className="btn-glass"
                style={{ 
                  borderRadius: '12px', padding: '10px', marginRight: '8px',
                  background: isDictating ? 'rgba(244, 63, 94, 0.1)' : 'transparent',
                  color: isDictating ? 'var(--accent-rose)' : 'var(--text-muted)'
                }}
                title={isDictating ? 'Stop Listening' : 'Start Dictation'}
              >
                {isDictating ? <span className="animate-pulse"><Mic /></span> : <MicOff />}
              </button>
              <button 
                onClick={() => handleSend(inputValue)}
                disabled={isLoading || !inputValue.trim()}
                className="btn-glow"
                style={{ padding: '12px 20px', borderRadius: '12px' }}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </AgriCard>

        {/* Sidebar help */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <AgriCard padding="24px">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle size={18} color="var(--accent-indigo)" />
              Quick Support
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {quickLinks.map((link, i) => (
                <button 
                  key={i}
                  onClick={() => handleSend(link)}
                  style={{
                    textAlign: 'left',
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-indigo)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-glass)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  {link}
                </button>
              ))}
            </div>
          </AgriCard>

          <AgriCard padding="24px" className="gradient-border" style={{ border: 'none' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="var(--accent-amber)" />
              AI Capabilities
            </h3>
            <ul style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '16px', lineHeight: 1.8 }}>
              <li>{t('chat_cap_multilingual', 'Multilingual (English/Hindi)')}</li>
              <li>{t('chat_cap_schemes', 'Official Scheme Analysis')}</li>
              <li>{t('chat_cap_agri', 'General Agronomic Advice')}</li>
              <li>{t('chat_cap_nav', 'Navigation Guidance')}</li>
            </ul>
          </AgriCard>
        </div>
      </div>
    </div>
  );
};

export default ChatDashboard;
