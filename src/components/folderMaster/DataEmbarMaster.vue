<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useAppStore } from "@/stores/app";
import { useMastersStore } from "@/stores/masters";
import MasterField from "./MasterField.vue";
//import axios from '@/api/axios-config';

defineProps<{ isFormActionsDisabled?: boolean }>();

const appStore = useAppStore();
const mastersStore = useMastersStore();
const itemsMotonave = computed(() => appStore.itemsMotonave);
const itemsContainers = computed(() => appStore.itemsContainers);
const itemsFleteCon = computed(() => appStore.itemsFleteCon);
const itemsShipment = computed(() => appStore.itemsShipment);
const itemsProveedorList = computed(() => appStore.itemsProveedorList);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mostrarCboAerolinea = computed(() => {
  return !(isFCL() || isLCL());
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const obtenerLabelConsignerMasterMBL = computed(() => {
  return isAereo() ? "Consigner Master AWE" : "Consigner Master MBL";
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const obtenerLabelNotifyMasterMBL = computed(() => {
  return isAereo() ? "Notify Master AWE" : "Notify Master MBL";
});
const obtenerLabelBLMaster = computed(() => {
  return isAereo() ? "BL Máster Nro." : "BL Máster";
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const obtenerContainerName = computed(() => {
  return (containerID: number) =>
    itemsContainers.value.filter((v: { id: number }) => v.id == containerID).length
      ? itemsContainers.value.find((v: { id: number }) => v.id == containerID)!.name
      : "";
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const obtenerItemsProveedoresCboAgente = computed(() => {
  return itemsProveedorList.value.filter(
    (item: { rol: string }) => item.rol.toUpperCase() !== "SHIPPER"
  ); // PROVEEDORES QUE NO SEAN DE TIPO SHIPPER
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const obtenerItemsProveedores = computed(() => {
  return (tipoProveedor: string) =>
    itemsProveedorList.value.filter(
      (item: { rol: string }) => item.rol.toUpperCase() === tipoProveedor.toUpperCase()
    );
});
const pesoCargable = computed(() => {
  if (isFCL()) return "";
  const kg = parseFloat((mastersStore.master_peso || 0) as string);
  const m3 = parseFloat((mastersStore.master_volumen || 0) as string);
  const chargeable = Math.max(kg, m3 * 166.66);
  return isNaN(chargeable) ? 0 : parseFloat(chargeable.toFixed(2));
});
const pesoVolumetrico = computed(() => {
  if (isFCL()) return "";
  if (!isAereo()) return "";
  const m3 = parseFloat((mastersStore.master_volumen || 0) as string);
  const pv = m3 > 0 ? m3 * 166.66 : 0;
  return isNaN(pv) ? 0 : parseFloat(pv.toFixed(2));
});

function isAereo() {
  let val = false;
  const id = appStore.master_id_trasnport.id
    ? appStore.master_id_trasnport.id
    : appStore.master_id_trasnport;

  const code =
    itemsShipment.value.filter((v: { id: number }) => v.id == id).length > 0
      ? itemsShipment.value.filter((v: { id: number }) => v.id == id)[0]!.code
      : "";

  if (code == "Aéreo") {
    val = true;
  }
  return val;
}
function isLCL() {
  let val = false;
  const id = appStore.master_id_trasnport.id
    ? appStore.master_id_trasnport.id
    : appStore.master_id_trasnport;

  const code =
    itemsShipment.value.filter((v: { id: number }) => v.id == id).length > 0
      ? itemsShipment.value.filter((v: { id: number }) => v.id == id)[0]!.code
      : "";

  if (code == "LCL") {
    val = true;
  }
  return val;
}
function isFCL() {
  let val = false;
  const id = appStore.master_id_trasnport.id
    ? appStore.master_id_trasnport.id
    : appStore.master_id_trasnport;

  const code =
    itemsShipment.value.filter((v: { id: number }) => v.id == id).length > 0
      ? itemsShipment.value.filter((v: { id: number }) => v.id == id)[0]!.code
      : "";

  if (code == "FCL") {
    val = true;
  }
  return val;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _callModalEntitie(id_role: number) {
  appStore.id_role_actual = id_role;
  if (id_role == 1) {
    appStore.modalAgente = !appStore.modalAgente;
  } else if (id_role == 11) {
    appStore.modalEntitie = !appStore.modalEntitie;
  } else if (id_role == 17) {
    appStore.modalColoader = !appStore.modalColoader;
  } else if (id_role == 2) {
    appStore.modalNaviera = !appStore.modalNaviera;
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _setDataContainers(
  id: number,
  name: string,
  nrocontainer: string,
  nroprecinto: string,
  cantidad: number | string,
) {
  appStore.master_itemsContainers.push({
    id: id,
    name: name,
    nro_container: nrocontainer,
    nro_precinto: nroprecinto,
    cantidad: cantidad,
  });
}
function _delContainers(index: number | string) {
  appStore.master_itemsContainers.splice(index as number, 1);
}

onMounted(async () => {
  Promise.all([
    await appStore._getProveedor(),
    await appStore._getMotonave(),
    await appStore._getContainers(),
    await appStore._getFleteCon(),
    await appStore._getCoinsList(),
    await appStore.cargarClientes(),
    await mastersStore._getProveedorRolAgente(),
    await appStore._getProveedorRolAerolinea(),
    await mastersStore._getProveedorRolColoader(),
    await mastersStore._getProveedorRolNaviera(),
  ]);

  //this._validaData();
});
</script>

<template>
  <div>
    <v-row density="compact">
      <v-col
        cols="12"
        sm="6"
      >
        <MasterField
          v-if="isFCL() || isLCL()"
          label="Motonave"
          v-slot="{ id }"
        >
          <v-autocomplete
            :id="id"
            :items="itemsMotonave"
            item-title="name"
            item-value="id"
            placeholder="Seleccionar motonave"
            :model-value="mastersStore.master_id_motonave || null"
            @update:model-value="(val) => (mastersStore.master_id_motonave = val)"
          />
        </MasterField>
        <MasterField
          v-else-if="isAereo()"
          label="Vuelo"
          v-slot="{ id }"
        >
          <v-text-field
            :id="id"
            v-model="mastersStore.master_vuelo"
            placeholder="N.º de vuelo"
          />
        </MasterField>
      </v-col>
      <v-col
        cols="12"
        sm="6"
      >
        <MasterField
          label="Viaje"
          v-slot="{ id }"
        >
          <v-text-field
            :id="id"
            v-model="mastersStore.master_viaje"
            placeholder="N.º de viaje"
          />
        </MasterField>
      </v-col>
      <v-col cols="12">
        <MasterField
          :label="obtenerLabelBLMaster"
          v-slot="{ id }"
        >
          <v-text-field
            :id="id"
            type="text"
            v-model="mastersStore.master_blmaster"
          />
        </MasterField>
      </v-col>

      <template v-if="isFCL()">
        <v-col
          cols="12"
          sm="6"
        >
          <MasterField
            label="Tipo de Contenedor"
            v-slot="{ id }"
          >
            <v-autocomplete
              :id="id"
              :items="itemsContainers"
              item-title="name"
              item-value="id"
              placeholder="Seleccionar"
              return-object
              v-model="appStore.master_id_containers"
            />
          </MasterField>
        </v-col>
        <v-col
          cols="12"
          sm="6"
        >
          <MasterField
            label="Cantidad"
            v-slot="{ id }"
          >
            <v-text-field
              :id="id"
              type="number"
              v-model="appStore.master_cantidad"
            />
          </MasterField>
        </v-col>
        <v-col
          cols="12"
          sm="6"
        >
          <MasterField
            label="Número de Contenedor"
            v-slot="{ id }"
          >
            <v-text-field
              :id="id"
              v-model="appStore.master_nro_containers"
            />
          </MasterField>
        </v-col>
        <v-col
          cols="12"
          sm="6"
        >
          <MasterField
            label="Sello"
            v-slot="{ id }"
          >
            <v-text-field
              :id="id"
              v-model="appStore.master_nro_precinto"
            />
          </MasterField>
        </v-col>
      </template>
      <template v-else>
        <v-col
          cols="12"
          sm="6"
        >
          <MasterField
            label="Peso"
            v-slot="{ id }"
          >
            <v-text-field
              :id="id"
              type="number"
              class="master-unit-field"
              v-model="mastersStore.master_peso"
            >
              <template #append>
                <span class="master-unit">kg</span>
              </template>
            </v-text-field>
          </MasterField>
        </v-col>
        <v-col
          cols="12"
          sm="6"
        >
          <MasterField
            label="Volumen"
            v-slot="{ id }"
          >
            <v-text-field
              :id="id"
              type="number"
              class="master-unit-field"
              v-model="mastersStore.master_volumen"
            >
              <template #append>
                <span class="master-unit">m³</span>
              </template>
            </v-text-field>
          </MasterField>
        </v-col>
        <v-col
          cols="12"
          sm="6"
          v-if="isAereo()"
        >
          <MasterField
            label="Peso Volumétrico"
            v-slot="{ id }"
          >
            <v-text-field
              :id="id"
              :model-value="pesoVolumetrico"
              class="master-unit-field"
              readonly
            >
              <template #append>
                <span class="master-unit">kg</span>
              </template>
            </v-text-field>
          </MasterField>
        </v-col>
        <v-col
          cols="12"
          sm="6"
          v-if="isAereo()"
        >
          <MasterField
            label="Peso Cargable"
            v-slot="{ id }"
          >
            <v-text-field
              :id="id"
              :model-value="pesoCargable"
              class="master-unit-field"
              readonly
            >
              <template #append>
                <span class="master-unit">kg</span>
              </template>
            </v-text-field>
          </MasterField>
        </v-col>
      </template>

      <v-col
        cols="12"
        sm="6"
      >
        <MasterField
          label="Condición del Flete"
          v-slot="{ id }"
        >
          <v-autocomplete
            :id="id"
            :items="itemsFleteCon"
            item-title="name"
            item-value="id"
            placeholder="Seleccionar"
            :model-value="mastersStore.master_id_condicion || null"
            @update:model-value="(val) => (mastersStore.master_id_condicion = val)"
          />
        </MasterField>
      </v-col>
      <v-col
        cols="12"
        sm="6"
      >
        <MasterField
          label="Monto"
          v-slot="{ id }"
        >
          <v-text-field
            :id="id"
            v-model="mastersStore.master_monto"
            type="number"
            placeholder="0.00"
          />
        </MasterField>
      </v-col>
    </v-row>

    <div
      v-if="isFCL()"
      class="mt-3"
    >
      <v-btn
        size="small"
        color="primary"
        elevation="0"
        rounded
        prepend-icon="mdi-plus"
        @click="appStore.modalContainers = !appStore.modalContainers"
        :disabled="isFormActionsDisabled"
      >
        Agregar contenedor
      </v-btn>

      <v-table
        fixed-header
        density="compact"
        height="180px"
        class="mt-2"
      >
        <thead>
          <tr>
            <th class="text-left">
              Nombre
            </th>
            <th class="text-left">
              N°. Contenedor
            </th>
            <th class="text-left">
              N° Precinto
            </th>
            <th class="text-left">
              Cantidad
            </th>
            <th class="text-left">
              Acción
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, index) in appStore.master_itemsContainers"
            :key="item.name"
          >
            <td>{{ item.name }}</td>
            <td>{{ item.nro_container }}</td>
            <td>{{ item.nro_precinto }}</td>
            <td>{{ item.cantidad }}</td>
            <td>
              <v-btn
                variant="text"
                @click="_delContainers(index)"
                size="small"
                icon
                aria-label="Eliminar contenedor"
                :disabled="isFormActionsDisabled"
              >
                <v-icon color="red">
                  mdi-delete
                </v-icon>
              </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.master-unit-field :deep(.v-input__append) {
  margin-inline-start: 0;
  padding: 0;
  align-self: stretch;
}
.master-unit {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 12px;
  border: 1px solid #cfd8e3;
  border-left: 0;
  border-radius: 0 6px 6px 0;
  background: #f3f6fa;
  font-size: 13px;
  color: #374151;
}
.master-unit-field :deep(.v-field) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.btn__add {
  cursor: pointer;
}

.div__container {
  overflow-y: scroll;
  height: 180px;
}
</style>
