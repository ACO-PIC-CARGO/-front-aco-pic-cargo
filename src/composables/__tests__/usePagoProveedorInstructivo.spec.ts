import { describe, expect, it } from "vitest";
import { archivoDe, detalleClientePago, detallePagoProveedor } from "@/composables/usePagoProveedorInstructivo";

const archivo = { name: "captura.png", ruta: "https://files.test/uploads/captura.png", insertid: 10 };

describe("detalle del pago al proveedor del instructivo (6.3)", () => {
  it("transferencia internacional: monto, factura, comprobante, captura y datos bancarios", () => {
    const detalle = detallePagoProveedor({
      metodoPagoCodigo: "03",
      monto: 8378.04,
      monedaPago: "USD",
      nroFactura: "FC-1",
      facturaPago: { key: "facturaCommercial", flag: true, file: null },
      comprobantePago: { key: "soporteTransferenciaInternacional", flag: true, file: archivo },
      capturaDatosBancarios: archivo,
      codigoSwift: "DHBKHKHH",
    });

    expect(detalle.titulo).toBe("Pago al Proveedor – Transferencia Internacional");
    const campo = (label: string) => detalle.campos.find((c) => c.label === label)!;
    expect(campo("Monto a pagar al proveedor").valor).toBe("USD 8,378.04");
    expect(campo("Factura Comercial / Proforma").archivo).toBeNull();
    expect(campo("Factura Comercial / Proforma").sinArchivo).toContain("Se adjunta");
    expect(campo("Comprobante de Transferencia").archivo).toEqual({ ruta: archivo.ruta, name: "captura.png" });
    expect(campo("Captura de los Datos Bancarios del Proveedor").archivo?.ruta).toBe(archivo.ruta);
    expect(campo("Código SWIFT").valor).toBe("DHBKHKHH");
  });

  it("Alibaba tarjeta lleva el logo y no pide datos de transferencia", () => {
    const detalle = detallePagoProveedor({ metodoPagoCodigo: "01", contratoAlibaba: archivo });
    expect(detalle.plataforma).toBe("Alibaba");
    expect(detalle.subtitulo).toBe("(Tarjeta de Débito / Crédito)");
    expect(detalle.campos.some((c) => c.label === "Beneficiario")).toBe(false);
    expect(detalle.campos.find((c) => c.label === "Contrato de Alibaba")?.archivo?.name).toBe("captura.png");
  });

  it("Made in China transferencia agrega los datos de la transferencia", () => {
    const detalle = detallePagoProveedor({ metodoPagoCodigo: "05" });
    expect(detalle.plataforma).toBe("Made in China");
    expect(detalle.campos.some((c) => c.label === "Beneficiario")).toBe(true);
  });

  it("Alipay muestra el QR y los montos CNY / USD sin el monto general", () => {
    const detalle = detallePagoProveedor({ metodoPagoCodigo: "04", montoCNY: "7000", montoUSD: "980.5", qrPagoProveedor: archivo });
    expect(detalle.campos.some((c) => c.label === "Monto a pagar al proveedor")).toBe(false);
    expect(detalle.campos.find((c) => c.label.startsWith("Monto a transferir"))?.valor).toBe("CNY 7,000.00");
    expect(detalle.campos.find((c) => c.label.startsWith("QR"))?.archivo?.ruta).toBe(archivo.ruta);
  });

  it("monto vacío se muestra vacío (sin 0 por defecto)", () => {
    const detalle = detallePagoProveedor({ metodoPagoCodigo: "07", metodoPagoOtro: "Western Union" });
    expect(detalle.subtitulo).toBe("(Western Union)");
    expect(detalle.campos.find((c) => c.label === "Monto a pagar al proveedor")?.valor).toBe("");
  });

  it("6.1 cliente pagó: Sí con monto y fecha, No sin campos, sin dato = null", () => {
    const si = detalleClientePago({ clientePago: "Si", montoRecibido: "8378.04", monedaRecibido: "USD", fechaPagoCliente: "2026-08-25" });
    expect(si?.pago).toBe(true);
    expect(si?.campos.map((c) => c.valor)).toEqual(["USD 8,378.04", "25/AGO/2026"]);
    expect(detalleClientePago({ clientePago: "No", montoRecibido: "10" })).toEqual({ pago: false, campos: [] });
    expect(detalleClientePago({ metodoPagoCodigo: "03" })).toBeNull();
  });

  it("6.1 cliente pagó: con comprobante se muestra entre el monto y la fecha", () => {
    const comprobante = { id: 9, ruta: "https://x/pago.pdf", name: "pago.pdf" };
    const si = detalleClientePago({ clientePago: "Si", montoRecibido: "10", fechaPagoCliente: "2026-08-25", comprobantePagoCliente: comprobante });
    expect(si?.campos.map((c) => c.label)).toEqual(["Monto que nos pagó", "Comprobante de pago del cliente", "Fecha en que nos pagó"]);
    expect(si?.campos[1]?.archivo).toEqual({ ruta: comprobante.ruta, name: "pago.pdf" });
  });

  it("6.1 cliente pagó: muestra la cuenta y el banco con su nombre", () => {
    const si = detalleClientePago({
      clientePago: "Si",
      montoRecibido: "10",
      cuentaPagoClienteTexto: "BCP - Banco de Crédito · 192-2190795",
      bancoPagoClienteTexto: "BANCO PICHINCHA - BANCO PICHINCHA",
    });
    expect(si?.campos.map((c) => c.valor)).toEqual([
      "USD 10.00",
      "BCP - Banco de Crédito · 192-2190795",
      "BANCO PICHINCHA - BANCO PICHINCHA",
      "",
    ]);
  });

  it("transferencia internacional sin comprobante ya no lo lista (pasó al 6.1)", () => {
    const detalle = detallePagoProveedor({ metodoPagoCodigo: "03", comprobantePago: { flag: false, file: null } });
    expect(detalle.campos.some((c) => c.label === "Comprobante de Transferencia")).toBe(false);
  });

  it("archivoDe acepta el archivo plano, el de «Se adjunta» y { archivo }", () => {
    expect(archivoDe(archivo)?.name).toBe("captura.png");
    expect(archivoDe({ flag: true, file: archivo })?.ruta).toBe(archivo.ruta);
    expect(archivoDe({ archivo: { ruta: "https://x/a.pdf", name: "https://x/a.pdf" } })?.name).toBe("a.pdf");
    expect(archivoDe({ flag: true, file: null })).toBeNull();
    expect(archivoDe(null)).toBeNull();
  });
});
