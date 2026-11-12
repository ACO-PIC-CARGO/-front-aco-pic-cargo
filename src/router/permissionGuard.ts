import type { NavigationGuardReturn, RouteLocationNormalized } from "vue-router";
import Swal from "sweetalert2";
import { usePermissions } from "@/composables/usePermissions";
import { VIEW_ACTION } from "@/utils/permissionGrants";

export const NO_SCREEN_ACCESS =
  "No tienes acceso a esta pantalla. Pide a un administrador de tu empresa que te lo asigne.";

const missingScreenPermission = (name: string) =>
  `No tienes el permiso ${name} › ${VIEW_ACTION} para abrir esta pantalla. Pide a un administrador de tu empresa que te lo asigne.`;

export default function permissionGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
): NavigationGuardReturn {
  const screen = String(to.meta.menuRoute ?? to.name);
  const { canOpen, screenName } = usePermissions();
  if (to.name === "Main" || canOpen(screen)) return;

  const name = screenName(screen);
  Swal.fire({ icon: "warning", text: name ? missingScreenPermission(name) : NO_SCREEN_ACCESS });
  return from.name ? false : { name: "Main" };
}
