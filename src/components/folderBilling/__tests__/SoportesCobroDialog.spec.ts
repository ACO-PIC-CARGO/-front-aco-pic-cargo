import { expect, test } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import SoportesCobroDialog from "@/components/folderBilling/SoportesCobroDialog.vue";

const vuetify = createVuetify({ components, directives });
const soporte = {
  codigo: "SCS-000003", monto: 300, id_cuentabancaria: 1, cuenta: "BCP - 192 - USD", banco: "BCP", nrocuenta: "192", id_banco_origen: 2,
  banco_origen: "BCP", fechadeposito: "2026-11-18", numerooperacion: "OP-1", id_path_voucher: 9, voucher_path: "https://x/v.jpg",
  voucher_nombre: "3 ositos.jpg", comentario: null, usuario_registro: "qa", fecha_registro: "2026-11-18 10:00", id_pagoingreso: null,
  numerooperacion_ingreso: null,
  // confirmación de este pago
  confirmadoflag: true,
  fecha_ingreso: "2026-11-16",
  usuario_confirma: "Dayana Jordan",
  fecha_confirmacion: "2026-11-18 10:12",
};

test("lists every payment with the amount still pending", async () => {
  const w = mount(SoportesCobroDialog, {
    props: { modelValue: false, soportes: [soporte], moneda: "USD", total: 1465.68, cliente: "TEXTILES", expediente: "2026MBL01744", correlativo: "0001",
      solicitud: { codigo_estado: "CONFIRMADO", estado: "Confirmado", fecha_ingreso: "2026-11-16", usuario_confirma: "Dayana Jordan", fecha_confirmacion: "2026-11-18 10:12" },
      editable: true, eliminable: true },
    global: { plugins: [vuetify] },
    attachTo: document.body,
  });
  await w.setProps({ modelValue: true });
  await flushPromises();
  expect(document.body.textContent).toContain("Soportes de ingreso (1)");
  // solo el caso de ese cliente / expediente, como "Confirmar ingreso"
  expect(document.body.textContent).toContain("TEXTILES");
  expect(document.body.textContent).toContain("2026MBL01744 - 0001");
  expect(document.body.textContent).toContain("1,465.68 USD");
  // tabla con el diseño del listado (sin "Método de pago"): el ojo abre el voucher
  expect(document.body.textContent).not.toContain("Método de pago");
  expect(document.querySelector('[title="Ver 3 ositos.jpg"]')).not.toBeNull();
  expect(document.body.textContent).toContain("Confirmado");
  expect(document.body.textContent).toContain("Dayana Jordan");
  expect(document.body.textContent).toContain("300.00 USD");
  expect(document.body.textContent).toContain("1,165.68 USD");
  w.unmount();
});
