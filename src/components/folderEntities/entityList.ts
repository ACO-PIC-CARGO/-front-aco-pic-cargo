import type { EntidadListado } from "@/types/entidades";

/** "2026-10-15" → "15/10/2026"; anything else is shown as it came. */
export function formatCreatedAt(value?: string | null): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? "");
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value ?? "";
}

const digitsOf = (phone?: string | null) => (phone ?? "").replace(/\D/g, "");

/** Phones are stored without the "+" (the forms show it as a prefix). */
export function formatPhone(phone?: string | null): string {
  const value = (phone ?? "").trim();
  if (!value) return "";
  return value.startsWith("+") ? value : `+${value}`;
}

export function whatsappLink(phone?: string | null): string {
  const digits = digitsOf(phone);
  return digits ? `https://wa.me/${digits}` : "";
}

export const isActive = (item: EntidadListado) => item.status == 1;

const SEARCHED_FIELDS: (keyof EntidadListado)[] = [
  "correlativo",
  "nombrecompleto",
  "document",
  "acronym_document",
  "telefono",
  "email",
  "pais",
  "city",
  "address",
  "estado",
  "tipo_proveedor",
];

const normalize = (text: unknown) =>
  String(text ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Every word typed must appear in some field (accents and case ignored); the date matches as shown. */
export function filterEntities(items: EntidadListado[], search: string): EntidadListado[] {
  const words = normalize(search).split(/\s+/).filter(Boolean);
  if (!words.length) return items;
  return items.filter((item) => {
    const text = [...SEARCHED_FIELDS.map((field) => item[field]), formatCreatedAt(item.created_at)]
      .map(normalize)
      .join(" ");
    return words.every((word) => text.includes(word));
  });
}

const KNOWN_TYPE_TONES: Record<string, string> = {
  "agente en el exterior": "blue",
  naviera: "purple",
  shipper: "green",
  transportista: "indigo",
  "agente de aduana": "amber",
  almacen: "violet",
  aerolinea: "teal",
};
const TONES = ["blue", "purple", "green", "indigo", "amber", "violet", "teal", "pink"];

/** Same provider type → same chip color, also for types added later. */
export function providerTypeTone(type?: string | null): string {
  const key = normalize(type).trim();
  if (!key) return "grey";
  if (KNOWN_TYPE_TONES[key]) return KNOWN_TYPE_TONES[key];
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return TONES[hash % TONES.length]!;
}

export const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];
