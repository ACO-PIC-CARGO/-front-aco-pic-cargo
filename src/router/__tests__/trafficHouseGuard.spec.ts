import { beforeEach, describe, expect, test, vi } from "vitest";
import type { RouteLocationNormalized } from "vue-router";
import Swal from "sweetalert2";
import trafficHouseGuard, { HOUSE_STILL_IN_TRAFFIC } from "@/router/trafficHouseGuard";
import type { HouseDetalle } from "@/types/operaciones";

const housesStore = vi.hoisted(() => ({ house: {} as HouseDetalle, verHouse: vi.fn() }));
let houseOnServer: HouseDetalle = {};

vi.mock("@/stores/houses", () => ({ useHousesStore: () => housesStore }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const route = (name: string | undefined, id = "4613") => ({ name, params: { id } }) as unknown as RouteLocationNormalized;
const fromList = route("listHouse");
const fromNowhere = route(undefined);

describe("trafficHouseGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    housesStore.house = {};
    housesStore.verHouse.mockImplementation(async () => {
      housesStore.house = houseOnServer;
    });
  });

  test.each(["controlHouseVer", "controlHouseEditar", "controlHouseId"])(
    "%s does not open a house still in Tráfico, which has no master, and says where to open it",
    async (screen) => {
      houseOnServer = { id: 4613 };

      expect(await trafficHouseGuard(route(screen), fromList)).toBe(false);
      expect(Swal.fire).toHaveBeenCalledWith({ icon: "warning", text: HOUSE_STILL_IN_TRAFFIC });
    },
  );

  test("a link opened in a new tab goes to the house list instead", async () => {
    houseOnServer = { id: 4613 };

    expect(await trafficHouseGuard(route("controlHouseEditar"), fromNowhere)).toEqual({ name: "listHouse" });
  });

  test("a house with its master opens from House", async () => {
    houseOnServer = { id: 4500, id_master: 812 };

    expect(await trafficHouseGuard(route("controlHouseEditar", "4500"), fromList)).toBeUndefined();
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("the Tráfico screens open the house without asking for it", async () => {
    expect(await trafficHouseGuard(route("trafficEditar"), fromList)).toBeUndefined();
    expect(housesStore.verHouse).not.toHaveBeenCalled();
  });

  test("a house that is not found is left to the screen, which says so", async () => {
    houseOnServer = {};

    expect(await trafficHouseGuard(route("controlHouseVer", "999999"), fromList)).toBeUndefined();
    expect(Swal.fire).not.toHaveBeenCalled();
  });
});
