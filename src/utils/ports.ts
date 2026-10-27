import type { Puerto } from "@/types/cotizacion";

export const isSelectedPortTitle = (ports: Puerto[], selectedId: Puerto["id_port"] | null, search: string): boolean =>
  ports.some((port) => port.id_port == selectedId && port.name === search);
