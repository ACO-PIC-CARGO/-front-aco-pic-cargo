import { TRACKING_ICONS } from "./trackingIcons";
import type { TrackingIcon } from "./trackingIcons";

const ICON_ENTRY = /^\s+"([a-z0-9-]+)": F[0-9A-F]+/gm;
const SUGGESTED_LABELS = new Map(TRACKING_ICONS.map(({ icon, label }) => [icon, label]));

let iconCatalog: Promise<TrackingIcon[]> | null = null;

export const parseMdiIconNames = (scss: string): string[] =>
  Array.from(scss.matchAll(ICON_ENTRY), ([, name]) => `mdi-${name}`);

const spelledOut = (icon: string) => icon.replace(/^mdi-/, "").replace(/-/g, " ");

const normalized = (text: string) =>
  text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim().replace(/\s+/g, " ");

export const toIconCatalog = (names: string[]): TrackingIcon[] =>
  names.map((icon) => ({ icon, label: SUGGESTED_LABELS.get(icon) ?? spelledOut(icon) }));

export const filterIcons = (catalog: TrackingIcon[], query: string): TrackingIcon[] => {
  const needle = normalized(query);
  if (!needle) return catalog;
  return catalog.filter(({ icon, label }) => normalized(label).includes(needle) || spelledOut(icon).includes(needle));
};

export const toRows = <Item>(items: Item[], width: number): Item[][] =>
  Array.from({ length: Math.ceil(items.length / width) }, (_, row) => items.slice(row * width, (row + 1) * width));

export const loadIconCatalog = (): Promise<TrackingIcon[]> => {
  iconCatalog ??= import("@mdi/font/scss/_variables.scss?raw")
    .then(({ default: scss }) => toIconCatalog(parseMdiIconNames(scss)))
    .catch((error) => {
      iconCatalog = null;
      throw error;
    });
  return iconCatalog;
};
