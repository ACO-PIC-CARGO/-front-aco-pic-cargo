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
const spanish = { language: "es" as const, intro_html: "<p>Hola</p>", closing_html: "<p>Saludos</p>" };
const english = { language: "en" as const, intro_html: "<p>Hello</p>", closing_html: "<p>Regards</p>" };
const accepted = (data: unknown[] = [], mensaje = "ok") => ({ estadoflag: true, mensaje, tipomensaje: "TMSGINF", data });
const rejected = (mensaje: string) => ({ estadoflag: false, mensaje, tipomensaje: "TMSGADV", data: [] });

beforeEach(() => {
  setActivePinia(createPinia());
  httpMock.mockReset();
});

describe("provider email templates", () => {
  test("loading keeps the Spanish and English templates of the company", async () => {
    httpMock.mockResolvedValue({ data: accepted([spanish, english]) });
    const store = useProviderQuoteEmailTemplateStore();

    expect(await store.load()).toBeNull();
    expect(httpMock).toHaveBeenCalledWith(expect.objectContaining({ method: "get", url: "provider_quote_email_templates" }));
    expect(store.templateFor("en")).toEqual(english);
    expect(store.templateFor("es")).toEqual(spanish);
  });

  test("a failed load keeps no templates and returns the message", async () => {
    httpMock.mockRejectedValue(new Error("Network Error"));
    const store = useProviderQuoteEmailTemplateStore();

    expect(await store.load()).toBe(CONNECTION_ERROR_MESSAGE);
    expect(store.templateFor("es")).toBeNull();
  });

  test("saving sends the texts to the language's URL and keeps them", async () => {
    httpMock.mockResolvedValueOnce({ data: accepted([spanish, english]) });
    const store = useProviderQuoteEmailTemplateStore();
    await store.load();
    httpMock.mockResolvedValueOnce({ data: accepted([], "Guardamos la plantilla en inglés.") });

    const edited = { ...english, intro_html: "<p>Hi team</p>" };
    expect(await store.save(edited)).toBeNull();

    expect(httpMock).toHaveBeenLastCalledWith({
      method: "put",
      url: "provider_quote_email_templates/en",
      data: { intro_html: "<p>Hi team</p>", closing_html: "<p>Regards</p>" },
    });
    expect(store.templateFor("en")).toEqual(edited);
  });

  test("saving sends only the two texts even when the template carries the API's status fields", async () => {
    const loaded = { ...english, estadoflag: true, mensaje: null, tipomensaje: null };
    httpMock.mockResolvedValueOnce({ data: accepted([loaded]) });
    const store = useProviderQuoteEmailTemplateStore();
    await store.load();
    httpMock.mockResolvedValueOnce({ data: accepted([], "Guardamos la plantilla en inglés.") });

    await store.save(store.templateFor("en")!);

    expect(httpMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: { intro_html: "<p>Hello</p>", closing_html: "<p>Regards</p>" } }),
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
    expect(store.templateFor("es")).toEqual(spanish);
  });
});
