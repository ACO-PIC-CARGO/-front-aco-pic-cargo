import { beforeEach, expect, test, vi } from "vitest";
import Swal from "sweetalert2";
import {
  askExpedienteKind,
  askMasterAvailabilityDate,
  availabilityDateProblem,
  masterMismatches,
} from "@/utils/expedienteChoice";

vi.mock("sweetalert2", () => ({ default: { fire: vi.fn(), showValidationMessage: vi.fn() } }));

type SwalOptions = { showDenyButton?: boolean; preConfirm?: () => unknown };
const firedWith = () => vi.mocked(Swal.fire).mock.calls[0]![0] as unknown as SwalOptions;

beforeEach(() => vi.clearAllMocks());

const quote = { idsentido: 1, idtipocarga: 2, idincoterms: 3, idorigen: 4, iddestino: 5 };
const sameRouteMaster = { id_modality: 1, id_shipment: 2, id_incoterms: 3, id_port_begin: 4, id_port_end: 5 };

test("a master on the quote's route and cargo has no mismatch, even when its ids come as text", () => {
  expect(masterMismatches(quote, sameRouteMaster)).toEqual([]);
  expect(masterMismatches(quote, { id_modality: "1", id_shipment: "2", id_incoterms: "3", id_port_begin: "4", id_port_end: "5" })).toEqual([]);
});

test("each field where the master differs from the quote is named, in the order the warning lists them", () => {
  expect(masterMismatches(quote, { id_modality: 9, id_shipment: 9, id_incoterms: 9, id_port_begin: 9, id_port_end: 9 })).toEqual([
    "Modalidad",
    "Tipó de Cargar",
    "Incoterms",
    "Puerto de origien",
    "Puerto de Destino",
  ]);
  expect(masterMismatches(quote, { ...sameRouteMaster, id_port_end: 8 })).toEqual(["Puerto de Destino"]);
});

test.each([
  ["", "La fecha de validez es requerida"],
  ["2026-11-10", "La fecha debe ser mayor que la fecha actual"],
  ["2026-11-11", "La fecha debe ser mayor que la fecha actual"],
  ["2026-11-12", null],
])("the master availability date %o is refused with %o", (value, problem) => {
  expect(availabilityDateProblem(value, "2026-11-11")).toBe(problem);
});

test.each([
  [{ isConfirmed: true }, "new"],
  [{ isDenied: true }, "existing"],
  [{ isDismissed: true }, null],
] as const)("answering the expediente question with %o chooses %o", async (answer, kind) => {
  vi.mocked(Swal.fire).mockResolvedValue(answer as never);

  expect(await askExpedienteKind(true)).toBe(kind);
});

test("selecting an existing expediente is offered only when there are masters to select", async () => {
  vi.mocked(Swal.fire).mockResolvedValue({ isDismissed: true } as never);

  await askExpedienteKind(false);
  expect(firedWith().showDenyButton).toBe(false);
  vi.mocked(Swal.fire).mockClear();
  await askExpedienteKind(true);
  expect(firedWith().showDenyButton).toBe(true);
});

test("the availability date is returned only when the user accepts it", async () => {
  vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: true, value: "2026-12-01" } as never);
  expect(await askMasterAvailabilityDate()).toBe("2026-12-01");

  vi.mocked(Swal.fire).mockResolvedValueOnce({ isDismissed: true } as never);
  expect(await askMasterAvailabilityDate()).toBeNull();
});

test("the availability prompt refuses a past date before closing", async () => {
  vi.mocked(Swal.fire).mockResolvedValue({ isDismissed: true } as never);
  await askMasterAvailabilityDate();
  document.body.innerHTML = '<input id="swal-input1" value="2000-01-01">';

  expect(firedWith().preConfirm!()).toBeUndefined();
  expect(Swal.showValidationMessage).toHaveBeenCalledWith("La fecha debe ser mayor que la fecha actual");
});
