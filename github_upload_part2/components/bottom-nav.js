/* NIRMAAN Bottom Navigation Component (Mobile First) */
import { store } from "../core/store.js";
import { t } from "../core/i18n.js";

export function renderBottomNav() {
  let navEl = document.getElementById("app-bottom-nav");
  if (!navEl) {
    navEl = document.createElement("div");
    navEl.id = "app-bottom-nav";
    document.body.appendChild(navEl);
  }

  const role = store.get("role") || "user";
  const currentHash = window.location.hash || "#/";

  if (currentHash === "#/" || currentHash === "#/auth" || currentHash === "#/onboarding") {
    navEl.innerHTML = "";
    return;
  }

  if (role === "kaarigar") {
    navEl.innerHTML = `
      <div class="bottom-nav">
        <a href="#/kaarigar-home" class="bottom-nav-item ${currentHash.includes("kaarigar-home") ? "active" : ""}">
          <span class="nav-icon">🏠</span>
          <span>${t("nav.home")}</span>
        </a>

        <a href="#/kaarigar-ai" class="bottom-nav-ai-center" title="Voice AI Assistant">
          🎙️
        </a>

        <a href="#/kaarigar-profile" class="bottom-nav-item ${currentHash.includes("kaarigar-profile") ? "active" : ""}">
          <span class="nav-icon">👤</span>
          <span>${t("nav.profile")}</span>
        </a>
      </div>
    `;
  } else {
    navEl.innerHTML = `
      <div class="bottom-nav">
        <a href="#/user-home" class="bottom-nav-item ${currentHash.includes("user-home") || currentHash.includes("find") ? "active" : ""}">
          <span class="nav-icon">🗺️</span>
          <span>${t("nav.find")}</span>
        </a>

        <a href="#/projects" class="bottom-nav-item ${currentHash.includes("projects") ? "active" : ""}">
          <span class="nav-icon">🏗️</span>
          <span>${t("nav.projects")}</span>
        </a>

        <a href="#/kaarigar-ai" class="bottom-nav-ai-center" title="Voice AI Assistant">
          🎙️
        </a>

        <a href="#/user-profile" class="bottom-nav-item ${currentHash.includes("user-profile") ? "active" : ""}">
          <span class="nav-icon">👤</span>
          <span>${t("nav.profile")}</span>
        </a>
      </div>
    `;
  }
}
