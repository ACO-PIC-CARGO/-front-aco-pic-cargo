import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Mock } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import "moment/dist/locale/es";
import Swal from "sweetalert2";
import http from "@/api/http";
import { useLegalPagesStore } from "@/stores/legalPages";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

interface RequestConfig {
  method: string;
  url: string;
  data?: unknown;
}

const httpMock = http as unknown as Mock<(config: RequestConfig) => Promise<{ data: unknown }>>;
let unexpected: string[] = [];

function respond(bodies: Record<string, unknown>) {
  httpMock.mockImplementation(async (config) => {
    const key = `${config.method} ${config.url}`;
    if (!(key in bodies)) {
      unexpected.push(key);
      throw new Error(`unexpected request ${key}`);
    }
    return { data: bodies[key] };
  });
}

const sent = () => httpMock.mock.calls.map(([config]) => config);
const accepted = (data: unknown[] = [], mensaje = "ok") => ({ estadoflag: true, mensaje, tipomensaje: "TMSGSUC", data });
const failed = (mensaje = "falló", tipomensaje = "TMSGERR") => ({ estadoflag: false, mensaje, tipomensaje, data: [] });

const terms = (over: Record<string, unknown> = {}) => ({
  slug: "terminos",
  title: "Términos y condiciones",
  updated_at: "2026-03-15T12:00:00",
  sections: [
    { heading: "Uso", paragraphs: ["Primer párrafo.", "Segundo párrafo."] },
    { heading: "Pagos", paragraphs: ["Pagas con [EMPRESA]."] },
  ],
  ...over,
});

const privacy = () => ({
  slug: "privacidad",
  title: "Privacidad",
  updated_at: null,
  sections: [{ heading: "Datos", paragraphs: ["Guardamos [DATO] y [EMPRESA]."] }],
});

const loaded = async () => {
  respond({ "get legal_pages": accepted([terms(), privacy()]) });
  const store = useLegalPagesStore();
  await store.loadPages();
  return store;
};

describe("legalPages store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    unexpected = [];
  });

  afterEach(() => {
    expect(unexpected).toEqual([]);
  });

  test("resetSession drops the loaded page, pages and drafts", async () => {
    const store = await loaded();
    store.page = terms() as never;
    await store.resetSession();
    expect(store.page).toBeNull();
    expect(store.pages).toEqual([]);
    expect(store.drafts).toEqual({});
  });

  test("loads one public page and answers the raw response", async () => {
    respond({ "get public/legal_pages/terminos": accepted([terms()]) });
    const store = useLegalPagesStore();
    expect(await store.loadPage("terminos")).toEqual(accepted([terms()]));
    expect(store.page).toBeNull();
  });

  test("loads the pages and builds one draft per page", async () => {
    const store = await loaded();
    expect(store.pages).toEqual([terms(), privacy()]);
    expect(store.drafts.terminos).toEqual({
      title: "Términos y condiciones",
      sections: [
        { key: expect.stringMatching(/^section-\d+$/), heading: "Uso", text: "Primer párrafo.\n\nSegundo párrafo." },
        { key: expect.stringMatching(/^section-\d+$/), heading: "Pagos", text: "Pagas con [EMPRESA]." },
      ],
    });
    const keys = Object.values(store.drafts).flatMap((draft) => draft.sections.map((section) => section.key));
    expect(new Set(keys).size).toBe(3);
    expect(store.dirtySlugs).toEqual([]);
  });

  test("a failed load answers the message and keeps the pages", async () => {
    const store = await loaded();
    respond({ "get legal_pages": failed("Sin conexión") });
    expect(await store.loadPages()).toBe("Sin conexión");
    expect(store.pages).toHaveLength(2);
  });

  test("an empty list is not an error", async () => {
    respond({ "get legal_pages": { estadoflag: false, mensaje: "No se encontraron registros", tipomensaje: "TMSGINF", data: [] } });
    const store = useLegalPagesStore();
    expect(await store.loadPages()).toBeNull();
    expect(store.pages).toEqual([]);
    expect(store.drafts).toEqual({});
  });

  test("marks a page dirty only when its payload changes", async () => {
    const store = await loaded();
    store.drafts.terminos!.sections[0]!.text = "Primer párrafo.\n   \nSegundo párrafo.  ";
    expect(store.dirtySlugs).toEqual([]);
    store.drafts.terminos!.title = "Términos";
    expect(store.dirtySlugs).toEqual(["terminos"]);
  });

  test("saves the trimmed payload and replaces the page", async () => {
    const saved = terms({ title: "Términos", updated_at: "2026-04-01T12:00:00" });
    const store = await loaded();
    respond({ "put legal_pages/terminos": accepted([saved], "Página guardada") });
    store.drafts.terminos!.title = "  Términos ";
    store.drafts.terminos!.sections[1]!.heading = " Pagos ";
    store.drafts.terminos!.sections[1]!.text = "  Uno \n\n\n Dos ";

    expect(await store.savePage("terminos")).toBe(true);

    expect(sent()[1]!.data).toEqual({
      title: "Términos",
      sections: [
        { heading: "Uso", paragraphs: ["Primer párrafo.", "Segundo párrafo."] },
        { heading: "Pagos", paragraphs: ["Uno", "Dos"] },
      ],
    });
    expect(store.pages[0]).toEqual(saved);
    expect(store.drafts.terminos!.title).toBe("Términos");
    expect(store.drafts.terminos!.sections[1]!.text).toBe("Pagas con [EMPRESA].");
    expect(store.pages[1]).toEqual(privacy());
    expect(Swal.fire).toHaveBeenCalledWith({
      toast: true,
      position: "top-end",
      icon: "success",
      titleText: "Página guardada",
      showConfirmButton: false,
      timer: 3000,
    });
  });

  test("a rejected save warns for an advice and errors otherwise", async () => {
    const store = await loaded();
    respond({ "put legal_pages/terminos": failed("Texto muy largo", "TMSGADV") });
    expect(await store.savePage("terminos")).toBe(false);
    expect(Swal.fire).toHaveBeenLastCalledWith({ icon: "warning", text: "Texto muy largo" });
    respond({ "put legal_pages/terminos": failed("Error interno") });
    expect(await store.savePage("terminos")).toBe(false);
    expect(Swal.fire).toHaveBeenLastCalledWith({ icon: "error", text: "Error interno" });
    expect(store.pages[0]).toEqual(terms());
  });

  test("validates a draft", async () => {
    const store = await loaded();
    expect(store.draftErrors("terminos")).toEqual({
      size: "",
      title: "",
      sections: "",
      items: [
        { heading: "", text: "" },
        { heading: "", text: "" },
      ],
    });
    expect(store.hasDraftErrors("terminos")).toBe(false);

    const draft = store.drafts.terminos!;
    draft.title = " ";
    draft.sections[0]!.heading = "x".repeat(151);
    draft.sections[1]!.text = Array.from({ length: 21 }, (_, n) => `p${n}`).join("\n\n");
    expect(store.draftErrors("terminos")).toEqual({
      size: "",
      title: "Escribe un título de hasta 120 caracteres.",
      sections: "",
      items: [
        { heading: "Cada sección necesita un título de hasta 150 caracteres.", text: "" },
        { heading: "", text: "Cada sección necesita texto: hasta 20 párrafos y 6000 caracteres." },
      ],
    });
    expect(store.hasDraftErrors("terminos")).toBe(true);

    draft.title = "T";
    draft.sections = [];
    expect(store.draftErrors("terminos").sections).toBe("Agrega entre 1 y 40 secciones.");
    expect(store.hasDraftErrors("terminos")).toBe(true);
  });

  test("rejects text over 6000 characters and pages over the request size", async () => {
    const store = await loaded();
    const draft = store.drafts.terminos!;
    draft.sections[0]!.text = "a".repeat(6001);
    expect(store.draftErrors("terminos").items[0]!.text).toBe(
      "Cada sección necesita texto: hasta 20 párrafos y 6000 caracteres.",
    );
    draft.sections = Array.from({ length: 16 }, (_, n) => ({ key: `k${n}`, heading: "H", text: "ñ".repeat(3000) }));
    expect(store.draftErrors("terminos").size).toBe(
      "La página es demasiado larga para guardarla. Acórtala a unos 90 000 caracteres en total.",
    );
    expect(store.hasDraftErrors("terminos")).toBe(true);
  });

  test("lists the bracket placeholders of a draft once", async () => {
    const store = await loaded();
    expect(store.placeholders("terminos")).toEqual(["[EMPRESA]"]);
    store.drafts.terminos!.title = "Hola [EMPRESA] y [RUC]";
    expect(store.placeholders("terminos")).toEqual(["[EMPRESA]", "[RUC]"]);
    expect(store.placeholders("privacidad")).toEqual(["[DATO]", "[EMPRESA]"]);
  });

  test("adds, moves and resets sections", async () => {
    const store = await loaded();
    const [first, second] = store.drafts.terminos!.sections.map((section) => section.key);
    store.addSection("terminos");
    const added = store.drafts.terminos!.sections[2]!;
    expect(added).toEqual({ key: expect.stringMatching(/^section-\d+$/), heading: "", text: "" });
    expect([first, second]).not.toContain(added.key);

    store.moveSection({ slug: "terminos", index: 2, offset: -1 });
    expect(store.drafts.terminos!.sections.map((section) => section.key)).toEqual([first, added.key, second]);
    store.moveSection({ slug: "terminos", index: 0, offset: -1 });
    store.moveSection({ slug: "terminos", index: 2, offset: 1 });
    expect(store.drafts.terminos!.sections.map((section) => section.key)).toEqual([first, added.key, second]);
    expect(store.dirtySlugs).toEqual(["terminos"]);

    store.resetDraft("terminos");
    expect(store.drafts.terminos!.sections.map((section) => section.heading)).toEqual(["Uso", "Pagos"]);
    expect(store.dirtySlugs).toEqual([]);
  });

  test("measures text and formats the update date", () => {
    const store = useLegalPagesStore();
    expect(store.textLength("  uno \n\n dos  \n \n")).toBe(6);
    expect(store.formatUpdatedAt("2026-03-15T12:00:00")).toBe("15 de marzo de 2026");
    expect(store.formatUpdatedAt(null)).toBe("");
    expect(store.limits).toEqual({ title: 120, sections: 40, heading: 150, paragraphs: 20, text: 6000, requestBytes: 90000 });
  });
});
