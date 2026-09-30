/* NIRMAAN Splash & Role Selection Page */
import { renderBottomNav } from "../components/bottom-nav.js";

export default {
  route: "#/",
  title: "Welcome to Nirmaan",

  async mount(container, ctx) {
    const { t, store } = ctx;
    renderBottomNav();

    container.innerHTML = `
      <div class="container-mobile" style="min-height: calc(100vh - 120px); display: flex; flex-direction: column; justify-content: space-between; padding-top: 20px; text-align: center;">

        <!-- Brand Hero -->
        <div style="margin-top: 10px;">
          <div style="width: 80px; height: 80px; margin: 0 auto 16px; background: var(--saffron-glow); border-radius: 24px; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm);">
            <svg width="48" height="48" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <line x1="20" y1="105" x2="100" y2="38" stroke="#E8621A" stroke-width="18" stroke-linecap="round"/>
              <polyline points="100,38 155,80 155,65 168,65 168,92 180,105" fill="none" stroke="#E8621A" stroke-width="18" stroke-linecap="round" stroke-linejoin="miter"/>
              <line x1="55" y1="105" x2="55" y2="175" stroke="#E8621A" stroke-width="18" stroke-linecap="round"/>
              <line x1="55" y1="105" x2="145" y2="175" stroke="#E8621A" stroke-width="18" stroke-linecap="round"/>
              <line x1="145" y1="105" x2="145" y2="175" stroke="#E8621A" stroke-width="18" stroke-linecap="round"/>
            </svg>
          </div>

          <h1 style="font-size: 2.2rem; font-weight: 800; color: var(--saffron); letter-spacing: -0.5px; line-height: 1.1;">
            NIRMAAN
          </h1>
          <p style="font-size: 1rem; font-weight: 700; color: var(--text-main); margin-top: 6px;">
            ${t("brand.tagline")}
          </p>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
            ${t("brand.sub")}
          </p>
        </div>

        <!-- Worker Visual -->
        <div style="margin: 24px auto; width: 100%; max-width: 320px; border-radius: 24px; overflow: hidden; box-shadow: var(--shadow-md); border: 2px solid var(--border-light); background: var(--bg-card);">
          <img
            src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80"
            alt="Nirmaan Kaarigar"
            style="width: 100%; height: 210px; object-fit: cover; display: block;"
          />
          <div style="padding: 12px; background: var(--bg-secondary); font-size: 0.82rem; font-weight: 700; color: var(--saffron);">
            🤝 काम मिलेगा, सम्मान मिलेगा · सीधा रोज़गार, सुरक्षित भुगतान
          </div>
        </div>

        <!-- Role Selection Cards -->
        <div style="margin-bottom: 24px; display: flex; flex-direction: column; gap: 14px;">
          <p style="font-size: 0.9rem; font-weight: 700; color: var(--text-muted);">
            ${t("auth.chooseRole")}
          </p>

          <!-- User Choice -->
          <button id="btn-choose-user" class="btn btn-primary btn-lg btn-full" style="padding: 16px; font-size: 1.1rem; box-shadow: var(--shadow-saffron);">
            👤 ${t("role.user")}
            <span style="font-size: 0.8rem; opacity: 0.9; display: block; font-weight: 500;">(घर बनवाना है / कारीगर बुलाना है)</span>
          </button>

          <!-- Kaarigar Choice -->
          <button id="btn-choose-kaarigar" class="btn btn-secondary btn-lg btn-full" style="padding: 16px; font-size: 1.1rem; border: 2px solid var(--saffron); color: var(--saffron); background: var(--bg-primary);">
            👷 ${t("role.kaarigar")}
            <span style="font-size: 0.8rem; color: var(--text-muted); display: block; font-weight: 500;">(काम चाहिए / दैनिक कमाई व योजनाएं)</span>
          </button>
        </div>

      </div>
    `;

    container.querySelector("#btn-choose-user").onclick = () => {
      store.set("role", "user");
      window.location.hash = "#/auth";
    };

    container.querySelector("#btn-choose-kaarigar").onclick = () => {
      store.set("role", "kaarigar");
      window.location.hash = "#/auth";
    };
  },

  unmount() {}
};
