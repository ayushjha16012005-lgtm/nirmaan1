/* NIRMAAN UI Helpers (Toast, Modal, Escape, Formatting, Offline, Skeletons) */

export function escape(str) {
  if (str == null) return "";
  if (typeof str !== "string") str = String(str);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function showToast(message, duration = 3500) {
  let container = document.getElementById("toast-root");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-root";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Consistent INR Currency Formatter
export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(num);
}

// Consistent IST Date Formatter
export function formatDateIST(dateStr, options = {}) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options
  }).format(date);
}

// Global Non-Intrusive Offline Banner
export function initOfflineBanner() {
  let banner = document.getElementById("nirmaan-offline-banner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "nirmaan-offline-banner";
    banner.style.cssText = "position:fixed; top:0; left:0; width:100%; z-index:99999; font-size:0.82rem; font-weight:700; text-align:center; padding:7px 12px; transition:transform 0.3s ease; display:none; box-shadow:0 2px 8px rgba(0,0,0,0.2);";
    document.body.prepend(banner);
  }

  function updateStatus() {
    if (!navigator.onLine) {
      banner.style.display = "block";
      banner.style.background = "#b91c1c";
      banner.style.color = "#ffffff";
      banner.innerHTML = "📡 Working offline. Changes are saved locally and will sync when reconnected.";
    } else {
      if (banner.style.display === "block") {
        banner.style.background = "#2d6a4f";
        banner.style.color = "#ffffff";
        banner.innerHTML = "🟢 Reconnected to network. System online.";
        setTimeout(() => {
          banner.style.display = "none";
        }, 2500);
      }
    }
  }

  window.addEventListener("online", updateStatus);
  window.addEventListener("offline", updateStatus);
  if (!navigator.onLine) updateStatus();
}

// Reusable Skeleton Loader HTML
export function renderSkeletonCard(count = 2) {
  return Array.from({ length: count }).map(() => `
    <div class="card" style="padding: 16px; margin-bottom: 12px; border: 1px solid var(--border-light); animation: nirmaanPulse 1.5s infinite ease-in-out;">
      <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 12px;">
        <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--border-light);"></div>
        <div style="flex: 1;">
          <div style="width: 50%; height: 16px; background: var(--border-light); border-radius: 4px; margin-bottom: 6px;"></div>
          <div style="width: 30%; height: 12px; background: var(--border-light); border-radius: 4px;"></div>
        </div>
      </div>
      <div style="width: 85%; height: 12px; background: var(--border-light); border-radius: 4px; margin-bottom: 8px;"></div>
      <div style="width: 60%; height: 12px; background: var(--border-light); border-radius: 4px;"></div>
    </div>
  `).join("");
}

// Reusable Empty State HTML
export function renderEmptyState({ icon = "🔍", title, description, actionText, actionHref }) {
  return `
    <div class="card" style="text-align: center; padding: 36px 20px; border: 1.5px dashed var(--border-light); background: var(--bg-card); margin: 16px 0;">
      <div style="font-size: 2.4rem; margin-bottom: 12px;">${icon}</div>
      <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-main); margin-bottom: 6px;">
        ${escape(title)}
      </h3>
      <p style="font-size: 0.85rem; color: var(--text-muted); max-width: 360px; margin: 0 auto 18px; line-height: 1.4;">
        ${escape(description)}
      </p>
      ${actionText && actionHref ? `
        <a href="${escape(actionHref)}" class="btn btn-primary btn-sm" style="display: inline-block; font-weight: 700;">
          ${escape(actionText)}
        </a>
      ` : ""}
    </div>
  `;
}

// Reusable Error State HTML with Retry
export function renderErrorState(message, retryCallbackName) {
  return `
    <div class="card" style="padding: 20px; text-align: center; border: 1.5px solid rgba(220, 38, 38, 0.3); background: rgba(220, 38, 38, 0.04); margin: 16px 0;">
      <span style="font-size: 1.8rem; display: block; margin-bottom: 6px;">⚠️</span>
      <h4 style="font-size: 1rem; font-weight: 800; color: var(--red); margin-bottom: 4px;">Unable to load data</h4>
      <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 14px;">${escape(message)}</p>
      ${retryCallbackName ? `
        <button onclick="${escape(retryCallbackName)}()" class="btn btn-secondary btn-sm" style="font-weight: 700;">
          🔄 Retry Connection
        </button>
      ` : `
        <button onclick="window.location.reload()" class="btn btn-secondary btn-sm" style="font-weight: 700;">
          🔄 Reload Page
        </button>
      `}
    </div>
  `;
}
