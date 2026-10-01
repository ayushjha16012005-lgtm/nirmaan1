/* NIRMAAN Tiny Pub/Sub Store */
import { DEMO_PERSONAS, getPersona } from "../data/personas.js";

class Store {
  constructor() {
    const initialRole = localStorage.getItem("nirmaan_role") || "user";
    this.state = {
      role: initialRole, // 'user' | 'kaarigar' | 'admin'
      user: this.loadUser(initialRole),
      lang: localStorage.getItem("nirmaan_lang") || "hi",
      theme: localStorage.getItem("nirmaan_theme") || "light",
      introSeen: localStorage.getItem("nirmaan_intro_seen") === "true",
      filters: { trade: "all", radius: 5, rating: 0 },
      activeJob: null,
      demoMode: true
    };
    this.listeners = new Map();
  }

  loadUser(role = "user") {
    try {
      const saved = localStorage.getItem("nirmaan_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure user belongs to the active role persona and not stale "Guest User"
        if (parsed && parsed.id && parsed.id !== "u-default" && parsed.role === role) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("User load failed", e);
    }
    return getPersona(role);
  }

  get(key) {
    return this.state[key];
  }

  set(key, value) {
    this.state[key] = value;

    // Persist designated keys safely
    try {
      if (key === "lang") localStorage.setItem("nirmaan_lang", value);
      if (key === "theme") localStorage.setItem("nirmaan_theme", value);
      if (key === "role") localStorage.setItem("nirmaan_role", value);
      if (key === "introSeen") localStorage.setItem("nirmaan_intro_seen", String(value));
      if (key === "user") localStorage.setItem("nirmaan_user", JSON.stringify(value));
    } catch (e) {
      console.warn("Storage write failed", e);
    }

    // Trigger subscribers
    if (this.listeners.has(key)) {
      this.listeners.get(key).forEach(fn => fn(value, this.state));
    }
    if (this.listeners.has("*")) {
      this.listeners.get("*").forEach(fn => fn(key, value, this.state));
    }
  }

  switchRole(newRole) {
    const role = (newRole === "kaarigar") ? "kaarigar" : "user";
    const persona = getPersona(role);

    this.set("role", role);
    this.set("user", persona);

    // Notify UI components without requiring full page reload
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("nirmaan:role-changed", { detail: { role, user: persona } }));
      const targetHash = role === "kaarigar" ? "#/kaarigar-home" : "#/user-home";
      if (window.location.hash !== targetHash) {
        window.location.hash = targetHash;
      }
    }
  }

  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
    return () => this.listeners.get(key).delete(callback);
  }
}

export const store = new Store();
