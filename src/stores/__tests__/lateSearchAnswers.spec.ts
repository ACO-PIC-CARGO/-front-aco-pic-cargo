import { beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useAduanaStore } from "@/stores/aduana";
import { useAppStore } from "@/stores/app";
import { useEntitiesStore } from "@/stores/entities";
import { useProveedorStore } from "@/stores/proveedor";
import { accepted, httpMock } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: false }) } }));

let answers: ((rows: unknown[]) => void)[] = [];

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  answers = [];
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
  httpMock.mockImplementation(() => new Promise((resolve) => answers.push((rows) => resolve({ data: accepted(rows) }))));
});

const settle = () => new Promise((resolve) => setTimeout(resolve));
const OLD_MATCH = [{ id: 1, nombrecompleto: "Calzados Lima" }];

describe("an entity search answered after the user changed the text", () => {
  test.each([
    ["client document", (s: ReturnType<typeof useEntitiesStore>, text: string) => (s.cliente.nro_documento = text), "validarDocumentoCliente", "lstProveedores_x_documento"],
    ["provider document", (s: ReturnType<typeof useEntitiesStore>, text: string) => (s.proveedor.nro_documento = text), "validarDocumentoProveedor", "lstProveedores_x_documento"],
    ["provider name", (s: ReturnType<typeof useEntitiesStore>, text: string) => (s.proveedor.nombrecompleto = text), "validarNombreProveedor", "lstProveedores_x_nombre"],
  ] as const)("is ignored for the %s, even after the field is cleared", async (_, type, search, list) => {
    const entities = useEntitiesStore();
    type(entities, "20");
    const older = entities[search]();
    type(entities, "204");
    const newer = entities[search]();

    answers[1]!([]);
    await newer;
    answers[0]!(OLD_MATCH);
    await older;
    expect(entities[list]).toEqual([]);

    type(entities, "20");
    const cleared = entities[search]();
    type(entities, "");
    answers[2]!(OLD_MATCH);
    await cleared;
    expect(entities[list]).toEqual([]);
  });
});

describe("a port or provider search answered after a newer one", () => {
  const NEWER = [{ id: 2, id_port: 2, name: "Callao" }];
  const OLDER = [{ id: 1, id_port: 1, name: "Cartagena" }];

  test.each([
    ["Aduana origin port", () => useAduanaStore(), "getPortBeginAduana", "listPortBegin"],
    ["Aduana destination port", () => useAduanaStore(), "getPortEndAduana", "listPortEnd"],
    ["Master origin port", () => useAppStore(), "_getPortBegin", "itemsPortBegin"],
    ["Master destination port", () => useAppStore(), "_getPortEnd", "itemsPortEnd"],
  ] as const)("does not replace the %s list", async (_, useStore, search, list) => {
    const store = useStore() as unknown as Record<string, unknown>;
    const run = store[search] as (filters: object) => Promise<void>;
    const older = run({ id_transport: 1, search: "CA" });
    const newer = run({ id_transport: 1, search: "CAL" });

    answers[1]!(NEWER);
    await newer;
    answers[0]!(OLDER);
    await older;
    await settle();

    expect(store[list]).toEqual(NEWER);
  });

  test("does not replace the providers offered in Costos", async () => {
    const providers = useProveedorStore();
    const older = providers.obtenerProveedorPricing({ id: "", search: "NA" });
    const newer = providers.obtenerProveedorPricing({ id: "", search: "NAV" });

    answers[1]!([{ id: 5, namelong: "Naviera Sur" }]);
    await newer;
    answers[0]!([{ id: 6, namelong: "Nacional" }]);
    await older;

    expect(providers.lstProveedores).toEqual([{ id: 5, namelong: "Naviera Sur" }]);
  });
});
