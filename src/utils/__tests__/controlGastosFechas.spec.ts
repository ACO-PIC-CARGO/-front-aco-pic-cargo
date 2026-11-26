import { describe, expect, it } from "vitest";
import { fechasPorDefecto, problemaRangoExportar } from "@/utils/controlGastosFechas";

const vacio = { ...fechasPorDefecto(), fechadisponibilidaddesde: null, fechadisponibilidadhasta: null };

describe("problemaRangoExportar", () => {
  it("acepta el rango por defecto (1 de enero a hoy)", () => {
    expect(problemaRangoExportar(fechasPorDefecto())).toBeNull();
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
      problemaRangoExportar({ ...fechasPorDefecto(), fechaetddesde: "2024-01-01", fechaetdhasta: "2026-01-01" }),
    ).toMatch(/Fecha ETD/);
  });
});
