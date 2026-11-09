import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import QuoteNotificationPopup from "../QuoteNotificationPopup.vue";
import { DISMISS_GUARD_MS } from "../useQuoteNotificationInbox";
import { listPendingQuoteNotifications, markQuoteNotificationSeen } from "../quoteNotificationApi";
import type { QuoteNotice } from "../quoteNotificationApi";

vi.mock("../quoteNotificationApi", () => ({ listPendingQuoteNotifications: vi.fn(), markQuoteNotificationSeen: vi.fn() }));
vi.mock("@/utils/sesion", () => ({ sessionBranchId: () => 1 }));
vi.mock("vue-router", () => ({
  useRouter: () => ({ resolve: ({ params }: { params: { id: number } }) => ({ href: `/home/folderPricing/verQuote/${params.id}` }) }),
}));
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
Object.defineProperty(window, "visualViewport", {
  value: { width: 1024, height: 768, addEventListener() {}, removeEventListener() {} },
  configurable: true,
});

const vuetify = createVuetify({ components, directives });
const notice = (id: number, fields: Partial<QuoteNotice>): QuoteNotice => ({
  notification_id: String(id), kind: "pricing_request", branch_id: 1, quote_id: id, quote_code: "14963-P",
  client_name: "ZEVALLOS ALFONSO", created_by_name: "VENTAS", pricing_notes: null, created_at: "09/11/2026 10:00", ...fields,
});
const button = (label: string) => [...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === label) as HTMLButtonElement;

beforeEach(() => {
  document.body.innerHTML = "";
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.mocked(markQuoteNotificationSeen).mockReset().mockResolvedValue();
  vi.mocked(listPendingQuoteNotifications).mockReset().mockResolvedValue([
    notice(5, { kind: "pricing_request", pricing_notes: "Revisar flete" }),
    notice(6, { kind: "sent_to_client" }),
  ]);
  vi.spyOn(window, "open").mockImplementation(() => null);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

test("Ver cotización opens the quote in a new tab, marks it seen and shows the next notice", async () => {
  mount(QuoteNotificationPopup, { props: { socket: { on: vi.fn(), off: vi.fn() } }, global: { plugins: [vuetify] }, attachTo: document.body });
  await flushPromises();
  expect(document.body.textContent).toContain("VENTAS te pide revisar la cotización 14963-P de ZEVALLOS ALFONSO.");
  expect(document.body.textContent).toContain("Revisar flete");
  vi.advanceTimersByTime(DISMISS_GUARD_MS);

  button("Ver cotización").click();
  await flushPromises();

  expect(window.open).toHaveBeenCalledWith("/home/folderPricing/verQuote/5", "_blank", "noopener");
  expect(markQuoteNotificationSeen).toHaveBeenCalledWith("5");
  expect(document.body.textContent).toContain("Cotización enviada al cliente");
  expect(document.body.textContent).toContain("VENTAS envió la cotización 14963-P a ZEVALLOS ALFONSO por WhatsApp.");
});
