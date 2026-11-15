import type { NavigationFailure, RouteLocationNormalized } from "vue-router";
import { useAppStore } from "@/stores/app";

function vistaDe(route: RouteLocationNormalized) {
  return route.matched[route.matched.length - 1]?.components?.default;
}

/**
 * Limpia el título de la barra superior al cambiar de vista.
 * Si la nueva vista no define `appStore.mainTitle`, se queda vacío
 * en lugar de mostrar el de la vista anterior.
 * No se limpia cuando la vista es la misma (solo cambian params/query),
 * porque el componente se reutiliza y no vuelve a fijar su título.
 */
export default function resetMainTitle(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  failure?: NavigationFailure | void,
) {
  if (failure || vistaDe(to) === vistaDe(from)) return;
  useAppStore().mainTitle = "";
}
