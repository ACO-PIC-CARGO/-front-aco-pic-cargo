import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatPrice,
  maxMonthsSaved,
  moduleNames,
  toPlanView,
  userLabel,
} from "../../../src/components/SubscriptionPackages/packageView.js";
import { START, PRO } from "./fixtures.js";

test("formatPrice drops cents only when the amount is whole", () => {
  assert.equal(formatPrice("290.00"), "US$290");
  assert.equal(formatPrice(1290), "US$1,290");
  assert.equal(formatPrice(29.5), "US$29.50");
});

test("userLabel pluralizes", () => {
  assert.equal(userLabel(1), "1 usuario");
  assert.equal(userLabel(3), "3 usuarios");
});

test("a package with a selection limit lists the modules as choices", () => {
  const plan = toPlanView(START);

  assert.deepEqual(plan.includes.slice(0, 3), [
    { text: "1 módulo a elegir" },
    { text: "Puedes elegir: Pricing o Operativo o Administración" },
    {
      text: "Si eliges Pricing:",
      details: [
        "Reporte de vendedores por status y mercado",
        "Acceso a ingreso y seguimiento de llamadas",
      ],
      conditional: true,
    },
  ]);
  assert.deepEqual(plan.includes[4], {
    text: "Si eliges Administración:",
    conditional: true,
  });
  assert.deepEqual(plan.includes.slice(5), [
    { text: "Sistema 100% online" },
    { text: "Soporte básico" },
  ]);
});

test("a package without a selection limit includes every module", () => {
  const plan = toPlanView(PRO);

  assert.deepEqual(plan.includes.slice(0, 2), [
    { text: "Todos los módulos incluidos" },
    {
      text: "Pricing",
      details: [
        "Reporte de vendedores por status y mercado",
        "Acceso a ingreso y seguimiento de llamadas",
      ],
    },
  ]);
  assert.deepEqual(plan.highlights, [
    "3 módulos incluidos",
    "Flujo conectado entre módulos",
  ]);
});

test("highlights start with the module access and add the highlighted features", () => {
  assert.deepEqual(toPlanView(START).highlights, [
    "1 módulo a elegir",
    "Sistema 100% online",
    "Soporte básico",
  ]);
});

test("excludes list only the general features that are not included", () => {
  assert.deepEqual(toPlanView(START).excludes, [
    "Los 3 módulos al mismo tiempo",
    "Soporte premium",
  ]);
});

test("annual savings show only when the annual price beats twelve months", () => {
  assert.equal(toPlanView(START).savings, "US$58");
  assert.equal(toPlanView(PRO).savings, null);
});

test("the plan view carries prices, users and flags", () => {
  const plan = toPlanView(PRO);

  assert.equal(plan.monthlyPrice, "US$79");
  assert.equal(plan.annualPrice, "US$948");
  assert.equal(plan.users, "3 usuarios");
  assert.equal(plan.featured, true);
  assert.equal(plan.isActive, false);
});

test("maxMonthsSaved reports the best annual deal", () => {
  assert.equal(maxMonthsSaved([START, PRO]), 2);
  assert.equal(maxMonthsSaved([PRO]), 0);
});

test("moduleNames lists each module once across packages", () => {
  assert.deepEqual(moduleNames([START, PRO]), [
    "Pricing",
    "Operativo",
    "Administración",
  ]);
});
