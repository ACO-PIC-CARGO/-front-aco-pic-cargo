import type { ClientQuoteHistoryItem } from "./useClientQuoteHistory";

const number = (value: number | null, fractionDigits: number) =>
  Number(value ?? 0).toLocaleString("en-US", { minimumFractionDigits: fractionDigits, maximumFractionDigits: 2 });

const TRANSPORT_ICONS: Record<string, string> = {
  "Marítimo": "mdi-ferry",
  "Aéreo": "mdi-airplane",
  "Terrestre": "mdi-truck",
};

export function modalityLabel(item: ClientQuoteHistoryItem): string {
  const shipment = item.shipment_name ?? "";
  if (item.containers.length) return `${shipment} ${item.containers.map((container) => container.name).join(", ")}`;
  if (shipment !== "LCL") return shipment;
  if (item.group_flag) return `${shipment} Grupal`;
  if (item.individual_flag) return `${shipment} Individual`;
  return shipment;
}

export function modalityColor(item: ClientQuoteHistoryItem): string {
  if (item.individual_flag) return "success";
  if (item.group_flag) return "info";
  return "primary";
}

export function cargoDetail(item: ClientQuoteHistoryItem): string {
  if (item.containers.length) {
    return item.containers.map((container) => `Contenedor: ${container.name} | Cantidad: ${container.cantidad}`).join(", ");
  }
  const weight = `Peso: ${number(item.weight, 0)} kg`;
  return Number(item.volume) > 0 ? `${weight} | Volumen: ${number(item.volume, 2)} m³` : weight;
}

export function transportIcon(transportName: string | null): string {
  return TRANSPORT_ICONS[transportName ?? ""] ?? "mdi-package-variant";
}

export function money(value: number): string {
  return number(value, 2);
}
