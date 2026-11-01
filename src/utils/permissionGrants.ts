import type { CatalogScreen, ScreenPermission } from "@/types/roles";

export const VIEW_ACTION = "VER";
export const ACTIONS = [VIEW_ACTION, "NUEVO", "MODIFICAR", "ELIMINAR", "FILTRAR", "COPIAR", "EXPORTAR"] as const;

export type Grants = Record<number, string[]>;

export const actionLabel = (action: string): string => action[0] + action.slice(1).toLowerCase();

export interface GrantCell {
  menuId: number;
  action: string;
}

export function setAction(grants: Grants, menuId: number, action: string, on: boolean): Grants {
  const current = grants[menuId] ?? [];
  if (on) return { ...grants, [menuId]: [...new Set([...current, VIEW_ACTION, action])] };
  return { ...grants, [menuId]: action === VIEW_ACTION ? [] : current.filter((granted) => granted !== action) };
}

export const setActions = (grants: Grants, cells: GrantCell[], on: boolean): Grants =>
  cells.reduce((next, cell) => setAction(next, cell.menuId, cell.action, on), grants);

export const grantsFromCatalog = (catalog: CatalogScreen[]): Grants =>
  Object.fromEntries(
    catalog.map((screen) => [screen.menu_id, screen.actions.filter((action) => action.granted).map((action) => action.name)]),
  );

export const permissionsPayload = (grants: Grants): ScreenPermission[] =>
  Object.entries(grants)
    .filter(([, actions]) => actions.length)
    .map(([menuId, actions]) => ({ menu_id: Number(menuId), actions }));
