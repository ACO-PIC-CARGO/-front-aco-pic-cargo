import { beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import PrepararRegistroSolicitudView from "../PrepararRegistroSolicitudView.vue";
import { request } from "@/utils/request";

const route = { meta: { solicitud: "cobro" }, params: { codigo: "SC-000001", id: "4" } as Record<string, string> };
const replace = vi.fn();
vi.mock("vue-router", () => ({ useRoute: () => route, useRouter: () => ({ replace }) }));
vi.mock("@/utils/request", () => ({ CONNECTION_ERROR_MESSAGE: "error de conexión", request: vi.fn() }));
const pedir = vi.mocked(request);

const render = () => mount(PrepararRegistroSolicitudView, { global: { plugins: [createVuetify({ components, directives })] } });

beforeEach(() => {
  replace.mockReset();
  pedir.mockReset();
});

test("cobro: gets the token and goes to the preloaded Bancos form", async () => {
  route.meta.solicitud = "cobro";
  pedir.mockResolvedValue({ estadoflag: true, mensaje: "", tipomensaje: "", data: [{ token: "tok-c" }] } as never);
  const w = render();
  expect(w.text()).toContain("Preparando el registro en Bancos");
  await flushPromises();
  expect(pedir).toHaveBeenCalledWith(expect.objectContaining({ method: "put", url: expect.stringMatching(/solicitud_cobro_transferir\/SC-000001$/) }));
  expect(replace).toHaveBeenCalledWith({ name: "registroCobroSolicitud", params: { token: "tok-c" } });
});

test("pago: uses the request id", async () => {
  route.meta.solicitud = "pago";
  pedir.mockResolvedValue({ estadoflag: true, mensaje: "", tipomensaje: "", data: [{ token: "tok-p" }] } as never);
  render();
  await flushPromises();
  expect(pedir).toHaveBeenCalledWith(expect.objectContaining({ url: expect.stringMatching(/solicitud_pago_transferir\/4$/) }));
  expect(replace).toHaveBeenCalledWith({ name: "registroPagoSolicitud", params: { token: "tok-p" } });
});

test("if the server refuses, the tab says why and can retry instead of staying blank", async () => {
  route.meta.solicitud = "cobro";
  pedir.mockResolvedValueOnce({ estadoflag: false, mensaje: "Falta el soporte de confirmación.", tipomensaje: "TMSGADV", data: [] } as never);
  const w = render();
  await flushPromises();
  expect(w.text()).toContain("Falta el soporte de confirmación.");
  expect(replace).not.toHaveBeenCalled();

  pedir.mockResolvedValueOnce({ estadoflag: true, mensaje: "", tipomensaje: "", data: [{ token: "tok-2" }] } as never);
  await w.findAll("button").find((b) => b.text().includes("Reintentar"))!.trigger("click");
  await flushPromises();
  expect(replace).toHaveBeenCalledWith({ name: "registroCobroSolicitud", params: { token: "tok-2" } });
});
