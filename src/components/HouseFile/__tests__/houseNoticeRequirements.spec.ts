import { expect, test } from "vitest";
import { missingHouseNoticeRequirements } from "../houseNoticeRequirements";
import type { HouseDetalle } from "@/types/operaciones";

test("notification requires supplier, client email and dates, but not amount", () => {
  const completeHouse = {
    id_proveedor: 5,
    emailaddress_clientefinal: "cliente@example.com",
    fecha_etd: "2026-11-09",
    fecha_eta: "2026-11-10",
  } as HouseDetalle;

  expect(missingHouseNoticeRequirements({ ...completeHouse, monto: null })).toEqual([]);
  expect(missingHouseNoticeRequirements({ ...completeHouse, id_proveedor: null }).map(({ field }) => field)).toEqual(["id_proveedor"]);
});
