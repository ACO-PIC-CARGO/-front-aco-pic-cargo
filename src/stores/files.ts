import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { ArchivoCargado } from "@/types/operaciones";

export const useFilesStore = defineStore("files", () => {
  const payPath = ref<number | null>(null);
  const datosPath = ref<ArchivoCargado | null>(null);

  async function _uploadFile(file: File): Promise<void> {
    const data = new FormData();
    const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
    data.append("name", nameWithoutExtension);
    data.append("file", file);
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "uploadAllPath",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    await axios<ApiResponse<ArchivoCargado[]>>(config)
      .then(function (response) {
        payPath.value = response.data.data[0]!.insertid;
        datosPath.value = response.data.data[0]!;
      })
      .catch(function (error) {
        console.error(error);
      });
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
