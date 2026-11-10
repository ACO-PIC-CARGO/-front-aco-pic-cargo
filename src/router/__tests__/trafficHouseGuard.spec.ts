import { beforeEach, describe, expect, test, vi } from "vitest";
import type { RouteLocationNormalized } from "vue-router";
import trafficHouseGuard from "@/router/trafficHouseGuard";
import type { HouseDetalle } from "@/types/operaciones";

const housesStore = vi.hoisted(() => ({ house: {} as HouseDetalle, verHouse: vi.fn() }));
let houseOnServer: HouseDetalle = {};

vi.mock("@/stores/houses", () => ({ useHousesStore: () => housesStore }));

const route = (name: string, id = "4613") => ({ name, params: { id } }) as unknown as RouteLocationNormalized;

describe("trafficHouseGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    housesStore.house = {};
    housesStore.verHouse.mockImplementation(async () => {
      housesStore.house = houseOnServer;
    });
  });

  test.each(["controlHouseVer", "controlHouseEditar", "controlHouseId"])(
    "%s sends a house still in Tráfico, which has no master, back to the house list",
    async (screen) => {
      houseOnServer = { id: 4613 };

      expect(await trafficHouseGuard(route(screen))).toEqual({ name: "listHouse" });
    },
  );

  test("a house with its master opens from House", async () => {
    houseOnServer = { id: 4500, id_master: 812 };

    expect(await trafficHouseGuard(route("controlHouseEditar", "4500"))).toBeUndefined();
  });

  test("the Tráfico screens open the house without asking for it", async () => {
    expect(await trafficHouseGuard(route("trafficEditar"))).toBeUndefined();
    expect(housesStore.verHouse).not.toHaveBeenCalled();
  });

  test("a house that is not found is left to the screen, which says so", async () => {
    houseOnServer = {};

    expect(await trafficHouseGuard(route("controlHouseVer", "999999"))).toBeUndefined();
  });
});
