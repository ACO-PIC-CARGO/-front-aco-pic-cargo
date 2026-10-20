<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useAppStore } from "@/stores/app";
import { useMastersStore } from "@/stores/masters";
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const obtenerLabelBLMaster = computed(() => {
  return isAereo() ? "BL Máster Nro." : "BL Máster";
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const obtenerInputTypeBLMaster = computed(() => {
  return isAereo() ? "number" : "text";
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
    <h3>Datos del Embarque</h3>

    <!-- FILA 1: Motonave/Vuelo y Viaje -->
    <v-row density="compact">
      <v-col
        cols="12"
        md="6"
      >
        <template v-if="isFCL() || isLCL()">
          <v-autocomplete
            :items="itemsMotonave"
            item-title="name"
            item-value="id"
            label="Motonave"
            v-model="mastersStore.master_id_motonave"
          />
        </template>
        <template v-else-if="isAereo()">
          <v-text-field
            v-model="mastersStore.master_vuelo"
            label="Vuelo"
          />
        </template>
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <v-text-field
          v-model="mastersStore.master_viaje"
          label="Viaje"
        />
      </v-col>
    </v-row>

    <!-- FILA 2: FCL vs LCL/Aéreo -->
    <v-row density="compact">
      <template v-if="isFCL()">
        <!-- FCL: Tipo de Contenedor, Cantidad, Número de Contenedor, Sello -->
        <v-col
          cols="12"
          md="3"
        >
          <v-autocomplete
            :items="itemsContainers"
            item-title="name"
            item-value="id"
            return-object
            label="Tipo de Contenedor"
            v-model="appStore.master_id_containers"
          />
        </v-col>
        <v-col
          cols="12"
          md="3"
        >
          <v-text-field
            type="number"
            v-model="appStore.master_cantidad"
            label="Cantidad"
          />
        </v-col>
        <v-col
          cols="12"
          md="3"
        >
          <v-text-field
            v-model="appStore.master_nro_containers"
            label="Número de Contenedor"
          />
        </v-col>
        <v-col
          cols="12"
          md="3"
        >
          <v-text-field
            v-model="appStore.master_nro_precinto"
            label="Sello"
          />
        </v-col>
      </template>
      <template v-else>
        <!-- LCL/Aéreo: Peso, Volumen, Peso Cargable -->
        <v-col
          cols="12"
          md="4"
        >
          <v-text-field
            type="number"
            suffix="kg"
            label="Peso"
            v-model="mastersStore.master_peso"
          />
        </v-col>
        <v-col
          cols="12"
          md="4"
        >
          <v-text-field
            type="number"
            suffix="m3"
            label="Volumen"
            v-model="mastersStore.master_volumen"
          />
        </v-col>
        <v-col
          cols="12"
          md="4"
          v-if="isAereo()"
        >
          <v-text-field
            :model-value="pesoVolumetrico"
            label="Peso Volumétrico"
            suffix="kg"
            readonly
          />
        </v-col>
        <v-col
          cols="12"
          md="4"
          v-if="isAereo()"
        >
          <v-text-field
            :model-value="pesoCargable"
            label="Peso Cargable"
            suffix="kg"
            readonly
          />
        </v-col>
      </template>
    </v-row>

    <!-- FILA 3: Tipo de flete y Monto -->
    <v-row density="compact">
      <v-col
        cols="12"
        md="6"
      >
        <v-autocomplete
          :items="itemsFleteCon"
          item-title="name"
          item-value="id"
          label="Condición"
          v-model="mastersStore.master_id_condicion"
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <v-text-field
          v-model="mastersStore.master_monto"
          type="number"
          label="Monto"
        />
      </v-col>
    </v-row>

    <!--  <v-col cols="4">
        <v-autocomplete
          :items="itemsContainers"
          item-text="name"
          item-value="id"
          return-object
          label="Tipo de contenedor"
          v-model="$store.state.master_id_containers"
        ></v-autocomplete>
      </v-col>
     <v-col cols="12" md="3" lg="3" xl="3">
        <v-text-field label="Nro. Contenedor"></v-text-field>
      </v-col>
     <v-col cols="12" md="3" lg="3" xl="3">
        <v-text-field label="Nro. Precinto"></v-text-field>
      </v-col> -->
    <!-- <v-col cols="2">
        <v-text-field v-model="$store.state.master_cantidad" label="Cant.">
          <v-icon
            class="btn__add"
            @click="
              _setDataContainers(
                $store.state.master_id_containers.id,
                $store.state.master_id_containers.id,
                $store.state.master_id_containers.id,
                $store.state.master_id_containers.name,
                $store.state.master_cantidad
              )
            "
            slot="append"
            color="green"
          >
            mdi-plus
          </v-icon>
        </v-text-field>
      </v-col> -->

    <v-col
      cols="12"
      md="12"
      v-if="isFCL()"
    >
      <v-btn
        size="small"
        color="primary"
        elevation="0"
        rounded
        @click="appStore.modalContainers = !appStore.modalContainers"
        :disabled="isFormActionsDisabled"
      >
        AGREGAR CONTENEDOR
      </v-btn>

      <v-table
        fixed-header
        height="180px"
      >
        <template #default>
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
                  :disabled="isFormActionsDisabled"
                >
                  <v-icon color="red">
                    mdi-delete
                  </v-icon>
                </v-btn>
              </td>
            </tr>
          </tbody>
        </template>
      </v-table>
      <!-- <div
          v-if="$store.state.master_itemsContainers.length === 0"
          class="text-center"
        >
          <img width="10%" :src="$store.state.imgList" alt="" />
          <p>LISTA DE CONTENTEDORES</p>
        </div> -->
    </v-col>
  </div>
</template>

<style lang="scss" scoped>
.btn__add {
  cursor: pointer;
}

.div__container {
  overflow-y: scroll;
  height: 180px;
}
</style>
