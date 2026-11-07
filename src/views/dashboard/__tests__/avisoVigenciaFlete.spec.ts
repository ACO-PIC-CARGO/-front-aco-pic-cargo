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
  popup.innerHTML = '<div class="freight-alert-deadline"><span class="freight-alert-deadline-label"></span> <span class="freight-alert-deadline-value"></span></div><div class="freight-alert-date"></div><div class="freight-alert-countdown"></div>';
  continueButton = document.createElement("button");
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

test("mantiene Configurar y Continuar visibles y deshabilitados durante cinco segundos", () => {
  const options = openAlert(2, "2026-11-08");
  const countdown = popup.querySelector(".freight-alert-countdown")!;
  const configure = vi.fn();
  const proceed = vi.fn();
  configButton.addEventListener("click", configure);
  continueButton.addEventListener("click", proceed);
  expect(options.allowOutsideClick).toBe(false);
  expect(options.allowEscapeKey).toBe(false);
  expect(popup.querySelector(".freight-alert-deadline-label")?.textContent).toBe("Vence en:");
  expect(popup.querySelector(".freight-alert-deadline-value")?.textContent).toBe("2 días");
  expect(options.iconHtml).toContain("<svg");
  expect(popup.querySelector(".freight-alert-date")?.textContent).toBe("Fecha de vigencia: 2026-11-08");
  expect(countdown.textContent).toBe("5s");
  expect(options.showDenyButton).toBe(true);
  expect(options.showCancelButton).toBe(true);
  expect(continueButton.hidden).toBe(false);
  expect(continueButton.style.display).not.toBe("none");
  expect(configButton.disabled).toBe(true);
  expect(continueButton.disabled).toBe(true);
  configButton.click();
  continueButton.click();
  expect(configure).not.toHaveBeenCalled();
  expect(proceed).not.toHaveBeenCalled();
  vi.advanceTimersByTime(4000);
  expect(countdown.textContent).toBe("1s");
  expect(configButton.disabled).toBe(true);
  expect(continueButton.disabled).toBe(true);
  vi.advanceTimersByTime(1000);
  expect(countdown.textContent).toBe("✓");
  expect(configButton.disabled).toBe(false);
  expect(continueButton.disabled).toBe(false);
  configButton.click();
  continueButton.click();
  expect(configure).toHaveBeenCalledOnce();
  expect(proceed).toHaveBeenCalledOnce();
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
  expect(configButton.disabled).toBe(true);
  expect(continueButton.disabled).toBe(true);
});
