import { expect, test, vi } from "vitest";
import DebstoPayComponent from "@/components/folderRequests/DebstoPayComponent.vue";
import AccountsReceivableComponent from "@/components/folderRequests/AccountsReceivableComponent.vue";
import { setState, shownControls } from "@/composables/__tests__/screenControls";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), go: vi.fn() } }));
vi.mock("vue-router", () => ({ useRouter: () => ({ push: vi.fn() }), useRoute: () => ({ params: {} }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: false }) } }));

const branchWithCurrency = () => sessionStorage.setItem("dataBranch", JSON.stringify([{ id: 7, moneda: [{ acronym: "PEN" }] }]));
const selectedChip = { name: "chip de selección", action: "VER", shown: () => document.body.querySelector(".v-navigation-drawer .v-chip") !== null };

test.each([
  { name: "cuentas por pagar", route: "debstopay", component: DebstoPayComponent },
  { name: "cuentas por cobrar", route: "accountsreceivable", component: AccountsReceivableComponent },
])("the $name filter opens with no provider, expense or income chosen", async ({ route, component }) => {
  const shown = await shownControls(
    { name: route, route, component, before: branchWithCurrency, prepare: (wrapper) => setState(wrapper, { offcanvas: true }), controls: [selectedChip] },
    ["VER"],
  );

  expect(shown).toEqual([]);
});
