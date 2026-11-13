import { describe, expect, test } from "vitest";
import { EMAIL_TABLE_FIELDS, fieldValue, quoteEmailFieldValues, quoteShipmentId } from "@/utils/providerQuoteEmailFields";
import type { QuoteEmailLists } from "@/utils/providerQuoteEmailFields";

const lists: QuoteEmailLists = {
  incoterms: [{ id: 3, name: "EXW" }],
  portsOfLoading: [{ id: 10, name: "SHANGHAI" }],
  portsOfDischarge: [{ id: 20, name: "CALLAO" }],
  marketing: [{ id: 1, name: "FACEBOOK" }],
  statuses: [{ id: 2, name: "COTIZANDO" }],
  staff: [{ id: 7, name: "ANA PAZ" }, { id: 8, name: "LUIS RUIZ" }],
  directions: [{ id: 1, name: "Importación" }],
  shipmentTypes: [{ id: 4, name: "LCL" }],
  providers: [{ id: 50, name: "ACME LTD" }],
  importOrders: [{ id: 1, name: "Primera importación" }],
};

const quote = {
  idincoterms: 3, idorigen: 10, iddestino: 20, id_marketing: 1, id_status: 2, id_vendedor: 7, id_pricing: 8,
  idsentido: 1, idtipocarga: 4, id_proveedor: 50, id_percepcionaduana: 1,
  nombre: "ACME SAC", telefono: "999", proveedor: "Ming", telefonoproveedor: "+86 1", direccionproveedor: "Av. 1",
  numerobultos: 2, peso: 1500, volumen: 12, descripcioncarga: "Repuestos", containers: [],
  esindividualflag: true, esgrupalflag: false,
};

describe("the data a provider email row can show", () => {
  test("every catalog key resolves from the quote and its lists", () => {
    const values = quoteEmailFieldValues(quote, lists);

    expect(EMAIL_TABLE_FIELDS.map(({ value }) => [value, fieldValue(value, values)])).toEqual([
      ["incoterm", "EXW"], ["pickup_address", "Av. 1"], ["port_of_loading", "SHANGHAI"], ["port_of_discharge", "CALLAO"],
      ["containers", ""], ["packages", "2"], ["weight", "1500"], ["volume", "12"], ["commodity", "Repuestos"],
      ["marketing_type", "FACEBOOK"], ["quote_status", "COTIZANDO"], ["executive", "ANA PAZ"], ["pricing_user", "LUIS RUIZ"],
      ["client_name", "ACME SAC"], ["client_phone", "999"], ["direction", "Importación"], ["shipment_type", "LCL"],
      ["provider_name", "Ming"], ["provider_phone", "+86 1"], ["provider", "ACME LTD"], ["load_type", "Individual"],
      ["import_order", "Primera importación"],
    ]);
  });

  test("the pickup address shows only for EXW", () => {
    expect(fieldValue("pickup_address", { incoterm: "FOB", pickup_address: "Av. 1" })).toBe("");
  });

  test("containers read as quantity x code joined by +", () => {
    const containers = [{ cantidad: 2, code: "20S" }, { cantidad: 1, description: "40 HC" }, { cantidad: 0, code: "40S" }];
    expect(fieldValue("containers", { containers } as never)).toBe("2x20S + 1x40 HC");
  });

  test("a group quote reads Grupal and a quote with neither flag reads nothing", () => {
    expect(fieldValue("load_type", quoteEmailFieldValues({ ...quote, esindividualflag: false, esgrupalflag: true }, lists))).toBe("Grupal");
    expect(fieldValue("load_type", quoteEmailFieldValues({ ...quote, esindividualflag: false }, lists))).toBe("");
  });

  test("ids whose lists are not loaded yet give empty values, never 'undefined'", () => {
    const empty = Object.fromEntries(Object.keys(lists).map((key) => [key, []])) as unknown as QuoteEmailLists;
    const values = quoteEmailFieldValues(quote, empty);

    expect(["incoterm", "port_of_loading", "executive", "provider", "import_order"].map((field) => fieldValue(field as never, values)))
      .toEqual(["", "", "", "", ""]);
  });

  test("a zero is kept and a blank text is empty", () => {
    expect(fieldValue("weight", { weight: 0 })).toBe("0");
    expect(fieldValue("commodity", { commodity: "  " })).toBe("");
  });
});

describe("the shipment type whose template a rate request uses", () => {
  test("is the quote's shipment type whether the form holds its id, its id as text or the whole type", () => {
    expect(quoteShipmentId({ idtipocarga: 4 })).toBe(4);
    expect(quoteShipmentId({ idtipocarga: "4" })).toBe(4);
    expect(quoteShipmentId({ idtipocarga: { id: 4, embarque: "LCL" } })).toBe(4);
  });

  test("is none when the quote has no shipment type yet", () => {
    expect(quoteShipmentId({ idtipocarga: "" })).toBeNull();
    expect(quoteShipmentId({})).toBeNull();
  });
});
