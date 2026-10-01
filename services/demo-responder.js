/* NIRMAAN Demo Responder Service
   Drives realistic progression for seed workers (is_seed = true)
   Timeline:
     - 4s: requested/offered -> accepted
     - 12s: accepted -> on_the_way (with GPS path broadcast every 3s)
     - 30s: on_the_way -> arrived
     - Customer gives OTP -> in_progress
     - 45s: in_progress -> completed/work_submitted with sample proof photo
*/

import { supabase, isLive } from "./supabase.js";
import { showToast } from "../core/ui.js";

let activeTimeouts = [];
let activeGpsInterval = null;
let activeChannel = null;
let isRunning = false;
let currentJobId = null;

export const demoResponder = {
  // Start or resume driving a seed worker job
  async watchJob(job, onStateChanged) {
    if (!job || !job.id) return;

    // Check if worker is seed worker
    const isSeed = job.is_seed || job.worker?.is_seed;
    if (!isSeed) return;

    // Check if demo responder is enabled
    const enabled = await this.isDemoResponderEnabled();
    if (!enabled) return;

    this.stop(); // Stop any previous run
    currentJobId = job.id;
    isRunning = true;

    const currentStatus = job.status;

    // 1. If requested / offered -> transition to accepted after 4s
    if (currentStatus === "requested" || currentStatus === "offered" || currentStatus === "posted") {
      const t1 = setTimeout(async () => {
        if (!isRunning || currentJobId !== job.id) return;
        await this.advance(job.id, "accepted");
        if (onStateChanged) onStateChanged("accepted");

        // Schedule on_the_way after another 8s (12s total from start)
        const t2 = setTimeout(async () => {
          if (!isRunning || currentJobId !== job.id) return;
          await this.advance(job.id, "on_the_way");
          if (onStateChanged) onStateChanged("on_the_way");

          // Start GPS movement simulation
          this.startGpsSimulation(job);

          // Schedule arrived after 18s (30s total)
          const t3 = setTimeout(async () => {
            if (!isRunning || currentJobId !== job.id) return;
            this.stopGpsSimulation();
            await this.advance(job.id, "arrived");
            if (onStateChanged) onStateChanged("arrived");
          }, 18000);
          activeTimeouts.push(t3);

        }, 8000);
        activeTimeouts.push(t2);

      }, 4000);
      activeTimeouts.push(t1);
    }

    // 2. If already accepted -> transition to on_the_way after 6s
    else if (currentStatus === "accepted") {
      const t = setTimeout(async () => {
        if (!isRunning || currentJobId !== job.id) return;
        await this.advance(job.id, "on_the_way");
        if (onStateChanged) onStateChanged("on_the_way");

        this.startGpsSimulation(job);

        const tArrive = setTimeout(async () => {
          if (!isRunning || currentJobId !== job.id) return;
          this.stopGpsSimulation();
          await this.advance(job.id, "arrived");
          if (onStateChanged) onStateChanged("arrived");
        }, 18000);
        activeTimeouts.push(tArrive);
      }, 6000);
      activeTimeouts.push(t);
    }

    // 3. If already on the way -> simulate GPS and arrive after 15s
    else if (currentStatus === "on_the_way") {
      this.startGpsSimulation(job);
      const t = setTimeout(async () => {
        if (!isRunning || currentJobId !== job.id) return;
        this.stopGpsSimulation();
        await this.advance(job.id, "arrived");
        if (onStateChanged) onStateChanged("arrived");
      }, 15000);
      activeTimeouts.push(t);
    }

    // 4. If in progress -> upload sample proof photo and finish after 45s
    else if (currentStatus === "in_progress") {
      const t = setTimeout(async () => {
        if (!isRunning || currentJobId !== job.id) return;
        await this.simulateWorkCompletion(job);
        if (onStateChanged) onStateChanged("completed");
      }, 45000);
      activeTimeouts.push(t);
    }
  },

  // Stop current automated responder progression (e.g. on cancel)
  stop() {
    isRunning = false;
    currentJobId = null;
    activeTimeouts.forEach(t => clearTimeout(t));
    activeTimeouts = [];
    this.stopGpsSimulation();
  },

  // Simulate GPS coordinates moving towards destination
  startGpsSimulation(job) {
    this.stopGpsSimulation();

    const destLat = job.lat || 28.6280;
    const destLng = job.lng || 77.3649;
    let curLat = job.workerLat || (destLat - 0.015);
    let curLng = job.workerLng || (destLng - 0.012);

    if (isLive()) {
      activeChannel = supabase.channel(`job-loc:${job.id}`);
      activeChannel.subscribe();
    }

    activeGpsInterval = setInterval(() => {
      if (!isRunning) return;

      // Move 8% closer each step with realistic micro-jitter
      curLat += (destLat - curLat) * 0.08 + (Math.random() - 0.5) * 0.0001;
      curLng += (destLng - curLng) * 0.08 + (Math.random() - 0.5) * 0.0001;

      const payload = {
        lat: curLat,
        lng: curLng,
        heading: 42,
        speed_kmh: 24,
        ts: Date.now()
      };

      if (isLive() && activeChannel) {
        activeChannel.send({
          type: "broadcast",
          event: "loc",
          payload
        });
      }
    }, 3000);
  },

  stopGpsSimulation() {
    if (activeGpsInterval) {
      clearInterval(activeGpsInterval);
      activeGpsInterval = null;
    }
    if (activeChannel && isLive()) {
      supabase.removeChannel(activeChannel);
      activeChannel = null;
    }
  },

  // Advance status in database or edge function
  async advance(jobId, nextStatus) {
    if (isLive()) {
      try {
        // Try demo_advance_job RPC first
        const { error } = await supabase.rpc("demo_advance_job", {
          p_job_id: jobId,
          p_next_status: nextStatus,
          p_actor: "system:demo-responder"
        });

        if (error) {
          // Fallback to direct update if user has permissions
          await supabase
            .from("jobs")
            .update({ status: nextStatus, updated_at: new Date().toISOString() })
            .eq("id", jobId);

          await supabase.from("job_events").insert([{
            job_id: jobId,
            actor_id: "system:demo-responder",
            event: nextStatus,
            payload: { status: nextStatus, time: Date.now() }
          }]);
        }
      } catch (err) {
        console.warn("demoResponder advance error:", err);
      }
    }
  },

  // Upload sample proof photo and finish job
  async simulateWorkCompletion(job) {
    if (isLive()) {
      try {
        await supabase.from("job_proofs").insert([{
          job_id: job.id,
          stage: "completion",
          photo_url: "https://images.unsplash.com/photo-1541888946425-d0fbb180f5f6?w=800&auto=format&fit=crop&q=80",
          photo_hash: "sha256:d3b07384d113edec49eaa6238ad5ff00",
          uploaded_by: job.worker_id || job.worker?.id,
          geo_lat: job.lat || 28.6280,
          geo_lng: job.lng || 77.3649,
          accuracy_meters: 3.5
        }]);

        await this.advance(job.id, "completed");
        showToast("Kaarigar completed the work and submitted site verification photos!");
      } catch (err) {
        console.warn("simulateWorkCompletion error:", err);
      }
    }
  },

  // Check setting from app_settings or localStorage
  async isDemoResponderEnabled() {
    if (isLive()) {
      try {
        const { data } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "demo_responder")
          .maybeSingle();

        if (data && data.value != null) {
          return data.value === "true";
        }
      } catch (e) {
        // ignore
      }
    }

    // Default to true for dev/evaluator convenience
    const local = localStorage.getItem("nirmaan_demo_responder");
    return local !== "false";
  }
};
