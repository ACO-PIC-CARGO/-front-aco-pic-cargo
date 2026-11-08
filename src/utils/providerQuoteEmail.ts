import type { ContenedorCantidad, Numerico } from "@/types/cotizacion";
import type { EmailLanguage, ProviderQuoteEmailTemplate } from "@/types/providerQuoteEmailTemplate";

export interface ProviderQuoteShipment {
  quoteNumber: string | number | null | undefined;
  client: string;
  incoterm: string;
  pickupAddress?: string | null;
  portOfLoading?: string | null;
  portOfDischarge?: string | null;
  containers?: ContenedorCantidad[] | null;
  weight?: Numerico;
  volume?: Numerico;
  commodity?: string | null;
}

const LABELS = {
  es: {
    header: ["Concepto", "Detalle"],
    incoterm: "Incoterm",
    pickupAddress: "Dirección de recojo",
    portOfLoading: "Puerto de salida",
    portOfDischarge: "Puerto de llegada",
    containers: "Contenedores",
    weight: "Peso (kg)",
    volume: "Volumen (m³)",
    commodity: "Tipo de mercancía",
    client: "CLIENTE",
  },
  en: {
    header: ["Item", "Detail"],
    incoterm: "Incoterm",
    pickupAddress: "Pickup address",
    portOfLoading: "Port of loading",
    portOfDischarge: "Port of discharge",
    containers: "Containers",
    weight: "Weight (kg)",
    volume: "Volume (m³)",
    commodity: "Commodity",
    client: "CLIENT",
  },
} as const;

const CELL = 'style="padding: 8px; border: 1px solid #333;"';

const escapeHtml = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const hasValue = (value: unknown): boolean => value !== null && value !== undefined && String(value).trim() !== "";

const containersText = (containers: ContenedorCantidad[] | null | undefined): string =>
  (containers ?? [])
    .filter((container) => Number(container.cantidad) > 0)
    .map((container) => `${container.cantidad}x${container.code || container.description || ""}`)
    .join(" + ");

export const buildProviderQuoteEmail = (template: ProviderQuoteEmailTemplate, shipment: ProviderQuoteShipment): string => {
  const labels = LABELS[template.language];
  const data: [string, unknown][] = [
    [labels.incoterm, shipment.incoterm],
    [labels.pickupAddress, shipment.incoterm === "EXW" ? shipment.pickupAddress : null],
    [labels.portOfLoading, shipment.portOfLoading],
    [labels.portOfDischarge, shipment.portOfDischarge],
    [labels.containers, containersText(shipment.containers)],
    [labels.weight, shipment.weight],
    [labels.volume, shipment.volume],
    [labels.commodity, shipment.commodity],
  ];
  const header = `<tr style="background-color: #eeeeee;"><th ${CELL}>${labels.header[0]}</th><th ${CELL}>${labels.header[1]}</th></tr>`;
  const body = data
    .filter(([, value]) => hasValue(value))
    .map(([label, value]) => `<tr><td ${CELL}>${label}</td><td ${CELL}>${escapeHtml(String(value))}</td></tr>`)
    .join("");
  return `<div style="font-family: Arial, sans-serif;">${template.intro_html}<table border="1" style="border-collapse: collapse; width: 100%; max-width: 800px;">${header}${body}</table>${template.closing_html}</div>`;
};

export const buildProviderQuoteSubject = (language: EmailLanguage, shipment: ProviderQuoteShipment): string =>
  `QUOTE${shipment.quoteNumber ?? ""} ${shipment.incoterm} ${shipment.portOfLoading ?? ""} - ${shipment.portOfDischarge ?? ""}  ${
    shipment.weight ?? ""
  }KGS / ${shipment.volume ?? ""}M3 | ${LABELS[language].client}: ${shipment.client}`;
