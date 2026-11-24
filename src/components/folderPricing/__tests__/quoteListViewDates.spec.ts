import { describe, expect, test } from "vitest";
import moment from "moment";
import { defaultViewDates, viewDatesProblem } from "../quoteListViewDates";

const today = moment("2026-11-23");

describe("defaultViewDates", () => {
  test("Solicitadas por Ventas opens on the last 30 days and Enviadas al Cliente on the last 10", () => {
    expect(defaultViewDates("pending_send", today)).toEqual({ view_date_from: "2026-10-24", view_date_to: "2026-11-23" });
    expect(defaultViewDates("sent_to_client", today)).toEqual({ view_date_from: "2026-11-13", view_date_to: "2026-11-23" });
  });

  test("the other lists have no view dates", () => {
    expect(defaultViewDates("", today)).toEqual({});
    expect(defaultViewDates("returned", today)).toEqual({});
  });
});

describe("viewDatesProblem", () => {
  test("a tab with dates needs both ends of the range", () => {
    expect(viewDatesProblem("pending_send", { view_date_from: "2026-10-24", view_date_to: "2026-11-23" })).toBeNull();
    expect(viewDatesProblem("pending_send", { view_date_from: "2026-10-24", view_date_to: null })).toBe(
      "Debes seleccionar la Fecha de solicitud a Pricing Hasta.",
    );
    expect(viewDatesProblem("sent_to_client", { view_date_from: "", view_date_to: "2026-11-23" })).toBe(
      "Debes seleccionar la Fecha de envío al cliente Desde.",
    );
  });

  test("an empty range or a list without view dates is fine", () => {
    expect(viewDatesProblem("pending_send", {})).toBeNull();
    expect(viewDatesProblem("", { view_date_from: "2026-10-24" })).toBeNull();
  });
});
