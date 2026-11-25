import { describe, expect, it, test } from "vitest";
import { operacionBanco, tieneVariosExpedientes, usuarioCorto } from "@/utils/solicitudVista";

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

describe("operacionBanco", () => {
  it("muestra el N° de operación cuando no se editó en Bancos", () => {
    expect(operacionBanco({ editadobancoflag: false }, "Salida", "0201")).toBe("Salida N° 0201");
    expect(operacionBanco({}, "Ingreso", "77")).toBe("Ingreso N° 77");
  });
  it("muestra el motivo del error en lugar del N° de operación si se editó en Bancos", () => {
    expect(operacionBanco({ editadobancoflag: true, motivo_edicion_banco: " Monto mal digitado " }, "Salida", "0201"))
      .toBe("Editado en Bancos: Monto mal digitado");
    expect(operacionBanco({ editadobancoflag: true, motivo_edicion_banco: null }, "Ingreso", "77")).toBe("Editado en Bancos: sin motivo");
  });
});
