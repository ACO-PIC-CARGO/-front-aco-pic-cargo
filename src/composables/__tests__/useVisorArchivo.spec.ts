import { afterEach, expect, test, vi } from "vitest";
import { abrirArchivo, tipoDeArchivo, visorArchivo } from "@/composables/useVisorArchivo";

function pantalla(movil: boolean) {
  vi.spyOn(window, "matchMedia").mockReturnValue({ matches: movil } as MediaQueryList);
}

afterEach(() => {
  visorArchivo.abierto = false;
  vi.restoreAllMocks();
});

test("detects pdf and image files by extension, ignoring the query string", () => {
  expect(tipoDeArchivo("https://x/files/a.PDF?v=1")).toBe("pdf");
  expect(tipoDeArchivo("https://x/files/b.jpeg")).toBe("imagen");
  expect(tipoDeArchivo("https://x/files/123", "Screenshot.png")).toBe("imagen");
  expect(tipoDeArchivo("https://x/files/123")).toBe("otro");
});

test("on a phone the file opens in the in-page viewer, not in another tab", () => {
  pantalla(true);
  const open = vi.spyOn(window, "open").mockReturnValue(null);
  abrirArchivo("https://x/files/voucher.jpg", "voucher.jpg");
  expect(open).not.toHaveBeenCalled();
  expect(visorArchivo).toMatchObject({ abierto: true, url: "https://x/files/voucher.jpg", nombre: "voucher.jpg" });
});

test("on desktop it keeps opening in another tab", () => {
  pantalla(false);
  const open = vi.spyOn(window, "open").mockReturnValue(null);
  abrirArchivo("https://x/files/soporte.pdf");
  expect(open).toHaveBeenCalledWith("https://x/files/soporte.pdf", "_blank");
  expect(visorArchivo.abierto).toBe(false);
});
