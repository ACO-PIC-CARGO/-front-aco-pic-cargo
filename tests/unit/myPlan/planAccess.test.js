import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canAddUsers,
  isModuleLocked,
  lockedModuleNotice,
  moduleForRoute,
  userLimitNotice,
} from "../../../src/views/MyPlan/planAccess.js";

const menu = [
  {
    id: 8,
    name: "Configuración",
    children: [{ id: "N12", children: [{ id: "S40", route: "listUser" }] }],
  },
  {
    id: 1,
    name: "Operativo",
    children: [
      {
        id: "N2",
        children: [
          { id: "S727", route: "listMaster" },
          { id: "S728", route: "listHouse" },
        ],
      },
    ],
  },
];
const access = (overrides = {}) => ({
  has_plan: true,
  plan_status: "active",
  package_name: "START",
  locked_module_ids: [1, 3],
  user_limit: 1,
  user_count: 5,
  can_add_users: false,
  ...overrides,
});

test("moduleForRoute finds the module of a menu route", () => {
  assert.deepEqual(moduleForRoute(menu, "listHouse"), {
    id: 1,
    name: "Operativo",
  });
  assert.deepEqual(moduleForRoute(menu, "listUser"), {
    id: 8,
    name: "Configuración",
  });
  assert.equal(moduleForRoute(menu, "verQuote"), null);
  assert.equal(moduleForRoute(null, "listHouse"), null);
});

test("isModuleLocked only locks modules the plan excludes", () => {
  assert.equal(isModuleLocked(access(), 1), true);
  assert.equal(isModuleLocked(access(), 6), false);
  assert.equal(isModuleLocked(access({ has_plan: false }), 1), false);
  assert.equal(isModuleLocked(null, 1), false);
});

test("canAddUsers follows the plan and lets companies without a plan add users", () => {
  assert.equal(canAddUsers(access()), false);
  assert.equal(canAddUsers(access({ can_add_users: true })), true);
  assert.equal(canAddUsers(access({ has_plan: false })), true);
  assert.equal(canAddUsers(null), true);
});

test("lockedModuleNotice explains why the module is locked", () => {
  assert.deepEqual(lockedModuleNotice(access(), "Operativo"), {
    title: "Operativo no está en tu plan",
    text: "Tu plan ACO START no incluye Operativo. Mejora tu plan para usarlo.",
  });
  assert.match(
    lockedModuleNotice(access({ plan_status: "canceled" }), "Operativo").text,
    /está cancelado/
  );
  assert.match(
    lockedModuleNotice(access({ plan_status: "paused" }), "Operativo").text,
    /está pausado/
  );
});

test("userLimitNotice tells the limit and the users the company has", () => {
  assert.deepEqual(userLimitNotice(access()), {
    title: "Llegaste al límite de usuarios",
    text: "Tu plan ACO START permite 1 usuario y tu empresa ya tiene 5. Mejora tu plan para agregar más.",
  });
  assert.match(
    userLimitNotice(access({ user_limit: 3, user_count: 3 })).text,
    /permite 3 usuarios/
  );
  assert.match(
    userLimitNotice(access({ plan_status: "canceled" })).text,
    /está cancelado/
  );
});
