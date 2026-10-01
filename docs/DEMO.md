# NIRMAAN Demo Responder Guide

This document explains how NIRMAAN provides a realistic, automated end-to-end evaluation experience for seed workers (`is_seed = true`) using the **Demo Responder** system.

---

## 1. Why the Demo Responder Exists

In a production environment, real Kaarigars receive push notifications, open their mobile phone app, accept jobs, and broadcast their GPS location.

During evaluation or staging, testers hire seed workers from the 300 realistic NCR profiles. Without an automated responder, these jobs would stay permanently in `requested` state unless an evaluator opens a second browser window and logs into the worker account.

The Demo Responder solves this by acting on behalf of seed workers according to a believable timeline.

---

## 2. Seed Worker Lifecycle Timeline

When a customer hires any worker flagged with `is_seed = true`:

```
[Booking Created] (Status: requested / offered)
       │
       ▼ (4 seconds)
[Job Accepted] (Status: accepted)
       │ • Kaarigar prepares tools
       │ • Customer receives in-app notification: "Booking Accepted!"
       │
       ▼ (8 seconds later / 12 seconds total)
[Dispatched] (Status: on_the_way)
       │ • Kaarigar starts journey
       │ • Realtime GPS simulation activates (broadcasts every 3 seconds)
       │ • Customer map shows live vehicle movement with dynamic ETA (~5 min -> ~1 min)
       │
       ▼ (18 seconds later / 30 seconds total)
[Arrived on Site] (Status: arrived)
       │ • GPS simulation parks at customer destination
       │ • Customer receives notification: "Kaarigar Arrived! Please share your on-spot OTP"
       │
       ▼ (Customer shares 4-digit PIN or clicks "⚡ Simulate Kaarigar Entering PIN")
[Work in Progress] (Status: in_progress)
       │ • On-spot PIN handshake verified
       │ • Timer starts for work execution
       │
       ▼ (45 seconds later)
[Work Completed] (Status: completed / work_submitted)
       │ • Kaarigar uploads site verification photo with SHA-256 integrity hash
       │ • Customer receives notification: "Work Completed! Review photos and approve"
       │
       ▼ (Customer clicks "Approve Work & Release Payment")
[Escrow Settled] (Status: approved / settled)
       │ • Escrow payment is captured and settled to Kaarigar
       │ • Official Printable Receipt generated with reference ID
       │ • 5-Star Rating & Review modal opens to update trust score
```

---

## 3. Security & Audit Trail Integrity

- **Isolated to Seed Profiles**: The Demo Responder **strictly refuses** to advance any job assigned to a real user. If a real registered phone number is hired, only that user's authenticated session can accept the booking.
- **Audit Logging**: Every status transition executed by the responder writes an immutable entry into `public.job_events` with:
  ```json
  {
    "actor_id": "system:demo-responder",
    "event": "accepted",
    "payload": { "prev_status": "offered", "new_status": "accepted" }
  }
  ```
- **Cancellable at any time**: If the customer clicks **"✕ Cancel Booking"**, all timers and GPS broadcasts terminate immediately. The job transitions to `cancelled` and any escrow hold is refunded.

---

## 4. How to Toggle the Demo Responder

The Demo Responder is controlled dynamically by the `app_settings` database table.

### To Disable in Supabase SQL:
```sql
update public.app_settings
set value = 'false'
where key = 'demo_responder';
```

### To Re-enable in Supabase SQL:
```sql
update public.app_settings
set value = 'true'
where key = 'demo_responder';
```

### To Disable in Browser Console (Local Evaluation):
```javascript
localStorage.setItem('nirmaan_demo_responder', 'false');
```

---

## 5. Implementation Files

- **Database RPC**: [supabase/migrations/006_demo_responder.sql](file:///Users/ayushjha/nirmaan1/supabase/migrations/006_demo_responder.sql)
- **Edge Function**: [supabase/functions/demo-responder/index.ts](file:///Users/ayushjha/nirmaan1/supabase/functions/demo-responder/index.ts)
- **Client Service**: [services/demo-responder.js](file:///Users/ayushjha/nirmaan1/services/demo-responder.js)
- **Tracking Page Integration**: [pages/track.js](file:///Users/ayushjha/nirmaan1/pages/track.js)
