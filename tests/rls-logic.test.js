import test from "node:test";
import assert from "node:assert";

// Mirrors RLS policy evaluations from 002_rls.sql
function canAccessJob(user, job) {
  if (!user) return false;
  if (user.isAdmin) return true;
  return job.customer_id === user.id || job.worker_id === user.id;
}

function canApproveEscrow(user, job) {
  if (!user) return false;
  if (user.isAdmin) return true;
  return job.customer_id === user.id;
}

function canAcceptJob(user, job) {
  if (!user) return false;
  if (user.isAdmin) return true;
  return job.worker_id === user.id;
}

function canVerifyWorker(user) {
  return Boolean(user && user.isAdmin);
}

const customer = { id: "c-101", isAdmin: false, role: "user" };
const worker = { id: "w-202", isAdmin: false, role: "kaarigar" };
const stranger = { id: "s-999", isAdmin: false, role: "user" };
const admin = { id: "a-001", isAdmin: true, role: "admin" };

const job = {
  id: "job-001",
  customer_id: "c-101",
  worker_id: "w-202",
  status: "offered"
};

test("Customer and Assigned Worker can view their job; Stranger cannot", () => {
  assert.strictEqual(canAccessJob(customer, job), true);
  assert.strictEqual(canAccessJob(worker, job), true);
  assert.strictEqual(canAccessJob(stranger, job), false);
  assert.strictEqual(canAccessJob(admin, job), true);
});

test("Only Customer or Admin can approve escrow and release funds", () => {
  assert.strictEqual(canApproveEscrow(customer, job), true);
  assert.strictEqual(canApproveEscrow(worker, job), false);
  assert.strictEqual(canApproveEscrow(stranger, job), false);
  assert.strictEqual(canApproveEscrow(admin, job), true);
});

test("Only Assigned Worker or Admin can accept a job offer", () => {
  assert.strictEqual(canAcceptJob(worker, job), true);
  assert.strictEqual(canAcceptJob(customer, job), false);
  assert.strictEqual(canAcceptJob(stranger, job), false);
});

test("Only Admin can approve Kaarigar Aadhaar verification", () => {
  assert.strictEqual(canVerifyWorker(admin), true);
  assert.strictEqual(canVerifyWorker(customer), false);
  assert.strictEqual(canVerifyWorker(worker), false);
});
