import { expect, test } from "vitest";
import { tieneVariosExpedientes, usuarioCorto } from "@/utils/solicitudVista";

test("el usuario que aprueba se corta hasta la arroba", () => {
  expect(usuarioCorto("administracionpe@pic-cargo.com")).toBe("administracionpe");
  expect(usuarioCorto("czuritar")).toBe("czuritar");
  expect(usuarioCorto(null)).toBeNull();
});

test("varios expedientes solo en la solicitud del reporte con más de uno", () => {
  expect(tieneVariosExpedientes({ multiexpedienteflag: true, expediente: "A, B" })).toBe(true);
  expect(tieneVariosExpedientes({ multiexpedienteflag: true, expediente: "A", correlativo: "0001, 0002" })).toBe(true);
  expect(tieneVariosExpedientes({ multiexpedienteflag: true, expediente: "A" })).toBe(false);
  expect(tieneVariosExpedientes({ multiexpedienteflag: false, expediente: "A, B" })).toBe(false);
});
