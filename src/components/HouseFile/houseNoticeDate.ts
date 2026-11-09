import type { NotificacionHouse } from "@/types/operaciones";

export function isDateOnlyHouseNotice(notification: Pick<NotificacionHouse, "descripcion">): boolean {
  const description = notification.descripcion ?? "";
  const normalized = description.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
  return normalized === "aviso de salida";
}
