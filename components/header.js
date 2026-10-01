/* NIRMAAN Header Component */
import { store } from "../core/store.js";
import { t } from "../core/i18n.js";
import { toggleTheme } from "../core/theme.js";
import { DEMO_PERSONAS } from "../data/personas.js";

export function renderHeader() {
  const container = document.getElementById("app-header");
  if (!container) return;

  const currentRole = store.get("role") || "user";
  const currentUser = store.get("user") || DEMO_PERSONAS[currentRole];
  const currentTheme = store.get("theme") || "light";
  const currentLang = store.get("lang") || "hi";
  const themeIcon = currentTheme === "dark" ? "☀️" : "🌙";
  const avatarInitials = currentUser?.avatarInitials || (currentRole === "kaarigar" ? "RY" : "AS");
  const roleEmoji = currentRole === "kaarigar" ? "👷" : "👤";

  container.innerHTML = `
    <nav>
      <a href="#/" class="logo">
        <div class="logo-icon">
          <svg width="28" height="28" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <line x1="20" y1="105" x2="100" y2="38" stroke="#E8621A" stroke-width="16" stroke-linecap="round"/>
            <polyline points="100,38 155,80 155,65 168,65 168,92 180,105" fill="none" stroke="#E8621A" stroke-width="16" stroke-linecap="round" stroke-linejoin="miter"/>
            <line x1="55" y1="105" x2="55" y2="175" stroke="#E8621A" stroke-width="16" stroke-linecap="round"/>
            <line x1="55" y1="105" x2="145" y2="175" stroke="#E8621A" stroke-width="16" stroke-linecap="round"/>
            <line x1="145" y1="105" x2="145" y2="175" stroke="#E8621A" stroke-width="16" stroke-linecap="round"/>
          </svg>
        </div>
        <span class="logo-text">Nirmaan</span>
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

      <!-- Controls (Role, Lang, Theme, Account Switcher) -->
      <div class="nav-controls">
        <!-- Language Switcher -->
        <button class="user-switch-btn nav-btn-compact" id="lang-btn" title="Toggle Language" aria-label="Toggle Language" style="background:var(--saffron-glow); color:var(--saffron); border-color:var(--saffron-border);">
          <strong>${currentLang === "hi" ? "EN" : "हिं"}</strong>
        </button>

        <!-- Theme Toggle -->
        <button class="user-switch-btn btn-icon nav-btn-compact" id="theme-btn" title="Toggle Theme" aria-label="Toggle Theme">
          <span>${themeIcon}</span>
        </button>

        <!-- Desktop Role Switcher -->
        <select class="user-switch-btn desktop-only" id="role-select" title="Switch Role" aria-label="Select Role" style="cursor:pointer;">
          <option value="user" ${currentRole === "user" ? "selected" : ""}>👤 ${t("role.user")}</option>
          <option value="kaarigar" ${currentRole === "kaarigar" ? "selected" : ""}>👷 ${t("role.kaarigar")}</option>
        </select>

        <!-- Account Switcher Avatar Button -->
        <button class="account-avatar-btn" id="account-avatar-btn" title="Switch Account" aria-label="Switch Account">
          <span class="avatar-badge-role">${roleEmoji}</span>
          <span class="avatar-initials">${avatarInitials}</span>
        </button>
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
      store.switchRole(newRole);
      renderHeader();
    };
  }

  // Account Switcher Bottom Sheet
  const avatarBtn = container.querySelector("#account-avatar-btn");
  if (avatarBtn) {
    avatarBtn.onclick = () => openAccountBottomSheet();
  }
}

function openAccountBottomSheet() {
  const existingSheet = document.getElementById("account-sheet-modal");
  if (existingSheet) existingSheet.remove();

  const currentRole = store.get("role") || "user";
  const lang = store.get("lang") || "hi";

  const modal = document.createElement("div");
  modal.id = "account-sheet-modal";
  modal.className = "account-sheet-backdrop";

  modal.innerHTML = `
    <div class="account-sheet">
      <div class="account-sheet-header">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-main); margin: 0;">
          🔄 ${t("switcher.title")}
        </h3>
        <button id="close-sheet-btn" style="background:none; border:none; font-size:1.4rem; color:var(--text-muted); cursor:pointer; padding:4px 8px;">✕</button>
      </div>

      <!-- Customer Persona Card -->
      <div class="account-card-option ${currentRole === "user" ? "active-account" : ""}" id="opt-customer">
        <div style="width:44px; height:44px; border-radius:50%; background:var(--saffron-glow); color:var(--saffron); display:flex; align-items:center; justify-content:center; font-size:1.3rem; font-weight:800; border:1.5px solid var(--saffron);">
          👤
        </div>
        <div style="flex:1;">
          <div style="font-weight:800; font-size:0.95rem; color:var(--text-main);">
            ${t("switcher.customerRole")} — Aman Sharma
          </div>
          <div style="font-size:0.78rem; color:var(--text-muted);">
            ${DEMO_PERSONAS.user.phone} · Noida Sector 62
          </div>
          <div style="font-size:0.75rem; color:var(--saffron); font-weight:600; margin-top:2px;">
            ${t("switcher.customerDesc")}
          </div>
        </div>
        ${currentRole === "user" ? `
          <span class="account-card-badge">✓ ${t("switcher.active")}</span>
        ` : ""}
      </div>

      <!-- Kaarigar Persona Card -->
      <div class="account-card-option ${currentRole === "kaarigar" ? "active-account" : ""}" id="opt-kaarigar">
        <div style="width:44px; height:44px; border-radius:50%; background:var(--green-glow); color:var(--green); display:flex; align-items:center; justify-content:center; font-size:1.3rem; font-weight:800; border:1.5px solid var(--green);">
          👷
        </div>
        <div style="flex:1;">
          <div style="font-weight:800; font-size:0.95rem; color:var(--text-main);">
            ${t("switcher.kaarigarRole")} — Ramesh Yadav
          </div>
          <div style="font-size:0.78rem; color:var(--text-muted);">
            ${DEMO_PERSONAS.kaarigar.phone} · Senior Raj Mistri
          </div>
          <div style="font-size:0.75rem; color:var(--green); font-weight:600; margin-top:2px;">
            ${t("switcher.kaarigarDesc")}
          </div>
        </div>
        ${currentRole === "kaarigar" ? `
          <span class="account-card-badge">✓ ${t("switcher.active")}</span>
        ` : ""}
      </div>

      <p style="font-size: 0.72rem; color: var(--text-muted); text-align: center; margin: 8px 0 14px;">
        ℹ️ ${t("switcher.demoNotice")}
      </p>

      <button id="sheet-logout-btn" class="btn btn-secondary btn-full" style="color:var(--danger); border-color:var(--border-light);">
        🚪 ${t("profile.logout")}
      </button>
    </div>
  `;

  document.body.appendChild(modal);

  const closeModal = () => modal.remove();

  modal.querySelector("#close-sheet-btn").onclick = closeModal;
  modal.onclick = (e) => {
    if (e.target === modal) closeModal();
  };

  modal.querySelector("#opt-customer").onclick = () => {
    closeModal();
    if (currentRole !== "user") {
      store.switchRole("user");
      renderHeader();
    }
  };

  modal.querySelector("#opt-kaarigar").onclick = () => {
    closeModal();
    if (currentRole !== "kaarigar") {
      store.switchRole("kaarigar");
      renderHeader();
    }
  };

  modal.querySelector("#sheet-logout-btn").onclick = () => {
    closeModal();
    store.set("introSeen", false);
    window.location.hash = "#/";
  };
}
