import { beforeEach, expect, test, vi } from "vitest";
import { requestAfterSave, requestPricingAfterSave } from "../requestAfterSave";
import { createPricingRequest } from "../pricingRequestApi";

vi.mock("../pricingRequestApi", () => ({ createPricingRequest: vi.fn() }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

beforeEach(() => {
  vi.mocked(createPricingRequest).mockReset();
});

test("requests only when the user chose it and the save returned a quote id", () => {
  expect(requestAfterSave("save_and_request", { saved: true, quoteId: 15 })).toBe(15);
  expect(requestAfterSave("save_only", { saved: true, quoteId: 15 })).toBeNull();
  expect(requestAfterSave("save_and_request", { saved: false, quoteId: 15 })).toBeNull();
  expect(requestAfterSave("save_and_request", { saved: true, quoteId: null })).toBeNull();
  expect(requestAfterSave("save_and_request", { saved: true, quoteId: 0 })).toBeNull();
});

test("sends the request without a note because the note already went with the save", async () => {
  vi.mocked(createPricingRequest).mockResolvedValue({ estadoflag: true, mensaje: "Solicitud enviada.", tipomensaje: "TMSGINF", data: [] });
  const outcome = await requestPricingAfterSave("save_and_request", { saved: true, quoteId: 15 });
  expect(createPricingRequest).toHaveBeenCalledWith(15);
  expect(outcome).toEqual({ estadoflag: true, mensaje: "Solicitud enviada." });
});

test("shows the backend message when the request is refused", async () => {
  vi.mocked(createPricingRequest).mockResolvedValue({ estadoflag: false, mensaje: "La cotización no tiene un pricing asignado.", tipomensaje: "TMSGINF", data: [] });
  const outcome = await requestPricingAfterSave("save_and_request", { saved: true, quoteId: 15 });
  expect(outcome).toEqual({ estadoflag: false, mensaje: "La cotización no tiene un pricing asignado." });
});

test("maps a network failure to friendly copy", async () => {
  vi.mocked(createPricingRequest).mockRejectedValue(new Error("Network Error"));
  const outcome = await requestPricingAfterSave("save_and_request", { saved: true, quoteId: 15 });
  expect(outcome?.estadoflag).toBe(false);
  expect(outcome?.mensaje).not.toContain("Network Error");
});

test("does not call the API when no request is due", async () => {
  expect(await requestPricingAfterSave("save_only", { saved: true, quoteId: 15 })).toBeNull();
  expect(createPricingRequest).not.toHaveBeenCalled();
});
