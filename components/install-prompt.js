/* NIRMAAN App Installation Popup & PWA/APK Prompt */
import { escape } from "../core/ui.js";

const APK_DOWNLOAD_URL = "https://github.com/ayushjha16012005-lgtm/nirmaan1/releases/latest/download/Nirmaan.apk";

let deferredPrompt = null;
let isPromptInitialized = false;

export function initInstallPrompt() {
  if (isPromptInitialized) return;
  isPromptInitialized = true;

  // Check if already in standalone app
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || 
                       window.navigator.standalone === true ||
                       Boolean(window.Capacitor?.isNativePlatform?.());

  if (isStandalone) {
    return; // Already installed and running as native/PWA app
  }

  // Capture beforeinstallprompt event (Chrome, Edge, Samsung Internet, Android WebAPK)
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // Show popup if not dismissed in this session or explicitly requested via URL
    showPromptWithDelay(600);
  });

  // App installed listener
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    hideInstallPrompt();
    sessionStorage.setItem("nirmaan_installed", "1");
  });

  // Check URL parameters for explicit install request (e.g. from QR scan)
  const isUrlRequested = window.location.search.includes("install") || 
                         window.location.hash.includes("install") ||
                         !sessionStorage.getItem("nirmaan_install_dismissed");

  // If not prompted by beforeinstallprompt within 1.2s on mobile/evaluator, show the modal with direct APK & PWA options
  if (isUrlRequested) {
    showPromptWithDelay(900);
  }
}

let delayTimer = null;
function showPromptWithDelay(delayMs = 800) {
  if (delayTimer) clearTimeout(delayTimer);
  delayTimer = setTimeout(() => {
    showInstallPrompt();
  }, delayMs);
}

export function showInstallPrompt() {
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || 
                       window.navigator.standalone === true;
  if (isStandalone) return;

  let modal = document.getElementById("nirmaan-install-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "nirmaan-install-modal";
    modal.className = "modal-overlay";
    modal.style.cssText = "z-index: 99999; backdrop-filter: blur(6px); background: rgba(0,0,0,0.65);";

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    modal.innerHTML = `
      <div class="modal-box" style="max-width: 440px; padding: 24px 20px; text-align: center; border: 2px solid var(--saffron); border-radius: 20px; box-shadow: 0 16px 40px rgba(0,0,0,0.3); animation: nirmaanSlideUp 0.3s ease-out;">
        
        <!-- App Logo & Badge -->
        <div style="display: flex; justify-content: center; margin-bottom: 12px;">
          <div style="width: 72px; height: 72px; border-radius: 18px; background: #ffffff; border: 2px solid var(--saffron); display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(232,98,26,0.25);">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" style="width: 52px; height: 52px;">
              <line x1="20" y1="105" x2="100" y2="38" stroke="#E8621A" stroke-width="16" stroke-linecap="round"/>
              <polyline points="100,38 155,80 155,65 168,65 168,92 180,105" fill="none" stroke="#E8621A" stroke-width="16" stroke-linecap="round" stroke-linejoin="miter"/>
              <line x1="55" y1="105" x2="55" y2="175" stroke="#E8621A" stroke-width="16" stroke-linecap="round"/>
              <line x1="55" y1="105" x2="145" y2="175" stroke="#E8621A" stroke-width="16" stroke-linecap="round"/>
              <line x1="145" y1="105" x2="145" y2="175" stroke="#E8621A" stroke-width="16" stroke-linecap="round"/>
            </svg>
          </div>
        </div>

        <span class="badge badge-saffron" style="margin-bottom: 8px;">Official App • आधिकारिक ऐप</span>
        
        <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--text-main); margin-bottom: 4px; line-height: 1.2;">
          Install Nirmaan App
        </h2>
        
        <p style="font-size: 0.88rem; color: var(--saffron); font-weight: 700; margin-bottom: 12px;">
          ऐप इंस्टॉल करें — तेज़ और सुरक्षित
        </p>

        <p style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 18px;">
          Install the official Nirmaan app for instant OTP login, live GPS Kaarigar tracking, and offline site support.
        </p>

        <!-- Feature Points -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 20px; text-align: left; font-size: 0.78rem;">
          <div style="background: var(--bg-secondary); padding: 8px 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-light); display: flex; align-items: center; gap: 6px;">
            <span>⚡</span>
            <span style="font-weight: 600;">Instant Launch</span>
          </div>
          <div style="background: var(--bg-secondary); padding: 8px 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-light); display: flex; align-items: center; gap: 6px;">
            <span>📍</span>
            <span style="font-weight: 600;">Live GPS Map</span>
          </div>
          <div style="background: var(--bg-secondary); padding: 8px 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-light); display: flex; align-items: center; gap: 6px;">
            <span>🛡️</span>
            <span style="font-weight: 600;">Escrow Protection</span>
          </div>
          <div style="background: var(--bg-secondary); padding: 8px 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-light); display: flex; align-items: center; gap: 6px;">
            <span>📶</span>
            <span style="font-weight: 600;">Works Offline</span>
          </div>
        </div>

        ${isIOS ? `
          <!-- iOS Safari Instructions -->
          <div style="background: rgba(232,98,26,0.08); border: 1px solid var(--saffron-border); padding: 12px; border-radius: var(--radius-sm); font-size: 0.82rem; margin-bottom: 16px; text-align: left;">
            <strong>iPhone / iPad Install:</strong><br>
            1. Tap the <strong>Share</strong> button (⎋) at the bottom of Safari.<br>
            2. Scroll down and tap <strong>Add to Home Screen</strong> (⊞).
          </div>
        ` : `
          <!-- Android / Desktop Direct 1-Tap & APK Options -->
          <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px;">
            <button id="btn-popup-pwa-install" class="btn btn-primary btn-full" style="font-weight: 800; font-size: 1rem; padding: 12px; box-shadow: 0 4px 16px rgba(232,98,26,0.35);">
              📲 Install App on Phone (1-Tap)
            </button>

            <a id="btn-popup-apk-download" href="${APK_DOWNLOAD_URL}" class="btn btn-secondary btn-full" style="font-weight: 700; font-size: 0.9rem; padding: 10px; text-decoration: none;">
              ⬇️ Download Android APK (Direct)
            </a>
          </div>
        `}

        <button id="btn-popup-dismiss" style="background: none; border: none; font-size: 0.82rem; color: var(--text-muted); cursor: pointer; text-decoration: underline; margin-top: 4px;">
          Continue to Web Version (वेब पर जारी रखें)
        </button>

      </div>
    `;

    document.body.appendChild(modal);

    // Bind PWA 1-Tap Button
    const pwaBtn = modal.querySelector("#btn-popup-pwa-install");
    if (pwaBtn) {
      pwaBtn.onclick = async () => {
        if (deferredPrompt) {
          pwaBtn.disabled = true;
          pwaBtn.innerText = "Installing...";
          deferredPrompt.prompt();
          const choice = await deferredPrompt.userChoice;
          if (choice && choice.outcome === "accepted") {
            hideInstallPrompt();
          } else {
            pwaBtn.disabled = false;
            pwaBtn.innerText = "📲 Install App on Phone (1-Tap)";
          }
          deferredPrompt = null;
        } else {
          // If browser didn't fire beforeinstallprompt yet (or already installed), direct to APK download or install page
          window.location.href = APK_DOWNLOAD_URL;
        }
      };
    }

    // Dismiss Button
    const dismissBtn = modal.querySelector("#btn-popup-dismiss");
    if (dismissBtn) {
      dismissBtn.onclick = () => {
        hideInstallPrompt();
        sessionStorage.setItem("nirmaan_install_dismissed", "1");
      };
    }

    // Backdrop click dismiss
    modal.onclick = (e) => {
      if (e.target === modal) {
        hideInstallPrompt();
        sessionStorage.setItem("nirmaan_install_dismissed", "1");
      }
    };
  }

  modal.classList.add("active");
}

export function hideInstallPrompt() {
  const modal = document.getElementById("nirmaan-install-modal");
  if (modal) {
    modal.classList.remove("active");
  }
}
