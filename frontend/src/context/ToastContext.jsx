import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('nitisetu_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn('Failed to load notification history', e);
      return [];
    }
  });

  // Sync history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('nitisetu_notifications', JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to save notification history', e);
    }
  }, [history]);

  /**
   * Add a new toast notification
   * @param {string} title - Short title for the toast
   * @param {string} message - Detailed message (optional)
   * @param {'success'|'error'|'info'|'warning'} type - Visual style
   */
  const addToast = useCallback((title, message = '', type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    const timestamp = new Date().toISOString();
    
    const newToast = { id, title, message, type, timestamp };

    // 1. Add to live active toasts array (for the screen)
    setToasts((prev) => [...prev, newToast]);

    // 2. Add to persistent history log (cap at 50)
    setHistory((prev) => {
      const updated = [newToast, ...prev];
      return updated.slice(0, 50); // Keep only the latest 50
    });

    // 3. Auto-remove from LIVE screen after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem('nitisetu_notifications');
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, history, addToast, removeToast, clearHistory }}>
      {children}
    </ToastContext.Provider>
  );
};
