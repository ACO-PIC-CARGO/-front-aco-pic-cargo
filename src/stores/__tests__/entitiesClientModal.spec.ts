import { beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { useAppStore } from "@/stores/app";
import { useEntitiesStore } from "@/stores/entities";
import { CONNECTION_ERROR_MESSAGE } from "@/utils/request";
import { accepted, flushPromises, httpMock, rejected, respond, URL_MAIN } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn(), { post: vi.fn() }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { name: "newQuote", params: {} } } } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const sentUrls = () => httpMock.mock.calls.map(([config]) => config.url.slice(URL_MAIN.length).split("?")[0]);
const empty = { lsttelefonos: [], lstcontactos: [], lstconvenios: [], lsttarifas: [], lstcuentas: [], lstemails: [], lstshippers: [], informacionentrega: [] };

describe("client dialog", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
    Object.assign(useAppStore(), { modalEntitie: true, registroClienteFlag: false, recargarClienteFlag: false });
  });

  test.each([
    ["a refused registration", rejected("Ya existe un cliente con ese documento. Búscalo en la lista."), "Ya existe un cliente con ese documento. Búscalo en la lista."],
    ["a connection failure", new Error("Network Error"), CONNECTION_ERROR_MESSAGE],
  ])("guardarCliente keeps the dialog open and names no client after %s", async (_, answer, message) => {
    respond({ registrar_cliente: answer });
    const entities = useEntitiesStore();
    entities.id = 12;

    expect(await entities.guardarCliente()).toBe(false);
    await flushPromises();

    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "error", text: message }));
    expect(entities.id).toBe(12);
    expect(useAppStore()).toMatchObject({ modalEntitie: true, registroClienteFlag: false });
  });

  test("a new client is always registered, even if a House consignee is loaded", async () => {
    respond({ registrar_cliente: accepted([{ id_entitie: 33 }]) });
    useAppStore().house_id_consigner = 8;
    const entities = useEntitiesStore();

    await entities.guardarClienteModal();
    await flushPromises();

    expect(sentUrls()).toEqual(["registrar_cliente"]);
    expect(entities.id).toBe(33);
    expect(useAppStore()).toMatchObject({ modalEntitie: false, registroClienteFlag: true });
  });

  test("the client the opener chose to edit is updated and the dialog closes", async () => {
    respond({ actualizar_cliente: accepted([]), ver_cliente: accepted([{ id: 8, ...empty }]) });
    const entities = useEntitiesStore();
    entities.clienteModalEditId = 8;
    entities.cliente.id = 8;

    await entities.guardarClienteModal();

    expect(sentUrls()).toEqual(["actualizar_cliente", "ver_cliente"]);
    expect(useAppStore()).toMatchObject({ modalEntitie: false, recargarClienteFlag: true });
  });

  test("a failed edit keeps the dialog open with the changes", async () => {
    respond({ actualizar_cliente: rejected("El teléfono ya pertenece a otro cliente. Usa otro número.") });
    const entities = useEntitiesStore();
    entities.clienteModalEditId = 8;
    entities.cliente.nombrecompleto = "ANA EDITADA";

    await entities.guardarClienteModal();

    expect(useAppStore()).toMatchObject({ modalEntitie: true, recargarClienteFlag: false });
    expect(entities.cliente.nombrecompleto).toBe("ANA EDITADA");
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "error", text: "El teléfono ya pertenece a otro cliente. Usa otro número." }));
  });
});
