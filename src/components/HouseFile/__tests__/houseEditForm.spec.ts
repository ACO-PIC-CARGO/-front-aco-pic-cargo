import { expect, test } from "vitest";
import { editFormError, editFormFromHouse, houseEditPayload } from "@/components/HouseFile/houseEditForm";
import type { HouseDetalle, ServicioHouse } from "@/types/operaciones";

const house = {
  id: 2892,
  id_master: 77,
  code_master: "2025MBL0001",
  id_cot: "",
  id_quoteaduana: null,
  id_modality: 1,
  id_shipment: "3",
  id_incoterms: 4,
  id_port_begin: 10,
  id_port_end: 11,
  id_proveedor: 20,
  id_consigner: 21,
  id_consigner_real: 22,
  id_notify: 23,
  id_aerolinea: null,
  id_coloader: 24,
  id_naviera: 25,
  nro_hbl: "HBL-9",
  id_motonave: 26,
  nro_viaje: "V12",
  bultos: 5,
  peso: 120.5,
  volumen: 1.2,
  id_conditions: 27,
  id_moneda: 1,
  monto: 300,
  nro_declaracion_aduana: "118-2026-10-000123",
  canal_aduana: "Verde",
} as unknown as HouseDetalle;

const services = [
  { id: 7, id_begend: 3, nameservice: "Flete", status: true, date_service: "2026-10-01" },
  { id: 8, id_begend: 4, nameservice: "Seguro", status: false, date_service: null },
] as unknown as ServicioHouse[];

test("the edit form is built only from the loaded house, with ids as numbers and blanks as null", () => {
  const form = editFormFromHouse(house);
  expect(form).toMatchObject({ id: 2892, id_shipment: 3, id_cot: null, id_quoteaduana: null, nro_viaje: "V12" });
  expect(form.canal_aduana).toBe("Verde");
  expect(editFormFromHouse({} as HouseDetalle)).toMatchObject({ id: null, nro_hbl: "", canal_aduana: "", peso: null });
});

test("the save payload keeps every service of the house and includes the customs data", () => {
  const payload = houseEditPayload(editFormFromHouse(house), services, 22);
  expect(payload).toMatchObject({
    id: 2892,
    id_branch: 22,
    id_modality: 1,
    id_shipment: 3,
    id_consigner: 21,
    id_proveedor: 20,
    nro_hbl: "HBL-9",
    nro_viaje: "V12",
    peso: 120.5,
    nro_declaracion_aduana: "118-2026-10-000123",
    canal_aduana: "Verde",
    id_cot: "",
    id_aerolinea: "",
  });
  expect(payload.lstservices).toStrictEqual([
    { id: 7, id_begend: 3, nameservice: "Flete", status: 1, date_service: "2026-10-01" },
    { id: 8, id_begend: 4, nameservice: "Seguro", status: 0, date_service: null },
  ]);
});

test("a house needs a client and a provider before saving", () => {
  const form = editFormFromHouse(house);
  expect(editFormError(form)).toBeNull();
  expect(editFormError({ ...form, id_consigner: null })).toBe("Elige el cliente HBL y el proveedor para guardar.");
  expect(editFormError({ ...form, id_proveedor: null })).toBe("Elige el cliente HBL y el proveedor para guardar.");
});
