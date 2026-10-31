import { describe, expect, test } from "vitest";
import { activeConcepts, conceptTotals, priceConcept, repriceConcept, repriceConcepts } from "@/utils/accountConcepts";

const TAX = 18;

describe("account concepts", () => {
  test.each([["true"], [true], [1], ["1"]])("a taxed concept (%s) adds the tax to its total and converts it", (afecto) => {
    expect(priceConcept({ concepto: "Flete", monto: "100", afecto }, 4, TAX)).toMatchObject({
      monto: 100,
      igv: 18,
      total: 118,
      montodolar: 25,
      igvdolar: 4.5,
      totaldolar: 29.5,
      afecto: 1,
      status: 1,
    });
  });

  test.each([["false"], [false], [0], [""]])("an untaxed concept (%s) keeps its amount as total", (afecto) => {
    expect(priceConcept({ concepto: "Flete", monto: 100, afecto }, 4, TAX)).toMatchObject({ igv: 0, total: 100, totaldolar: 25, afecto: 0 });
  });

  test("repricing a concept keeps its id and its deleted state", () => {
    expect(priceConcept({ id: 7, concepto: "Flete", monto: 10, afecto: 0, status: 0 }, 1, TAX)).toMatchObject({ id: 7, status: 0 });
  });

  test("editing a concept after deleting an earlier one changes only that concept", () => {
    const deleted = priceConcept({ id: 1, concepto: "Borrado", monto: 10, afecto: 0, status: 0 }, 1, TAX);
    const kept = priceConcept({ id: 2, concepto: "Flete", monto: 20, afecto: 0 }, 1, TAX);
    const other = priceConcept({ id: 3, concepto: "Seguro", monto: 30, afecto: 0 }, 1, TAX);

    kept.monto = 50;
    const concepts = repriceConcept([deleted, kept, other], kept, 1, TAX);

    expect(concepts.map((concept) => [concept.id, concept.total, concept.status])).toEqual([
      [1, 10, 0],
      [2, 50, 1],
      [3, 30, 1],
    ]);
  });

  test("changing the exchange rate converts every concept and does not bring deleted ones back", () => {
    const concepts = repriceConcepts(
      [
        priceConcept({ id: 1, concepto: "Borrado", monto: 10, afecto: 0, status: 0 }, 1, TAX),
        priceConcept({ id: 2, concepto: "Flete", monto: 20, afecto: 0 }, 1, TAX),
      ],
      4,
      TAX,
    );

    expect(activeConcepts(concepts).map((concept) => concept.id)).toEqual([2]);
    expect(concepts[1]!.totaldolar).toBe(5);
  });

  test("the totals add up only the active concepts", () => {
    const concepts = [
      priceConcept({ concepto: "Flete", monto: 100, afecto: "true" }, 4, TAX),
      priceConcept({ concepto: "Seguro", monto: 50, afecto: "false" }, 4, TAX),
      priceConcept({ concepto: "Borrado", monto: 1000, afecto: "true", status: 0 }, 4, TAX),
    ];

    expect(conceptTotals(concepts)).toEqual({ monto: 150, igv: 18, total: 168, montodolar: 37.5, igvdolar: 4.5, totaldolar: 42 });
  });
});
