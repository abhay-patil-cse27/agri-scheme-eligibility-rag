import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation dictionaries
const resources = {
  en: {
    translation: {
      "app_name": "Niti-Setu",
      "tagline": "Agricultural Scheme Intelligence",
      "nav_features": "Features",
      "nav_audience": "Who We Serve",
      "nav_tech": "Technology",
      "nav_contact": "Contact",
      "btn_signin": "Sign In",
      "btn_register": "Register",
      "btn_free_check": "Free Check",
      "hero_title_1": "India's Farmers Deserve",
      "hero_title_2": "Every Benefit They've Earned",
      "hero_subtitle": "Tell us about your land, income, and family in seconds — by typing or speaking. Niti-Setu reads the actual scheme documents and tells you exactly which benefits you qualify for, and why.",
      "hero_btn_check": "Check Your Eligibility (Free)",
      "hero_btn_learn": "Learn How It Works",
      "eligibility_check": "Eligibility Check",
      "select_scheme": "Select Government Scheme",
      "voice_input": "Voice Input",
      "farmer_profile": "Farmer Profile",
      "check_eligibility": "Check Eligibility",
      "guest_mode": "Guest Mode:",
      "free_checks_remaining": "free checks remaining"
    }
  },
  hi: {
    translation: {
      "app_name": "नीति-सेतु",
      "tagline": "कृषि योजना बुद्धिमत्ता",
      "nav_features": "विशेषताएं",
      "nav_audience": "हम किसकी सेवा करते हैं",
      "nav_tech": "प्रौद्योगिकी",
      "nav_contact": "संपर्क करें",
      "btn_signin": "लॉग इन",
      "btn_register": "पंजीकरण करें",
      "btn_free_check": "मुफ्त जांच",
      "hero_title_1": "भारत के किसान हकदार हैं",
      "hero_title_2": "हर उस लाभ के जो उन्होंने कमाया है",
      "hero_subtitle": "हमें अपनी भूमि, आय और परिवार के बारे में सेकंडों में बताएं — टाइप करके या बोलकर। नीति-सेतु वास्तविक योजना दस्तावेज़ पढ़ता है और आपको बताता है कि आप किस लाभ के योग्य हैं, और क्यों।",
      "hero_btn_check": "अपनी पात्रता जांचें (मुफ्त)",
      "hero_btn_learn": "यह कैसे काम करता है जानें",
      "eligibility_check": "पात्रता जांच",
      "select_scheme": "सरकारी योजना चुनें",
      "voice_input": "आवाज़ इनपुट",
      "farmer_profile": "किसान प्रोफ़ाइल",
      "check_eligibility": "पात्रता जांचें",
      "guest_mode": "अतिथि मोड:",
      "free_checks_remaining": "मुफ्त जांच बाकी"
    }
  },
  mr: {
    translation: {
      "app_name": "नीती-सेतू",
      "tagline": "कृषी योजना बुद्धिमत्ता",
      "nav_features": "वैशिष्ट्ये",
      "nav_audience": "आम्ही कोणाची सेवा करतो",
      "nav_tech": "तंत्रज्ञान",
      "nav_contact": "संपर्क करा",
      "btn_signin": "लॉग इन करा",
      "btn_register": "नोंदणी करा",
      "btn_free_check": "मोफत तपासणी",
      "hero_title_1": "भारताच्या शेतकऱ्यांना मिळायला हवेत",
      "hero_title_2": "ते सर्व लाभ ज्यांचे ते हक्कदार आहेत",
      "hero_subtitle": "तुमच्या शेती, उत्पन्न आणि कुटुंबाबद्दल आम्हाला काही सेकंदात सांगा — टायपिंग किंवा बोलून. नीती-सेतू प्रत्यक्ष योजना दस्तऐवज वाचतो आणि तुम्हाला सांगतो की तुम्ही कोणत्या लाभांसाठी पात्र आहात आणि का.",
      "hero_btn_check": "तुमची पात्रता तपासा (मोफत)",
      "hero_btn_learn": "हे कसे कार्य करते ते जाणून घ्या",
      "eligibility_check": "पात्रता तपासणी",
      "select_scheme": "सरकारी योजना निवडा",
      "voice_input": "आवाज इनपुट",
      "farmer_profile": "शेतकरी प्रोफाइल",
      "check_eligibility": "पात्रता तपासा",
      "guest_mode": "अतिथी मोड:",
      "free_checks_remaining": "मोफत तपासणी बाकी"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    }
  });

export default i18n;
