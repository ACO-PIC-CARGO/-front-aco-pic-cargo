import { test } from "node:test";
import assert from "node:assert/strict";
import {
  billingRows,
  cardLabel,
} from "../../../src/views/BillingHistory/billingHistoryView.js";

const entry = (overrides = {}) => ({
  id: "txn_01",
  billed_at: "2026-10-07T15:00:00Z",
  origin: "web",
  product_name: "ACO PRO",
  billing: "monthly",
  status: "completed",
  currency_code: "USD",
  total: "7900",
  adjusted_total: "7900",
  has_invoice: true,
  ...overrides,
});

const rowOf = (overrides) => billingRows([entry(overrides)])[0];

test("billingRows names a purchase, a renewal and a plan change", () => {
  assert.equal(rowOf({ origin: "web" }).concept, "Compra ACO PRO · Mensual");
  assert.equal(rowOf({ origin: "api" }).concept, "Compra ACO PRO · Mensual");
  assert.equal(
    rowOf({ origin: "subscription_recurring", billing: "annual" }).concept,
    "Renovación ACO PRO · Anual"
  );
  assert.equal(
    rowOf({ origin: "subscription_update", product_name: "ACO MAX" }).concept,
    "Cambio a ACO MAX · Mensual"
  );
  assert.equal(rowOf({ billing: null }).concept, "Compra ACO PRO");
});

test("billingRows formats the amount from the lowest denomination in its currency", () => {
  assert.equal(rowOf({ total: "7900" }).amount, "US$79");
  assert.equal(rowOf({ total: "6810" }).amount, "US$68.10");
  assert.match(
    rowOf({ total: "129050", currency_code: "MXN" }).amount,
    /^1290,50\sMXN$/
  );
});

test("billingRows shows the billing date in Spanish", () => {
  assert.equal(rowOf().date, "7 de octubre de 2026");
  assert.equal(rowOf({ billed_at: null }).date, "");
});

test("billingRows labels each Paddle status", () => {
  const statusOf = (status) => {
    const row = rowOf({ status });
    return [row.statusLabel, row.statusTone];
  };

  assert.deepEqual(statusOf("completed"), ["Pagado", "ok"]);
  assert.deepEqual(statusOf("paid"), ["Pagado", "ok"]);
  assert.deepEqual(statusOf("billed"), ["Facturado", "info"]);
  assert.deepEqual(statusOf("past_due"), ["Pago pendiente", "warning"]);
  assert.deepEqual(statusOf("canceled"), ["Cancelado", "muted"]);
});

test("billingRows tells full and partial refunds apart from the adjusted total", () => {
  assert.equal(rowOf({ adjusted_total: "0" }).statusLabel, "Reembolsado");
  assert.equal(
    rowOf({ adjusted_total: "3900" }).statusLabel,
    "Reembolso parcial"
  );
  assert.equal(
    rowOf({ total: "0", adjusted_total: "0" }).statusLabel,
    "Pagado"
  );
  assert.equal(
    rowOf({ status: "billed", adjusted_total: "0" }).statusLabel,
    "Facturado"
  );
});

test("billingRows keeps the transaction id and whether it has an invoice", () => {
  assert.equal(rowOf().id, "txn_01");
  assert.equal(rowOf().hasInvoice, true);
  assert.equal(rowOf({ has_invoice: false }).hasInvoice, false);
});

test("cardLabel describes the card with its brand, last digits and expiry", () => {
  const card = {
    brand: "visa",
    last4: "4242",
    expiry_month: 12,
    expiry_year: 2030,
  };

  assert.equal(cardLabel(card), "Visa terminada en 4242 · vence 12/2030");
  assert.equal(
    cardLabel({ ...card, brand: "mastercard", expiry_month: 3 }),
    "Mastercard terminada en 4242 · vence 03/2030"
  );
  assert.equal(
    cardLabel({ ...card, brand: "unknown" }),
    "Tarjeta terminada en 4242 · vence 12/2030"
  );
});

test("cardLabel has nothing to show without a card", () => {
  assert.equal(cardLabel(null), null);
});
