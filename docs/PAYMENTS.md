# NIRMAAN Payments & Escrow Architecture

## Overview & Honest Disclosure

NIRMAAN implements a fair and transparent payment lifecycle ensuring:
1. **Customer Confidence:** Funds are locked in escrow when a booking is confirmed and held safely.
2. **Worker Security:** Workers see "Payment Secured" before beginning work on site, eliminating payment evasion.
3. **Approval Gate:** The customer inspects the completed work and releases funds directly to the Kaarigar.

> [!NOTE]
> **Test Mode vs Live Mode:**
> For hackathon evaluation and demonstration, payments operate in **Razorpay Test Mode** or the authenticated **Supabase Test Ledger**. All transitions (Order Creation → Authorization / Lock → Verification → Capture → Settlement Receipt) operate on the identical state machine and code paths without real banking transactions. The UI prominently displays the **"Test Mode"** badge.

---

## Escrow Lifecycle Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Customer as 👤 Customer / Builder
    participant App as 📱 Nirmaan Client
    participant Edge as ⚡ Supabase Edge Function
    participant RZP as 💳 Razorpay (Test Mode)
    participant DB as 🗄️ Supabase Postgres
    actor Worker as 👷 Kaarigar / Worker

    Customer->>App: 1. Fill Job Scope & Tap "Lock Escrow"
    App->>Edge: 2. POST create-order { jobId, amount }
    Edge->>RZP: 3. Create Order (payment_capture: 0 manual hold)
    RZP-->>Edge: 4. Order ID (order_...)
    Edge->>DB: 5. Insert payments row (status: created)
    Edge-->>App: 6. Return orderId & keyId
    App->>RZP: 7. Open Razorpay Checkout modal (Test Mode)
    Customer->>RZP: 8. Authorize test payment
    RZP-->>App: 9. Payment ID (pay_...)
    App->>DB: 10. Update payments (status: authorized), jobs (escrow_status: locked)
    DB-->>Worker: 11. Realtime notification: "Payment Secured 💰"
    Worker->>Customer: 12. Complete on-site work & upload photo proof
    Customer->>App: 13. Inspect photo proofs & Tap "Approve Work"
    App->>Edge: 14. POST capture-payment { jobId }
    Edge->>RZP: 15. Capture authorized payment
    Edge->>DB: 16. Update payments (status: captured), jobs (escrow_status: released)
    App-->>Customer: 17. Generate Settlement Receipt
    App-->>Worker: 18. Generate Settlement Receipt
```

---

## What is Real vs What is Test

| Component | Status | Behavior |
|---|---|---|
| **Escrow State Machine** | **100% Real** | Enforced in Supabase PostgreSQL tables & RPCs (`jobs.escrow_status`, `advance_job`). |
| **Order Generation** | **Real** | Deno Edge Function `create-order` creates manual-capture orders in Razorpay. |
| **Checkout UI** | **Real** | Lazy-loaded Razorpay Checkout.js with custom brand theme `#E8621A`. |
| **Database Ledger Fallback** | **Real** | If Razorpay keys are not provided, an authenticated Test Ledger records payments with exact IDs. |
| **Money Movement** | **Test Mode** | Real money is not debited; test card/UPI credentials are used. |

---

## Deployment & Secrets Setup (Part A Step 6)

### 1. Set Function Secrets in Supabase Dashboard
In **Supabase Dashboard → Project Settings → Edge Functions → Secrets**, add:
- `RAZORPAY_KEY_ID`: `rzp_test_...` (from Razorpay Dashboard → Settings → API Keys)
- `RAZORPAY_KEY_SECRET`: `...`
- `RAZORPAY_WEBHOOK_SECRET`: `...` (optional, for webhook verification)

### 2. Deploy Edge Functions via Supabase CLI
```bash
supabase functions deploy create-order
supabase functions deploy razorpay-webhook
supabase functions deploy capture-payment
supabase functions deploy refund-payment
```
