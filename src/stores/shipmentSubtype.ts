import { defineStore } from "pinia";
import { ref } from "vue";
import type { ShipmentSubtype, ShipmentSubtypeForm } from "@/types/shipmentSubtype";
import { SUBTIPO_GRUPAL, SUBTIPO_INDIVIDUAL } from "@/types/shipmentSubtype";
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

  /** INDIVIDUAL first, since it is the default; then the rest by code. */
  const comboOrder = (subtype: ShipmentSubtype) => (subtype.codigo === SUBTIPO_INDIVIDUAL ? "" : subtype.codigo);

  /** Active subtypes of one shipment type, INDIVIDUAL first; empty when that type has none. */
  const ofShipment = (shipmentId: number | string | null | undefined) =>
    shipmentId
      ? subtypes.value
          .filter((subtype) => subtype.id_shipment == shipmentId)
          .sort((a, b) => comboOrder(a).localeCompare(comboOrder(b)))
      : [];

  /** The INDIVIDUAL subtype of a shipment type: the default, and what a quote without subtype counts as. */
  const individualOf = (shipmentId: number | string | null | undefined) =>
    ofShipment(shipmentId).find((subtype) => subtype.codigo === SUBTIPO_INDIVIDUAL) ?? null;

  /** The subtype a quote without one counts as, from its flags: GRUPAL when grupal (if its type has it), else INDIVIDUAL. */
  const byMode = (shipmentId: number | string | null | undefined, grupal: boolean | null | undefined) =>
    (grupal ? ofShipment(shipmentId).find((subtype) => subtype.codigo === SUBTIPO_GRUPAL) : null) ??
    individualOf(shipmentId);

  /** Only GRUPAL (by code) is grupal; any other subtype, or none, is individual. */
  const isGrupal = (subtypeId: number | null | undefined) =>
    subtypes.value.some((subtype) => subtype.id === subtypeId && subtype.codigo === SUBTIPO_GRUPAL);

  const save = (form: ShipmentSubtypeForm) => {
    const data = { id_shipment: form.id_shipment, name: form.name };
    return form.id
      ? request({ method: "put", url: url(`shipment_subtype/${form.id}`), headers: JSON_HEADERS, data })
      : request({ method: "post", url: url("shipment_subtype"), headers: JSON_HEADERS, data });
  };

  const remove = (id: number) => request({ method: "delete", url: url(`shipment_subtype/${id}`), headers: JSON_HEADERS });

  return { subtypes, load, ofShipment, individualOf, byMode, isGrupal, save, remove };
});
