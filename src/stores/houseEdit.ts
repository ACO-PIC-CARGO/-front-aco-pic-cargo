import { defineStore } from "pinia";
import { ref } from "vue";
import { request } from "@/utils/request";
import { useAppStore } from "@/stores/app";
import { useHousesStore } from "@/stores/houses";
import { sessionBranchId } from "@/utils/sesion";
import { editFormError, editFormFromHouse, houseEditPayload } from "@/components/HouseFile/houseEditForm";
import type { HouseDetalle } from "@/types/operaciones";

const SAVE_ERROR = "No pudimos guardar los cambios del house. Revisa tu conexión e intenta de nuevo.";
const NOT_LOADED = "No pudimos cargar todos los datos del house. Recarga la página e intenta de nuevo.";
// setHouseEdit never answers when its SQL fails, so the request must give up on its own.
const SAVE_TIMEOUT_MS = 30000;
const ONEDRIVE_BRANCHES = [1, 2];

export const useHouseEditStore = defineStore("houseEdit", () => {
  const form = ref(editFormFromHouse({} as HouseDetalle));
  const loadingLists = ref(false);
  const saving = ref(false);

  async function start(house: HouseDetalle): Promise<void> {
    form.value = editFormFromHouse(house);
    const app = useAppStore();
    loadingLists.value = true;
    await Promise.all([
      app._getModality(),
      app._getShipment(),
      app._getIncoterms(),
      app._getMotonave(),
      app._getFleteCon(),
      app._getCoinsList(),
      app._getContainers(),
      app._getProveedorRolShipper(),
      app.cargarClientes(),
      useHousesStore()._getColoaders(),
    ]);
    loadingLists.value = false;
  }

  async function createOneDriveFolder(house: HouseDetalle): Promise<void> {
    if (house.url_onedrive || !ONEDRIVE_BRANCHES.includes(Number(sessionBranchId()))) return;
    const client = useAppStore().clientes.find((item: { id: number }) => item.id == form.value.id_consigner) as
      | { namelong?: string }
      | undefined;
    try {
      await useHousesStore().guardarCarpetaHouse({
        id: house.id_master,
        nroMaster: `${house.code_master}_${client?.namelong ?? ""}`,
      });
    } catch (error) {
      console.error(error);
    }
  }

  async function save(house: HouseDetalle): Promise<string | null> {
    if (saving.value) return null;
    const invalid = editFormError(form.value);
    if (invalid) return invalid;
    // Services not sent are deleted by the DB, so a house without its services list must never be saved.
    if (!Array.isArray(house.services) || !form.value.id || Number(house.id) !== form.value.id) return NOT_LOADED;
    saving.value = true;
    try {
      const response = (await request({
        method: "put",
        url: "setHouseEdit",
        data: houseEditPayload(form.value, house.services, sessionBranchId()),
        timeout: SAVE_TIMEOUT_MS,
      })) as { statusBol?: boolean };
      if (!response.statusBol) return SAVE_ERROR;
      await createOneDriveFolder(house);
      return null;
    } finally {
      saving.value = false;
    }
  }

  return { form, loadingLists, saving, start, save };
});
