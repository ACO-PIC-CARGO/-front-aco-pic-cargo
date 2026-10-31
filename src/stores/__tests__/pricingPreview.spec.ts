import { afterEach, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { usePricingStore } from "@/stores/pricing";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

afterEach(() => vi.useRealTimers());

test("the quote preview is ready as soon as its chosen options are worked out", async () => {
  vi.useFakeTimers();
  setActivePinia(createPinia());
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
  const pricing = usePricingStore();
  Object.assign(pricing, {
    datosEmpresa: [{ business_name: "PIC", address: "Lima", iso_pais: "PE", pais: "Perú", document: "20", phone: "1" }],
    listModality: [{ id: 1, name: "Importación", code: "I" }],
    listShipment: [{ id: 3, embarque: "LCL" }],
    listIncoterms: [{ id: 2, name: "FOB" }],
    datosPrincipales: { ...pricing.datosPrincipales, idsentido: 1, idtipocarga: 3, idincoterms: 2, containers: [] },
    opcionCostos: [
      { nro_propuesta: 1, selected: true, listCostos: [], listImpuestos: [], listNotasQuote: [] },
      { nro_propuesta: 2, selected: false, listCostos: [], listImpuestos: [], listNotasQuote: [] },
    ],
  });

  let ready = false;
  const preview = pricing.predata({ tipo: "PDF" }).then((data) => {
    ready = true;
    return data;
  });
  await vi.advanceTimersByTimeAsync(50);

  expect(ready).toBe(true);
  expect((await preview).OpcionesSelecciondas).toEqual([expect.objectContaining({ nro_propuesta: 1 })]);
});
