/* NIRMAAN Data Gateway (api.js) */
import { supabase, isLive } from "./supabase.js";
import { MOCK_KAARIGARS, MOCK_GOVT_SCHEMES, MOCK_SAMACHAR, MOCK_PROJECTS } from "../data/mock.js";

// Local in-memory store for demo mode mutations
let activeBookings = [
  {
    id: "job-101",
    workerId: "k-ramesh",
    workerName: "Ramesh Yadav",
    workerRole: "Senior Raj Mistri",
    customerId: "u-default",
    customerName: "Aman Sharma",
    jobTitle: "Boundary Wall Construction & Plastering",
    location: "Noida Sector 62",
    lat: 28.6280,
    lng: 77.3649,
    workerLat: 28.6210,
    workerLng: 77.3590,
    rate: 850,
    rateType: "day",
    days: 3,
    amount: 2550,
    status: "on_the_way", // posted, offered, accepted, on_the_way, arriving, in_progress, completed, signed_off, settled
    otp: "4829",
    escrowLocked: true,
    startDate: "2026-09-30",
    affidavitSigned: true
  }
];

export const api = {
  async listWorkers(filters = {}) {
    try {
      if (isLive()) {
        let query = supabase.from("worker_profiles").select("*, profiles(*)");
        if (filters.trade && filters.trade !== "all") {
          query = query.eq("trade", filters.trade);
        }
        const { data, error } = await query;
        if (error) throw error;
        return { data: data || [], error: null };
      }

      // Demo Mock Filter
      let workers = [...MOCK_KAARIGARS];
      if (filters.trade && filters.trade !== "all") {
        workers = workers.filter(w => w.trade === filters.trade);
      }
      if (filters.radius) {
        workers = workers.filter(w => w.distance_km <= filters.radius);
      }
      return { data: workers, error: null };
    } catch (error) {
      console.warn("listWorkers error, fallback to mock:", error);
      return { data: MOCK_KAARIGARS, error: null };
    }
  },

  async getWorker(id) {
    try {
      if (isLive()) {
        const { data, error } = await supabase.from("worker_profiles").select("*, profiles(*)").eq("id", id).single();
        if (error) throw error;
        return { data, error: null };
      }
      const worker = MOCK_KAARIGARS.find(w => w.id === id) || MOCK_KAARIGARS[0];
      return { data: worker, error: null };
    } catch (error) {
      return { data: MOCK_KAARIGARS[0], error: null };
    }
  },

  async createJob(payload) {
    try {
      const newJob = {
        id: "job-" + Date.now(),
        workerId: payload.workerId,
        workerName: payload.workerName,
        workerRole: payload.workerRole,
        customerId: payload.customerId || "u-default",
        customerName: payload.customerName || "Customer",
        jobTitle: payload.jobTitle || "Construction Work",
        location: payload.location || "Noida Sector 62",
        lat: 28.6280,
        lng: 77.3649,
        workerLat: 28.6210,
        workerLng: 77.3590,
        rate: payload.rate,
        rateType: payload.rateType || "day",
        days: payload.days || 1,
        amount: payload.amount,
        status: "accepted",
        otp: String(Math.floor(1000 + Math.random() * 9000)),
        escrowLocked: true,
        startDate: new Date().toISOString().split("T")[0],
        affidavitSigned: true,
        created_at: new Date().toISOString()
      };

      if (isLive()) {
        const { data, error } = await supabase.from("jobs").insert([newJob]).select().single();
        if (error) throw error;
        return { data, error: null };
      }

      activeBookings.unshift(newJob);
      return { data: newJob, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  async getJob(id) {
    try {
      if (isLive()) {
        const { data, error } = await supabase.from("jobs").select("*").eq("id", id).single();
        if (error) throw error;
        return { data, error: null };
      }
      const job = activeBookings.find(j => j.id === id) || activeBookings[0];
      return { data: job, error: null };
    } catch (error) {
      return { data: activeBookings[0], error: null };
    }
  },

  async advanceJob(id, nextStatus) {
    try {
      if (isLive()) {
        const { data, error } = await supabase.rpc("advance_job", { job_id: id, next_status: nextStatus });
        if (error) throw error;
        return { data, error: null };
      }

      const job = activeBookings.find(j => j.id === id);
      if (job) {
        job.status = nextStatus;
        if (nextStatus === "settled" || nextStatus === "signed_off") {
          job.escrowLocked = false;
        }
        return { data: job, error: null };
      }
      return { data: null, error: "Job not found" };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  async listSchemes() {
    return { data: MOCK_GOVT_SCHEMES, error: null };
  },

  async listNews() {
    return { data: MOCK_SAMACHAR, error: null };
  },

  async getProjects() {
    return { data: MOCK_PROJECTS, error: null };
  },

  async getActiveJobs() {
    return { data: activeBookings, error: null };
  }
};
