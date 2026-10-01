/* NIRMAAN Project Management System (PMS) Data Service */
import { supabase, isLive } from "./supabase.js";
import { store } from "../core/store.js";
import { MOCK_PROJECTS } from "../data/mock.js";

const CACHE_KEY = "nirmaan_pms_cache";
const QUEUE_KEY = "nirmaan_pms_sync_queue";

export const pms = {
  // Load Project and all sub-modules (materials, tasks, crew, progress)
  async getProject() {
    const user = store.get("user");
    const cached = this.getLocalCache();

    if (isLive() && user?.id) {
      try {
        // Fetch owner project
        let { data: project, error: pErr } = await supabase
          .from("projects")
          .select("*")
          .eq("owner_id", user.id)
          .maybeSingle();

        // If no project exists yet for this user, seed an initial project
        if (!project) {
          const { data: newProj, error: createErr } = await supabase
            .from("projects")
            .insert([{
              owner_id: user.id,
              title: "Dream Villa — 2400 sq.ft Construction",
              location: `${user.city || "Noida"} ${user.sector || "Sector 62"}`,
              progress_pct: 65,
              status: "active"
            }])
            .select()
            .single();

          if (!createErr && newProj) {
            project = newProj;

            // Seed initial materials
            await supabase.from("materials").insert([
              { project_id: project.id, item_name: "UltraTech Cement", category: "Cement", used_qty: 240, total_qty: 350, unit: "bags" },
              { project_id: project.id, item_name: "Red Clay Bricks", category: "Bricks", used_qty: 18000, total_qty: 25000, unit: "units" },
              { project_id: project.id, item_name: "River Sand", category: "Sand", used_qty: 14, total_qty: 20, unit: "tons" },
              { project_id: project.id, item_name: "TMT Steel 12mm", category: "Steel", used_qty: 3200, total_qty: 4000, unit: "kg" }
            ]);

            // Seed initial tasks
            await supabase.from("project_tasks").insert([
              { project_id: project.id, title: "Foundation Excavation & PCC", completed: true },
              { project_id: project.id, title: "Ground Floor Column Casting & Plinth Beam", completed: true },
              { project_id: project.id, title: "Brick Masonry up to Lintel Level", completed: true },
              { project_id: project.id, title: "First Floor Slab Shuttering & Casting", completed: false },
              { project_id: project.id, title: "Plumbing Concealed Lines & Sanitary Fitting", completed: false },
              { project_id: project.id, title: "Electrical Concealed Conduiting & Wiring", completed: false }
            ]);
          }
        }

        if (project) {
          // Fetch sub-entities in parallel
          const [matRes, taskRes, progRes] = await Promise.all([
            supabase.from("materials").select("*").eq("project_id", project.id).order("created_at", { ascending: false }),
            supabase.from("project_tasks").select("*").eq("project_id", project.id).order("created_at", { ascending: true }),
            supabase.from("progress_entries").select("*").eq("project_id", project.id).order("created_at", { ascending: false })
          ]);

          const materials = matRes.data || [];
          const tasks = taskRes.data || [];
          const progress = progRes.data || [];

          const completedTasks = tasks.filter(t => t.completed).length;
          const progressPct = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : (project.progress_pct || 65);

          const fullProject = {
            ...project,
            progressPct,
            progress_pct: progressPct,
            materials,
            tasks,
            timeline: tasks.map(t => ({ id: t.id, step: t.title, done: t.completed })),
            progress
          };

          this.saveLocalCache(fullProject);
          return { data: fullProject, error: null };
        }
      } catch (err) {
        console.warn("PMS remote fetch error, returning local cache:", err);
      }
    }

    if (cached) return { data: cached, error: null };

    // Standard fallback with full material and task model
    const mock = {
      ...MOCK_PROJECTS[0],
      materials: [
        { id: "mat-1", item_name: "UltraTech Cement", category: "Cement", used_qty: 240, total_qty: 350, unit: "bags" },
        { id: "mat-2", item_name: "Red Clay Bricks", category: "Bricks", used_qty: 18000, total_qty: 25000, unit: "units" },
        { id: "mat-3", item_name: "River Sand", category: "Sand", used_qty: 14, total_qty: 20, unit: "tons" },
        { id: "mat-4", item_name: "TMT Steel 12mm", category: "Steel", used_qty: 3200, total_qty: 4000, unit: "kg" }
      ],
      tasks: (MOCK_PROJECTS[0].timeline || []).map((t, idx) => ({
        id: `task-${idx + 1}`,
        title: t.step,
        completed: t.done
      })),
      progress: [
        {
          id: "prog-1",
          step: "Slab Casting Inspection",
          photo_url: "https://images.unsplash.com/photo-1541888946425-d0fbb180f5f6?w=600&auto=format&fit=crop&q=80",
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: "prog-2",
          step: "Ground Floor Brickwork Completed",
          photo_url: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&auto=format&fit=crop&q=80",
          created_at: new Date(Date.now() - 172800000).toISOString()
        }
      ]
    };

    return { data: mock, error: null };
  },

  // Add or update materials delivery
  async logMaterialDelivery(projectId, item) {
    const newItem = {
      id: crypto.randomUUID(),
      project_id: projectId,
      item_name: item.name,
      category: item.category || "General",
      used_qty: 0,
      total_qty: Number(item.qty) || 0,
      unit: item.unit || "units",
      created_at: new Date().toISOString()
    };

    // Update local cache optimistically
    const cached = this.getLocalCache();
    if (cached) {
      cached.materials = [newItem, ...(cached.materials || [])];
      this.saveLocalCache(cached);
    }

    if (isLive() && navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from("materials")
          .insert([{
            project_id: projectId,
            item_name: item.name,
            category: item.category || "General",
            used_qty: 0,
            total_qty: Number(item.qty),
            unit: item.unit || "units"
          }])
          .select()
          .single();

        if (error) throw error;
        return { data, error: null };
      } catch (err) {
        console.warn("Remote material insert failed, enqueuing:", err);
        this.enqueueSync({ type: "material", data: newItem });
        return { data: newItem, error: null };
      }
    } else {
      this.enqueueSync({ type: "material", data: newItem });
      return { data: newItem, error: null };
    }
  },

  // Upload site progress photo to project-photos bucket
  async uploadSitePhoto(projectId, file, stepTitle = "Site Inspection") {
    const entryId = crypto.randomUUID();
    let photoUrl = null;

    if (isLive() && navigator.onLine) {
      try {
        const path = `${projectId}/${crypto.randomUUID()}-${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from("project-photos")
          .upload(path, file);

        if (upErr) throw upErr;

        const { data: publicUrl } = supabase.storage
          .from("project-photos")
          .getPublicUrl(path);

        photoUrl = publicUrl?.publicUrl || null;

        const { data: entry, error: insErr } = await supabase
          .from("progress_entries")
          .insert([{
            project_id: projectId,
            step: stepTitle,
            note: "Timestamped progress verification photo uploaded from site.",
            photo_url: photoUrl,
            completed: true
          }])
          .select()
          .single();

        if (insErr) throw insErr;

        // Update local cache
        const cached = this.getLocalCache();
        if (cached) {
          cached.progress = [entry, ...(cached.progress || [])];
          this.saveLocalCache(cached);
        }

        return { data: entry, error: null };
      } catch (err) {
        console.warn("uploadSitePhoto live failed, fallback to local:", err);
      }
    }

    // Offline / fallback data
    const localEntry = {
      id: entryId,
      project_id: projectId,
      step: stepTitle,
      note: "Offline captured site photo (sync pending)",
      photo_url: URL.createObjectURL(file),
      completed: true,
      created_at: new Date().toISOString()
    };

    const cached = this.getLocalCache();
    if (cached) {
      cached.progress = [localEntry, ...(cached.progress || [])];
      this.saveLocalCache(cached);
    }

    return { data: localEntry, error: null };
  },

  // Toggle task completion
  async toggleTask(projectId, taskId, completed) {
    const cached = this.getLocalCache();
    if (cached && cached.tasks) {
      const target = cached.tasks.find(t => t.id === taskId);
      if (target) {
        target.completed = completed;
        const comp = cached.tasks.filter(t => t.completed).length;
        cached.progressPct = Math.round((comp / cached.tasks.length) * 100);
        cached.progress_pct = cached.progressPct;
        this.saveLocalCache(cached);
      }
    }

    if (isLive() && navigator.onLine) {
      try {
        await supabase
          .from("project_tasks")
          .update({ completed })
          .eq("id", taskId);

        // Also update project progress_pct
        if (cached?.progressPct != null) {
          await supabase
            .from("projects")
            .update({ progress_pct: cached.progressPct })
            .eq("id", projectId);
        }
      } catch (e) {
        console.warn("toggleTask remote error:", e);
      }
    }
  },

  // Sync queue for offline operations
  enqueueSync(item) {
    try {
      const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
      q.push(item);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
    } catch (e) {
      console.warn("Queue write error:", e);
    }
  },

  async flushSyncQueue() {
    if (!isLive() || !navigator.onLine) return;
    try {
      const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
      if (q.length === 0) return;

      const remaining = [];
      for (const item of q) {
        try {
          if (item.type === "material") {
            await supabase.from("materials").insert([{
              project_id: item.data.project_id,
              item_name: item.data.item_name,
              category: item.data.category,
              used_qty: item.data.used_qty,
              total_qty: item.data.total_qty,
              unit: item.data.unit
            }]);
          }
        } catch (e) {
          remaining.push(item);
        }
      }
      localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    } catch (e) {
      console.warn("flushSyncQueue error:", e);
    }
  },

  // Local Offline Cache Helpers
  saveLocalCache(projectData) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(projectData));
    } catch (e) {
      console.warn("Could not write PMS cache:", e);
    }
  },

  getLocalCache() {
    try {
      const saved = localStorage.getItem(CACHE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  }
};

// Auto-sync when reconnecting online
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    pms.flushSyncQueue();
  });
}
