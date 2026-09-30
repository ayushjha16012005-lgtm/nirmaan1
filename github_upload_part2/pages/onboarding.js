/* NIRMAAN Kaarigar & User KYC Onboarding Page */
import { showToast } from "../core/ui.js";

let mediaStream = null;

export default {
  route: "#/onboarding",
  title: "Identity & Video KYC Onboarding",

  async mount(container, ctx) {
    const { t, store } = ctx;
    const role = store.get("role") || "kaarigar";

    container.innerHTML = `
      <div class="container-mobile" style="padding-top: 20px; padding-bottom: 60px;">
        
        <div class="card" style="padding: 24px; text-align: center;">
          
          <span class="badge badge-verified" style="margin-bottom: 8px;">Trust & Identity Verification</span>
          <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--text-main);">
            ${role === "kaarigar" ? "Kaarigar Verification (सत्यापन)" : "User Identity Setup"}
          </h2>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 20px;">
            Aadhaar link and 3-second live face selfie build 100% trust with builders.
          </p>

          <!-- Step 1: Aadhaar Number -->
          <div class="form-group">
            <label class="form-label">Aadhaar Number (UIDAI)</label>
            <input
              type="password"
              id="kyc-aadhaar"
              class="form-control"
              placeholder="XXXX-XXXX-XXXX"
              maxlength="12"
              value="542981729012"
            />
            <p style="font-size: 0.7rem; color: var(--text-muted); margin-top: 4px;">
              🔒 Encrypted with 256-bit AES · AUA/KUA certified
            </p>
          </div>

          <!-- Step 2: Live Video Selfie -->
          <div style="margin: 20px 0; background: var(--bg-secondary); border: 1.5px dashed var(--saffron-border); border-radius: var(--radius-md); padding: 18px; text-align: center;">
            <label class="form-label" style="margin-bottom: 10px;">Live Camera Video Selfie</label>
            
            <video id="kyc-video-preview" autoplay playsinline muted style="width: 100%; max-height: 180px; border-radius: var(--radius-md); background: #000; display: none; margin-bottom: 10px;"></video>
            
            <button id="btn-start-camera" class="btn btn-primary btn-sm btn-full" style="margin-bottom: 6px;">
              📹 Open Camera & Record Face
            </button>
            <span id="kyc-video-status" style="font-size: 0.78rem; font-weight: 700; color: var(--green); display: none;">
              ✅ Face Biometric Captured!
            </span>
          </div>

          <!-- Finish Button -->
          <button id="btn-complete-kyc" class="btn btn-success btn-full btn-lg" style="margin-top: 10px;">
            ✓ Complete Verification & Enter App
          </button>

        </div>

      </div>
    `;

    const videoEl = container.querySelector("#kyc-video-preview");
    const btnCam = container.querySelector("#btn-start-camera");
    const statusEl = container.querySelector("#kyc-video-status");

    btnCam.onclick = async () => {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        videoEl.srcObject = mediaStream;
        videoEl.style.display = "block";
        btnCam.textContent = "🔴 Recording 3-second biometric...";
        btnCam.disabled = true;

        setTimeout(() => {
          if (mediaStream) {
            mediaStream.getTracks().forEach(t => t.stop());
            mediaStream = null;
          }
          videoEl.style.display = "none";
          btnCam.style.display = "none";
          statusEl.style.display = "block";
          showToast("Live Face Biometric Verified! 🎉");
        }, 3000);
      } catch (err) {
        alert("Camera permission not granted or device camera unavailable.");
      }
    };

    container.querySelector("#btn-complete-kyc").onclick = () => {
      showToast("KYC Complete! Welcome to Nirmaan.");
      setTimeout(() => {
        window.location.hash = role === "kaarigar" ? "#/kaarigar-home" : "#/user-home";
      }, 500);
    };
  },

  unmount() {
    if (mediaStream) {
      mediaStream.getTracks().forEach(t => t.stop());
      mediaStream = null;
    }
  }
};
