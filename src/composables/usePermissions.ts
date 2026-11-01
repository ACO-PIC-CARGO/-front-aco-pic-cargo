import type { MyPermissions } from "@/types/roles";
import { VIEW_ACTION } from "@/utils/permissionGrants";

const readPermissions = (): MyPermissions | null => {
  try {
    return JSON.parse(sessionStorage.getItem("permissions") ?? "null");
  } catch {
    return null;
  }
};

export function usePermissions() {
  const permissions = readPermissions();
  const controlled = new Set(permissions?.controlled ?? []);
  const granted = new Map((permissions?.screens ?? []).map((screen) => [screen.route, screen.actions]));

  const can = (route: string, action: string): boolean =>
    !controlled.has(route) || (granted.get(route) ?? []).includes(action);
  const canOpen = (route: string): boolean => can(route, VIEW_ACTION);

  return { can, canOpen };
}
