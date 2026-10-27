import type { HouseDetalle, ServicioHouse } from "@/types/operaciones";

export interface HouseEditForm {
  id: number | null;
  id_cot: number | null;
  id_quoteaduana: number | null;
  id_modality: number | null;
  id_shipment: number | null;
  id_incoterms: number | null;
  id_port_begin: number | null;
  id_port_end: number | null;
  id_proveedor: number | null;
  id_consigner: number | null;
  id_consigner_real: number | null;
  id_notify: number | null;
  id_aerolinea: number | null;
  id_coloader: number | null;
  id_naviera: number | null;
  nro_hbl: string;
  id_motonave: number | null;
  nro_viaje: string;
  bultos: number | null;
  peso: number | null;
  volumen: number | null;
  id_conditions: number | null;
  id_moneda: number | null;
  monto: number | null;
  nro_declaracion_aduana: string;
  canal_aduana: string;
}

const MISSING_PARTIES = "Elige el cliente HBL y el proveedor para guardar.";

const toNumber = (value: unknown): number | null =>
  value === null || value === undefined || value === "" ? null : Number(value);

const toText = (value: unknown): string => (value === null || value === undefined ? "" : String(value));

export const editFormFromHouse = (house: HouseDetalle): HouseEditForm => {
  const source = house as Record<string, unknown>;
  return {
    id: toNumber(source.id),
    id_cot: toNumber(source.id_cot),
    id_quoteaduana: toNumber(source.id_quoteaduana),
    id_modality: toNumber(source.id_modality),
    id_shipment: toNumber(source.id_shipment),
    id_incoterms: toNumber(source.id_incoterms),
    id_port_begin: toNumber(source.id_port_begin),
    id_port_end: toNumber(source.id_port_end),
    id_proveedor: toNumber(source.id_proveedor),
    id_consigner: toNumber(source.id_consigner),
    id_consigner_real: toNumber(source.id_consigner_real),
    id_notify: toNumber(source.id_notify),
    id_aerolinea: toNumber(source.id_aerolinea),
    id_coloader: toNumber(source.id_coloader),
    id_naviera: toNumber(source.id_naviera),
    nro_hbl: toText(source.nro_hbl),
    id_motonave: toNumber(source.id_motonave),
    nro_viaje: toText(source.nro_viaje),
    bultos: toNumber(source.bultos),
    peso: toNumber(source.peso),
    volumen: toNumber(source.volumen),
    id_conditions: toNumber(source.id_conditions),
    id_moneda: toNumber(source.id_moneda),
    monto: toNumber(source.monto),
    nro_declaracion_aduana: toText(source.nro_declaracion_aduana),
    canal_aduana: toText(source.canal_aduana),
  };
};

const orBlank = (value: unknown) => (value === null || value === undefined || value === "" ? "" : value);

export const houseEditPayload = (form: HouseEditForm, services: ServicioHouse[], branchId: number | string) => ({
  id_modality: orBlank(form.id_modality),
  id_shipment: orBlank(form.id_shipment),
  id_consigner_real: orBlank(form.id_consigner_real),
  id_port_begin: orBlank(form.id_port_begin),
  id_port_end: orBlank(form.id_port_end),
  id_proveedor: orBlank(form.id_proveedor),
  id_consigner: orBlank(form.id_consigner),
  id_notify: orBlank(form.id_notify),
  id_aerolinea: orBlank(form.id_aerolinea),
  id_coloader: orBlank(form.id_coloader),
  id_naviera: orBlank(form.id_naviera),
  id_incoterms: orBlank(form.id_incoterms),
  nro_hbl: orBlank(form.nro_hbl),
  id_motonave: orBlank(form.id_motonave),
  nro_viaje: orBlank(form.nro_viaje),
  bultos: orBlank(form.bultos),
  peso: orBlank(form.peso),
  volumen: orBlank(form.volumen),
  id_conditions: orBlank(form.id_conditions),
  id_moneda: orBlank(form.id_moneda),
  monto: orBlank(form.monto),
  id_branch: branchId,
  id_cot: orBlank(form.id_cot),
  id: form.id,
  lstservices: services.map((service) => ({
    id: service.id ?? null,
    id_begend: service.id_begend ?? null,
    nameservice: service.nameservice ?? null,
    status: service.status ? 1 : 0,
    date_service: service.date_service ?? null,
  })),
  nro_declaracion_aduana: orBlank(form.nro_declaracion_aduana),
  canal_aduana: orBlank(form.canal_aduana),
});

export const editFormError = (form: HouseEditForm): string | null =>
  form.id_consigner && form.id_proveedor ? null : MISSING_PARTIES;
