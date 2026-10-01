/* NIRMAAN Privacy Policy & Terms of Service */
import { renderBottomNav } from "../components/bottom-nav.js";
import { escape } from "../core/ui.js";

export default {
  route: "#/privacy",
  title: "Privacy & Terms",

  async mount(container, ctx) {
    const { t } = ctx;
    renderBottomNav();

    const isTerms = window.location.hash.includes("terms");

    container.innerHTML = `
      <div class="container-mobile" style="padding-top: 16px; padding-bottom: 70px;">
        
        <div style="display: flex; gap: 10px; margin-bottom: 16px;">
          <a href="#/privacy" class="btn ${!isTerms ? "btn-primary" : "btn-secondary"} btn-sm" style="flex: 1;">
            Privacy Policy
          </a>
          <a href="#/terms" class="btn ${isTerms ? "btn-primary" : "btn-secondary"} btn-sm" style="flex: 1;">
            Terms of Service
          </a>
        </div>

        <div class="card" style="padding: 24px; line-height: 1.6; font-size: 0.9rem;">
          ${!isTerms ? `
            <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--text-main); margin-bottom: 12px;">
              Privacy Policy (गोपनीयता नीति)
            </h2>
            <p style="color: var(--text-muted); font-size: 0.82rem; margin-bottom: 18px;">
              Effective Date: October 1, 2026 · Plain & Honest Disclosure
            </p>

            <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--saffron); margin-top: 16px; margin-bottom: 6px;">
              1. Information We Collect
            </h3>
            <p style="color: var(--text-main); margin-bottom: 12px;">
              We collect your <strong>mobile phone number</strong> to authenticate your account via SMS OTP. If you create a profile, we store your full name, location (city/sector), trade skills, and service radius. We do NOT collect or store Aadhaar numbers or government biometric IDs.
            </p>

            <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--saffron); margin-top: 16px; margin-bottom: 6px;">
              2. Realtime Location Sharing
            </h3>
            <p style="color: var(--text-main); margin-bottom: 12px;">
              When a Kaarigar sets a job status to <em>On the Way</em> or <em>Arrived</em>, their device GPS coordinates are published over encrypted Supabase Realtime channels strictly to the hiring customer. Tracking stops automatically once the job begins.
            </p>

            <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--saffron); margin-top: 16px; margin-bottom: 6px;">
              3. Data Storage & Security
            </h3>
            <p style="color: var(--text-main); margin-bottom: 12px;">
              User profiles and job records are securely stored on Supabase PostgreSQL with Row Level Security (RLS) policies. Only authorized parties can access booking details and private photo proofs.
            </p>

            <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--saffron); margin-top: 16px; margin-bottom: 6px;">
              4. Data Deletion
            </h3>
            <p style="color: var(--text-main); margin-bottom: 12px;">
              You have the right to delete your profile and associated data at any time. Simply tap the <strong>Request Account & Data Deletion</strong> button on your Profile page.
            </p>
          ` : `
            <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--text-main); margin-bottom: 12px;">
              Terms of Service (सेवा की शर्तें)
            </h2>
            <p style="color: var(--text-muted); font-size: 0.82rem; margin-bottom: 18px;">
              Effective Date: October 1, 2026
            </p>

            <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--saffron); margin-top: 16px; margin-bottom: 6px;">
              1. Platform Nature
            </h3>
            <p style="color: var(--text-main); margin-bottom: 12px;">
              Nirmaan is a direct peer-to-peer digital platform connecting independent construction workers (Kaarigars) directly with customers and builders. Nirmaan eliminates middleman contractor commissions.
            </p>

            <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--saffron); margin-top: 16px; margin-bottom: 6px;">
              2. Payments & Escrow Mechanism
            </h3>
            <p style="color: var(--text-main); margin-bottom: 12px;">
              Funds locked for a booking are held securely until the customer verifies the completed work. In test mode, transactions simulate the real escrow lifecycle without real monetary deductions.
            </p>

            <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--saffron); margin-top: 16px; margin-bottom: 6px;">
              3. Site Safety & Mutual Respect
            </h3>
            <p style="color: var(--text-main); margin-bottom: 12px;">
              All users agree to fair treatment, timely settlement of wages, adherence to basic safety standards on construction sites, and truthfulness in identity and skills.
            </p>
          `}

          <div style="margin-top: 24px; text-align: center;">
            <a href="#/" class="btn btn-secondary btn-sm">← Back to App</a>
          </div>

        </div>

      </div>
    `;
  },

  unmount() {}
};
