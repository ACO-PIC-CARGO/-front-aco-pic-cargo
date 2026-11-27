import { describe, expect, it } from "vitest";
import { fechasPorDefecto, problemaRangoExportar } from "@/utils/controlGastosFechas";

const vacio = { ...fechasPorDefecto(), fechadisponibilidaddesde: null, fechadisponibilidadhasta: null };

describe("fechasPorDefecto", () => {
  it("cubre 3 años: del 1 de enero del año pasado al 31 de diciembre del siguiente", () => {
    const year = new Date().getFullYear();
    expect(fechasPorDefecto()).toMatchObject({
      fechadisponibilidaddesde: `${year - 1}-01-01`,
      fechadisponibilidadhasta: `${year + 1}-12-31`,
    });
  });
});

describe("problemaRangoExportar", () => {
  it("pide reducir el rango por defecto de 3 años antes de exportar", () => {
    expect(problemaRangoExportar(fechasPorDefecto())).toMatch(/1 año/);
  });
  it("exige al menos un rango", () => {
    expect(problemaRangoExportar(vacio)).toMatch(/elige un rango/);
  });
  it("exige Desde y Hasta en el rango usado", () => {
    expect(problemaRangoExportar({ ...vacio, fechaetddesde: "2026-01-01" })).toMatch(/Fecha ETD Desde y Hasta/);
  });
  it("acepta justo un año y rechaza más", () => {
    expect(problemaRangoExportar({ ...vacio, fechaetadesde: "2025-11-26", fechaetahasta: "2026-11-26" })).toBeNull();
    expect(problemaRangoExportar({ ...vacio, fechaetadesde: "2025-11-25", fechaetahasta: "2026-11-26" })).toMatch(/1 año/);
  });
  it("valida cada rango lleno aunque otro esté bien", () => {
    expect(
      problemaRangoExportar({
        ...vacio,
        fechadisponibilidaddesde: "2026-01-01",
        fechadisponibilidadhasta: "2026-06-30",
        fechaetddesde: "2024-01-01",
        fechaetdhasta: "2026-01-01",
      }),
    ).toMatch(/Fecha ETD/);
  });
});
