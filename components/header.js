/* NIRMAAN Header Component */
import { store } from "../core/store.js";
import { t } from "../core/i18n.js";
import { toggleTheme } from "../core/theme.js";
import { isLive } from "../services/supabase.js";
import { DEMO_PERSONAS } from "../data/personas.js";
import { escape } from "../core/ui.js";

export function renderHeader() {
  const container = document.getElementById("app-header");
  if (!container) return;

  const currentRole = store.get("role") || "user";
  const currentUser = store.get("user") || (isLive() ? null : DEMO_PERSONAS[currentRole]);
  const currentTheme = store.get("theme") || "light";
  const currentLang = store.get("lang") || "hi";
  const themeIcon = currentTheme === "dark" ? "☀️" : "🌙";
  const avatarInitials = currentUser?.avatarInitials || (currentRole === "kaarigar" ? "RY" : "AS");
  const roleEmoji = currentRole === "kaarigar" ? "👷" : "👤";
  const unreadCount = store.get("unreadNotifications") || 0;

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

      <!-- Controls (Role, Notifications, Lang, Theme, Account Switcher) -->
      <div class="nav-controls">
        
        <!-- Notification Bell (Phase 3c) -->
        <button class="user-switch-btn btn-icon nav-btn-compact" id="notif-bell-btn" title="Notifications" aria-label="Notifications" style="position:relative;">
          <span>🔔</span>
          ${unreadCount > 0 ? `
            <span class="notif-badge" style="position:absolute; top:-4px; right:-4px; background:var(--danger); color:white; border-radius:50%; width:18px; height:18px; font-size:0.65rem; font-weight:800; display:flex; align-items:center; justify-content:center;">
              ${unreadCount}
            </span>
          ` : ""}
        </button>

        <!-- Language Switcher -->
        <button class="user-switch-btn nav-btn-compact" id="lang-btn" title="Toggle Language" aria-label="Toggle Language" style="background:var(--saffron-glow); color:var(--saffron); border-color:var(--saffron-border);">
          <strong>${currentLang === "hi" ? "EN" : "हिं"}</strong>
        </button>

        <!-- Theme Toggle -->
        <button class="user-switch-btn btn-icon nav-btn-compact" id="theme-btn" title="Toggle Theme" aria-label="Toggle Theme">
          <span>${themeIcon}</span>
        </button>

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

  // Notification Bell Click
  const notifBtn = container.querySelector("#notif-bell-btn");
  if (notifBtn) {
    notifBtn.onclick = () => openNotificationDropdown();
  }

  // Account Switcher Bottom Sheet
  const avatarBtn = container.querySelector("#account-avatar-btn");
  if (avatarBtn) {
    avatarBtn.onclick = () => openAccountBottomSheet();
  }
}

function openNotificationDropdown() {
  const existingModal = document.getElementById("notif-dropdown-modal");
  if (existingModal) {
    existingModal.remove();
    return;
  }

  const notifications = store.get("notifications") || [];
  const modal = document.createElement("div");
  modal.id = "notif-dropdown-modal";
  modal.className = "account-sheet-backdrop";

  modal.innerHTML = `
    <div class="account-sheet" style="max-height: 80vh; overflow-y: auto;">
      <div class="account-sheet-header">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-main); margin: 0;">
          🔔 Notifications (${notifications.length})
        </h3>
        <button id="close-notif-btn" style="background:none; border:none; font-size:1.4rem; color:var(--text-muted); cursor:pointer;">✕</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 14px;">
        ${notifications.length === 0 ? `
          <div style="text-align: center; padding: 30px 16px; color: var(--text-muted);">
            <p style="font-size: 1.8rem; margin-bottom: 6px;">🔕</p>
            <p style="font-weight: 600;">No new notifications</p>
          </div>
        ` : notifications.map(n => `
          <div class="card card-clickable" style="padding: 12px 14px; background: var(--bg-secondary); border-left: 3px solid var(--saffron);" onclick="if('${n.link || ""}') window.location.hash='${n.link}'; document.getElementById('notif-dropdown-modal')?.remove();">
            <div style="font-weight: 800; font-size: 0.9rem; color: var(--text-main);">${escape(n.title)}</div>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">${escape(n.body)}</p>
            <span style="font-size: 0.68rem; color: var(--text-light);">${new Date(n.created_at || Date.now()).toLocaleTimeString()}</span>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.querySelector("#close-notif-btn").onclick = () => modal.remove();
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
}

function openAccountBottomSheet() {
  const existingSheet = document.getElementById("account-sheet-modal");
  if (existingSheet) existingSheet.remove();

  const user = store.get("user");
  const currentRole = store.get("role") || "user";
  const hasCustomer = isLive() ? Boolean(user && user.hasCustomerProfile) : true;
  const hasWorker = isLive() ? Boolean(user && user.hasWorkerProfile) : true;

  const modal = document.createElement("div");
  modal.id = "account-sheet-modal";
  modal.className = "account-sheet-backdrop";

  const customerName = user ? (user.name || "Customer") : DEMO_PERSONAS.user.name;
  const customerPhone = user ? (user.phone || "") : DEMO_PERSONAS.user.phone;
  const workerName = user ? (user.workerData?.name || user.name || "Kaarigar") : DEMO_PERSONAS.kaarigar.name;
  const workerPhone = user ? (user.phone || "") : DEMO_PERSONAS.kaarigar.phone;

  modal.innerHTML = `
    <div class="account-sheet">
      <div class="account-sheet-header">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-main); margin: 0;">
          🔄 ${t("switcher.title")}
        </h3>
        <button id="close-sheet-btn" style="background:none; border:none; font-size:1.4rem; color:var(--text-muted); cursor:pointer; padding:4px 8px;">✕</button>
      </div>

      <!-- Customer Persona Card -->
      <div class="account-card-option ${currentRole === "user" ? "active-account" : ""}" id="opt-customer" style="cursor: pointer;">
        <div style="width:44px; height:44px; border-radius:50%; background:var(--saffron-glow); color:var(--saffron); display:flex; align-items:center; justify-content:center; font-size:1.3rem; font-weight:800; border:1.5px solid var(--saffron);">
          👤
        </div>
        <div style="flex:1;">
          <div style="font-weight:800; font-size:0.95rem; color:var(--text-main);">
            ${t("switcher.customerRole")} — ${escape(customerName)}
          </div>
          <div style="font-size:0.78rem; color:var(--text-muted);">
            ${customerPhone ? escape(customerPhone) : "Noida Sector 62"}
          </div>
          <div style="font-size:0.75rem; color:var(--saffron); font-weight:600; margin-top:2px;">
            ${t("switcher.customerDesc")}
          </div>
        </div>
        ${currentRole === "user" ? `
          <span class="account-card-badge">✓ ${t("switcher.active")}</span>
        ` : (hasCustomer ? `
          <button class="btn btn-secondary btn-sm" id="btn-switch-to-user">Switch</button>
        ` : `
          <a href="#/onboarding?role=user" class="btn btn-primary btn-sm" onclick="document.getElementById('account-sheet-modal')?.remove();">Activate</a>
        `)}
      </div>

      <!-- Kaarigar Persona Card -->
      <div class="account-card-option ${currentRole === "kaarigar" ? "active-account" : ""}" id="opt-kaarigar" style="cursor: pointer;">
        <div style="width:44px; height:44px; border-radius:50%; background:var(--green-glow); color:var(--green); display:flex; align-items:center; justify-content:center; font-size:1.3rem; font-weight:800; border:1.5px solid var(--green);">
          👷
        </div>
        <div style="flex:1;">
          <div style="font-weight:800; font-size:0.95rem; color:var(--text-main);">
            ${t("switcher.kaarigarRole")} — ${escape(workerName)}
          </div>
          <div style="font-size:0.78rem; color:var(--text-muted);">
            ${workerPhone ? escape(workerPhone) : "Senior Raj Mistri"}
          </div>
          <div style="font-size:0.75rem; color:var(--green); font-weight:600; margin-top:2px;">
            ${t("switcher.kaarigarDesc")}
          </div>
        </div>
        ${currentRole === "kaarigar" ? `
          <span class="account-card-badge">✓ ${t("switcher.active")}</span>
        ` : (hasWorker ? `
          <button class="btn btn-secondary btn-sm" id="btn-switch-to-worker">Switch</button>
        ` : `
          <a href="#/onboarding?role=kaarigar" class="btn btn-primary btn-sm" onclick="document.getElementById('account-sheet-modal')?.remove();">Become Kaarigar</a>
        `)}
      </div>

      ${!isLive() ? `
        <p style="font-size: 0.72rem; color: var(--text-muted); text-align: center; margin: 8px 0 14px;">
          ℹ️ ${t("switcher.demoNotice")}
        </p>
      ` : ""}

      <button id="sheet-logout-btn" class="btn btn-secondary btn-full" style="color:var(--danger); border-color:var(--border-light); margin-top: 10px;">
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

  modal.querySelector("#opt-customer").onclick = (e) => {
    if (e.target.tagName === "A") return;
    closeModal();
    if (currentRole !== "user") {
      if (hasCustomer) {
        store.switchRole("user");
      } else {
        window.location.hash = "#/onboarding?role=user";
      }
    }
  };

  modal.querySelector("#opt-kaarigar").onclick = (e) => {
    if (e.target.tagName === "A") return;
    closeModal();
    if (currentRole !== "kaarigar") {
      if (hasWorker) {
        store.switchRole("kaarigar");
      } else {
        window.location.hash = "#/onboarding?role=kaarigar";
      }
    }
  };

  modal.querySelector("#sheet-logout-btn").onclick = () => {
    closeModal();
    store.signOut();
  };
}
