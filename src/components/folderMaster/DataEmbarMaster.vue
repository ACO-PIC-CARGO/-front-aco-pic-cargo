<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useStore } from "vuex";
//import axios from '@/api/http';

defineProps<{ isFormActionsDisabled?: boolean }>();

const rootStore = useStore();
const itemsMotonave = computed(() => rootStore.state.itemsMotonave);
const itemsContainers = computed(() => rootStore.state.itemsContainers);
const itemsFleteCon = computed(() => rootStore.state.itemsFleteCon);
const itemsShipment = computed(() => rootStore.state.itemsShipment);
const itemsProveedorList = computed(() => rootStore.state.itemsProveedorList);

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
      ? itemsContainers.value.find((v: { id: number }) => v.id == containerID).name
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
  const kg = parseFloat(rootStore.state.master_peso || 0);
  const m3 = parseFloat(rootStore.state.master_volumen || 0);
  const chargeable = Math.max(kg, m3 * 166.66);
  return isNaN(chargeable) ? 0 : parseFloat(chargeable.toFixed(2));
});
const pesoVolumetrico = computed(() => {
  if (isFCL()) return "";
  if (!isAereo()) return "";
  const m3 = parseFloat(rootStore.state.master_volumen || 0);
  const pv = m3 > 0 ? m3 * 166.66 : 0;
  return isNaN(pv) ? 0 : parseFloat(pv.toFixed(2));
});

function isAereo() {
  let val = false;
  const id = rootStore.state.master_id_trasnport.id
    ? rootStore.state.master_id_trasnport.id
    : rootStore.state.master_id_trasnport;

  const code =
    itemsShipment.value.filter((v: { id: number }) => v.id == id).length > 0
      ? itemsShipment.value.filter((v: { id: number }) => v.id == id)[0].code
      : "";

  if (code == "Aéreo") {
    val = true;
  }
  return val;
}
function isLCL() {
  let val = false;
  const id = rootStore.state.master_id_trasnport.id
    ? rootStore.state.master_id_trasnport.id
    : rootStore.state.master_id_trasnport;

  const code =
    itemsShipment.value.filter((v: { id: number }) => v.id == id).length > 0
      ? itemsShipment.value.filter((v: { id: number }) => v.id == id)[0].code
      : "";

  if (code == "LCL") {
    val = true;
  }
  return val;
}
function isFCL() {
  let val = false;
  const id = rootStore.state.master_id_trasnport.id
    ? rootStore.state.master_id_trasnport.id
    : rootStore.state.master_id_trasnport;

  const code =
    itemsShipment.value.filter((v: { id: number }) => v.id == id).length > 0
      ? itemsShipment.value.filter((v: { id: number }) => v.id == id)[0].code
      : "";

  if (code == "FCL") {
    val = true;
  }
  return val;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _callModalEntitie(id_role: number) {
  rootStore.state.id_role_actual = id_role;
  if (id_role == 1) {
    rootStore.state.modalAgente = !rootStore.state.modalAgente;
  } else if (id_role == 11) {
    rootStore.state.modalEntitie = !rootStore.state.modalEntitie;
  } else if (id_role == 17) {
    rootStore.state.modalColoader = !rootStore.state.modalColoader;
  } else if (id_role == 2) {
    rootStore.state.modalNaviera = !rootStore.state.modalNaviera;
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
  rootStore.state.master_itemsContainers.push({
    id: id,
    name: name,
    nro_container: nrocontainer,
    nro_precinto: nroprecinto,
    cantidad: cantidad,
  });
}
function _delContainers(index: number | string) {
  rootStore.state.master_itemsContainers.splice(index as number, 1);
}

onMounted(async () => {
  Promise.all([
    await rootStore.dispatch("_getProveedor"),
    await rootStore.dispatch("_getMotonave"),
    await rootStore.dispatch("_getContainers"),
    await rootStore.dispatch("_getFleteCon"),
    await rootStore.dispatch("_getCoinsList"),
    await rootStore.dispatch("cargarClientes"),
    await rootStore.dispatch("_getProveedorRolAgente"),
    await rootStore.dispatch("_getProveedorRolAerolinea"),
    await rootStore.dispatch("_getProveedorRolColoader"),
    await rootStore.dispatch("_getProveedorRolNaviera"),
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
            v-model="rootStore.state.master_id_motonave"
          />
        </template>
        <template v-else-if="isAereo()">
          <v-text-field
            v-model="rootStore.state.master_vuelo"
            label="Vuelo"
          />
        </template>
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <v-text-field
          v-model="rootStore.state.master_viaje"
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
            v-model="rootStore.state.master_id_containers"
          />
        </v-col>
        <v-col
          cols="12"
          md="3"
        >
          <v-text-field
            type="number"
            v-model="rootStore.state.master_cantidad"
            label="Cantidad"
          />
        </v-col>
        <v-col
          cols="12"
          md="3"
        >
          <v-text-field
            v-model="rootStore.state.master_nro_containers"
            label="Número de Contenedor"
          />
        </v-col>
        <v-col
          cols="12"
          md="3"
        >
          <v-text-field
            v-model="rootStore.state.master_nro_precinto"
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
            v-model="rootStore.state.master_peso"
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
            v-model="rootStore.state.master_volumen"
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
          v-model="rootStore.state.master_id_condicion"
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <v-text-field
          v-model="rootStore.state.master_monto"
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
            @click.native="
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
        @click="rootStore.state.modalContainers = !rootStore.state.modalContainers"
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
              v-for="(item, index) in rootStore.state.master_itemsContainers"
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
