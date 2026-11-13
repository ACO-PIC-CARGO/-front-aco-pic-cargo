import { afterEach, beforeEach, expect, test, vi } from "vitest";
import Swal from "sweetalert2";
import type { SweetAlertOptions } from "sweetalert2";
import { mostrarAvisoVigenciaFlete } from "@/views/dashboard/avisoVigenciaFlete";

vi.mock("sweetalert2", () => ({
  default: { fire: vi.fn(), getCancelButton: vi.fn(), getDenyButton: vi.fn() },
}));

let popup: HTMLElement;
let continueButton: HTMLButtonElement;
let configButton: HTMLButtonElement;

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  popup = document.createElement("div");
  popup.innerHTML = '<div class="freight-alert-deadline"><span class="freight-alert-deadline-label"></span> <span class="freight-alert-deadline-value"></span></div><div class="freight-alert-date"></div>';
  continueButton = document.createElement("button");
  continueButton.innerHTML = '<span class="freight-alert-cancel-label">CANCELAR EN</span><span class="freight-alert-countdown"></span>';
  configButton = document.createElement("button");
  vi.mocked(Swal.getCancelButton).mockReturnValue(continueButton);
  vi.mocked(Swal.getDenyButton).mockReturnValue(configButton);
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as never);
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

function openAlert(days: number, date?: string) {
  mostrarAvisoVigenciaFlete(days, date);
  const options = vi.mocked(Swal.fire).mock.calls[0]![0] as SweetAlertOptions;
  options.willOpen!(popup);
  options.didOpen!(popup);
  return options;
}

test("solo Cancelar queda deshabilitado durante cinco segundos; Configurar flete está disponible", () => {
  const options = openAlert(2, "2026-11-08");
  const countdown = continueButton.querySelector(".freight-alert-countdown")!;
  const configure = vi.fn();
  const cancel = vi.fn();
  configButton.addEventListener("click", configure);
  continueButton.addEventListener("click", cancel);
  expect(options.allowOutsideClick).toBe(false);
  expect(options.allowEscapeKey).toBe(false);
  expect(popup.querySelector(".freight-alert-deadline-label")?.textContent).toBe("Vence en:");
  expect(popup.querySelector(".freight-alert-deadline-value")?.textContent).toBe("2 días");
  expect(options.iconHtml).toContain("<svg");
  expect(options.confirmButtonText).toContain("ACTUALIZAR AHORA");
  expect(popup.querySelector(".freight-alert-date")?.textContent).toBe("Fecha de vigencia: 2026-11-08");
  expect(countdown.textContent).toBe("5 s");
  expect(options.showDenyButton).toBe(true);
  expect(options.showCancelButton).toBe(true);
  expect(configButton.disabled).toBe(false);
  expect(continueButton.disabled).toBe(true);
  configButton.click();
  continueButton.click();
  expect(configure).toHaveBeenCalledOnce();
  expect(cancel).not.toHaveBeenCalled();
  vi.advanceTimersByTime(4000);
  expect(countdown.textContent).toBe("1 s");
  expect(continueButton.disabled).toBe(true);
  vi.advanceTimersByTime(1000);
  expect(continueButton.querySelector(".freight-alert-countdown")).toBeNull();
  expect(continueButton.textContent).toBe("CANCELAR");
  expect(continueButton.disabled).toBe(false);
  continueButton.click();
  expect(cancel).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(0);
});

test.each([
  { days: -2, label: "Venció hace: 2 días", heading: "VENCIDA", icon: "error" },
  { days: -1, label: "Venció hace: 1 día", heading: "VENCIDA", icon: "error" },
  { days: 0, label: "Vence hoy", heading: "VENCE HOY", icon: "warning" },
  { days: 1, label: "Vence en: 1 día", heading: "POR VENCER", icon: "warning" },
])("describe correctamente el vencimiento $days", ({ days, label, heading, icon }) => {
  const options = openAlert(days);
  expect(options.icon).toBe(icon);
  expect(options.html).toContain(heading);
  expect(popup.querySelector(".freight-alert-deadline")?.textContent).toBe(label);
  options.didClose!();
  expect(vi.getTimerCount()).toBe(0);
});

test("la fecha se inserta como texto y se detiene el temporizador al cerrar antes", () => {
  const options = openAlert(2, "<img src=x>");
  expect(popup.querySelector(".freight-alert-date")?.textContent).toBe("Fecha de vigencia: <img src=x>");
  expect(popup.querySelector(".freight-alert-date img")).toBeNull();
  options.didClose!();
  expect(vi.getTimerCount()).toBe(0);
  vi.advanceTimersByTime(5000);
  expect(continueButton.disabled).toBe(true);
});
