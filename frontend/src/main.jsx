import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './i18n'; // Import i18n completely here
import './index.css';

import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker (now active in dev mode too for localhost testing)
registerSW({ immediate: true });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
