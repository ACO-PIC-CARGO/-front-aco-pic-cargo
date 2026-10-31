import { expect, test } from "vitest";
import { emptyHouseFilter, houseListParams } from "@/components/HouseFile/houseListFilters";
import type { FiltroExpedientesRaiz } from "@/types/app";

test("sends each filter under the name the house list reads", () => {
  const filter = {
    ...emptyHouseFilter(),
    id_master: 9,
    id_sentido: 1,
    id_tipo_embarque: { id: 3, id_transport: 1 },
    id_origen: 10,
    id_destino: 11,
    id_cliente: 12,
    fecha_etd_desde: "2026-01-01",
    fecha_etd_hasta: "2026-01-31",
    fecha_eta_desde: "2026-02-01",
    fecha_eta_hasta: "2026-02-28",
  } as FiltroExpedientesRaiz;

  expect(houseListParams(filter)).toStrictEqual({
    id_master: 9,
    id_modality: 1,
    id_shipment: 3,
    id_origin: 10,
    id_destino: 11,
    id_cliente: 12,
    fecha_etd_desde: "2026-01-01",
    fecha_etd_hasta: "2026-01-31",
    fecha_eta_desde: "2026-02-01",
    fecha_eta_hasta: "2026-02-28",
  });
});

test("leaves out the filters that are empty", () => {
  expect(houseListParams(emptyHouseFilter())).toStrictEqual({});
  expect(houseListParams({ ...emptyHouseFilter(), id_tipo_embarque: null } as unknown as FiltroExpedientesRaiz)).toStrictEqual({});
});
