/* NIRMAAN Kaarigar AI — Saarthi & Disha Voice Intelligence */
import { voice } from "../services/voice.js";
import { renderBottomNav } from "../components/bottom-nav.js";
import { showToast } from "../core/ui.js";

let SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognitionInstance = null;
let isListening = false;

export default {
  route: "#/kaarigar-ai",
  title: "AI Voice Assistant",

  async mount(container, ctx) {
    const { t } = ctx;
    renderBottomNav();

    let currentPersona = "SAARTHI";
    let userSpeech = "—";
    let aiResponse = "नमस्ते भाई! मैं निर्माण से सारथी हूँ। बताइए, काम, मज़दूरी या योजनाओं में आपकी क्या सहायता करूँ?";
    let statusText = "माइक दबाएं और बोलें (Mic dabao aur bolo)";

    function render() {
      container.innerHTML = `
        <div class="container-mobile" style="padding-top: 10px; padding-bottom: 70px; text-align: center;">
          
          <span class="badge badge-saffron" style="margin-bottom: 6px;">Voice Intelligence for Bharat</span>
          <h1 style="font-size: 1.8rem; font-weight: 800; color: var(--saffron); line-height: 1.1;">
            NIRMAAN AI
          </h1>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
            Multilingual Voice Assistant for Kaarigars & Builders
          </p>

          <!-- Persona Switcher -->
          <div style="display: flex; justify-content: center; gap: 10px; margin: 18px 0;">
            <button id="btn-saarthi" class="btn ${currentPersona === "SAARTHI" ? "btn-primary" : "btn-secondary"}" style="border-radius: var(--radius-full); padding: 10px 22px;">
              👨 SAARTHI
            </button>
            <button id="btn-disha" class="btn ${currentPersona === "DISHA" ? "btn-primary" : "btn-secondary"}" style="border-radius: var(--radius-full); padding: 10px 22px;">
              👩 DISHA
            </button>
          </div>

          <!-- Glowing Voice Orb -->
          <div style="margin: 24px auto;">
            <button id="voice-orb-btn" class="orb-pulse" style="
              width: 140px; height: 140px; border-radius: 50%; border: none; cursor: pointer;
              background: linear-gradient(135deg, var(--saffron-light), var(--saffron));
              color: white; font-size: 42px; display: flex; align-items: center; justify-content: center;
              box-shadow: 0 14px 40px rgba(232, 98, 26, 0.4); margin: 0 auto; transition: transform 0.2s ease;
            ">
              🎙️
            </button>
          </div>

          <!-- Status Bar -->
          <div id="ai-status-label" style="font-size: 0.95rem; font-weight: 800; color: var(--saffron); margin-bottom: 18px;">
            ${statusText}
          </div>

          <!-- Conversation Display Box -->
          <div class="card" style="text-align: left; padding: 18px; margin-bottom: 20px; background: var(--bg-secondary); border: 1px solid var(--border-light);">
            
            <div style="margin-bottom: 14px; border-bottom: 1px solid var(--border-light); padding-bottom: 10px;">
              <span style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">YOU (आप)</span>
              <div id="ai-user-text" style="font-size: 0.95rem; font-weight: 600; color: var(--text-main); margin-top: 2px;">
                ${userSpeech}
              </div>
            </div>

            <div>
              <span style="font-size: 0.72rem; font-weight: 800; color: var(--saffron); text-transform: uppercase;">
                ${currentPersona} AI
              </span>
              <div id="ai-reply-text" style="font-size: 0.95rem; color: var(--text-main); line-height: 1.5; margin-top: 4px;">
                ${aiResponse}
              </div>
            </div>

          </div>

          <!-- Quick Suggestion Chips -->
          <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 20px;">
            <button class="radius-pill chip-query" data-q="राज मिस्त्री का आज का रेट क्या है?">🧱 मिस्त्री का रेट?</button>
            <button class="radius-pill chip-query" data-q="ई-श्रम कार्ड का 2 लाख बीमा कैसे मिलेगा?">🛡️ ई-श्रम बीमा?</button>
            <button class="radius-pill chip-query" data-q="मुझे पास में प्लंबर चाहिए">🔧 प्लंबर खोजें</button>
            <button class="radius-pill chip-query" data-q="एस्क्रो पेमेंट कैसे काम करता है?">🔒 एस्क्रो सुरक्षा?</button>
          </div>

          <!-- Controls (Voice Test & API Settings) -->
          <div style="display: flex; justify-content: center; gap: 10px;">
            <button id="btn-test-speech" class="btn btn-secondary btn-sm" style="border-radius: var(--radius-full);">
              🔊 Test Voice
            </button>
            <button id="btn-voice-settings" class="btn btn-secondary btn-sm" style="border-radius: var(--radius-full);">
              ⚙️ Gemini Key
            </button>
          </div>

        </div>
      `;

      // Bind Personas
      container.querySelector("#btn-saarthi").onclick = () => {
        currentPersona = "SAARTHI";
        aiResponse = "नमस्ते भाई! मैं सारथी हूँ। बताइए निर्माण के काम में आपकी क्या मदद करूँ?";
        render();
        voice.speak(aiResponse, "hi-IN", "SAARTHI");
      };

      container.querySelector("#btn-disha").onclick = () => {
        currentPersona = "DISHA";
        aiResponse = "नमस्ते जी! मैं दिशा हूँ। बताइए निर्माण के काम में मैं आपकी क्या सहायता करूँ?";
        render();
        voice.speak(aiResponse, "hi-IN", "DISHA");
      };

      // Voice Orb Click
      container.querySelector("#voice-orb-btn").onclick = () => {
        startSpeechRecognition();
      };

      // Query Chips
      container.querySelectorAll(".chip-query").forEach(chip => {
        chip.onclick = async () => {
          const query = chip.dataset.q;
          handleUserQuery(query);
        };
      });

      // Test Voice
      container.querySelector("#btn-test-speech").onclick = () => {
        const text = currentPersona === "SAARTHI"
          ? "नमस्ते भाई! मैं सारथी हूँ। निर्माण पर आपका स्वागत है।"
          : "नमस्ते जी! मैं दिशा हूँ। निर्माण पर आपका स्वागत है।";
        voice.speak(text, "hi-IN", currentPersona);
      };

      // API Key
      container.querySelector("#btn-voice-settings").onclick = () => {
        const currentKey = voice.getApiKey();
        const key = prompt("Enter Gemini API Key (optional for live model generation):", currentKey);
        if (key !== null) {
          voice.setApiKey(key.trim());
          showToast("API Key saved!");
        }
      };
    }

    async function handleUserQuery(query) {
      userSpeech = query;
      statusText = `${currentPersona} सोच रहे हैं...`;
      render();

      const result = await voice.askAI(query, currentPersona);
      aiResponse = result.display;
      statusText = "Mic dabao aur bolo";
      render();

      voice.speak(result.spoken || result.display, result.langCode || "hi-IN", currentPersona);
    }

    function startSpeechRecognition() {
      if (!SpeechRecognitionAPI) {
        alert("Speech Recognition is not supported in this browser. Please use Google Chrome or Edge.");
        return;
      }

      if (isListening && recognitionInstance) {
        recognitionInstance.stop();
        return;
      }

      voice.stopAudio();
      recognitionInstance = new SpeechRecognitionAPI();
      recognitionInstance.lang = "hi-IN";
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;

      recognitionInstance.onstart = () => {
        isListening = true;
        statusText = "🎙️ सुन रहा हूँ... बोलिए (Listening...)";
        render();
      };

      recognitionInstance.onresult = async (event) => {
        isListening = false;
        const transcript = event.results[0][0].transcript.trim();
        if (transcript) {
          handleUserQuery(transcript);
        }
      };

      recognitionInstance.onerror = (event) => {
        isListening = false;
        statusText = "आवाज़ समझ नहीं आई। दोबारा बोलें।";
        render();
      };

      recognitionInstance.onend = () => {
        isListening = false;
      };

      try {
        recognitionInstance.start();
      } catch (e) {
        console.warn("Recognition start error", e);
      }
    }

    render();
  },

  unmount() {
    voice.stopAudio();
    if (recognitionInstance) {
      try { recognitionInstance.stop(); } catch {}
      recognitionInstance = null;
    }
  }
};
