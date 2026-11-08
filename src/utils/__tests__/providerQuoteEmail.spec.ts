import { describe, expect, test } from "vitest";
import { buildProviderQuoteEmail, buildProviderQuoteSubject } from "@/utils/providerQuoteEmail";
import type { ProviderQuoteShipment } from "@/utils/providerQuoteEmail";
import type { ProviderQuoteEmailTemplate } from "@/types/providerQuoteEmailTemplate";

const spanish: ProviderQuoteEmailTemplate = { language: "es", intro_html: "<p>INTRO</p>", closing_html: "<p>CIERRE</p>" };
const english: ProviderQuoteEmailTemplate = { language: "en", intro_html: "<p>INTRO</p>", closing_html: "<p>CLOSING</p>" };

const shipment = (over: Partial<ProviderQuoteShipment> = {}): ProviderQuoteShipment => ({
  quoteNumber: 120,
  client: "ACME SAC",
  incoterm: "FOB",
  pickupAddress: "Av. Industrial 123",
  portOfLoading: "SHANGHAI",
  portOfDischarge: "CALLAO",
  containers: [],
  weight: 1500,
  volume: 12,
  commodity: "Repuestos",
  ...over,
});

const rows = (html: string) =>
  [...html.matchAll(/<tr><td[^>]*>(.*?)<\/td><td[^>]*>(.*?)<\/td><\/tr>/g)].map(([, label, value]) => [label, value]);

describe("the email that asks providers for rates", () => {
  test("puts the template's intro before the data table and its closing after it", () => {
    const html = buildProviderQuoteEmail(spanish, shipment());

    expect(html.indexOf("<p>INTRO</p>")).toBeLessThan(html.indexOf("<table"));
    expect(html.indexOf("</table>")).toBeLessThan(html.indexOf("<p>CIERRE</p>"));
  });

  test("lists the shipment data with Spanish labels", () => {
    expect(rows(buildProviderQuoteEmail(spanish, shipment()))).toEqual([
      ["Incoterm", "FOB"],
      ["Puerto de salida", "SHANGHAI"],
      ["Puerto de llegada", "CALLAO"],
      ["Peso (kg)", "1500"],
      ["Volumen (m³)", "12"],
      ["Tipo de mercancía", "Repuestos"],
    ]);
  });

  test("uses English labels for the English template", () => {
    expect(rows(buildProviderQuoteEmail(english, shipment())).map(([label]) => label)).toEqual([
      "Incoterm",
      "Port of loading",
      "Port of discharge",
      "Weight (kg)",
      "Volume (m³)",
      "Commodity",
    ]);
  });

  test("adds the pickup address only for EXW", () => {
    expect(rows(buildProviderQuoteEmail(spanish, shipment({ incoterm: "EXW" })))).toContainEqual([
      "Dirección de recojo",
      "Av. Industrial 123",
    ]);
    expect(rows(buildProviderQuoteEmail(spanish, shipment({ incoterm: "FCA" }))).map(([label]) => label)).not.toContain(
      "Dirección de recojo",
    );
  });

  test("writes containers as quantity x code joined by +, falling back to the description", () => {
    const containers = [
      { cantidad: 2, code: "20S", description: "20' Standard" },
      { cantidad: 1, code: "", description: "40' HC" },
      { cantidad: 0, code: "40NOR", description: "40' NOR" },
    ];

    expect(rows(buildProviderQuoteEmail(spanish, shipment({ containers })))).toContainEqual([
      "Contenedores",
      "2x20S + 1x40' HC",
    ]);
  });

  test("leaves out empty data but keeps a zero", () => {
    const labels = rows(
      buildProviderQuoteEmail(spanish, shipment({ containers: null, weight: 0, volume: "", commodity: null, portOfDischarge: " " })),
    );

    expect(labels).toEqual([
      ["Incoterm", "FOB"],
      ["Puerto de salida", "SHANGHAI"],
      ["Peso (kg)", "0"],
    ]);
  });

  test("escapes the quote values", () => {
    expect(rows(buildProviderQuoteEmail(spanish, shipment({ commodity: "<b>Tools & parts</b>" })))).toContainEqual([
      "Tipo de mercancía",
      "&lt;b&gt;Tools &amp; parts&lt;/b&gt;",
    ]);
  });

  test("keeps today's subject with the client label in the email's language", () => {
    expect(buildProviderQuoteSubject("es", shipment())).toBe("QUOTE120 FOB SHANGHAI - CALLAO  1500KGS / 12M3 | CLIENTE: ACME SAC");
    expect(buildProviderQuoteSubject("en", shipment())).toBe("QUOTE120 FOB SHANGHAI - CALLAO  1500KGS / 12M3 | CLIENT: ACME SAC");
  });
});
