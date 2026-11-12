import { afterEach, describe, expect, test } from "vitest";
import { defineComponent, h } from "vue";
import type { Component } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import EntityListTable from "@/components/folderEntities/EntityListTable.vue";
import { filterEntities, formatCreatedAt, formatPhone, providerTypeTone, whatsappLink } from "@/components/folderEntities/entityList";
import type { EntidadListado } from "@/types/entidades";

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const client = (id: number, extra: Partial<EntidadListado> = {}): EntidadListado => ({
  id,
  correlativo: String(id).padStart(7, "0"),
  nombrecompleto: `CLIENTE ${id}`,
  acronym_document: "DNI",
  document: `4000${id}`,
  pais: "Perú",
  address: "Av. Los Olivos 123",
  status: 1,
  estado: "Activo",
  created_at: "2026-10-15",
  telefono: "51987654321",
  email: `cliente${id}@gmail.com`,
  ...extra,
});

const permissions = { canCreate: true, canExport: true, canEdit: true, canDelete: true };
let wrapper: VueWrapper | undefined;

async function mountTable(props: Record<string, unknown>) {
  wrapper = mount(
    defineComponent({
      render: () =>
        h(components.VApp, () =>
          h(EntityListTable as Component, {
            plural: "clientes",
            newLabel: "Nuevo Cliente",
            searchPlaceholder: "Buscar cliente...",
            ...permissions,
            ...props,
          }),
        ),
    }),
    { global: { plugins: [createVuetify({ components, directives })] }, attachTo: document.body },
  );
  await flushPromises();
  return wrapper;
}
const rows = () => [...document.body.querySelectorAll("tbody tr")];
const range = () => document.body.querySelector(".entity-list__range")!.textContent!.trim();

afterEach(() => wrapper?.unmount());

describe("entity list helpers", () => {
  test("dates and phones are shown the way the list design shows them", () => {
    expect(formatCreatedAt("2026-10-15")).toBe("15/10/2026");
    expect(formatCreatedAt(null)).toBe("");
    expect(formatPhone("51 987 654 321")).toBe("+51 987 654 321");
    expect(formatPhone("+51987654321")).toBe("+51987654321");
    expect(whatsappLink("+51 987-654-321")).toBe("https://wa.me/51987654321");
    expect(whatsappLink("")).toBe("");
  });

  test("the search finds by document too, ignoring accents and case, and needs every word", () => {
    const items = [client(1, { nombrecompleto: "ROBERTO PAREDES" }), client(2, { pais: "Panamá", document: "20601234567" })];

    expect(filterEntities(items, "20601234567").map((item) => item.id)).toEqual([2]);
    expect(filterEntities(items, "panama").map((item) => item.id)).toEqual([2]);
    expect(filterEntities(items, "roberto peru").map((item) => item.id)).toEqual([1]);
    expect(filterEntities(items, "roberto panama")).toEqual([]);
    expect(filterEntities(items, "15/10/2026")).toHaveLength(2);
  });

  test("a provider type always gets the same chip color", () => {
    expect(providerTypeTone("Naviera")).toBe("purple");
    expect(providerTypeTone("Almacén")).toBe("violet");
    expect(providerTypeTone("Courier")).toBe(providerTypeTone("courier"));
    expect(providerTypeTone(null)).toBe("grey");
  });
});

describe("EntityListTable", () => {
  test("pages the records and says which ones it shows", async () => {
    await mountTable({ items: Array.from({ length: 42 }, (_, index) => client(index + 1)) });

    expect(rows()).toHaveLength(10);
    expect(range()).toBe("Mostrando 1 – 10 de 42 clientes");
  });

  test("searching goes back to the first page and counts only what matches", async () => {
    const table = await mountTable({ items: Array.from({ length: 42 }, (_, index) => client(index + 1)) });
    await table.findComponent(EntityListTable).find("input").setValue("cliente3@gmail.com");
    await flushPromises();

    expect(range()).toBe("Mostrando 1 – 1 de 1 clientes");
    expect(rows()[0]!.textContent).toContain("CLIENTE 3");
  });

  test("an inactive record cannot be edited or deleted even with permission", async () => {
    await mountTable({ items: [client(1, { status: 0, estado: "Inactivo" })] });

    expect(document.body.querySelector("tbody .mdi-pencil")).toBeNull();
    expect(document.body.querySelector("tbody .mdi-delete")).toBeNull();
    expect(document.body.querySelector("tbody .mdi-eye")).not.toBeNull();
    expect(document.body.querySelector(".entity-list__status--off")?.textContent).toContain("Inactivo");
  });

  test("without permissions only phones and view are offered", async () => {
    await mountTable({ items: [client(1)], canCreate: false, canExport: false, canEdit: false, canDelete: false });

    const labels = [...document.body.querySelectorAll("button")].map((button) => button.textContent!.trim().toUpperCase());
    expect(labels).not.toContain("NUEVO CLIENTE");
    expect(labels).not.toContain("EXPORTAR");
    expect(document.body.querySelector("tbody .mdi-pencil")).toBeNull();
    expect(document.body.querySelector("tbody .mdi-delete")).toBeNull();
    expect(document.body.querySelector("tbody .mdi-phone")).not.toBeNull();
  });

  test("each action reports the record it was pressed on", async () => {
    const table = await mountTable({ items: [client(7)] });
    for (const label of ["Teléfonos y contactos", "Editar", "Ver", "Eliminar"]) {
      document.body.querySelector<HTMLElement>(`tbody button[aria-label="${label}"]`)!.click();
    }
    const list = table.findComponent(EntityListTable);

    for (const event of ["phones", "edit", "view", "remove"]) {
      expect(list.emitted(event)?.[0]).toEqual([expect.objectContaining({ id: 7 })]);
    }
  });

  test("providers show their type instead of the address, with phone and email links", async () => {
    await mountTable({ providers: true, plural: "proveedores", items: [client(1, { tipo_proveedor: "Naviera" })] });

    const headerText = document.body.querySelector("thead")!.textContent!;
    expect(headerText).toContain("Tipo de Proveedor");
    expect(headerText).not.toContain("Dirección");
    expect(document.body.querySelector(".entity-list__type--purple")?.textContent?.trim()).toBe("Naviera");
    expect(document.body.querySelector<HTMLAnchorElement>('a[href^="https://wa.me/"]')!.href).toBe("https://wa.me/51987654321");
    expect(document.body.querySelector<HTMLAnchorElement>('a[href^="mailto:"]')!.textContent).toContain("cliente1@gmail.com");
    expect(document.body.querySelector("tbody")!.textContent).toContain("15/10/2026");
  });
});
