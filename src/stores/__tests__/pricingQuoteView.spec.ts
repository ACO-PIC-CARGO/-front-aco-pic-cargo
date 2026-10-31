import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { usePricingStore } from "@/stores/pricing";
import { CONNECTION_ERROR_MESSAGE } from "@/utils/request";
import { QUOTE_NOT_FOUND_MESSAGE } from "@/utils/quoteScreen";
import { accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn(), { post: vi.fn() }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn(), showLoading: vi.fn(), close: vi.fn() } }));

const QUOTE = {
  id: 77,
  quote: "14779-P",
  statusmain: 1,
  aprobadoflag: false,
  url_folderonedrive: "https://drive/77",
  idtipocarga: 3,
  containers: [],
  cliente: [{ id: 4159 }],
  servicios: [],
  opcioncostos: [],
};

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  sessionStorage.clear();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 1 }]));
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
});
afterEach(() => vi.restoreAllMocks());

describe("opening a quote", () => {
  test("a quote of another company or that does not exist is reported as not found and leaves the screen untouched", async () => {
    respond({ getQuoteId: rejected() });
    const pricing = usePricingStore();

    expect(await pricing.getQuote({ id: 999999 })).toBe(QUOTE_NOT_FOUND_MESSAGE);
    expect(pricing.nro_quote).toBe("");
  });

  test("a quote that cannot be loaded says what to do", async () => {
    httpMock.mockRejectedValue(new Error("Network Error"));

    expect(await usePricingStore().getQuote({ id: 77 })).toBe(CONNECTION_ERROR_MESSAGE);
  });

  test("a loaded quote reports nothing to show", async () => {
    respond({ getQuoteId: accepted([QUOTE]), listado_files: accepted([]), get_texto_whatsapp: accepted([]) });
    const pricing = usePricingStore();

    expect(await pricing.getQuote({ id: 77 })).toBeNull();
    expect(pricing.nro_quote).toBe("14779-P");
  });

  test("the OneDrive files of the previous quote are gone while the new ones load and after a failure", async () => {
    httpMock.mockRejectedValue({ response: { status: 500, data: {} } });
    const pricing = usePricingStore();
    pricing.listadoFilesDrive = [{ name: "anterior.pdf" }];

    const loading = pricing.GetArchivos("https://drive/78");

    expect(pricing.listadoFilesDrive).toEqual([]);
    await loading;
    await flushPromises();
    expect(pricing.listadoFilesDrive).toEqual([]);
  });

  test("a quote without folder shows no OneDrive files", async () => {
    const pricing = usePricingStore();
    pricing.listadoFilesDrive = [{ name: "anterior.pdf" }];

    await pricing.GetArchivos(null);

    expect(pricing.listadoFilesDrive).toEqual([]);
  });

  test("resetting the quote forgets its OneDrive files", () => {
    const pricing = usePricingStore();
    pricing.listadoFilesDrive = [{ name: "anterior.pdf" }];

    pricing.SET_RESET();

    expect(pricing.listadoFilesDrive).toEqual([]);
  });
});
