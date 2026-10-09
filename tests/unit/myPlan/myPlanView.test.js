import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canChangePlan,
  cardAction,
  changeSummary,
  daysLabel,
  hasUpgrade,
  isUnavailableAction,
  planDetails,
  purchaseAction,
  readPendingChoice,
  trialNotice,
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

const START = { id: 2, monthly_price: "29" };
const PRO = { id: 3, monthly_price: "79" };
const MAX = { id: 4, monthly_price: "149" };
const annualPlan = { ...plan, billing: "annual" };

test("cardAction marks a package cheaper than the current one as lower", () => {
  assert.equal(cardAction(START, plan, "monthly", PRO), "lower");
  assert.equal(cardAction(START, plan, "annual", PRO), "lower");
  assert.equal(cardAction(MAX, plan, "monthly", PRO), "change");
  assert.equal(
    cardAction({ ...MAX, monthly_price: "79" }, plan, "monthly", PRO),
    "change"
  );
});

test("cardAction keeps an annual plan from going back to monthly", () => {
  assert.equal(cardAction(PRO, annualPlan, "monthly", PRO), "annual-only");
  assert.equal(cardAction(PRO, annualPlan, "annual", PRO), "current");
  assert.equal(cardAction(PRO, plan, "annual", PRO), "change");
});

test("only the current, lower and annual-only cards cannot be picked", () => {
  for (const action of ["current", "lower", "annual-only"]) {
    assert.equal(isUnavailableAction(action), true);
  }
  for (const action of ["buy", "change", "change-module", "manage"]) {
    assert.equal(isUnavailableAction(action), false);
  }
});

test("hasUpgrade finds a pricier package or the annual cycle", () => {
  assert.equal(hasUpgrade(plan, [START, PRO]), true);
  assert.equal(hasUpgrade(annualPlan, [START, PRO]), false);
  assert.equal(hasUpgrade(annualPlan, [START, PRO, MAX]), true);
});

test("hasUpgrade counts a module switch on the same package", () => {
  const choosable = { ...START, module_selection_limit: 1 };

  assert.equal(hasUpgrade({ ...annualPlan, package_id: 2 }, [choosable]), true);
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

const notice = (overrides = {}) => ({
  days: null,
  ended: false,
  canBuy: false,
  paidText: null,
  ...overrides,
});
const registrationTrial = (endsInMs) => ({
  trial_days: 30,
  started_at: new Date(NOW - 5 * DAY_MS).toISOString(),
  ends_at: new Date(NOW + endsInMs).toISOString(),
});

test("trialNotice counts the days of a plan in trial and offers no purchase", () => {
  assert.deepEqual(
    trialNotice({
      plan: trial(12 * DAY_MS),
      registrationTrial: null,
      now: NOW,
    }),
    notice({ days: 12 })
  );
  assert.equal(
    trialNotice({ plan: trial(11 * DAY_MS + 1), now: NOW }).days,
    12
  );
});

test("trialNotice falls back to the next bill date and to the last day", () => {
  const nextBilled = new Date(NOW + 3 * DAY_MS).toISOString();
  const withoutEnd = { current_period_ends_at: null };

  assert.equal(
    trialNotice({
      plan: trial(0, { ...withoutEnd, next_billed_at: nextBilled }),
      now: NOW,
    }).days,
    3
  );
  assert.equal(trialNotice({ plan: trial(0, withoutEnd), now: NOW }).days, 0);
  assert.equal(trialNotice({ plan: trial(-DAY_MS), now: NOW }).days, 0);
});

test("trialNotice shows the paid plan and ignores the registration trial", () => {
  assert.deepEqual(
    trialNotice({
      plan: { status: "active", package_name: "PRO" },
      registrationTrial: registrationTrial(DAY_MS),
      now: NOW,
    }),
    notice({ paidText: "ACO PRO activo" })
  );
});

test("trialNotice shows nothing for a live plan that is neither in trial nor paid", () => {
  for (const status of ["past_due", "paused"]) {
    assert.equal(
      trialNotice({
        plan: { status, package_name: "PRO" },
        registrationTrial: registrationTrial(DAY_MS),
        now: NOW,
      }),
      null
    );
  }
});

test("trialNotice counts the registration trial days and offers a plan", () => {
  assert.deepEqual(
    trialNotice({
      plan: null,
      registrationTrial: registrationTrial(30 * DAY_MS),
      now: NOW,
    }),
    notice({ days: 30, canBuy: true })
  );
  assert.deepEqual(
    trialNotice({
      plan: { status: "canceled", package_name: "PRO" },
      registrationTrial: registrationTrial(1),
      now: NOW,
    }),
    notice({ days: 1, canBuy: true })
  );
});

test("trialNotice says the registration trial ended and offers a plan", () => {
  for (const endsInMs of [0, -DAY_MS]) {
    assert.deepEqual(
      trialNotice({
        plan: null,
        registrationTrial: registrationTrial(endsInMs),
        now: NOW,
      }),
      notice({ ended: true, canBuy: true })
    );
  }
});

test("trialNotice only offers a plan when there is no live plan and no trial", () => {
  assert.deepEqual(
    trialNotice({ plan: null, registrationTrial: null, now: NOW }),
    notice({ canBuy: true })
  );
});

test("daysLabel uses the singular and the last day", () => {
  assert.equal(daysLabel(12), "12 días");
  assert.equal(daysLabel(1), "1 día");
  assert.equal(daysLabel(0), "Último día");
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

test("purchaseAction blocks downgrades for a live plan", () => {
  assert.equal(purchaseAction(START, plan, "monthly", PRO), "lower");
  assert.equal(purchaseAction(PRO, annualPlan, "monthly", PRO), "annual-only");
  assert.equal(purchaseAction(START, null, "monthly", undefined), "buy");
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

test("readPendingChoice starts a plan link without a cycle on monthly billing", () => {
  assert.deepEqual(readPendingChoice({ paquete: "3" }), {
    packageId: 3,
    billing: "monthly",
  });
});
