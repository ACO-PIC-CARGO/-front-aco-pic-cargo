export type HouseNoticeField =
  | "id_proveedor"
  | "emailaddress_clientefinal"
  | "fecha_etd"
  | "fecha_eta";

export interface HouseNoticeRequirement {
  field: HouseNoticeField;
  label: string;
  icon: string;
}

export const HOUSE_NOTICE_REQUIREMENTS: HouseNoticeRequirement[] = [
  { field: "id_proveedor", label: "Proveedor", icon: "mdi-truck" },
  { field: "emailaddress_clientefinal", label: "Correo del cliente", icon: "mdi-email" },
  { field: "fecha_etd", label: "Fecha ETD", icon: "mdi-calendar-month" },
  { field: "fecha_eta", label: "Fecha ETA", icon: "mdi-calendar-month" },
];

export function missingHouseNoticeRequirements(house: Partial<Record<HouseNoticeField, unknown>>): HouseNoticeRequirement[] {
  return HOUSE_NOTICE_REQUIREMENTS.filter(({ field }) => !house[field]);
}
