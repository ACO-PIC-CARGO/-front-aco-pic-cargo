import { beforeEach, describe, expect, test, vi } from "vitest";
import type { Mock } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import http from "@/api/http";
import { useProviderQuoteEmailTemplateStore } from "@/stores/providerQuoteEmailTemplate";
import { CONNECTION_ERROR_MESSAGE } from "@/utils/request";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

interface RequestConfig {
  method: string;
  url: string;
  data?: unknown;
}

const httpMock = http as unknown as Mock<(config: RequestConfig) => Promise<{ data: unknown }>>;
const table = {
  table_header: ["Concepto", "Detalle"] as [string, string],
  table_rows: [{ field: "incoterm" as const, label: "Incoterm" }],
};
const air = { id_shipment: 1, shipment_name: "Aéreo" };
const sea = { id_shipment: 2, shipment_name: "FCL" };
const spanish = { ...air, language: "es" as const, intro_html: "<p>Hola</p>", closing_html: "<p>Saludos</p>", ...table };
const english = { ...air, language: "en" as const, intro_html: "<p>Hello</p>", closing_html: "<p>Regards</p>", ...table };
const seaEnglish = { ...sea, language: "en" as const, intro_html: "<p>Hello sea</p>", closing_html: "<p>Regards</p>", ...table };
const accepted = (data: unknown[] = [], mensaje = "ok") => ({ estadoflag: true, mensaje, tipomensaje: "TMSGINF", data });
const rejected = (mensaje: string) => ({ estadoflag: false, mensaje, tipomensaje: "TMSGADV", data: [] });

beforeEach(() => {
  setActivePinia(createPinia());
  httpMock.mockReset();
});

describe("provider email templates", () => {
  test("loading keeps the templates of each shipment type, so each type gets its own", async () => {
    httpMock.mockResolvedValue({ data: accepted([spanish, english, seaEnglish]) });
    const store = useProviderQuoteEmailTemplateStore();

    expect(await store.load()).toBeNull();
    expect(httpMock).toHaveBeenCalledWith(expect.objectContaining({ method: "get", url: "provider_quote_email_templates" }));
    expect(store.templateFor(1, "en")).toEqual(english);
    expect(store.templateFor(1, "es")).toEqual(spanish);
    expect(store.templateFor(2, "en")).toEqual(seaEnglish);
    expect(store.templateFor(3, "en")).toBeNull();
  });

  test("a failed load keeps no templates and returns the message", async () => {
    httpMock.mockRejectedValue(new Error("Network Error"));
    const store = useProviderQuoteEmailTemplateStore();

    expect(await store.load()).toBe(CONNECTION_ERROR_MESSAGE);
    expect(store.templateFor(1, "es")).toBeNull();
  });

  test("saving sends the texts and the table to the shipment type and language URL and keeps them only there", async () => {
    httpMock.mockResolvedValueOnce({ data: accepted([spanish, english, seaEnglish]) });
    const store = useProviderQuoteEmailTemplateStore();
    await store.load();
    httpMock.mockResolvedValueOnce({ data: accepted([], "Guardamos la plantilla de Aéreo en inglés.") });

    const edited = { ...english, intro_html: "<p>Hi team</p>" };
    expect(await store.save(edited)).toBeNull();

    expect(httpMock).toHaveBeenLastCalledWith({
      method: "put",
      url: "provider_quote_email_templates/1/en",
      data: { intro_html: "<p>Hi team</p>", closing_html: "<p>Regards</p>", ...table },
    });
    expect(store.templateFor(1, "en")).toEqual(edited);
    expect(store.templateFor(2, "en")).toEqual(seaEnglish);
  });

  test("saving sends only the template fields even when the template carries the API's status fields", async () => {
    const loaded = { ...english, estadoflag: true, mensaje: null, tipomensaje: null };
    httpMock.mockResolvedValueOnce({ data: accepted([loaded]) });
    const store = useProviderQuoteEmailTemplateStore();
    await store.load();
    httpMock.mockResolvedValueOnce({ data: accepted([], "Guardamos la plantilla de Aéreo en inglés.") });

    await store.save(store.templateFor(1, "en")!);

    expect(httpMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: { intro_html: "<p>Hello</p>", closing_html: "<p>Regards</p>", ...table } }),
    );
  });

  test("a refused save returns the reason and keeps the saved text", async () => {
    httpMock.mockResolvedValueOnce({ data: accepted([spanish, english]) });
    const store = useProviderQuoteEmailTemplateStore();
    await store.load();
    httpMock.mockResolvedValueOnce({ data: rejected("Escribe el texto del correo antes de guardar.") });

    expect(await store.save({ ...spanish, intro_html: "", closing_html: "" })).toBe(
      "Escribe el texto del correo antes de guardar.",
    );
    expect(store.templateFor(1, "es")).toEqual(spanish);
  });
});
