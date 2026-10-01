/* NIRMAAN Footer Component */
import { t } from "../core/i18n.js";
import { showInstallPrompt } from "./install-prompt.js";

export function renderFooter() {
  const container = document.getElementById("app-footer");
  if (!container) return;

  container.innerHTML = `
    <footer style="background: var(--bg-primary); border-top: 1px solid var(--border-light); padding: 32px 16px; margin-top: 40px; text-align: center;">
      <div class="container">
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px;">
          <strong style="font-size: 1.1rem; color: var(--text-main);">Nirmaan <span class="logo-devanagari">निर्माण</span></strong>
        </div>
        <p style="font-size: 0.85rem; color: var(--saffron); font-weight: 700; margin-bottom: 12px;">
          ${t("brand.tagline")}
        </p>
        <p style="font-size: 0.78rem; color: var(--text-muted); max-width: 500px; margin: 0 auto 14px;">
          India's direct construction labour ecosystem — Verified Kaarigars, Protected Escrow, Zero Middleman.
        </p>
        <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-bottom: 14px;">
          <button id="btn-footer-install-app" class="radius-pill" style="background: var(--bg-secondary); border: 1.5px solid var(--saffron-border); color: var(--saffron); font-size: 0.8rem; font-weight: 700; padding: 6px 16px; cursor: pointer;">
            📲 Install Nirmaan App
          </button>
          <a href="https://github.com/ayushjha16012005-lgtm/nirmaan1/releases/latest/download/Nirmaan.apk" class="radius-pill" style="background: #24292e; border: 1.5px solid #24292e; color: #ffffff; font-size: 0.8rem; font-weight: 700; padding: 6px 16px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
            <span>⬇️</span> Download APK (GitHub)
          </a>
        </div>
        <div style="font-size: 0.75rem; color: var(--text-light);">
          © ${new Date().getFullYear()} Nirmaan India. All rights reserved.
        </div>
      </div>
    </footer>
  `;

  const btn = container.querySelector("#btn-footer-install-app");
  if (btn) {
    btn.onclick = () => {
      showInstallPrompt();
    };
  }
}
