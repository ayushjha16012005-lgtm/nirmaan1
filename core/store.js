/* NIRMAAN Tiny Pub/Sub Store with Real Supabase Session Sync */
import { DEMO_PERSONAS, getPersona } from "../data/personas.js";
import { supabase, isLive } from "../services/supabase.js";

class Store {
  constructor() {
    const initialRole = localStorage.getItem("nirmaan_role") || "user";
    this.state = {
      role: initialRole, // 'user' | 'kaarigar' | 'admin'
      user: this.loadLocalUser(initialRole),
      session: null,
      authInitialized: false,
      lang: localStorage.getItem("nirmaan_lang") || "hi",
      theme: localStorage.getItem("nirmaan_theme") || "light",
      introSeen: localStorage.getItem("nirmaan_intro_seen") === "true",
      filters: { trade: "all", radius: 5, rating: 0 },
      activeJob: null,
      demoMode: !isLive()
    };
    this.listeners = new Map();
  }

  loadLocalUser(role = "user") {
    try {
      const saved = localStorage.getItem("nirmaan_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && parsed.id !== "u-default") {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("User load failed", e);
    }
    return isLive() ? null : getPersona(role);
  }

  async initAuth() {
    if (!isLive()) {
      this.state.authInitialized = true;
      return;
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (session?.user) {
        this.state.session = session;
        await this.loadUserProfile(session.user.id, session.user.phone);
      } else {
        this.state.session = null;
        this.set("user", null);
      }

      // Listen to continuous auth state changes
      supabase.auth.onAuthStateChange(async (event, currentSession) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          if (currentSession?.user) {
            this.state.session = currentSession;
            await this.loadUserProfile(currentSession.user.id, currentSession.user.phone);
          }
        } else if (event === "SIGNED_OUT") {
          this.state.session = null;
          this.set("user", null);
          localStorage.removeItem("nirmaan_user");
          if (window.location.hash !== "#/auth" && window.location.hash !== "#/") {
            window.location.hash = "#/auth";
          }
        }
      });
    } catch (err) {
      console.warn("Failed to initialize Supabase auth session:", err);
    } finally {
      this.state.authInitialized = true;
    }
  }

  async loadUserProfile(userId, userPhone = null) {
    if (!isLive()) return null;

    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*, worker_profiles(*)")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.warn("Error fetching user profile:", error);
      }

      if (profile) {
        const hasWorker = Boolean(
          profile.worker_profiles && 
          (Array.isArray(profile.worker_profiles) ? profile.worker_profiles.length > 0 : profile.worker_profiles.id)
        );
        const workerData = Array.isArray(profile.worker_profiles) ? profile.worker_profiles[0] : profile.worker_profiles;

        const userData = {
          id: profile.id,
          phone: profile.phone || userPhone,
          name: profile.full_name || "Nirmaan User",
          avatarUrl: profile.avatar_url,
          avatarInitials: (profile.full_name || "NU").split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase(),
          role: profile.active_role || "user",
          city: profile.city || "Noida",
          sector: profile.sector || "Sector 62",
          isAdmin: Boolean(profile.is_admin),
          isSeed: Boolean(profile.is_seed),
          hasCustomerProfile: true,
          hasWorkerProfile: hasWorker,
          workerData: workerData || null,
          needsOnboarding: false
        };

        this.set("user", userData);
        this.set("role", userData.role);
        return userData;
      } else {
        // Authenticated user has no profile row yet
        const pendingUser = {
          id: userId,
          phone: userPhone,
          role: this.state.role || "user",
          needsOnboarding: true
        };
        this.set("user", pendingUser);
        return pendingUser;
      }
    } catch (err) {
      console.error("loadUserProfile error:", err);
      return null;
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
      if (key === "user") {
        if (value) {
          localStorage.setItem("nirmaan_user", JSON.stringify(value));
        } else {
          localStorage.removeItem("nirmaan_user");
        }
      }
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

  async switchRole(newRole) {
    const role = (newRole === "kaarigar") ? "kaarigar" : "user";
    const currentUser = this.get("user");

    if (isLive() && currentUser?.id) {
      // Check if user needs kaarigar onboarding before switching
      if (role === "kaarigar" && !currentUser.hasWorkerProfile) {
        window.location.hash = "#/onboarding";
        return;
      }

      // Update active_role in profiles table
      try {
        await supabase
          .from("profiles")
          .update({ active_role: role })
          .eq("id", currentUser.id);
      } catch (err) {
        console.warn("Could not persist active_role:", err);
      }

      const updated = { ...currentUser, role };
      this.set("role", role);
      this.set("user", updated);
    } else {
      const persona = getPersona(role);
      this.set("role", role);
      this.set("user", persona);
    }

    // Notify UI components
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("nirmaan:role-changed", { detail: { role } }));
      const targetHash = role === "kaarigar" ? "#/kaarigar-home" : "#/user-home";
      if (window.location.hash !== targetHash) {
        window.location.hash = targetHash;
      }
    }
  }

  async signOut() {
    try {
      if (isLive()) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn("Sign out exception:", err);
    }

    this.state.session = null;
    this.set("user", null);
    localStorage.removeItem("nirmaan_user");
    sessionStorage.removeItem("nirmaan_redirect_after_login");
    window.location.hash = "#/auth";
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
