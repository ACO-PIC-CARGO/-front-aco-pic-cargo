import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canChangePlan,
  cardAction,
  changeSummary,
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
