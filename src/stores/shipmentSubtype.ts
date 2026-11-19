import { defineStore } from "pinia";
import { ref } from "vue";
import type { ShipmentSubtype, ShipmentSubtypeForm } from "@/types/shipmentSubtype";
import { request } from "@/utils/request";

const JSON_HEADERS = { "Content-Type": "application/json" };
const url = (path: string) => import.meta.env.VITE_URL_MAIN + path;

export const useShipmentSubtypeStore = defineStore("shipmentSubtype", () => {
  const subtypes = ref<ShipmentSubtype[]>([]);

  async function load() {
    const answer = await request<ShipmentSubtype>({ method: "get", url: url("shipment_subtype"), headers: JSON_HEADERS });
    subtypes.value = answer.estadoflag ? answer.data : [];
    return answer;
  }

  /** Active subtypes of one shipment type; empty when that type has none. */
  const ofShipment = (shipmentId: number | string | null | undefined) =>
    shipmentId ? subtypes.value.filter((subtype) => subtype.id_shipment == shipmentId) : [];

  const save = (form: ShipmentSubtypeForm) => {
    const data = { id_shipment: form.id_shipment, name: form.name };
    return form.id
      ? request({ method: "put", url: url(`shipment_subtype/${form.id}`), headers: JSON_HEADERS, data })
      : request({ method: "post", url: url("shipment_subtype"), headers: JSON_HEADERS, data });
  };

  const remove = (id: number) => request({ method: "delete", url: url(`shipment_subtype/${id}`), headers: JSON_HEADERS });

  return { subtypes, load, ofShipment, save, remove };
});
