import { describe, expect, test } from "vitest";
import { buildProviderQuoteEmail, buildProviderQuoteSubject } from "@/utils/providerQuoteEmail";
import type { ProviderQuoteShipment } from "@/utils/providerQuoteEmail";
import type { EmailFieldValues } from "@/utils/providerQuoteEmailFields";
import type { ProviderQuoteEmailTemplate } from "@/types/providerQuoteEmailTemplate";

const spanish: ProviderQuoteEmailTemplate = {
  language: "es",
  intro_html: "<p>INTRO</p>",
  closing_html: "<p>CIERRE</p>",
  table_header: ["Concepto", "Detalle"],
  table_rows: [
    { field: "incoterm", label: "Incoterm" },
    { field: "pickup_address", label: "Recojo" },
    { field: "weight", label: "Peso (kg)" },
    { field: "packages", label: "Bultos" },
    { field: "commodity", label: "Mercancía" },
  ],
};

const values = (over: EmailFieldValues = {}): EmailFieldValues => ({
  incoterm: "FOB",
  pickup_address: "Av. 1",
  weight: 1500,
  packages: 2,
  commodity: "Repuestos",
  ...over,
});

const shipment = (over: Partial<ProviderQuoteShipment> = {}): ProviderQuoteShipment => ({
  quoteNumber: 120,
  client: "ACME SAC",
  incoterm: "FOB",
  portOfLoading: "SHANGHAI",
  portOfDischarge: "CALLAO",
  weight: 1500,
  volume: 12,
  ...over,
});

const rows = (html: string) =>
  [...html.matchAll(/<tr><td[^>]*>(.*?)<\/td><td[^>]*>(.*?)<\/td><\/tr>/g)].map(([, label, value]) => [label, value]);
const headerOf = (html: string) => [...html.matchAll(/<th[^>]*>(.*?)<\/th>/g)].map(([, text]) => text);

describe("the email that asks providers for rates", () => {
  test("puts the template's intro before the data table and its closing after it", () => {
    const html = buildProviderQuoteEmail(spanish, values());

    expect(html.indexOf("<p>INTRO</p>")).toBeLessThan(html.indexOf("<table"));
    expect(html.indexOf("</table>")).toBeLessThan(html.indexOf("<p>CIERRE</p>"));
  });

  test("renders the saved headers and rows in the saved order", () => {
    const html = buildProviderQuoteEmail(spanish, values());

    expect(headerOf(html)).toEqual(["Concepto", "Detalle"]);
    expect(rows(html)).toEqual([
      ["Incoterm", "FOB"],
      ["Peso (kg)", "1500"],
      ["Bultos", "2"],
      ["Mercancía", "Repuestos"],
    ]);
  });

  test("the pickup address follows the EXW rule whatever its row is called", () => {
    expect(rows(buildProviderQuoteEmail(spanish, values({ incoterm: "EXW" })))).toContainEqual(["Recojo", "Av. 1"]);
  });

  test("leaves out empty data but keeps a zero", () => {
    expect(rows(buildProviderQuoteEmail(spanish, values({ weight: 0, packages: "", commodity: null })))).toEqual([
      ["Incoterm", "FOB"],
      ["Peso (kg)", "0"],
    ]);
  });

  test("escapes the quote values", () => {
    expect(rows(buildProviderQuoteEmail(spanish, values({ commodity: "<b>Tools & parts</b>" })))).toContainEqual([
      "Mercancía",
      "&lt;b&gt;Tools &amp; parts&lt;/b&gt;",
    ]);
  });

  test("escapes the headers and row texts the company wrote", () => {
    const template: ProviderQuoteEmailTemplate = {
      ...spanish,
      table_header: ["<b>Dato</b>", "A & B"],
      table_rows: [{ field: "incoterm", label: '"Término"' }],
    };
    const html = buildProviderQuoteEmail(template, values());

    expect(headerOf(html)).toEqual(["&lt;b&gt;Dato&lt;/b&gt;", "A &amp; B"]);
    expect(rows(html)).toEqual([["&quot;Término&quot;", "FOB"]]);
  });

  test("a saved row with a datum this version does not know is left out", () => {
    const template = { ...spanish, table_rows: [{ field: "price" as never, label: "Precio" }, ...spanish.table_rows] };

    expect(rows(buildProviderQuoteEmail(template, values()))[0]).toEqual(["Incoterm", "FOB"]);
  });

  test("keeps today's subject with the client label in the email's language", () => {
    expect(buildProviderQuoteSubject("es", shipment())).toBe("QUOTE120 FOB SHANGHAI - CALLAO  1500KGS / 12M3 | CLIENTE: ACME SAC");
    expect(buildProviderQuoteSubject("en", shipment())).toBe("QUOTE120 FOB SHANGHAI - CALLAO  1500KGS / 12M3 | CLIENT: ACME SAC");
  });
});
