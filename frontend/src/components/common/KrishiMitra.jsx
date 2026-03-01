import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getChatSessions, 
  getSessionMessages, 
  clearChatHistory, 
  chatWithKrishiMitra, 
  generateSpeech 
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import ConfirmDeleteModal from '../common/ConfirmDeleteModal';
import { 
  MessageSquare, X, Send, Sprout, Leaf, User, Bot, HelpCircle, 
  LayoutDashboard, Search, Volume2, VolumeX, Loader2, Home, 
  Mic, MicOff, ChevronRight, CheckCircle2, Trash2 
} from 'lucide-react';
import { useLocation } from 'react-router-dom';

const KrishiMitra = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const [isAutoSpeech, setIsAutoSpeech] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef(null);
  const messagesEndRef = useRef(null);
  const { i18n } = useTranslation();
  
  // New States for Home/Chat Views and Dictation
  const [activeTab, setActiveTab] = useState('home');
  const [isDictating, setIsDictating] = useState(false);
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition
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

  // Update language dynamically
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = i18n.language || 'en-IN';
    }
  }, [i18n.language]);

  const [currentSessionId, setCurrentSessionId] = useState(null);

  const loadHistory = async () => {
    try {
      // 1. Get all sessions
      const sessions = await getChatSessions();
      
      if (sessions && sessions.length > 0) {
        const latestSession = sessions[0]; // List is sorted by updatedAt desc
        setCurrentSessionId(latestSession._id);
        
        // 2. Load messages for this session
        const history = await getSessionMessages(latestSession._id);
        if (history && history.length > 0) {
          const formatted = history.map(msg => ({
            id: msg._id,
            text: msg.content,
            sender: msg.role === 'assistant' ? 'ai' : 'user',
            showSuggestions: false
          }));
          setMessages(formatted);
        } else {
          showGreeting();
        }
      } else {
        showGreeting();
      }
      setIsHistoryLoaded(true);
    } catch (error) {
      console.error('Failed to load chat history:', error);
      showGreeting();
    }
  };

  const showGreeting = () => {
    setMessages([
      { 
        id: 'initial', 
        text: t('chat_greeting', "Namaste! I am Krishi Mitra, your agricultural guide. How can I help you today?"), 
        sender: 'ai',
        showSuggestions: true 
      }
    ]);
  };

  useEffect(() => {
    if (isOpen && !isHistoryLoaded) {
      loadHistory();
    }
  }, [isOpen, isHistoryLoaded]);

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
    { text: t('chat_sug_profile', "👤 How to update my profile?"), action: "guide_profile" },
    { text: t('chat_sug_crops', "🌾 Best crops for this season?"), action: "llm_trigger" },
    { text: t('chat_sug_benefits', "👩‍🌾 Benefits for Women/SC/ST?"), action: "llm_trigger" },
    { text: t('chat_sug_language', "🌐 Talk in my language"), action: "guide_language" }
  ];

  const handleSend = async (text) => {
    if (!text.trim()) return;

    setMessages(prev => prev.map(m => ({ ...m, showSuggestions: false })));

    const userMessage = { id: Date.now(), text, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setActiveTab('chat');

    try {
      const historyItems = messages.slice(-6).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const res = await chatWithKrishiMitra(text, historyItems, i18n.language, currentSessionId);
      
      if (!currentSessionId && res.sessionId) {
        setCurrentSessionId(res.sessionId);
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, text: res.response, sender: 'ai' }]);
      
      if (isAutoSpeech) {
        speakResponse(res.response);
      }
      
      setTimeout(() => {
        setMessages(prev => [
          ...prev, 
          { 
            id: Date.now() + 2, 
            text: t('chat_follow_up', "Would you like to ask anything else?"), 
            sender: 'ai', 
            showSuggestions: true 
          }
        ]);
      }, 1500);

    } catch (error) {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        text: "I'm having trouble connecting right now. Please try again later.", 
        sender: 'ai' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestion = (suggestion) => {
    // Hide suggestions on the previous AI message
    setMessages(prev => prev.map(m => ({ ...m, showSuggestions: false })));
    
    setActiveTab('chat'); // Switch to chat mode automatically

    if (suggestion.action.startsWith('guide_')) {
      const userText = suggestion.text;
      let response = "";
      switch (suggestion.action) {
        case 'guide_eligibility':
          response = "To check your eligibility: \n1. Click 'Eligibility Check' in the sidebar.\n2. Choose 'Manual' or 'Voice' mode.\n3. Get instant results!";
          break;
        case 'guide_history':
          response = "You can view all your previous eligibility checks by clicking 'History' in the sidebar.";
          break;
        case 'guide_schemes':
          response = "Go to the 'Schemes' page to see all available government documents and official PDFs.";
          break;
        case 'guide_profile':
          response = "To update your details, go to the 'Settings' page. Accurate data ensures better results!";
          break;
        case 'guide_language':
          response = "Use the language switcher at the bottom of the sidebar to change the app language.";
          break;
        default:
          response = "I can guide you through the app. Just ask me where to find something!";
      }
      
      setMessages(prev => [...prev, { id: Date.now(), text: userText, sender: 'user' }]);
      
      // Artificial delay for guiding
      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now() + 1, text: response, sender: 'ai' }]);
        
        // Final follow up after another delay
        setTimeout(() => {
          setMessages(prev => [
            ...prev, 
            { 
              id: Date.now() + 2, 
              text: t('chat_got_it', "Got it! Anything else about Niti Setu?"), 
              sender: 'ai', 
              showSuggestions: true 
            }
          ]);
        }, 1500);
      }, 600);
    } else {
      handleSend(suggestion.text);
    }
  };
  
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

  // Do not show the floating bot on the dedicated chat dashboard
  if (location.pathname === '/dashboard/chat') {
    return null;
  }

  return (
    <>
      {/* Floating Action Button */}
      <motion.div 
        className="krishi-mitra-fab"
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={30} />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Sprout size={32} />
            </motion.div>
          )}
        </AnimatePresence>

        {!isOpen && (
          <motion.div 
            className="absolute -top-3 -right-3 px-3 py-1.5 rounded-2xl shadow-xl border border-[var(--border-glow)] flex items-center justify-center"
            style={{ 
              background: 'var(--gradient-primary)', 
              backdropFilter: 'blur(8px)',
              boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 800,
              zIndex: 10
            }}
            initial={{ scale: 0, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ delay: 1, type: 'spring', stiffness: 260, damping: 20 }}
          >
            Hi! {user?.name ? user.name.split(' ')[0] : ''}
          </motion.div>
        )}
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="chat-window"
            initial={{ opacity: 0, scale: 0.9, y: 40, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 40, x: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className="chat-header" style={{ 
              background: 'var(--gradient-primary)', 
              padding: '24px 20px', 
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)'
            }}>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Leaf size={20} className="text-white" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Krishi Mitra</h4>
                <div className="flex items-center gap-1.5">
                  {isSpeaking ? (
                    <div className="waveform">
                      <div className="waveform-bar"></div>
                      <div className="waveform-bar"></div>
                      <div className="waveform-bar"></div>
                      <div className="waveform-bar"></div>
                      <div className="waveform-bar"></div>
                    </div>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <p className="text-[10px] opacity-80">{t('sb_system_online', "Farmer's Friend is Online")}</p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 ml-auto">
                <button 
                  onClick={() => setShowClearConfirm(true)}
                  className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-white/70"
                  title="Clear Conversation"
                >
                  <Trash2 size={16} />
                </button>
                <button 
                  onClick={() => setIsAutoSpeech(!isAutoSpeech)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isAutoSpeech ? 'bg-white/20 text-yellow-300' : 'hover:bg-white/10 text-white/70'}`}
                  title={isAutoSpeech ? "Disable Auto-Speech" : "Enable Auto-Speech"}
                >
                  {isAutoSpeech ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <ConfirmDeleteModal
              isOpen={showClearConfirm}
              onClose={() => setShowClearConfirm(false)}
              onConfirm={async () => {
                setIsClearing(true);
                try {
                  await clearChatHistory();
                  setMessages([
                    { 
                      id: 'reset', 
                      text: t('chat_greeting', "Namaste! I am Krishi Mitra, your agricultural guide. How can I help you today?"), 
                      sender: 'ai',
                      showSuggestions: true 
                    }
                  ]);
                  setShowClearConfirm(false);
                } catch (err) {
                  alert("Failed to clear history");
                } finally {
                  setIsClearing(false);
                }
              }}
              title={t('chat_clear_title', "Clear Conversation?")}
              message={t('chat_clear_msg', "This will permanently delete all your chat messages with Krishi Mitra.")}
              isDeleting={isClearing}
            />

            {/* TAB CONTENT */}
            {activeTab === 'home' ? (
              <div className="chat-messages" style={{ padding: '0', background: 'var(--bg-primary)' }}>
                {/* Hero Greeting */}
                <div style={{ padding: '24px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-glass)' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Hello {user?.name ? user.name.split(' ')[0] : 'Farmer'}!
                    <br />How can we help?
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(34, 197, 94, 0.1)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                    <CheckCircle2 size={16} color="var(--accent-emerald)" />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Status: All Systems Operational</span>
                  </div>
                </div>

                {/* Search Area */}
                <div style={{ padding: '20px 20px 0' }}>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      placeholder="Ask me anything..." 
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend(inputValue)}
                      style={{ width: '100%', padding: '12px 40px 12px 16px', borderRadius: '12px', border: '1px solid var(--border-glass)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                    />
                    <button 
                      onClick={() => handleSend(inputValue)}
                      style={{ position: 'absolute', right: '12px', top: '12px', color: 'var(--accent-indigo)' }}
                    >
                      <Search size={18} />
                    </button>
                  </div>
                </div>

                {/* FAQ List */}
                <div style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Help</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {suggestions.slice(0, 4).map((s, i) => (
                      <button 
                        key={i}
                        onClick={() => handleSuggestion(s)}
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          padding: '14px 18px', 
                          background: 'var(--bg-secondary)', 
                          borderRadius: '16px', 
                          border: '1px solid var(--border-glass)', 
                          color: 'var(--text-secondary)', 
                          fontSize: '0.92rem', 
                          fontWeight: 500,
                          width: '100%', 
                          textAlign: 'left', 
                          cursor: 'pointer', 
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--accent-indigo)';
                          e.currentTarget.style.transform = 'translateX(6px)';
                          e.currentTarget.style.background = 'var(--bg-glass)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-glass)';
                          e.currentTarget.style.transform = 'translateX(0)';
                          e.currentTarget.style.background = 'var(--bg-secondary)';
                        }}
                      >
                        {s.text}
                        <ChevronRight size={18} color="var(--accent-indigo)" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // Chat Messages Area
              <>
                <div className="chat-messages">
                  {messages.map(msg => (
                    <div key={msg.id} className="flex flex-col gap-2">
                      <div className={`message ${msg.sender === 'ai' ? 'message-ai' : 'message-user'}`}>
                        {msg.text}
                      </div>
                      
                      {msg.showSuggestions && (
                        <div className="flex flex-wrap gap-2 mt-1 mb-2">
                          {suggestions.map((s, i) => (
                            <button 
                              key={i} 
                              onClick={() => handleSuggestion(s)}
                              className="chat-btn-suggestion-inline"
                            >
                              {s.text}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="message message-ai">
                      <div className="typing-indicator">
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="chat-input-area border-t border-[var(--border-glass)]">
                  <div className="chat-input-wrapper flex items-center bg-[var(--bg-secondary)] border border-[var(--border-color)] p-1 rounded-2xl w-full">
                    <input 
                      type="text" 
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend(inputValue)}
                      placeholder="Ask me anything..."
                      className="flex-1 bg-transparent border-none outline-none text-[var(--text-primary)] px-3 py-2 text-sm"
                    />
                    <button 
                      onClick={toggleDictation}
                      className={`p-2 rounded-xl transition ${isDictating ? 'text-rose-500 bg-rose-500/10' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                      title={isDictating ? 'Stop Listening' : 'Start Dictation'}
                    >
                      {isDictating ? <span className="animate-pulse"><Mic size={18} /></span> : <MicOff size={18} />}
                    </button>
                    <button 
                      onClick={() => handleSend(inputValue)}
                      disabled={isLoading || !inputValue.trim()}
                      className="p-2 ml-1 text-white bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-xl disabled:opacity-50"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Bottom Tab Navigation */}
            <div style={{ display: 'flex', borderTop: '1px solid var(--border-glass)', background: 'var(--bg-primary)' }}>
              <button 
                onClick={() => setActiveTab('home')}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 0', background: 'transparent', border: 'none', color: activeTab === 'home' ? 'var(--accent-indigo)' : 'var(--text-muted)', borderTop: activeTab === 'home' ? '2px solid var(--accent-indigo)' : '2px solid transparent', cursor: 'pointer' }}
              >
                <Home size={20} style={{ marginBottom: '4px' }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Home</span>
              </button>
              <button 
                onClick={() => setActiveTab('chat')}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 0', background: 'transparent', border: 'none', color: activeTab === 'chat' ? 'var(--accent-indigo)' : 'var(--text-muted)', borderTop: activeTab === 'chat' ? '2px solid var(--accent-indigo)' : '2px solid transparent', cursor: 'pointer' }}
              >
                <MessageSquare size={20} style={{ marginBottom: '4px' }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Messages</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};


export default KrishiMitra;
