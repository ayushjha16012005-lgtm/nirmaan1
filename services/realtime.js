/* NIRMAAN Realtime Channel Management */
import { supabase, isLive } from "./supabase.js";
import { store } from "../core/store.js";

const activeChannels = new Map();

export const realtime = {
  // 1. Subscribe to User Notifications
  subscribeNotifications(userId, callback) {
    if (!isLive() || !userId) return () => {};

    const channelName = `user-notifs:${userId}`;
    if (activeChannels.has(channelName)) {
      activeChannels.get(channelName).unsubscribe();
    }

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`
        },
        payload => {
          if (callback) callback(payload.new);
          // Increment unread count in store
          const currentCount = store.get("unreadNotifications") || 0;
          store.set("unreadNotifications", currentCount + 1);
          const notifs = store.get("notifications") || [];
          store.set("notifications", [payload.new, ...notifs]);
        }
      )
      .subscribe();

    activeChannels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      activeChannels.delete(channelName);
    };
  },

  // 2. Subscribe to Realtime Job Status Changes
  subscribeJob(jobId, onUpdate) {
    if (!isLive() || !jobId) return () => {};

    const channelName = `job-status:${jobId}`;
    if (activeChannels.has(channelName)) {
      activeChannels.get(channelName).unsubscribe();
    }

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "jobs",
          filter: `id=eq.${jobId}`
        },
        payload => {
          if (onUpdate) onUpdate(payload.new);
        }
      )
      .subscribe();

    activeChannels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      activeChannels.delete(channelName);
    };
  },

  // 3. Subscribe to Realtime Chat Messages for a Job
  subscribeChat(jobId, onMessage) {
    if (!isLive() || !jobId) return () => {};

    const channelName = `chat:${jobId}`;
    if (activeChannels.has(channelName)) {
      activeChannels.get(channelName).unsubscribe();
    }

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `job_id=eq.${jobId}`
        },
        payload => {
          if (onMessage) onMessage(payload.new);
        }
      )
      .subscribe();

    activeChannels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      activeChannels.delete(channelName);
    };
  },

  // 4. Subscribe to Realtime Job Proofs
  subscribeProofs(jobId, onProof) {
    if (!isLive() || !jobId) return () => {};

    const channelName = `proofs:${jobId}`;
    if (activeChannels.has(channelName)) {
      activeChannels.get(channelName).unsubscribe();
    }

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "job_proofs",
          filter: `job_id=eq.${jobId}`
        },
        payload => {
          if (onProof) onProof(payload);
        }
      )
      .subscribe();

    activeChannels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      activeChannels.delete(channelName);
    };
  },

  // 5. Clean up all active channels (e.g. on route change or logout)
  cleanup() {
    activeChannels.forEach(ch => ch.unsubscribe());
    activeChannels.clear();
  }
};
