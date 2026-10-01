/* NIRMAAN Realtime Chat Modal for Job Bookings */
import { api } from "../services/api.js";
import { realtime } from "../services/realtime.js";
import { store } from "../core/store.js";
import { escape } from "../core/ui.js";

export function openChatModal(jobId, counterPartyName) {
  const existing = document.getElementById("job-chat-modal");
  if (existing) existing.remove();

  const user = store.get("user");
  const modal = document.createElement("div");
  modal.id = "job-chat-modal";
  modal.className = "account-sheet-backdrop";

  modal.innerHTML = `
    <div class="account-sheet" style="max-height: 85vh; display: flex; flex-direction: column;">
      
      <!-- Chat Header -->
      <div class="account-sheet-header" style="border-bottom: 1px solid var(--border-light); padding-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--saffron-glow); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; border: 1.5px solid var(--saffron);">
            💬
          </div>
          <div>
            <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--text-main); margin: 0;">
              ${escape(counterPartyName || "Direct Chat")}
            </h3>
            <span style="font-size: 0.72rem; color: var(--green); font-weight: 700;">● Live Connection</span>
          </div>
        </div>
        <button id="close-chat-btn" style="background:none; border:none; font-size:1.4rem; color:var(--text-muted); cursor:pointer;">✕</button>
      </div>

      <!-- Messages Stream Area -->
      <div id="chat-messages-container" style="flex: 1; min-height: 240px; max-height: 380px; overflow-y: auto; padding: 14px 4px; display: flex; flex-direction: column; gap: 10px;">
        <div style="text-align: center; color: var(--text-muted); font-size: 0.78rem;">Loading conversation...</div>
      </div>

      <!-- Message Input Form -->
      <form id="chat-input-form" onsubmit="return false;" style="display: flex; gap: 8px; border-top: 1px solid var(--border-light); padding-top: 12px;">
        <input 
          type="text" 
          id="chat-message-input" 
          class="form-control" 
          placeholder="Type a message (संदेश लिखें)..." 
          required 
          autocomplete="off"
          style="flex: 1; font-size: 0.9rem;"
        />
        <button type="submit" id="chat-send-btn" class="btn btn-primary" style="padding: 0 18px; font-weight: 800;">
          Send
        </button>
      </form>

    </div>
  `;

  document.body.appendChild(modal);

  const container = modal.querySelector("#chat-messages-container");
  const inputForm = modal.querySelector("#chat-input-form");
  const textInput = modal.querySelector("#chat-message-input");
  const closeBtn = modal.querySelector("#close-chat-btn");

  let unsubscribeChat = null;

  function appendMessage(m) {
    const isMine = m.sender_id === user?.id;
    const timeStr = m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

    const msgEl = document.createElement("div");
    msgEl.style.cssText = `
      align-self: ${isMine ? "flex-end" : "flex-start"};
      max-width: 80%;
      background: ${isMine ? "var(--saffron)" : "var(--bg-secondary)"};
      color: ${isMine ? "#fff" : "var(--text-main)"};
      border: 1px solid ${isMine ? "var(--saffron)" : "var(--border-light)"};
      border-radius: 14px;
      padding: 8px 14px;
      box-shadow: var(--shadow-sm);
    `;

    msgEl.innerHTML = `
      <div style="font-size: 0.88rem; line-height: 1.35;">${escape(m.body)}</div>
      <div style="font-size: 0.65rem; opacity: 0.75; text-align: right; margin-top: 4px;">${timeStr}</div>
    `;

    container.appendChild(msgEl);
    container.scrollTop = container.scrollHeight;
  }

  // Load existing messages
  api.listMessages(jobId).then(({ data: messages }) => {
    container.innerHTML = "";
    if (!messages || messages.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; margin: auto;">
          👋 Start a conversation about site instructions, timing, or materials.
        </div>
      `;
    } else {
      messages.forEach(appendMessage);
    }
  });

  // Subscribe to live incoming messages
  unsubscribeChat = realtime.subscribeChat(jobId, (newMsg) => {
    // Only append if not already in list
    if (newMsg.sender_id !== user?.id) {
      appendMessage(newMsg);
    }
  });

  // Send message
  inputForm.onsubmit = async (e) => {
    e.preventDefault();
    const text = textInput.value.trim();
    if (!text) return;

    textInput.value = "";
    const { data: sentMsg } = await api.sendMessage(jobId, text);
    if (sentMsg) {
      appendMessage(sentMsg);
    }
  };

  const closeModal = () => {
    if (unsubscribeChat) unsubscribeChat();
    modal.remove();
  };

  closeBtn.onclick = closeModal;
  modal.onclick = (e) => {
    if (e.target === modal) closeModal();
  };
}
