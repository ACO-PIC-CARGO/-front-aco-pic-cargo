import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canChangePlan,
  cardAction,
  changeSummary,
  planBadge,
  planDetails,
  purchaseAction,
} from "../../../src/views/MyPlan/myPlanView.js";

const plan = { package_id: 3, billing: "monthly", status: "active" };
const preview = (overrides = {}) => ({
  action: "charge",
  amount: 499.99,
  recurring_amount: 1290,
  billing: "annual",
  next_billed_at: "2027-10-07T00:00:00Z",
  removes_cancel: false,
  ...overrides,
});

test("only an active or trial plan can be changed", () => {
  assert.equal(canChangePlan({ status: "active" }), true);
  assert.equal(canChangePlan({ status: "trialing" }), true);
  assert.equal(canChangePlan({ status: "past_due" }), false);
  assert.equal(canChangePlan({ status: "paused" }), false);
  assert.equal(canChangePlan({ status: "canceled" }), false);
  assert.equal(canChangePlan(null), false);
});

test("cardAction marks the current plan and allows another package or cycle", () => {
  assert.equal(cardAction({ id: 4 }, plan, "monthly"), "change");
  assert.equal(cardAction({ id: 3 }, plan, "annual"), "change");
  assert.equal(cardAction({ id: 3 }, plan, "monthly"), "current");
});

test("cardAction lets a package with module choice switch modules", () => {
  const start = { id: 2, module_selection_limit: 1 };

  assert.equal(
    cardAction(start, { ...plan, package_id: 2 }, "monthly"),
    "change-module"
  );
});

test("changeSummary tells what is charged today and the new price", () => {
  const text = changeSummary(preview());

  assert.match(text, /Hoy se cobrarán US\$499\.99/);
  assert.match(text, /US\$1,290 al año desde el 7 de octubre de 2027/);
  assert.doesNotMatch(text, /cancelación/);
});

test("changeSummary tells the credit left for the next payments", () => {
  const text = changeSummary(
    preview({
      action: "credit",
      amount: 710.98,
      recurring_amount: 79,
      billing: "monthly",
    })
  );

  assert.match(text, /crédito de US\$710\.98/);
  assert.match(text, /US\$79 al mes/);
  assert.doesNotMatch(text, /Hoy se cobrarán/);
});

test("changeSummary says nothing is charged and warns the cancellation goes away", () => {
  const text = changeSummary(
    preview({ action: "none", amount: 0, removes_cancel: true })
  );

  assert.match(text, /No se te cobrará nada hoy/);
  assert.match(text, /Tu cancelación programada se quitará\.$/);
});

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.parse("2026-10-07T12:00:00Z");
const trial = (endsInMs, overrides = {}) => ({
  status: "trialing",
  package_name: "PRO",
  current_period_ends_at: new Date(NOW + endsInMs).toISOString(),
  next_billed_at: null,
  ...overrides,
});

test("planBadge counts the trial days left, rounding up", () => {
  assert.deepEqual(planBadge(trial(12 * DAY_MS), NOW), {
    text: "12 días de prueba",
    tone: "trial",
  });
  assert.equal(
    planBadge(trial(11 * DAY_MS + 1), NOW).text,
    "12 días de prueba"
  );
});

test("planBadge uses the singular and the last day", () => {
  assert.equal(planBadge(trial(DAY_MS), NOW).text, "1 día de prueba");
  assert.equal(planBadge(trial(0), NOW).text, "Último día de prueba");
  assert.equal(planBadge(trial(-DAY_MS), NOW).text, "Último día de prueba");
});

test("planBadge falls back to the next bill date and to the last day", () => {
  const nextBilled = new Date(NOW + 3 * DAY_MS).toISOString();

  assert.equal(
    planBadge(
      trial(0, { current_period_ends_at: null, next_billed_at: nextBilled }),
      NOW
    ).text,
    "3 días de prueba"
  );
  assert.equal(
    planBadge(trial(0, { current_period_ends_at: null }), NOW).text,
    "Último día de prueba"
  );
});

test("planBadge shows the paid plan", () => {
  assert.deepEqual(planBadge({ status: "active", package_name: "PRO" }, NOW), {
    text: "ACO PRO activo",
    tone: "paid",
  });
});

test("planBadge hides for no plan and for plans that are not usable or paid", () => {
  assert.equal(planBadge(null, NOW), null);
  for (const status of ["canceled", "past_due", "paused"]) {
    assert.equal(planBadge({ status, package_name: "PRO" }, NOW), null);
  }
});

const detailedPlan = (overrides = {}) => ({
  user_limit: 3,
  user_count: 1,
  modules: [
    { id: 6, name: "Pricing" },
    { id: 1, name: "Operativo" },
  ],
  features: [
    { module_id: 6, description: "Reporte de vendedores" },
    { module_id: null, description: "Sistema 100% online" },
    { module_id: 1, description: "Reporte de embarques" },
    { module_id: 6, description: "Seguimiento de llamadas" },
    { module_id: null, description: "Soporte prioritario" },
  ],
  ...overrides,
});

test("planDetails shows used and allowed users", () => {
  assert.equal(planDetails(detailedPlan()).users, "1 de 3");
  assert.equal(planDetails(detailedPlan({ user_count: 4 })).users, "4 de 3");
  assert.equal(planDetails(detailedPlan({ user_limit: null })).users, null);
});

test("planDetails groups each module with what it includes, in order", () => {
  assert.deepEqual(planDetails(detailedPlan()).modules, [
    {
      id: 6,
      name: "Pricing",
      details: ["Reporte de vendedores", "Seguimiento de llamadas"],
    },
    { id: 1, name: "Operativo", details: ["Reporte de embarques"] },
  ]);
});

test("planDetails lists the general features apart", () => {
  assert.deepEqual(planDetails(detailedPlan()).extras, [
    "Sistema 100% online",
    "Soporte prioritario",
  ]);
});

test("planDetails tolerates a plan without details", () => {
  assert.deepEqual(planDetails({ modules: [{ id: 6, name: "Pricing" }] }), {
    users: null,
    modules: [{ id: 6, name: "Pricing", details: [] }],
    extras: [],
  });
  assert.deepEqual(planDetails(null), { users: null, modules: [], extras: [] });
});

test("purchaseAction buys when the company has no live plan", () => {
  assert.equal(purchaseAction({ id: 3 }, null, "annual"), "buy");
  assert.equal(
    purchaseAction(
      { id: 3 },
      { status: "canceled", package_id: 3, billing: "annual" },
      "annual"
    ),
    "buy"
  );
});

test("purchaseAction changes a live plan like Mi plan does", () => {
  const plan = { status: "active", package_id: 3, billing: "annual" };

  assert.equal(purchaseAction({ id: 4 }, plan, "annual"), "change");
  assert.equal(purchaseAction({ id: 3 }, plan, "annual"), "current");
  assert.equal(
    purchaseAction(
      { id: 2, module_selection_limit: 1 },
      { ...plan, package_id: 2 },
      "annual"
    ),
    "change-module"
  );
  assert.equal(
    purchaseAction({ id: 4 }, { ...plan, status: "trialing" }, "annual"),
    "change"
  );
});

test("purchaseAction sends plans that cannot change to Mi plan", () => {
  assert.equal(
    purchaseAction(
      { id: 4 },
      { status: "past_due", package_id: 3, billing: "annual" },
      "annual"
    ),
    "manage"
  );
  assert.equal(
    purchaseAction(
      { id: 4 },
      { status: "paused", package_id: 3, billing: "annual" },
      "annual"
    ),
    "manage"
  );
});
