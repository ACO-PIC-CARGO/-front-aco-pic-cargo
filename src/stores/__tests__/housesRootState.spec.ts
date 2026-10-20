import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useAppStore } from "@/stores/app";
import { useHousesStore } from "@/stores/houses";
import { JSON_HEADERS, URL_MAIN, accepted, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

describe("houses store, root state part", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id: 21, id_branch: 7 }]));
  });
  afterEach(() => vi.restoreAllMocks());

  test("_getHouseBitacora posts the house the app store holds and empties the log on a rejection", async () => {
    useAppStore().house_Id_get = 31;
    const houses = useHousesStore();
    respond({ getHouseBitacora: accepted([{ id: 1 }]) });

    await houses._getHouseBitacora();
    expect(httpMock.mock.lastCall![0]).toEqual({
      method: "post",
      url: URL_MAIN + "getHouseBitacora",
      headers: JSON_HEADERS,
      data: { id: 31, id_branch: 7 },
    });
    expect(houses.itemsBitacora).toEqual([{ id: 1 }]);

    respond({ getHouseBitacora: rejected() });
    await houses._getHouseBitacora();
    expect(houses.itemsBitacora).toEqual([]);
  });
});
