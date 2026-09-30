/* NIRMAAN Header Component */
import { store } from "../core/store.js";
import { t } from "../core/i18n.js";
import { toggleTheme } from "../core/theme.js";

export function renderHeader() {
  const container = document.getElementById("app-header");
  if (!container) return;

  const currentRole = store.get("role") || "user";
  const currentTheme = store.get("theme") || "light";
  const currentLang = store.get("lang") || "hi";
  const themeIcon = currentTheme === "dark" ? "☀️" : "🌙";

  container.innerHTML = `
    <nav>
      <a href="#/" class="logo">
        <div class="logo-icon">
          <svg width="34" height="34" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <line x1="20" y1="105" x2="100" y2="38" stroke="#E8621A" stroke-width="16" stroke-linecap="round"/>
            <polyline points="100,38 155,80 155,65 168,65 168,92 180,105" fill="none" stroke="#E8621A" stroke-width="16" stroke-linecap="round" stroke-linejoin="miter"/>
            <line x1="55" y1="105" x2="55" y2="175" stroke="#E8621A" stroke-width="16" stroke-linecap="round"/>
            <line x1="55" y1="105" x2="145" y2="175" stroke="#E8621A" stroke-width="16" stroke-linecap="round"/>
            <line x1="145" y1="105" x2="145" y2="175" stroke="#E8621A" stroke-width="16" stroke-linecap="round"/>
          </svg>
        </div>
        <span>Nirmaan</span>
        <span class="logo-devanagari">निर्माण</span>
      </a>

      <!-- Desktop Nav Links -->
      <div class="nav-links">
        ${currentRole === "kaarigar" ? `
          <a href="#/kaarigar-home">🏠 ${t("nav.home")}</a>
          <a href="#/kaarigar-ai" style="color:var(--saffron); font-weight:800;">🎙️ ${t("nav.ai")}</a>
          <a href="#/kaarigar-profile">👤 ${t("nav.profile")}</a>
        ` : `
          <a href="#/user-home">🗺️ ${t("nav.find")}</a>
          <a href="#/projects">🏗️ ${t("nav.projects")}</a>
          <a href="#/kaarigar-ai" style="color:var(--saffron); font-weight:800;">🎙️ ${t("nav.ai")}</a>
          <a href="#/user-profile">👤 ${t("nav.profile")}</a>
        `}
      </div>

      <!-- Controls (Role, Lang, Theme) -->
      <div class="nav-controls">
        <!-- Language Switcher -->
        <button class="user-switch-btn" id="lang-btn" title="Toggle Language" style="background:var(--saffron-glow); color:var(--saffron); border-color:var(--saffron-border);">
          <strong>${currentLang === "hi" ? "EN" : "हिं"}</strong>
        </button>

        <!-- Theme Toggle -->
        <button class="user-switch-btn btn-icon" id="theme-btn" title="Toggle Theme">
          <span>${themeIcon}</span>
        </button>

        <!-- Quick Role Switcher -->
        <select class="user-switch-btn desktop-only" id="role-select" style="cursor:pointer;">
          <option value="user" ${currentRole === "user" ? "selected" : ""}>👤 ${t("role.user")}</option>
          <option value="kaarigar" ${currentRole === "kaarigar" ? "selected" : ""}>👷 ${t("role.kaarigar")}</option>
        </select>
      </div>
    </nav>
  `;

  // Bind Header actions
  container.querySelector("#lang-btn").onclick = () => {
    const nextLang = currentLang === "hi" ? "en" : "hi";
    store.set("lang", nextLang);
    renderHeader();
    window.location.reload();
  };

  container.querySelector("#theme-btn").onclick = () => {
    toggleTheme();
    renderHeader();
  };

  const roleSelect = container.querySelector("#role-select");
  if (roleSelect) {
    roleSelect.onchange = (e) => {
      const newRole = e.target.value;
      store.set("role", newRole);
      renderHeader();
      window.location.hash = newRole === "kaarigar" ? "#/kaarigar-home" : "#/user-home";
    };
  }
}
