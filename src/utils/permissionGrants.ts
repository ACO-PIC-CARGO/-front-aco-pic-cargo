import type { CatalogScreen, ScreenPermission } from "@/types/roles";

export const VIEW_ACTION = "VER";
export const ACTIONS = [VIEW_ACTION, "NUEVO", "MODIFICAR", "ELIMINAR", "COPIAR", "EXPORTAR"] as const;

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

export function grantedCount(screens: CatalogScreen[], grants: Grants): { granted: number; total: number } {
  const offered = screens.flatMap((screen) =>
    screen.actions
      .filter((action) => (ACTIONS as readonly string[]).includes(action.name))
      .map((action) => (grants[screen.menu_id] ?? []).includes(action.name)),
  );
  return { granted: offered.filter(Boolean).length, total: offered.length };
}

export const grantsFromCatalog = (catalog: CatalogScreen[]): Grants =>
  Object.fromEntries(
    catalog.map((screen) => [screen.menu_id, screen.actions.filter((action) => action.granted).map((action) => action.name)]),
  );

export const permissionsPayload = (grants: Grants): ScreenPermission[] =>
  Object.entries(grants)
    .filter(([, actions]) => actions.length)
    .map(([menuId, actions]) => ({ menu_id: Number(menuId), actions }));
