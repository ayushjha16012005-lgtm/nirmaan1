/* NIRMAAN AI Voice Intelligence Service (Saarthi & Disha) */

let vaApiKey = localStorage.getItem("nirmaan_api_key") || "";
let activeAudio = null;

export const voice = {
  getApiKey() {
    return vaApiKey;
  },

  setApiKey(key) {
    vaApiKey = key;
    localStorage.setItem("nirmaan_api_key", key);
  },

  detectLanguage(text) {
    if (/[\u0900-\u097F]/.test(text)) return "hi-IN";
    const lower = text.toLowerCase();
    const hindiWords = ["hai", "hain", "kya", "kaise", "kaam", "chahiye", "mujhe", "mera", "meri", "aap", "bhai", "ghar", "karigar", "mazdoor", "mistri", "batao", "bataiye"];
    let score = 0;
    for (const w of hindiWords) {
      if (lower.includes(w)) score++;
    }
    return score >= 2 ? "hi-IN" : "en-IN";
  },

  stopAudio() {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  },

  async askAI(userMessage, persona = "SAARTHI") {
    if (!vaApiKey) {
      // Offline fallback smart mock responses
      const lower = userMessage.toLowerCase();
      if (lower.includes("plumber") || lower.includes("नल") || lower.includes("लीकेज")) {
        return {
          display: persona === "SAARTHI"
            ? "नमस्ते भाई! मैंने आपके नज़दीक 3 कुशल प्लंबर ढूंढे हैं। सुनील वर्मा जी 1.8 किमी दूरी पर उपलब्ध हैं।"
            : "नमस्ते जी! आपके पास अनुभवी प्लंबर उपलब्ध हैं। आप सीधे मैप से बुक कर सकते हैं।",
          spoken: persona === "SAARTHI"
            ? "नमस्ते भाई! मैंने आपके नज़दीक कुशल प्लंबर ढूंढे हैं।"
            : "नमस्ते जी! आपके पास अनुभवी प्लंबर उपलब्ध हैं।",
          langCode: "hi-IN"
        };
      }
      if (lower.includes("rate") || lower.includes("मजदूरी") || lower.includes("रेट") || lower.includes("wage")) {
        return {
          display: persona === "SAARTHI"
            ? "राज मिस्त्री का मानक दैनिक वेतन ₹850/दिन है। निर्माण पर कोई बिचौलिया कमीशन नहीं कटता।"
            : "निर्माण पर मजदूरी दरें पारदर्शी हैं - मिस्त्री ₹850/दिन और पेंटर ₹700/दिन।",
          spoken: "राज मिस्त्री का मानक वेतन ₹850 प्रतिदिन है।",
          langCode: "hi-IN"
        };
      }
      return {
        display: persona === "SAARTHI"
          ? `भाई, मैं निर्माण का साथी सारथी हूँ। बताइए काम, मज़दूरी या सरकारी योजनाओं में क्या मदद चाहिए?`
          : `नमस्ते जी, मैं दिशा हूँ। निर्माण पर आपका काम पूरी सुरक्षा और सम्मान के साथ होगा।`,
        spoken: persona === "SAARTHI" ? "बताइए भाई, आपकी क्या सहायता करूँ?" : "नमस्ते जी, बताइए मैं क्या मदद करूँ?",
        langCode: "hi-IN"
      };
    }

    // Live Gemini API
    const personaPrompt = persona === "SAARTHI"
      ? `You are SAARTHI, the male voice assistant of NIRMAAN. Speak like a reliable, elder Indian brother. Short, respectful, conversational Hinglish/Hindi.`
      : `You are DISHA, the female voice assistant of NIRMAAN. Warm, calm, reassuring, conversational Hinglish/Hindi.`;

    const prompt = `${personaPrompt}\nUser said: ${userMessage}\nReturn ONLY valid JSON: {"display": "text", "spoken": "short text", "langCode": "hi-IN"}`;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": vaApiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });
    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    try {
      return JSON.parse(text);
    } catch {
      return { display: text, spoken: text, langCode: "hi-IN" };
    }
  },

  speak(text, lang = "hi-IN", persona = "SAARTHI") {
    this.stopAudio();
    if (!window.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = persona === "SAARTHI" ? 0.9 : 1.0;
    utterance.pitch = persona === "SAARTHI" ? 0.85 : 1.1;

    const voices = window.speechSynthesis.getVoices();
    const match = voices.find(v => v.lang && v.lang.toLowerCase().startsWith("hi-in")) ||
                  voices.find(v => v.lang && v.lang.toLowerCase().startsWith("en-in"));
    if (match) utterance.voice = match;

    window.speechSynthesis.speak(utterance);
  }
};
