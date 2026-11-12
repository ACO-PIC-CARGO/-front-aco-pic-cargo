import { modalityLabel, transportIcon } from "@/components/folderPricing/QuoteClientHistory/quoteHistoryLabels";
import type { QuoteNotice } from "./quoteNotificationApi";

export interface NoticeDetail {
  label: string;
  value: string;
  icon: string;
  highlight?: boolean;
}

const formatNumber = (value: number, minimumFractionDigits: number) =>
  value.toLocaleString("en-US", { minimumFractionDigits, maximumFractionDigits: 2 });

const positive = (value: number | null) => (value !== null && Number(value) > 0 ? Number(value) : null);

const present = (rows: (NoticeDetail | null)[]) => rows.filter((row): row is NoticeDetail => row !== null);

const detail = (label: string, value: string | null | undefined, icon: string, highlight = false): NoticeDetail | null =>
  value ? { label, value, icon, highlight } : null;

export function noticeDetails(notice: QuoteNotice): NoticeDetail[] {
  const goodsValue = positive(notice.goods_value);
  const transport = transportIcon(notice.transport_name);
  return present([
    detail("Cotización N.°", notice.quote_code, "mdi-file-document-outline"),
    detail("Cliente", notice.client_name, "mdi-account-outline"),
    detail("Teléfono", notice.client_phone, "mdi-phone-outline"),
    detail("Tipo de embarque", modalityLabel(notice), transport, true),
    detail("Origen", notice.origin, transport),
    detail("Valor", goodsValue === null ? null : `USD ${formatNumber(goodsValue, 0)}`, "mdi-cash-multiple"),
  ]);
}

export function noticeMeasures(notice: QuoteNotice): NoticeDetail[] {
  const weight = positive(notice.weight);
  const volume = positive(notice.volume);
  return present([
    detail("Peso", weight === null ? null : `${formatNumber(weight, 0)} kg`, "mdi-weight-kilogram"),
    detail("Volumen", volume === null ? null : `${formatNumber(volume, 2)} m³`, "mdi-cube-outline"),
  ]);
}

export const sentToClientMessage = (notice: QuoteNotice): string =>
  `${notice.created_by_name ?? "Un usuario"} ya le envió la cotización.`;

export const pricingRequestDetails = (notice: QuoteNotice): NoticeDetail[] =>
  present([
    detail("Vendedor", notice.created_by_name, "mdi-account-outline"),
    detail("Cotización N.°", notice.quote_code, "mdi-file-document-outline"),
    detail("Tipo de Embarque", modalityLabel(notice), transportIcon(notice.transport_name), true),
    detail("Notas", notice.pricing_notes, "mdi-message-text-outline"),
  ]);
