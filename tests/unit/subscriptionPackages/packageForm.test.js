import { test } from "node:test";
import assert from "node:assert/strict";
import {
  draftFromPackage,
  draftToPackage,
  emptyDraft,
  registrationTrialDaysError,
  toPayload,
  toggleModule,
  validateDraft,
} from "../../../src/components/SubscriptionPackages/packageForm.js";
import { MODULES, START } from "./fixtures.js";

const validDraft = () => ({
  ...emptyDraft(),
  name: "START",
  monthlyPrice: "29",
  annualPrice: "290",
  moduleIds: [6, 1, 3],
  selectionLimit: 1,
});

const feature = (overrides = {}) => ({
  key: overrides.key ?? 1,
  description: "Soporte básico",
  moduleId: null,
  isIncluded: true,
  isHighlighted: false,
  ...overrides,
});

test("an empty draft reports every required field", () => {
  const errors = validateDraft(emptyDraft());

  assert.deepEqual(Object.keys(errors).sort(), [
    "annualPrice",
    "moduleIds",
    "monthlyPrice",
    "name",
  ]);
});

test("a complete draft has no errors", () => {
  assert.deepEqual(validateDraft(validDraft()), {});
});

test("a name over 60 characters is rejected", () => {
  assert.ok(validateDraft({ ...validDraft(), name: "N".repeat(61) }).name);
});

test("a negative price is rejected", () => {
  assert.ok(validateDraft({ ...validDraft(), annualPrice: "-1" }).annualPrice);
});

test("the client cannot pick as many modules as the package has", () => {
  assert.ok(
    validateDraft({ ...validDraft(), selectionLimit: 3 }).selectionLimit
  );
});

test("more than two highlighted features are rejected", () => {
  const features = [1, 2, 3].map((key) =>
    feature({ key, isHighlighted: true })
  );

  assert.ok(validateDraft({ ...validDraft(), features }).features);
});

test("a blank feature is rejected", () => {
  assert.ok(
    validateDraft({
      ...validDraft(),
      features: [feature({ description: "  " })],
    }).features
  );
});

test("toPayload trims text, converts numbers and keeps module features included", () => {
  const draft = {
    ...validDraft(),
    name: "  START ",
    tagline: "  ",
    features: [
      feature({
        description: " Reporte ",
        moduleId: 6,
        isIncluded: false,
        isHighlighted: true,
      }),
    ],
  };

  assert.deepEqual(toPayload(draft), {
    name: "START",
    tagline: null,
    monthly_price: 29,
    annual_price: 290,
    user_limit: 1,
    module_selection_limit: 1,
    is_featured: false,
    trial_enabled: false,
    trial_interval: "day",
    trial_frequency: 15,
    modules: [6, 1, 3],
    features: [
      {
        description: "Reporte",
        module_id: 6,
        is_included: true,
        is_highlighted: false,
      },
    ],
  });
});

test("an excluded feature is never sent as highlighted nor counts toward the limit", () => {
  const features = [
    feature({ key: 1, isHighlighted: true }),
    feature({ key: 2, isHighlighted: true }),
    feature({ key: 3, isIncluded: false, isHighlighted: true }),
  ];

  assert.deepEqual(validateDraft({ ...validDraft(), features }), {});
  assert.equal(
    toPayload({ ...validDraft(), features }).features[2].is_highlighted,
    false
  );
});

test("removing a module keeps its features as general ones and lowers the selection", () => {
  const draft = {
    ...validDraft(),
    selectionLimit: 2,
    features: [feature({ moduleId: 3 })],
  };

  const updated = toggleModule(draft, 3);

  assert.deepEqual(updated.moduleIds, [6, 1]);
  assert.equal(updated.features[0].moduleId, null);
  assert.equal(updated.selectionLimit, 1);
});

test("removing a module down to one clears the selection limit", () => {
  const updated = toggleModule(
    { ...validDraft(), moduleIds: [6, 1], selectionLimit: 1 },
    1
  );

  assert.equal(updated.selectionLimit, null);
});

test("toggling an unselected module adds it", () => {
  assert.deepEqual(toggleModule(validDraft(), 49).moduleIds, [6, 1, 3, 49]);
});

test("the preview package keeps only selected modules and tolerates unfinished fields", () => {
  const draft = {
    ...emptyDraft(),
    moduleIds: [3],
    features: [feature({ description: "" }), feature({ key: 2 })],
  };

  const preview = draftToPackage(draft, MODULES);

  assert.deepEqual(preview.modules, [{ id: 3, name: "Administración" }]);
  assert.equal(preview.monthly_price, 0);
  assert.equal(preview.features.length, 1);
  assert.equal(preview.is_active, true);
});

test("a package round-trips through the draft into the same payload", () => {
  const payload = toPayload(draftFromPackage(START));

  assert.equal(payload.name, "START");
  assert.equal(payload.monthly_price, 29);
  assert.equal(payload.module_selection_limit, 1);
  assert.deepEqual(payload.modules, [6, 1, 3]);
  assert.deepEqual(payload.features, START.features);
});

test("registration trial days accept whole numbers from 1 to 365", () => {
  for (const value of [1, "30", "365"]) {
    assert.equal(registrationTrialDaysError(value), null);
  }
});

test("registration trial days reject blanks, decimals and values out of range", () => {
  for (const value of ["", "  ", null, "0", "366", "1.5", "abc", -3]) {
    assert.equal(
      registrationTrialDaysError(value),
      "Escribe entre 1 y 365 días."
    );
  }
});
