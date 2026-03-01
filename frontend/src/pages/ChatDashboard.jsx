import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Sprout, User, Bot, Sparkles, HelpCircle, ArrowRight, 
  Volume2, VolumeX, Globe, Mic, MicOff, Trash2, Plus, 
  MessageSquare, MoreVertical, Edit3, Check, X, History as HistoryIcon,
  ChevronLeft, Search
} from 'lucide-react';
import { 
  getChatSessions, 
  createChatSession, 
  getSessionMessages, 
  deleteChatSession, 
  clearChatHistory,
  chatWithKrishiMitra, 
  generateSpeech 
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import AgriCard from '../components/common/AgriCard';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal';

const ChatDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSessionsLoading, setIsSessionsLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [isAutoSpeech, setIsAutoSpeech] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const audioRef = useRef(null);
  const messagesEndRef = useRef(null);
  const { i18n } = useTranslation();
  
  // Voice Dictation States
  const [isDictating, setIsDictating] = useState(false);
  const recognitionRef = useRef(null);

  // Load Sessions on Mount
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async (shouldAutoSelect = true) => {
    try {
      setIsSessionsLoading(true);
      const data = await getChatSessions();
      setSessions(data);
      
      // Only auto-select if we aren't already in a session and haven't started a new unsaved chat
      if (shouldAutoSelect && data.length > 0 && !currentSessionId && messages.length <= 1) {
        handleSelectSession(data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setIsSessionsLoading(false);
    }
  };

  const handleSelectSession = async (sessionId) => {
    if (sessionId === currentSessionId) return;
    setCurrentSessionId(sessionId);
    setMessages([]);
    setIsLoading(true);
    try {
      const data = await getSessionMessages(sessionId);
      const formatted = data.map(msg => ({
        id: msg._id,
        text: msg.content,
        sender: msg.role === 'assistant' ? 'ai' : 'user'
      }));
      setMessages(formatted);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
  };

  useEffect(() => {
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

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = i18n.language || 'en-IN';
    }
  }, [i18n.language]);

  const toggleDictation = () => {
    if (!recognitionRef.current) return alert("Speech Recognition is not supported in this browser.");
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

  const suggestions = [
    { text: t('chat_sug_eligibility', "🔍 How to check eligibility?"), action: "guide_eligibility" },
    { text: t('chat_sug_history', "📜 Show my check history"), action: "guide_history" },
    { text: t('chat_sug_schemes', "📄 View Scheme documents"), action: "guide_schemes" },
    { text: t('chat_sug_crops', "🌾 Best crops for this season?"), action: "llm_trigger" },
    { text: t('chat_sug_benefits', "👩‍🌾 Benefits for Women/SC/ST?"), action: "llm_trigger" },
    { text: t('chat_sug_pmkisan', "🚜 What is PM-Kisan?"), action: "llm_trigger" }
  ];

  const handleSuggestion = (suggestion) => {
    handleSend(suggestion.text);
  };

  const handleSend = async (text) => {
    if (!text.trim()) return;

    const userMessage = { id: Date.now(), text, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const currentHistory = [...messages, userMessage].slice(-10).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const res = await chatWithKrishiMitra(text, currentHistory, i18n.language, currentSessionId);
      
      if (!currentSessionId && res.sessionId) {
        setCurrentSessionId(res.sessionId);
        fetchSessions(false); 
      }

      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        text: res.response, 
        sender: 'ai' 
      }]);

      if (isAutoSpeech) speakResponse(res.response);
    } catch (error) {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        text: "Error connecting to AI. Please try again.", 
        sender: 'ai' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    setIsDeleting(true);
    try {
      await deleteChatSession(sessionToDelete);
      setSessions(prev => prev.filter(s => s._id !== sessionToDelete));
      if (currentSessionId === sessionToDelete) {
        handleNewChat();
      }
      setShowClearConfirm(false);
    } catch (error) {
      alert("Failed to delete session");
    } finally {
      setIsDeleting(false);
      setSessionToDelete(null);
    }
  };

  const handleClearAllHistory = async () => {
    setIsDeleting(true);
    try {
      await clearChatHistory();
      setSessions([]);
      handleNewChat();
      setShowClearConfirm(false);
    } catch (error) {
      alert("Failed to clear history");
    } finally {
      setIsDeleting(false);
    }
  };

  const speakResponse = async (text) => {
    if (audioRef.current) audioRef.current.pause();
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
      setIsSpeaking(false);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', height: 'calc(100vh - 100px)', display: 'flex', gap: '24px', padding: '10px' }}>
      
      {/* Sidebar - Chat History List (ChatGPT style) */}
      <motion.div 
        animate={{ width: sidebarOpen ? '320px' : '0px', opacity: sidebarOpen ? 1 : 0 }}
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          background: 'var(--bg-secondary)', 
          borderRadius: '24px', 
          border: '1px solid var(--border-glass)',
          overflow: 'hidden',
          position: 'relative',
          flexShrink: 0
        }}
      >
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
          <button 
            onClick={handleNewChat}
            className="btn-glow"
            style={{ 
              width: '100%', 
              padding: '14px', 
              borderRadius: '14px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '10px',
              fontSize: '0.95rem',
              fontWeight: 600
            }}
          >
            <Plus size={18} />
            {t('chat_new_chat', 'New Chat')}
          </button>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '20px 8px 10px', paddingBottom: '8px', borderBottom: '1px solid var(--border-glass)' }}>
              <HistoryIcon size={14} className="text-indigo-400" />
              <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {t('chat_recent_chats', 'Recent Conversations')}
              </h3>
            </div>
            
            {isSessionsLoading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <Bot size={24} className="animate-pulse text-indigo-400" />
              </div>
            ) : sessions.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No previous chats</p>
            ) : (
              sessions.map(session => (
                <div 
                  key={session._id}
                  onClick={() => handleSelectSession(session._id)}
                  style={{
                    padding: '14px',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    background: currentSessionId === session._id ? 'var(--gradient-primary)' : 'transparent',
                    boxShadow: currentSessionId === session._id ? '0 8px 20px rgba(99, 102, 241, 0.2)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    marginBottom: '4px',
                  }}
                  className="chat-session-item"
                >
                  <MessageSquare size={16} color={currentSessionId === session._id ? 'white' : 'var(--accent-emerald)'} />
                  <span style={{ 
                    fontSize: '0.88rem', 
                    color: currentSessionId === session._id ? 'white' : 'var(--text-primary)',
                    fontWeight: currentSessionId === session._id ? 700 : 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    flex: 1
                  }}>
                    {session.title}
                  </span>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSessionToDelete(session._id);
                      setShowClearConfirm(true);
                    }}
                    style={{ 
                      opacity: 0, 
                      transition: 'opacity 0.2s', 
                      background: 'transparent', 
                      border: 'none', 
                      color: currentSessionId === session._id ? 'white' : 'var(--accent-rose)',
                      cursor: 'pointer'
                    }}
                    className="delete-btn"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          <button 
            onClick={() => {
              setSessionToDelete(null); // Setting null signifies "Clear All"
              setShowClearConfirm(true);
            }}
            className="text-rose-400 hover:text-rose-300 transition-colors py-3 mt-4 flex items-center justify-center gap-2 border-t border-[var(--border-glass)]"
            style={{ fontSize: '0.8rem', fontWeight: 600, background: 'transparent' }}
          >
            <Trash2 size={14} /> {t('chat_clear_all', 'Clear All Conversations')}
          </button>
        </div>
      </motion.div>

      {/* Main Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* Header Strip */}
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="btn-glass"
            style={{ padding: '8px', borderRadius: '10px' }}
          >
            {sidebarOpen ? <ChevronLeft size={20} /> : <HistoryIcon size={20} />}
          </button>
          
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            <span className="gradient-text">Krishi Mitra</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginLeft: '12px', fontWeight: 500 }}>
              {currentSessionId ? sessions.find(s => s._id === currentSessionId)?.title : 'New Session'}
            </span>
          </h1>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isSpeaking && (
              <div className="waveform">
                <div className="waveform-bar"></div><div className="waveform-bar"></div>
                <div className="waveform-bar"></div><div className="waveform-bar"></div>
                <div className="waveform-bar"></div>
              </div>
            )}
            <button 
              onClick={() => setIsAutoSpeech(!isAutoSpeech)}
              className={`btn-glass flex items-center gap-2 px-4 py-2 ${isAutoSpeech ? 'text-indigo-400' : 'text-gray-400'}`}
              style={{ 
                borderRadius: '12px',
                background: isAutoSpeech ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-secondary)',
                border: `1px solid ${isAutoSpeech ? 'rgba(99, 102, 241, 0.2)' : 'var(--border-glass)'}`
              }}
            >
              {isAutoSpeech ? <Volume2 size={18} /> : <VolumeX size={18} />}
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{isAutoSpeech ? 'Auto-Voice: On' : 'Auto-Voice: Off'}</span>
            </button>
          </div>
        </div>

        {/* Chat Feed */}
        <AgriCard style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', border: '1px solid var(--border-glass)', background: 'var(--bg-primary)' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {messages.length === 0 && !isLoading ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div style={{ 
                  width: '70px', height: '70px', borderRadius: '20px', 
                  background: 'var(--gradient-primary)', display: 'flex', 
                  alignItems: 'center', justifyContent: 'center', marginBottom: '20px',
                  boxShadow: '0 10px 25px rgba(99, 102, 241, 0.3)'
                }}>
                  <Bot size={36} color="white" />
                </div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  नमस्ते! I am Krishi Mitra
                </h2>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', lineHeight: 1.6, marginBottom: '24px', fontSize: '0.95rem' }}>
                  Your personal AI companion for irrigation, schemes, and farming techniques. Try one of these questions to start:
                </p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', maxWidth: '550px', width: '100%' }}>
                  {suggestions.map((s, i) => (
                    <motion.button 
                      key={i}
                      whileHover={{ scale: 1.02, backgroundColor: 'rgba(34, 197, 94, 0.05)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSuggestion(s)}
                      style={{ 
                        padding: '14px', borderRadius: '14px', background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-glass)', color: 'var(--text-primary)',
                        textAlign: 'left', fontSize: '0.85rem', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', gap: '8px', transition: 'all 0.2s'
                      }}
                    >
                      {s.text}
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map(msg => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id} 
                  style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row'
                  }}
                >
                  <div style={{ 
                    width: '36px', height: '36px', borderRadius: '10px', 
                    background: msg.sender === 'user' ? 'var(--gradient-primary)' : 'var(--bg-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    border: '1px solid var(--border-glass)',
                    boxShadow: msg.sender === 'user' ? '0 4px 10px rgba(99, 102, 241, 0.2)' : 'none'
                  }}>
                    {msg.sender === 'user' ? <User size={18} color="white" /> : <Bot size={18} color="var(--accent-indigo)" />}
                  </div>
                  <div style={{ 
                    maxWidth: '80%', padding: '12px 18px', borderRadius: '18px',
                    background: msg.sender === 'user' ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-secondary)',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: 1.6,
                  }}>
                    {msg.text}
                  </div>
                </motion.div>
              ))
            )}
            {isLoading && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={18} color="var(--accent-indigo)" />
                </div>
                <div className="typing-indicator" style={{ padding: '12px' }}>
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Typing Area */}
          <div style={{ padding: '20px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-glass)' }}>
            <div style={{ 
              background: 'var(--bg-primary)', borderRadius: '16px', padding: '8px 8px 8px 18px', 
              display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
            }}>
              <input 
                type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend(inputValue)}
                placeholder="Message Krishi Mitra..."
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', padding: '10px 0', fontSize: '0.95rem' }}
              />
              <div style={{ display: 'flex', gap: '4px' }}>
                <button 
                  onClick={toggleDictation}
                  style={{ 
                    padding: '10px', borderRadius: '12px', 
                    background: isDictating ? 'rgba(244, 63, 94, 0.1)' : 'transparent',
                    color: isDictating ? 'var(--accent-rose)' : 'var(--text-muted)',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                >
                  {isDictating ? <Mic size={20} className="animate-pulse" /> : <MicOff size={20} />}
                </button>
                <button 
                  onClick={() => handleSend(inputValue)}
                  disabled={isLoading || !inputValue.trim()}
                  className="btn-glow" 
                  style={{ 
                    padding: '10px 20px', borderRadius: '12px',
                    opacity: (!inputValue.trim() || isLoading) ? 0.6 : 1
                  }}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </AgriCard>
      </div>

      <ConfirmDeleteModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={sessionToDelete ? handleDeleteSession : handleClearAllHistory}
        title={sessionToDelete ? "Delete Conversation?" : "Clear All History?"}
        message={sessionToDelete 
          ? "This will permanently delete this conversation and all its messages." 
          : "This will permanently delete ALL your conversations and messages with Krishi Mitra. This action cannot be undone."}
        isDeleting={isDeleting}
      />

      <style>{`
        .chat-session-item:hover .delete-btn {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
};

export default ChatDashboard;
