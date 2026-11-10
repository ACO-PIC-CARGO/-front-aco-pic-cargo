import type { ContenedorCantidad, DatosPrincipales } from "@/types/cotizacion";
import type { EmailTableField } from "@/types/providerQuoteEmailTemplate";

export const EMAIL_TABLE_FIELDS: { value: EmailTableField; title: string }[] = [
  { value: "incoterm", title: "Incoterm" },
  { value: "pickup_address", title: "Dirección del proveedor (EXW)" },
  { value: "port_of_loading", title: "Puerto de origen" },
  { value: "port_of_discharge", title: "Puerto de destino" },
  { value: "containers", title: "Contenedores" },
  { value: "packages", title: "Bultos" },
  { value: "weight", title: "Peso" },
  { value: "volume", title: "Volumen" },
  { value: "commodity", title: "Tipo de mercancía" },
  { value: "marketing_type", title: "Tipo de marketing" },
  { value: "quote_status", title: "Estado de la cotización" },
  { value: "executive", title: "Ejecutivo" },
  { value: "pricing_user", title: "Pricing" },
  { value: "client_name", title: "Nombre del cliente" },
  { value: "client_phone", title: "Teléfono del cliente" },
  { value: "direction", title: "Sentido" },
  { value: "shipment_type", title: "Tipo de embarque" },
  { value: "provider_name", title: "Nombre del proveedor" },
  { value: "provider_phone", title: "Teléfono del proveedor" },
  { value: "provider", title: "Proveedor" },
  { value: "load_type", title: "Individual o grupal" },
  { value: "import_order", title: "Primera o segunda importación" },
];

export type EmailFieldValues = Partial<Record<EmailTableField, string | number | ContenedorCantidad[] | null | undefined>>;

export interface Named {
  id: number | string;
  name: string;
}

export interface QuoteEmailLists {
  incoterms: Named[];
  portsOfLoading: Named[];
  portsOfDischarge: Named[];
  marketing: Named[];
  statuses: Named[];
  staff: Named[];
  directions: Named[];
  shipmentTypes: Named[];
  providers: Named[];
  importOrders: Named[];
}

const idOf = (value: unknown): unknown =>
  value !== null && typeof value === "object" ? (value as { id?: unknown }).id : value;

const nameOf = (list: Named[], id: unknown): string | null =>
  list.find((item) => item.id == idOf(id))?.name ?? null;

const containersText = (containers: ContenedorCantidad[] | null | undefined): string =>
  (containers ?? [])
    .filter((container) => Number(container.cantidad) > 0)
    .map((container) => `${container.cantidad}x${container.code || container.description || ""}`)
    .join(" + ");

const loadType = (quote: DatosPrincipales): string | null => {
  if (quote.esindividualflag) return "Individual";
  if (quote.esgrupalflag) return "Grupal";
  return null;
};

export function quoteEmailFieldValues(quote: DatosPrincipales, lists: QuoteEmailLists): EmailFieldValues {
  return {
    incoterm: nameOf(lists.incoterms, quote.idincoterms),
    pickup_address: quote.direccionproveedor,
    port_of_loading: nameOf(lists.portsOfLoading, quote.idorigen),
    port_of_discharge: nameOf(lists.portsOfDischarge, quote.iddestino),
    containers: quote.containers,
    packages: quote.numerobultos,
    weight: quote.peso,
    volume: quote.volumen,
    commodity: quote.descripcioncarga,
    marketing_type: nameOf(lists.marketing, quote.id_marketing),
    quote_status: nameOf(lists.statuses, quote.id_status),
    executive: nameOf(lists.staff, quote.id_vendedor),
    pricing_user: nameOf(lists.staff, quote.id_pricing),
    client_name: quote.nombre,
    client_phone: quote.telefono,
    direction: nameOf(lists.directions, quote.idsentido),
    shipment_type: nameOf(lists.shipmentTypes, quote.idtipocarga),
    provider_name: quote.proveedor,
    provider_phone: quote.telefonoproveedor,
    provider: nameOf(lists.providers, quote.id_proveedor),
    load_type: loadType(quote),
    import_order: nameOf(lists.importOrders, quote.id_percepcionaduana),
  };
}

export function fieldValue(field: EmailTableField, values: EmailFieldValues): string {
  if (field === "pickup_address" && values.incoterm !== "EXW") return "";
  const value = values[field];
  if (field === "containers") return containersText(value as ContenedorCantidad[] | null | undefined);
  return value === null || value === undefined ? "" : String(value).trim();
}
