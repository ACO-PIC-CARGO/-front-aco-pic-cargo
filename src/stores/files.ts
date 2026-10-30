import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { ArchivoCargado } from "@/types/operaciones";
import { CONNECTION_ERROR_MESSAGE, request } from "@/utils/request";

export const useFilesStore = defineStore("files", () => {
  const payPath = ref<number | null>(null);
  const datosPath = ref<ArchivoCargado | null>(null);

  async function _uploadFile(file: File): Promise<string> {
    payPath.value = null;
    datosPath.value = null;
    const data = new FormData();
    const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
    data.append("name", nameWithoutExtension);
    data.append("file", file);
    const response = await request<ArchivoCargado>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "uploadAllPath",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    });
    const [uploaded] = response.data;
    if (!uploaded?.insertid) return response.mensaje || CONNECTION_ERROR_MESSAGE;
    payPath.value = uploaded.insertid;
    datosPath.value = uploaded;
    return "";
  }

  async function uploadFileFromUrlToOneDrive(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "mover_files_servidor_onedrive",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    await axios<ApiResponse>(config).then(() => {});
  }
  async function moveFileToOneDrive(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "mover_files",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    await axios<ApiResponse>(config).then(() => {});
  }

  return { payPath, datosPath, _uploadFile, uploadFileFromUrlToOneDrive, moveFileToOneDrive };
});
