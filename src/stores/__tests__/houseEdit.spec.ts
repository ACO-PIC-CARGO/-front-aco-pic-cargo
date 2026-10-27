import { beforeEach, describe, expect, test, vi } from "vitest";
import type { Mock } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import http from "@/api/http";
import { useHouseEditStore } from "@/stores/houseEdit";
import { useHousesStore } from "@/stores/houses";
import { editFormFromHouse, houseEditPayload } from "@/components/HouseFile/houseEditForm";
import type { HouseDetalle, ServicioHouse } from "@/types/operaciones";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const httpMock = http as unknown as Mock<(config: Record<string, unknown>) => Promise<{ data: unknown }>>;
const SAVE_ERROR = "No pudimos guardar los cambios del house. Revisa tu conexión e intenta de nuevo.";
const services = [{ id: 7, id_begend: 3, nameservice: "Flete", status: true, date_service: null }] as unknown as ServicioHouse[];
const house = {
  id: 2892,
  id_master: 77,
  code_master: "2025MBL0001",
  id_proveedor: 20,
  id_consigner: 21,
  url_onedrive: "https://onedrive/x",
  services,
} as unknown as HouseDetalle;

describe("houseEdit store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 22 }]));
  });

  test("save sends the edit form with every service of the house and a 30 s timeout", async () => {
    httpMock.mockResolvedValue({ data: { status: 200, statusBol: true } });
    const store = useHouseEditStore();
    store.form = editFormFromHouse(house);
    expect(await store.save(house)).toBeNull();
    const [config] = httpMock.mock.calls[0]!;
    expect(config).toMatchObject({ method: "put", url: "setHouseEdit", timeout: 30000 });
    expect(config.data).toStrictEqual(houseEditPayload(store.form, services, 22));
  });

  test("a failed or hanging save returns the friendly reason", async () => {
    const store = useHouseEditStore();
    store.form = editFormFromHouse(house);
    httpMock.mockRejectedValueOnce(new Error("timeout of 30000ms exceeded"));
    expect(await store.save(house)).toBe(SAVE_ERROR);
    httpMock.mockResolvedValueOnce({ data: { status: 500, statusBol: false } });
    expect(await store.save(house)).toBe(SAVE_ERROR);
    expect(store.saving).toBe(false);
  });

  test("a house without client or provider is not sent", async () => {
    const store = useHouseEditStore();
    store.form = editFormFromHouse({ ...house, id_consigner: null } as unknown as HouseDetalle);
    expect(await store.save(house)).toBe("Elige el cliente HBL y el proveedor para guardar.");
    expect(httpMock).not.toHaveBeenCalled();
  });

  test("a saved house of sucursal 1 without a folder gets its OneDrive folder", async () => {
    sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 1 }]));
    httpMock.mockResolvedValue({ data: { status: 200, statusBol: true } });
    const folder = vi.spyOn(useHousesStore(), "guardarCarpetaHouse").mockResolvedValue();
    const store = useHouseEditStore();
    const noFolder = { ...house, url_onedrive: "" } as unknown as HouseDetalle;
    store.form = editFormFromHouse(noFolder);
    expect(await store.save(noFolder)).toBeNull();
    expect(folder).toHaveBeenCalledWith(expect.objectContaining({ id: 77 }));
  });
});
