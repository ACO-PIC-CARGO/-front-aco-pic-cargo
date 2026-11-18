import { beforeEach, expect, test, vi } from "vitest";
import { nextTick, ref } from "vue";
import { flushPromises } from "@vue/test-utils";
import { useInternalThread } from "../useInternalThread";
import { getInternalMessages, sendInternalMessage } from "../internalCommunicationApi";
import { internalThreadChanged } from "../internalThreadRefresh";

vi.mock("../internalCommunicationApi", () => ({ getInternalMessages: vi.fn(), sendInternalMessage: vi.fn() }));

const message = (id: number, body = "hola") => ({ id, direction: "sales_to_pricing", body, author_name: "Ana", created_at: "2026-11-10T10:00:00Z" });
const ok = (data: unknown[]) => ({ estadoflag: true, mensaje: "", tipomensaje: "", data });
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
};

beforeEach(() => vi.resetAllMocks());

test("switching quote clears draft, error and messages", async () => {
  vi.mocked(getInternalMessages).mockResolvedValue(ok([message(1)]) as never);
  const quoteId = ref(1);
  const thread = useInternalThread(quoteId, vi.fn());
  await flushPromises();
  thread.draft.value = "nota para A";
  vi.mocked(getInternalMessages).mockReturnValue(new Promise(() => {}));
  quoteId.value = 2;
  await nextTick();
  expect(thread.draft.value).toBe("");
  expect(thread.messages.value).toEqual([]);
  expect(thread.errorText.value).toBe("");
});

test("a load response for an old quote is ignored", async () => {
  const slow = deferred<unknown>();
  vi.mocked(getInternalMessages).mockReturnValueOnce(slow.promise as never).mockResolvedValueOnce(ok([message(2, "de B")]) as never);
  const quoteId = ref(1);
  const thread = useInternalThread(quoteId, vi.fn());
  quoteId.value = 2;
  await flushPromises();
  slow.resolve(ok([message(1, "de A")]));
  await flushPromises();
  expect(thread.messages.value.map((m) => m.body)).toEqual(["de B"]);
});

test("a send finishing after a quote change does not emit nor reload", async () => {
  vi.mocked(getInternalMessages).mockResolvedValue(ok([]) as never);
  const slow = deferred<unknown>();
  vi.mocked(sendInternalMessage).mockReturnValue(slow.promise as never);
  const onSent = vi.fn();
  const quoteId = ref(1);
  const thread = useInternalThread(quoteId, onSent);
  await flushPromises();
  thread.draft.value = "nota";
  const sending = thread.send();
  quoteId.value = 2;
  await flushPromises();
  vi.mocked(getInternalMessages).mockClear();
  slow.resolve({ estadoflag: true, mensaje: "", tipomensaje: "", data: [{ id: 9, direction: "sales_to_pricing", created_at: "x" }] });
  await sending;
  expect(onSent).not.toHaveBeenCalled();
  expect(getInternalMessages).not.toHaveBeenCalled();
});

test("TMSGINF refusal is the empty state", async () => {
  vi.mocked(getInternalMessages).mockResolvedValue({ estadoflag: false, mensaje: "No se encontraron registros", tipomensaje: "TMSGINF", data: [] } as never);
  const thread = useInternalThread(ref(1), vi.fn());
  await flushPromises();
  expect(thread.errorText.value).toBe("");
});

test("any other refusal shows the backend message", async () => {
  vi.mocked(getInternalMessages).mockResolvedValue({ estadoflag: false, mensaje: "No tienes permiso para ver estos mensajes.", tipomensaje: "TMSGERR", data: [] } as never);
  const thread = useInternalThread(ref(1), vi.fn());
  await flushPromises();
  expect(thread.errorText.value).toBe("No tienes permiso para ver estos mensajes.");
});

test("a sent message reports its trimmed body so a list row can show it", async () => {
  vi.mocked(getInternalMessages).mockResolvedValue(ok([]) as never);
  vi.mocked(sendInternalMessage).mockResolvedValue(ok([{ id: 9, direction: "sales_to_pricing", created_at: "x" }]) as never);
  const onSent = vi.fn();
  const thread = useInternalThread(ref(1), onSent);
  await flushPromises();
  thread.draft.value = "  Urge  ";
  await thread.send();
  expect(onSent).toHaveBeenCalledWith({ id: 9, direction: "sales_to_pricing", created_at: "x", body: "Urge" });
});

test("a message added elsewhere, such as a note sent with a pricing request, reloads the thread", async () => {
  vi.mocked(getInternalMessages).mockResolvedValue(ok([]) as never);
  const thread = useInternalThread(ref(1), vi.fn());
  await flushPromises();
  vi.mocked(getInternalMessages).mockResolvedValue(ok([message(3, "Urge el flete")]) as never);

  internalThreadChanged();
  await flushPromises();

  expect(thread.messages.value.map((m) => m.body)).toEqual(["Urge el flete"]);
  expect(thread.count.value).toBe(1);
});
