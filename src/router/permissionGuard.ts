import type { NavigationGuardReturn, RouteLocationNormalized } from "vue-router";
import Swal from "sweetalert2";
import { usePermissions } from "@/composables/usePermissions";

export const NO_SCREEN_ACCESS =
  "No tienes acceso a esta pantalla. Pide a un administrador de tu empresa que te lo asigne.";

export default function permissionGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
): NavigationGuardReturn {
  if (to.name === "Main" || usePermissions().canOpen(String(to.meta.menuRoute ?? to.name))) return;

  Swal.fire({ icon: "warning", text: NO_SCREEN_ACCESS });
  return from.name ? false : { name: "Main" };
}
