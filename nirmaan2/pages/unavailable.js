import { renderBottomNav } from "../components/bottom-nav.js";
import { escape } from "../core/ui.js";

export default {
  async mount(container, ctx) {
    renderBottomNav();
    const hindi = ctx.store.get("lang") === "hi";
    const heading = hindi ? "यह सुविधा अभी उपलब्ध नहीं है" : "This feature is not available yet";
    const message = hindi
      ? "इस सुविधा की ज़रूरी सेवाएँ अभी जुड़ी नहीं हैं। अभी कोई बुकिंग, भुगतान या डेटा अपडेट नहीं किया जा सकता। निर्माण के स्वागत पृष्ठ पर वापस जाएँ।"
      : "The services needed for this feature are not connected yet. No bookings, payments, or data updates can be made here. You can still visit the Nirmaan welcome page.";

    container.innerHTML = `
      <section class="container-mobile" style="padding-top: 40px; padding-bottom: 90px;">
        <div class="card" role="status" style="padding: 28px; text-align: center;">
          <span class="badge badge-saffron">${escape(ctx.feature || "Nirmaan")}</span>
          <h1 style="font-size: 1.5rem; margin: 18px 0 12px;">${heading}</h1>
          <p style="color: var(--text-muted); margin-bottom: 24px;">${message}</p>
          <a href="#/" class="btn btn-primary">${hindi ? "स्वागत पृष्ठ पर जाएँ" : "Back to Home"}</a>
        </div>
      </section>
    `;
  },

  unmount() {}
};
