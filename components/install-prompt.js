/* NIRMAAN App Installation Popup & Standalone APK Installer */

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
    return; // Already installed and running as standalone app
  }

  // Capture beforeinstallprompt event (Chrome, Edge, Samsung Internet)
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });

  // App installed listener
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    hideInstallPrompt();
    sessionStorage.setItem("nirmaan_installed", "1");
  });

  // Check URL parameters for explicit install request (e.g. from QR scan: https://nirmaan-m.vercel.app/?install=1)
  const isUrlRequested = window.location.search.includes("install") || 
                         window.location.hash.includes("install");
  const isFirstVisit = !sessionStorage.getItem("nirmaan_install_dismissed");

  if (isUrlRequested) {
    showPromptWithDelay(300);
  } else if (isFirstVisit) {
    showPromptWithDelay(1800);
  }
}

let delayTimer = null;
function showPromptWithDelay(delayMs = 600) {
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
      <div class="modal-box" style="max-width: 440px; padding: 24px 20px; text-align: center; border: 2px solid var(--saffron); border-radius: 20px; box-shadow: 0 16px 40px rgba(0,0,0,0.3); animation: nirmaanSlideUp 0.3s ease-out; position: relative;">
        
        <!-- Close icon button -->
        <button id="btn-popup-close-x" style="position: absolute; right: 14px; top: 14px; background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--text-muted); padding: 4px;" aria-label="Close">✕</button>

        <!-- App Logo & Badge -->
        <div style="display: flex; justify-content: center; margin-bottom: 10px;">
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

        <div style="display: flex; justify-content: center; gap: 6px; margin-bottom: 8px;">
          <span class="badge badge-saffron" style="font-size: 0.72rem;">Official Android App • आधिकारिक ऐप</span>
          <span class="badge badge-green" style="font-size: 0.72rem;">Direct Install</span>
        </div>
        
        <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--text-main); margin-bottom: 2px; line-height: 1.2;">
          Install Nirmaan App
        </h2>
        
        <p style="font-size: 0.88rem; color: var(--saffron); font-weight: 700; margin-bottom: 10px;">
          फोन में ऐप इंस्टॉल करें — 100% सुरक्षित
        </p>

        <p style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 14px;">
          Install the app directly on your phone to get instant Kaarigar discovery, live GPS tracking, and offline Hindi/English voice support.
        </p>

        <!-- Feature Points -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; text-align: left; font-size: 0.76rem;">
          <div style="background: var(--bg-secondary); padding: 8px 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-light); display: flex; align-items: center; gap: 6px;">
            <span>⚡</span>
            <span style="font-weight: 600;">Home Screen Icon</span>
          </div>
          <div style="background: var(--bg-secondary); padding: 8px 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-light); display: flex; align-items: center; gap: 6px;">
            <span>📍</span>
            <span style="font-weight: 600;">Live GPS Map & Radius</span>
          </div>
          <div style="background: var(--bg-secondary); padding: 8px 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-light); display: flex; align-items: center; gap: 6px;">
            <span>🛡️</span>
            <span style="font-weight: 600;">Escrow Protection</span>
          </div>
          <div style="background: var(--bg-secondary); padding: 8px 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-light); display: flex; align-items: center; gap: 6px;">
            <span>📱</span>
            <span style="font-weight: 600;">Standalone Phone App</span>
          </div>
        </div>

        <!-- Installation Instructions (shown dynamically after download starts) -->
        <div id="install-step-guide" style="display: none; background: #F0FDF4; border: 2px solid #16A34A; border-radius: 14px; padding: 14px; margin-bottom: 16px; text-align: left; animation: nirmaanSlideUp 0.3s ease-out;">
          <div style="display: flex; align-items: center; gap: 8px; font-weight: 800; color: #15803D; font-size: 0.95rem; margin-bottom: 8px;">
            <span>⬇️</span> <span>Download Started! (डाउनलोड शुरू हो गया)</span>
          </div>
          <p style="font-size: 0.82rem; color: var(--text-main); font-weight: 700; margin-bottom: 8px;">
            फोन में लगाने के लिए 3 आसान कदम:
          </p>
          <div style="display: flex; flex-direction: column; gap: 7px; font-size: 0.8rem; color: var(--text-main); line-height: 1.4;">
            <div style="display: flex; gap: 8px; align-items: flex-start;">
              <span style="background: #16A34A; color: white; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; flex-shrink: 0; margin-top: 1px;">1</span>
              <span>फोन के ऊपर से <strong>नोटिफिकेशन बार खींचें</strong> या <em>Downloads</em> फोल्डर खोलें.</span>
            </div>
            <div style="display: flex; gap: 8px; align-items: flex-start;">
              <span style="background: #16A34A; color: white; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; flex-shrink: 0; margin-top: 1px;">2</span>
              <span><strong>Nirmaan.apk</strong> पर टैप करें (यदि पूछे तो "Allow from this source" चालू करें).</span>
            </div>
            <div style="display: flex; gap: 8px; align-items: flex-start;">
              <span style="background: #16A34A; color: white; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; flex-shrink: 0; margin-top: 1px;">3</span>
              <span><strong>"Install"</strong> दबाएं — निर्माण ऐप आपके फोन में लग जाएगा!</span>
            </div>
          </div>
          <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(22,163,74,0.35); font-size: 0.78rem; color: #166534; font-weight: 700;">
            ✨ यह ऐप आपके फोन की स्क्रीन पर दिखेगा (Chrome में नहीं, अलग ऐप की तरह चलेगा).
          </div>
        </div>

        ${isIOS ? `
          <!-- iOS Safari Instructions -->
          <div style="background: rgba(232,98,26,0.08); border: 1px solid var(--saffron-border); padding: 12px; border-radius: var(--radius-sm); font-size: 0.82rem; margin-bottom: 16px; text-align: left;">
            <strong>🍎 iPhone / iPad Install:</strong><br>
            1. Tap the <strong>Share</strong> button (⎋) at the bottom of Safari.<br>
            2. Scroll down and tap <strong>Add to Home Screen</strong> (⊞).<br>
            3. Tap <strong>Add</strong> — Nirmaan will be on your home screen!
          </div>
        ` : `
          <!-- Action Buttons Area -->
          <div id="install-actions-box" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px;">
            <button id="btn-popup-install-apk" class="btn btn-primary btn-full" style="font-weight: 800; font-size: 1rem; padding: 13px; box-shadow: 0 4px 18px rgba(232,98,26,0.4); display: flex; align-items: center; justify-content: center; gap: 8px;">
              <span>📲</span>
              <span>Install App (Download APK) • ऐप इंस्टॉल करें</span>
            </button>

            <button id="btn-popup-pwa-install" class="btn btn-outline btn-full" style="font-weight: 600; font-size: 0.84rem; padding: 9px; display: flex; align-items: center; justify-content: center; gap: 6px;">
              <span>⚡</span>
              <span>Add to Home Screen (Instant Web App / बिना APK)</span>
            </button>
          </div>
        `}

        <div id="post-download-buttons" style="display: none; flex-direction: column; gap: 8px; margin-bottom: 12px;">
          <a id="btn-popup-redownload" href="${APK_DOWNLOAD_URL}" class="btn btn-secondary btn-full" style="font-weight: 700; font-size: 0.88rem; padding: 9px; text-decoration: none;">
            🔄 Download Again (अगर डाउनलोड न हुआ हो)
          </a>
          <button id="btn-popup-post-done" class="btn btn-primary btn-full" style="font-weight: 700; font-size: 0.88rem; padding: 9px;">
            ✓ Continue to Website (वेबसाइट पर जारी रखें)
          </button>
        </div>

        <button id="btn-popup-dismiss" style="background: none; border: none; font-size: 0.82rem; color: var(--text-muted); cursor: pointer; text-decoration: underline; margin-top: 4px;">
          Continue to Web Version (वेब पर जारी रखें)
        </button>

      </div>
    `;

    document.body.appendChild(modal);

    // 1. Primary APK Install / Download Trigger
    const apkBtn = modal.querySelector("#btn-popup-install-apk");
    const guideBox = modal.querySelector("#install-step-guide");
    const actionsBox = modal.querySelector("#install-actions-box");
    const postBtns = modal.querySelector("#post-download-buttons");

    if (apkBtn) {
      apkBtn.onclick = () => {
        // Trigger APK download directly in phone browser
        const downloadLink = document.createElement("a");
        downloadLink.href = APK_DOWNLOAD_URL;
        downloadLink.download = "Nirmaan.apk";
        downloadLink.target = "_blank";
        downloadLink.rel = "noopener noreferrer";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        // Show install instructions banner
        if (guideBox) guideBox.style.display = "block";
        if (actionsBox) actionsBox.style.display = "none";
        if (postBtns) postBtns.style.display = "flex";
      };
    }

    // 2. Secondary PWA 1-Tap Trigger
    const pwaBtn = modal.querySelector("#btn-popup-pwa-install");
    if (pwaBtn) {
      pwaBtn.onclick = async () => {
        if (deferredPrompt) {
          pwaBtn.disabled = true;
          pwaBtn.innerText = "Adding...";
          deferredPrompt.prompt();
          const choice = await deferredPrompt.userChoice;
          if (choice && choice.outcome === "accepted") {
            hideInstallPrompt();
          } else {
            pwaBtn.disabled = false;
            pwaBtn.innerText = "⚡ Add to Home Screen (Instant Web App / बिना APK)";
          }
          deferredPrompt = null;
        } else {
          // If no beforeinstallprompt, trigger APK download
          if (apkBtn) apkBtn.click();
        }
      };
    }

    // Post-download done button
    const postDoneBtn = modal.querySelector("#btn-popup-post-done");
    if (postDoneBtn) {
      postDoneBtn.onclick = () => {
        hideInstallPrompt();
        sessionStorage.setItem("nirmaan_install_dismissed", "1");
      };
    }

    // Close buttons (X and dismiss)
    const closeXBtn = modal.querySelector("#btn-popup-close-x");
    if (closeXBtn) {
      closeXBtn.onclick = () => {
        hideInstallPrompt();
        sessionStorage.setItem("nirmaan_install_dismissed", "1");
      };
    }

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
