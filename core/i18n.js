/* NIRMAAN Internationalization Engine */
import { store } from "./store.js";

const translations = {
  en: {
    // Brand
    "brand.tagline": "Bharat Ka Nirmaan, Nahi Rukega",
    "brand.sub": "Direct & Fair Construction Labour Platform",
    "nav.home": "Home",
    "nav.find": "Find Kaarigars",
    "nav.projects": "Projects",
    "nav.ai": "AI Saarthi",
    "nav.profile": "Profile",
    "nav.admin": "Admin",

    // Roles & Auth
    "role.user": "User / Builder",
    "role.kaarigar": "Kaarigar / Worker",
    "auth.welcome": "Welcome to Nirmaan",
    "auth.chooseRole": "Choose how you want to use the app:",
    "auth.loginTitle": "Secure Login",
    "auth.enterMobile": "Enter mobile number",
    "auth.getOtp": "GET OTP",
    "auth.verifyOtp": "Verify OTP",
    "auth.enterOtp": "Enter 4-digit OTP",
    "auth.submit": "Continue",

    // User Discovery
    "user.searchPlaceholder": "Search Kaarigar or skill (e.g. Mason, Plumber, Painter)...",
    "user.radius": "Radius",
    "user.nearbyKaarigars": "Nearby Kaarigars",
    "user.kaarigarBulaye": "Kaarigar Bulaye",
    "user.viewProfile": "View Profile",
    "user.rateDay": "/day",
    "user.rateHour": "/hr",
    "user.verified": "Verified",
    "user.unverified": "Unverified",

    // Projects Command Centre
    "projects.title": "Construction Command Centre",
    "projects.resources": "Resource Management",
    "projects.resourcesDesc": "Track cement, bricks, sand, paint usage & inventory",
    "projects.labour": "Labour Planning",
    "projects.labourDesc": "Smart mix: masons + helpers with dynamic pricing",
    "projects.progress": "Daily Progress",
    "projects.progressDesc": "Upload site photos & track construction timeline",
    "projects.houseMap": "AI House Map Maker",
    "projects.houseMapDesc": "Plot dimensions → Instant 2D/3D architectural layouts",
    "projects.engineer": "Civil Engineer",
    "projects.engineerDesc": "Book professional structural & blueprint consultation",

    // Kaarigar Home
    "kaarigar.greeting": "Namaste",
    "kaarigar.newRequest": "New Job Request",
    "kaarigar.accept": "ACCEPT",
    "kaarigar.decline": "DECLINE",
    "kaarigar.earnings": "Earnings",
    "kaarigar.thisMonth": "This Month",
    "kaarigar.bankDetails": "Bank Details",
    "kaarigar.samachar": "Nirmaan Samachar",
    "kaarigar.schemes": "Government Schemes & Welfare",
    "kaarigar.eShram": "e-Shram Card Benefits",
    "kaarigar.bocw": "BOCW Welfare Board Grant",
    "kaarigar.pmAwas": "PM Awas Yojana Subsidy",

    // AI Assistant
    "ai.title": "AI Assistant (Saarthi & Disha)",
    "ai.micPrompt": "Tap mic and speak in Hindi or English",
    "ai.saarthi": "👨 SAARTHI",
    "ai.disha": "👩 DISHA",

    // Tracking & Verification
    "track.title": "Live Kaarigar Tracking",
    "track.onTheWay": "Kaarigar is on the way",
    "track.arrived": "Arrived on Site",
    "track.verifyOtp": "Verify On-Spot PIN",
    "track.escrowLocked": "Escrow Payment Locked",
    "track.releaseCash": "Release Payment",

    // Common
    "common.loading": "Loading...",
    "common.back": "Back",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.logout": "Logout"
  },

  hi: {
    // Brand
    "brand.tagline": "भारत का निर्माण, नहीं रुकेगा",
    "brand.sub": "कारीगरों और ग्राहकों का सीधा एवं सुरक्षित मंच",
    "nav.home": "होम",
    "nav.find": "कारीगर खोजें",
    "nav.projects": "प्रोजेक्ट्स",
    "nav.ai": "एआई सारथी",
    "nav.profile": "प्रोफ़ाइल",
    "nav.admin": "एडमिन",

    // Roles & Auth
    "role.user": "उपयोगकर्ता / ग्राहक",
    "role.kaarigar": "कारीगर / मज़दूर",
    "auth.welcome": "निर्माण में आपका स्वागत है",
    "auth.chooseRole": "आप किस रूप में उपयोग करना चाहते हैं?",
    "auth.loginTitle": "सुरक्षित लॉगिन",
    "auth.enterMobile": "मोबाइल नंबर दर्ज करें",
    "auth.getOtp": "ओटीपी प्राप्त करें",
    "auth.verifyOtp": "ओटीपी सत्यापित करें",
    "auth.enterOtp": "4-अंकों का ओटीपी दर्ज करें",
    "auth.submit": "आगे बढ़ें",

    // User Discovery
    "user.searchPlaceholder": "कारीगर या हुनर खोजें (जैसे राज मिस्त्री, प्लंबर, पेंटर)...",
    "user.radius": "दूरी का दायरा",
    "user.nearbyKaarigars": "आस-पास के कारीगर",
    "user.kaarigarBulaye": "कारीगर बुलाएं",
    "user.viewProfile": "प्रोफ़ाइल देखें",
    "user.rateDay": "/दिन",
    "user.rateHour": "/घंटा",
    "user.verified": "सत्यापित",
    "user.unverified": "असत्यापित",

    // Projects Command Centre
    "projects.title": "कंस्ट्रक्शन कमांड सेंटर",
    "projects.resources": "सामग्री प्रबंधन (रिसोर्स)",
    "projects.resourcesDesc": "सीमेंट, ईंट, रेत, पेंट और सामग्री की खपत ट्रैक करें",
    "projects.labour": "मज़दूर योजना (लेबर प्लानिंग)",
    "projects.labourDesc": "मिस्त्री + लेबर का सही तालमेल और पारदर्शी मजदूरी",
    "projects.progress": "दैनिक प्रगति (डेली प्रोग्रेस)",
    "projects.progressDesc": "साइट की फ़ोटो अपलोड करें और समयसीमा ट्रैक करें",
    "projects.houseMap": "एआई हाउस मैप मेकर",
    "projects.houseMapDesc": "प्लॉट नाप दर्ज करें → एआई तुरंत 2D/3D नक्शे सुझाएगा",
    "projects.engineer": "सिविल इंजीनियर",
    "projects.engineerDesc": "अनुभवी इंजीनियर से नक्शा व स्ट्रक्चरल सलाह लें",

    // Kaarigar Home
    "kaarigar.greeting": "नमस्ते",
    "kaarigar.newRequest": "नया काम आया है!",
    "kaarigar.accept": "स्वीकार करें",
    "kaarigar.decline": "अस्वीकार",
    "kaarigar.earnings": "कुल कमाई",
    "kaarigar.thisMonth": "इस महीने",
    "kaarigar.bankDetails": "बैंक खाता विवरण",
    "kaarigar.samachar": "निर्माण समाचार",
    "kaarigar.schemes": "सरकारी योजनाएं एवं कल्याण",
    "kaarigar.eShram": "ई-श्रम कार्ड लाभ",
    "kaarigar.bocw": "BOCW कल्याण बोर्ड योजनाएं",
    "kaarigar.pmAwas": "पीएम आवास योजना सहायता",

    // AI Assistant
    "ai.title": "एआई सहायक (सारथी एवं दिशा)",
    "ai.micPrompt": "माइक दबाएं और हिंदी या अंग्रेजी में बोलें",
    "ai.saarthi": "👨 सारथी",
    "ai.disha": "👩 दिशा",

    // Tracking & Verification
    "track.title": "लाइव कारीगर ट्रैकिंग",
    "track.onTheWay": "कारीगर रास्ते में हैं",
    "track.arrived": "साइट पर पहुंच गए हैं",
    "track.verifyOtp": "ऑन-स्पॉट पिन सत्यापित करें",
    "track.escrowLocked": "एस्क्रो भुगतान सुरक्षित लॉक है",
    "track.releaseCash": "भुगतान जारी करें",

    // Common
    "common.loading": "लोड हो रहा है...",
    "common.back": "पीछे",
    "common.save": "सुरक्षित करें",
    "common.cancel": "रद्द करें",
    "common.logout": "लॉग आउट"
  }
};

export function t(key, vars = {}) {
  const lang = store.get("lang") || "hi";
  let text = translations[lang]?.[key] || translations["en"]?.[key] || key;
  Object.keys(vars).forEach(k => {
    text = text.replace(new RegExp(`{${k}}`, "g"), vars[k]);
  });
  return text;
}
