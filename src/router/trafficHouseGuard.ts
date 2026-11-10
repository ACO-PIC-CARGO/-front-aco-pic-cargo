import type { NavigationGuardReturn, RouteLocationNormalized } from "vue-router";
import { useHousesStore } from "@/stores/houses";

const HOUSE_SCREENS = ["controlHouseVer", "controlHouseEditar", "controlHouseId"];

export default async function trafficHouseGuard(to: RouteLocationNormalized): Promise<NavigationGuardReturn> {
  if (!HOUSE_SCREENS.includes(String(to.name))) return;

  const housesStore = useHousesStore();
  await housesStore.verHouse({ id: Number(to.params.id) });
  const house = housesStore.house;
  if (house.id && !house.id_master) return { name: "listHouse" };
}
