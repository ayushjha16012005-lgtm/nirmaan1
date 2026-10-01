import test from "node:test";
import assert from "node:assert";

// Mirrors public.advance_job state transition graph from 003_functions.sql
const VALID_TRANSITIONS = {
  posted: ["offered", "accepted", "cancelled"],
  requested: ["accepted", "cancelled"],
  offered: ["accepted", "cancelled"],
  accepted: ["on_the_way", "cancelled"],
  on_the_way: ["arrived", "cancelled"],
  arrived: ["in_progress", "cancelled"],
  in_progress: ["work_submitted", "completed", "disputed"],
  work_submitted: ["approved", "in_progress", "disputed"], // in_progress on retake request
  completed: ["approved", "settled", "disputed"],
  approved: ["settled"],
  settled: [],
  cancelled: [],
  disputed: ["settled", "cancelled"]
};

function canTransition(current, next) {
  const allowed = VALID_TRANSITIONS[current] || [];
  return allowed.includes(next);
}

test("Valid linear workflow transitions are allowed", () => {
  assert.strictEqual(canTransition("offered", "accepted"), true);
  assert.strictEqual(canTransition("accepted", "on_the_way"), true);
  assert.strictEqual(canTransition("on_the_way", "arrived"), true);
  assert.strictEqual(canTransition("arrived", "in_progress"), true);
  assert.strictEqual(canTransition("in_progress", "completed"), true);
  assert.strictEqual(canTransition("completed", "approved"), true);
  assert.strictEqual(canTransition("approved", "settled"), true);
});

test("Illegal leap transitions are strictly blocked", () => {
  assert.strictEqual(canTransition("posted", "completed"), false);
  assert.strictEqual(canTransition("offered", "arrived"), false);
  assert.strictEqual(canTransition("on_the_way", "settled"), false);
  assert.strictEqual(canTransition("arrived", "approved"), false);
});

test("Retake requested allows work_submitted to transition back to in_progress", () => {
  assert.strictEqual(canTransition("work_submitted", "in_progress"), true);
});

test("Cancelled and Settled are terminal states", () => {
  assert.strictEqual(canTransition("cancelled", "accepted"), false);
  assert.strictEqual(canTransition("cancelled", "in_progress"), false);
  assert.strictEqual(canTransition("settled", "in_progress"), false);
  assert.strictEqual(canTransition("settled", "completed"), false);
});
