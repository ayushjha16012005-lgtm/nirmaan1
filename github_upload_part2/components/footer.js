/* NIRMAAN Footer Component */
import { t } from "../core/i18n.js";

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
        <p style="font-size: 0.78rem; color: var(--text-muted); max-width: 500px; margin: 0 auto 16px;">
          India's direct construction labour ecosystem — Verified Kaarigars, Protected Escrow, Zero Middleman.
        </p>
        <div style="font-size: 0.75rem; color: var(--text-light);">
          © ${new Date().getFullYear()} Nirmaan India. All rights reserved.
        </div>
      </div>
    </footer>
  `;
}
