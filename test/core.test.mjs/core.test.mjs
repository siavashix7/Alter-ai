import assert from "node:assert/strict";
import test from "node:test";

import { createAlter } from "../src/core/index.js";

test("Alter runtime initializes", () => {
  const alter = createAlter();

  assert.equal(alter.policy.identity.name, "Alter");
  assert.equal(
    alter.policy.identity.role,
    "Personal AI Operating System"
  );
});

test("Alter exposes provider registry", () => {
  const alter = createAlter();

  assert.ok(alter.providers);
  assert.ok(Array.isArray(alter.providers.list()));
});

test("Alter exposes tool registry", () => {
  const alter = createAlter();

  assert.ok(alter.tools);
  assert.ok(Array.isArray(alter.tools.list()));
});

test("Alter exposes audit trace", () => {
  const alter = createAlter();

  const trace = alter.getTrace();

  assert.ok(Array.isArray(trace));
  assert.ok(trace.length >= 1);
});

test("Planner creates a valid task", () => {
  const alter = createAlter();

  const task = alter.planner.createTask({
    request: "Test Alter",
    capability: "chat"
  });

  assert.equal(task.request, "Test Alter");
  assert.equal(task.capability, "chat");
  assert.equal(task.status, "planned");
  assert.ok(task.id.startsWith("task_"));
});
