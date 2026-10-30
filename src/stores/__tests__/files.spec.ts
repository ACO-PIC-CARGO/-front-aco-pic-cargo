import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useFilesStore } from "@/stores/files";
import { JSON_HEADERS, URL_MAIN, httpMock, respond } from "./catalogHttp";
import { CONNECTION_ERROR_MESSAGE } from "@/utils/request";

vi.mock("@/api/http", () => ({ default: vi.fn() }));

describe("files store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });
  afterEach(() => vi.restoreAllMocks());

  test("_uploadFile sends the file named without its extension and keeps the path it answers", async () => {
    const row = { insertid: 31, ruta: "https://files/foto.final.png", name: "foto.final" };
    respond({ uploadAllPath: { estadoflag: true, data: [row] } });
    const files = useFilesStore();
    const file = new File(["x"], "foto.final.png");

    const failure = await files._uploadFile(file);

    const config = httpMock.mock.calls[0]![0];
    expect(config).toMatchObject({ method: "post", url: URL_MAIN + "uploadAllPath", headers: JSON_HEADERS });
    const body = config.data as FormData;
    expect(body.get("name")).toBe("foto.final");
    expect(body.get("file")).toBe(file);
    expect(files.payPath).toBe(31);
    expect(files.datosPath).toEqual(row);
    expect(failure).toBe("");
  });

  test.each([
    [{ estadoflag: false, mensaje: "No aceptamos archivos HTML", data: [] }, "No aceptamos archivos HTML"],
    [new Error("network"), CONNECTION_ERROR_MESSAGE],
  ])("_uploadFile forgets the previous file and gives back why the upload failed", async (answer, reason) => {
    const files = useFilesStore();
    files.payPath = 5;
    files.datosPath = { insertid: 5, ruta: "https://files/a.pdf" };
    respond({ uploadAllPath: answer });

    const failure = await files._uploadFile(new File(["x"], "a.html"));

    expect(failure).toBe(reason);
    expect(files.payPath).toBeNull();
    expect(files.datosPath).toBeNull();
  });

  test("the OneDrive moves send the data with a PUT", async () => {
    respond({ mover_files_servidor_onedrive: { data: [] }, mover_files: { data: [] } });
    const files = useFilesStore();

    await files.uploadFileFromUrlToOneDrive({ id: 1 });
    await files.moveFileToOneDrive({ id: 2 });

    expect(httpMock.mock.calls.map(([config]) => [config.method, config.url.slice(URL_MAIN.length), config.headers, config.data])).toEqual([
      ["put", "mover_files_servidor_onedrive", JSON_HEADERS, { id: 1 }],
      ["put", "mover_files", JSON_HEADERS, { id: 2 }],
    ]);
  });
});
