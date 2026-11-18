import type { ApiResponse } from "@/types/api";

export interface PriorityOption {
  id: number;
  name: string;
  color_all: string;
}

export interface QuotePriorityDetail {
  id_quote_priority: string | null;
  priority_name: string | null;
  priority_color: string | null;
  dangerous_goods: boolean | null;
}

export function currentPriorityOf(response: ApiResponse<QuotePriorityDetail[]>): PriorityOption | null {
  const row = response.estadoflag ? response.data[0] : undefined;
  if (!row?.id_quote_priority) return null;
  return { id: Number(row.id_quote_priority), name: row.priority_name ?? "", color_all: row.priority_color ?? "" };
}

export function priorityOptions(active: PriorityOption[], current: PriorityOption | null): PriorityOption[] {
  if (!current || active.some((option) => option.id === current.id)) return active;
  return [...active, current];
}
