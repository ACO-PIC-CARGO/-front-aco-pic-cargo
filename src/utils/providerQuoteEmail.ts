import type { Numerico } from "@/types/cotizacion";
import type { EmailLanguage, ProviderQuoteEmailTemplate } from "@/types/providerQuoteEmailTemplate";
import { EMAIL_TABLE_FIELDS, fieldValue } from "@/utils/providerQuoteEmailFields";
import type { EmailFieldValues } from "@/utils/providerQuoteEmailFields";

export interface ProviderQuoteShipment {
  quoteNumber: string | number | null | undefined;
  client: string;
  incoterm: string;
  portOfLoading?: string | null;
  portOfDischarge?: string | null;
  weight?: Numerico;
  volume?: Numerico;
}

const CLIENT_LABEL = { es: "CLIENTE", en: "CLIENT" } as const;
const KNOWN_FIELDS = new Set(EMAIL_TABLE_FIELDS.map(({ value }) => value));
const CELL = 'style="padding: 8px; border: 1px solid #333;"';

const escapeHtml = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const buildProviderQuoteEmail = (template: ProviderQuoteEmailTemplate, values: EmailFieldValues): string => {
  const header = `<tr style="background-color: #eeeeee;">${template.table_header
    .map((text) => `<th ${CELL}>${escapeHtml(text)}</th>`)
    .join("")}</tr>`;
  const body = template.table_rows
    .filter(({ field }) => KNOWN_FIELDS.has(field))
    .map(({ field, label }) => [label, fieldValue(field, values)] as const)
    .filter(([, value]) => value !== "")
    .map(([label, value]) => `<tr><td ${CELL}>${escapeHtml(label)}</td><td ${CELL}>${escapeHtml(value)}</td></tr>`)
    .join("");
  return `<div style="font-family: Arial, sans-serif;">${template.intro_html}<table border="1" style="border-collapse: collapse; width: 100%; max-width: 800px;">${header}${body}</table>${template.closing_html}</div>`;
};

export const buildProviderQuoteSubject = (language: EmailLanguage, shipment: ProviderQuoteShipment): string =>
  `QUOTE${shipment.quoteNumber ?? ""} ${shipment.incoterm} ${shipment.portOfLoading ?? ""} - ${shipment.portOfDischarge ?? ""}  ${
    shipment.weight ?? ""
  }KGS / ${shipment.volume ?? ""}M3 | ${CLIENT_LABEL[language]}: ${shipment.client}`;
