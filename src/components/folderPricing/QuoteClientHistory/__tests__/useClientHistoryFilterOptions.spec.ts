import { beforeEach, describe, expect, test, vi } from "vitest";
import { defineComponent, ref } from "vue";
import { mount } from "@vue/test-utils";
import { useClientHistoryFilterOptions } from "../useClientHistoryFilterOptions";
import { URL_MAIN, accepted, flushPromises, httpMock, rejected } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));

const optionsRow = (total: string) => ({
  estadoflag: true,
  total_count: total,
  transports: [{ id: 1, name: "Marítimo" }],
  modalities: [{ shipment_id: 3, group_flag: false, label: "LCL Individual" }],
  origins: [{ id: 10, name: "SHANGHAI" }],
  destinations: [{ id: 20, name: "CALLAO" }],
  statuses: [{ id: 7, name: "APROBADA" }],
});

function mountOptions(initial: number | null) {
  const clientId = ref<number | null>(initial);
  let options!: ReturnType<typeof useClientHistoryFilterOptions>;
  mount(defineComponent({ setup() { options = useClientHistoryFilterOptions(clientId); return () => null; } }));
  return { clientId, options };
}

describe("useClientHistoryFilterOptions", () => {
  beforeEach(() => httpMock.mockReset());

  test("loads the client's options once and keeps them per client", async () => {
    httpMock.mockResolvedValueOnce({ data: accepted([optionsRow("12")]) }).mockResolvedValueOnce({ data: accepted([optionsRow("3")]) });
    const { clientId, options } = mountOptions(41);
    await flushPromises();

    expect(httpMock.mock.calls[0]![0].url).toBe(`${URL_MAIN}quote_client_history_filters`);
    expect(httpMock.mock.calls[0]![0].params).toEqual({ entitie_id: 41 });
    expect(options.options.value.total_count).toBe(12);
    expect(options.options.value.origins).toEqual([{ id: 10, name: "SHANGHAI" }]);

    clientId.value = 42;
    await flushPromises();
    clientId.value = 41;
    await flushPromises();

    expect(httpMock).toHaveBeenCalledTimes(2);
    expect(options.options.value.total_count).toBe(12);
  });

  test("a client without quotes has empty options", async () => {
    httpMock.mockResolvedValueOnce({ data: rejected() });
    const { options } = mountOptions(41);
    await flushPromises();

    expect(options.options.value).toEqual({ total_count: 0, transports: [], modalities: [], origins: [], destinations: [], statuses: [] });
  });

  test("the late answer of a previous client is ignored", async () => {
    let resolveFirst!: (value: { data: unknown }) => void;
    httpMock.mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve))).mockResolvedValueOnce({ data: accepted([optionsRow("3")]) });
    const { clientId, options } = mountOptions(41);
    await flushPromises();

    clientId.value = 42;
    await flushPromises();
    resolveFirst({ data: accepted([optionsRow("12")]) });
    await flushPromises();

    expect(options.options.value.total_count).toBe(3);
  });

  test("no client means no request", async () => {
    mountOptions(null);
    await flushPromises();

    expect(httpMock).not.toHaveBeenCalled();
  });
});
