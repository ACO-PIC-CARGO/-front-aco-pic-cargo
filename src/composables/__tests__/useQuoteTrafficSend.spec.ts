import { beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import router from "@/router";
import { useQuoteTrafficSend } from "@/composables/useQuoteTrafficSend";
import { URL_MAIN, accepted, httpMock, rejected, respond } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn(), showLoading: vi.fn() } }));

const automatic = { correlativo: null, last_used: 3, next_code: "TR-00004", manual: false };
const manual = { ...automatic, manual: true };
const pendingFile = { id_traffic: 4, code_traffic: "TR-00004", id_house: 90, sent: false };
const amounts = {
  totalIngreso: 100,
  igvIngreso: 0,
  valorIngreso: 100,
  id_opcion: null,
  listCostosInstructivo: [],
  listVentasInstructivo: [],
};

const keysSentTo = (path: string) =>
  httpMock.mock.calls.filter(([config]) => config.url === URL_MAIN + path).map(([config]) => config.headers!["idempotency-key"]);

const sendFor = (approved = false) => useQuoteTrafficSend({ quoteKind: "PRICING", quoteId: () => 15376, approved: () => approved });

describe("useQuoteTrafficSend", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  });

  test("a quote whose Tráfico file is pending can only go on to Operaciones", async () => {
    respond({ traffic_by_quote: accepted([pendingFile]) });
    const send = sendFor(true);

    await send.load();

    expect(send.targets.value).toEqual(["OPERATIONS"]);
    expect(send.target.value).toBe("OPERATIONS");
    expect(send.pendingFile.value).toEqual(pendingFile);
  });

  test("a new quote starts on Operaciones, as before, and can switch to Tráfico", async () => {
    respond({ traffic_by_quote: rejected() });
    const send = sendFor(false);

    await send.load();

    expect(send.targets.value).toEqual(["OPERATIONS", "TRAFFIC"]);
    expect(send.target.value).toBe("OPERATIONS");
  });

  test("a refused send shows the server's reason and the retry uses a new key", async () => {
    respond({ traffic_correlative: accepted([automatic]), traffic_send: rejected("Esta cotización ya fue aprobada.", "TMSGADV") });
    const send = sendFor(false);

    expect(await send.sendQuote(amounts)).toBe(false);
    await send.sendQuote(amounts);

    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "error", text: "Esta cotización ya fue aprobada." }));
    const [first, second] = keysSentTo("traffic_send");
    expect(first).not.toBe(second);
  });

  test("after sending to Tráfico the user can open the new file", async () => {
    respond({
      traffic_correlative: accepted([automatic]),
      traffic_send: accepted([{ id_traffic: 4, code_traffic: "TR-00004", id_house: 90 }]),
      traffic_by_quote: accepted([pendingFile]),
    });

    expect(await sendFor(false).sendQuote(amounts)).toBe(true);

    expect(router.push).toHaveBeenCalledWith({ name: "trafficVer", params: { id: 90 } });
  });

  test("with manual numbering the typed number goes with the quote", async () => {
    respond({ traffic_correlative: accepted([manual]), traffic_send: accepted([{ id_traffic: 9, code_traffic: "TR-00057", id_house: 91 }]) });
    vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: true, value: "57" } as never);

    await sendFor(false).sendQuote(amounts);

    const sent = httpMock.mock.calls.find(([config]) => config.url === URL_MAIN + "traffic_send")![0];
    expect(sent.data).toMatchObject({ nro_traffic: 57 });
  });

  test("cancelling the manual number sends nothing", async () => {
    respond({ traffic_correlative: accepted([manual]) });
    vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: false, isDismissed: true } as never);

    expect(await sendFor(false).sendQuote(amounts)).toBe(false);

    expect(keysSentTo("traffic_send")).toEqual([]);
  });

  test("after sending to Operaciones the user can open the house", async () => {
    respond({
      traffic_by_quote: accepted([pendingFile]),
      "traffic/4/send_to_operations": accepted([{ code_master: "2026MBL01742", id_master: 2701, id_house: 90 }]),
    });
    const send = sendFor(true);
    await send.load();

    expect(await send.sendToOperations({ nuevoexpediente: true, id_exp: null, fecha_validez: "2026-12-01" })).toBe(true);

    expect(router.push).toHaveBeenCalledWith({ name: "controlHouseVer", params: { id: 90 } });
  });
});
