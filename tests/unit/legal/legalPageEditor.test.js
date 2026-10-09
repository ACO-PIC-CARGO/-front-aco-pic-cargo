import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LEGAL_MESSAGES,
  findPlaceholders,
  formatUpdatedAt,
  hasErrors,
  isDirty,
  moveSection,
  toDraft,
  toPayload,
  validateDraft,
} from "../../../src/views/Legal/legalPageEditor.js";

const page = {
  title: "Política de reembolsos",
  sections: [
    {
      heading: "Reembolsos",
      paragraphs: [
        "Dentro de [Plazo de reembolso].",
        "Escríbenos a [Correo de soporte].",
      ],
    },
    { heading: "Cobros", paragraphs: ["Escríbenos a [Correo de soporte]."] },
  ],
};
const draftWith = (sections, title = "Título") => ({
  title,
  sections: sections.map((section, index) => ({
    key: `k${index}`,
    ...section,
  })),
});

test("a page survives the trip through the editor unchanged", () => {
  assert.deepEqual(toPayload(toDraft(page)), page);
});

test("a blank line separates paragraphs and surrounding spaces are dropped", () => {
  const draft = draftWith(
    [
      {
        heading: "  Uno  ",
        text: " primero \n  \n\nsegundo\nmisma línea \n\n ",
      },
    ],
    "  Título  "
  );
  assert.deepEqual(toPayload(draft), {
    title: "Título",
    sections: [
      { heading: "Uno", paragraphs: ["primero", "segundo\nmisma línea"] },
    ],
  });
});

test("an untouched page has no errors", () => {
  assert.equal(hasErrors(validateDraft(toDraft(page))), false);
});

test("the title must have between 1 and 120 characters", () => {
  assert.equal(
    validateDraft(draftWith([{ heading: "a", text: "b" }], "   ")).title,
    LEGAL_MESSAGES.title
  );
  assert.equal(
    validateDraft(draftWith([{ heading: "a", text: "b" }], "x".repeat(121)))
      .title,
    LEGAL_MESSAGES.title
  );
  assert.equal(
    validateDraft(draftWith([{ heading: "a", text: "b" }], "x".repeat(120)))
      .title,
    ""
  );
});

test("a page needs between 1 and 40 sections", () => {
  assert.equal(validateDraft(draftWith([])).sections, LEGAL_MESSAGES.sections);
  const many = Array.from({ length: 41 }, () => ({ heading: "a", text: "b" }));
  assert.equal(
    validateDraft(draftWith(many)).sections,
    LEGAL_MESSAGES.sections
  );
  assert.equal(validateDraft(draftWith(many.slice(0, 40))).sections, "");
});

test("each section needs a heading of up to 150 characters", () => {
  const [empty, long, fine] = validateDraft(
    draftWith([
      { heading: " ", text: "b" },
      { heading: "x".repeat(151), text: "b" },
      { heading: "x".repeat(150), text: "b" },
    ])
  ).items;
  assert.equal(empty.heading, LEGAL_MESSAGES.heading);
  assert.equal(long.heading, LEGAL_MESSAGES.heading);
  assert.equal(fine.heading, "");
});

test("each section needs text: up to 20 paragraphs and 6000 characters", () => {
  const paragraphs = (count) =>
    Array.from({ length: count }, () => "p").join("\n\n");
  const [empty, tooMany, tooLong, atLimit] = validateDraft(
    draftWith([
      { heading: "a", text: " \n\n " },
      { heading: "a", text: paragraphs(21) },
      { heading: "a", text: "x".repeat(6001) },
      { heading: "a", text: `${"x".repeat(3000)}\n\n${"x".repeat(3000)}` },
    ])
  ).items;
  assert.equal(empty.text, LEGAL_MESSAGES.text);
  assert.equal(tooMany.text, LEGAL_MESSAGES.text);
  assert.equal(tooLong.text, LEGAL_MESSAGES.text);
  assert.equal(atLimit.text, "");
});

test("a page too large to send is rejected before saving", () => {
  const sections = Array.from({ length: 16 }, () => ({
    heading: "a",
    text: "x".repeat(6000),
  }));
  assert.equal(validateDraft(draftWith(sections)).size, LEGAL_MESSAGES.size);
  assert.equal(hasErrors(validateDraft(draftWith(sections))), true);
  assert.equal(validateDraft(draftWith(sections.slice(0, 14))).size, "");
});

test("only real content changes count as unsaved", () => {
  const draft = toDraft(page);
  assert.equal(isDirty(draft, page), false);
  draft.sections[0].text += "  \n";
  assert.equal(isDirty(draft, page), false);
  draft.sections[1].heading = "Cobros indebidos";
  assert.equal(isDirty(draft, page), true);
});

test("data still to fill is listed once, in order of appearance", () => {
  assert.deepEqual(findPlaceholders(toDraft(page)), [
    "[Plazo de reembolso]",
    "[Correo de soporte]",
  ]);
  assert.deepEqual(
    findPlaceholders(draftWith([{ heading: "a", text: "sin [cerrar" }])),
    []
  );
});

test("a section moves one place and stays put at the edges", () => {
  const sections = ["a", "b", "c"];
  assert.deepEqual(moveSection(sections, 2, -1), ["a", "c", "b"]);
  assert.deepEqual(moveSection(sections, 0, 1), ["b", "a", "c"]);
  assert.deepEqual(moveSection(sections, 0, -1), sections);
  assert.deepEqual(moveSection(sections, 2, 1), sections);
});

test("a missing update date shows nothing", () => {
  assert.equal(formatUpdatedAt(null), "");
  assert.equal(formatUpdatedAt("2026-10-09T12:00:00Z"), "9 de octubre de 2026");
});
