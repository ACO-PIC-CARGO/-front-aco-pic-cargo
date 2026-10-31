import { beforeEach, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useAppStore } from "@/stores/app";
import { useTownStore } from "@/stores/town";
import { accepted, httpMock, URL_MAIN } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const requestsTo = (path: string) => httpMock.mock.calls.filter(([config]) => config.url.slice(URL_MAIN.length).startsWith(path));

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
});

test("two lists of providers loaded at the same time ask the server once and both get the providers", async () => {
  const providers = [{ id: 5, namelong: "Naviera Sur" }];
  httpMock.mockResolvedValue({ data: accepted(providers) });
  const app = useAppStore();

  await Promise.all([app._getProveedor(), app.cargarProveedores()]);

  expect(requestsTo("CargarProveedores")).toHaveLength(1);
  expect(app.itemsProveedorList).toEqual(providers);
  expect(app.provedores).toEqual(providers);
});

test("districts of the same country asked twice at once are loaded once", async () => {
  const districts = [{ id: 9, name: "Miraflores" }];
  httpMock.mockResolvedValue({ data: accepted(districts) });
  const town = useTownStore();

  await Promise.all([town.cargarTownParaPricing({ id_pais: 1 }), town.cargarTownParaPricing({ id_pais: 1 })]);
  await town.cargarTownParaPricing({ id_pais: 2 });

  expect(requestsTo("cargar_town_pricing").map(([config]) => config.params)).toEqual([{ id_pais: 1 }, { id_pais: 2 }]);
  expect(town.lstTownPricing).toEqual(districts);
});
