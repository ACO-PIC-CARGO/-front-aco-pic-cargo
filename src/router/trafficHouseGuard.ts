import type { NavigationGuardReturn, RouteLocationNormalized } from "vue-router";
import Swal from "sweetalert2";
import { useHousesStore } from "@/stores/houses";

export const HOUSE_STILL_IN_TRAFFIC =
  "Este house sigue en Tráfico y aún no tiene master. Ábrelo desde Operativo › Tráfico › Embarques; aparecerá en Houses cuando lo envíes a Operaciones.";

const HOUSE_SCREENS = ["controlHouseVer", "controlHouseEditar", "controlHouseId"];

export default async function trafficHouseGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
): Promise<NavigationGuardReturn> {
  if (!HOUSE_SCREENS.includes(String(to.name))) return;

  const housesStore = useHousesStore();
  await housesStore.verHouse({ id: Number(to.params.id) });
  const house = housesStore.house;
  if (!house.id || house.id_master) return;

  Swal.fire({ icon: "warning", text: HOUSE_STILL_IN_TRAFFIC });
  return from.name ? false : { name: "listHouse" };
}
