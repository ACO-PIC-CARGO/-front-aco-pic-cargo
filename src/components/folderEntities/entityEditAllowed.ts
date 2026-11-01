import router from "@/router";
import { usePermissions } from "@/composables/usePermissions";

// Outside its own screens the form sits in a quote or house dialog, which that screen's permissions already gate.
export function entityEditAllowed(listRoute: string): boolean {
  const screen = router.currentRoute.value.meta?.menuRoute;
  return screen !== listRoute || usePermissions().can(listRoute, "MODIFICAR");
}
