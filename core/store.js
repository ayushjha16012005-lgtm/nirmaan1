/* NIRMAAN Tiny Pub/Sub Store */

class Store {
  constructor() {
    this.state = {
      user: this.loadUser(),
      role: localStorage.getItem("nirmaan_role") || "user", // 'user' | 'kaarigar' | 'admin'
      lang: localStorage.getItem("nirmaan_lang") || "hi",
      theme: localStorage.getItem("nirmaan_theme") || "light",
      introSeen: localStorage.getItem("nirmaan_intro_seen") === "true",
      filters: { trade: "all", radius: 5, rating: 0 },
      activeJob: null,
      demoMode: true
    };
    this.listeners = new Map();
  }

  loadUser() {
    try {
      const saved = localStorage.getItem("nirmaan_user");
      return saved ? JSON.parse(saved) : { id: "u-default", name: "Guest User", phone: "+91 98765 43210", role: "user" };
    } catch {
      return { id: "u-default", name: "Guest User", phone: "+91 98765 43210", role: "user" };
    }
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

  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
    return () => this.listeners.get(key).delete(callback);
  }
}

export const store = new Store();
