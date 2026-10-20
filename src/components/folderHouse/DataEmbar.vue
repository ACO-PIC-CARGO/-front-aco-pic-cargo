<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import axios from "@/api/http";
import Swal from "sweetalert2";
import { usePricingStore } from "@/stores/pricing";
import type { HouseCambio } from "@/types/operaciones";

defineProps<{ isFormActionsDisabled?: boolean }>();

const rootStore = useStore();
const route = useRoute();
const router = useRouter();
const pricingStore = usePricingStore();
const itemsCoinsList = computed(() => rootStore.state.itemsCoinsList);
const itemsMotonave = computed(() => rootStore.state.itemsMotonave);
const itemsContainers = computed(() => rootStore.state.itemsContainers);
const itemsFleteCon = computed(() => rootStore.state.itemsFleteCon);
const itemsShipment = computed(() => rootStore.state.itemsShipment);

const lstHouse = ref<HouseCambio[]>([]);
const idHouse = ref<HouseCambio>(null as unknown as HouseCambio);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mostrarAerolineaYGuia = computed(() => {
  const TipoEmbarque = itemsShipment.value.find(
    (v: { id: number; code: string }) => v.id == rootStore.state.house_id_trasnport,
  );
  return TipoEmbarque && TipoEmbarque.code === "Aéreo";
});
const mostrarContenedor = computed(() => {
  const TipoEmbarque = itemsShipment.value.find(
    (v: { id: number; code: string }) => v.id == rootStore.state.house_id_trasnport,
  );
  return TipoEmbarque && TipoEmbarque.code === "FCL";
});

function cleanData() {
  rootStore.state.house_cantidad = "";
}
function cargarHousesAsociados() {
  const config = {
    method: "get",
    url: import.meta.env.VITE_URL_MAIN + "obtener_house_master_asociados",
    headers: {
      "Content-Type": "application/json",
    },
    params: { id: route.params.id },
  };
  axios(config)
    .then(function (response) {
      const res = response.data;
      if (res.estadoflag) {
        lstHouse.value = res.data;
      }
    })
    .catch(function (error) {
      console.error(error);
    });
}
function cambiarHouse(val: HouseCambio) {
  console.log(val);
  Swal.fire({
    icon: "question",
    title: "¿Cambiar de House?",
    text: "Desea Ir A Editar el House: " + val.house,
    allowEnterKey: false,
    allowEscapeKey: false,
    allowOutsideClick: false,
    confirmButtonText: "Si Cambiar",
    cancelButtonText: "Cancelar",
    cancelButtonColor: "red",
    showCancelButton: true,
  }).then((respuesta) => {
    if (respuesta.isConfirmed) {
      router.push({
        name: "controlHouseEditar",
        params: {
          id: val.id,
        },
      });
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  });
}
function _deleteContainers(id: number) {
  const data = {
    id: id,
  };
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "deleteContainers",
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };
  axios(config)
    .then(function (response) {
      if (response.data.status == 200) {
        rootStore.dispatch("_getHouseContainers", { id: route.params.id });
      }
    })
    .catch(function (error) {
      console.error(error);
    });
}
function _setHouseContainers(
  id: number,
  name: string,
  nro_containers: string,
  nro_precinto: string,
  quantity: string,
) {
  const data = {
    id_house: route.params.id,
    id_containers: id,
    nro_containers: nro_containers,
    nro_precinto: nro_precinto,
    quantity: quantity,
    status: 1,
  };
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "setHouseContainers",
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };
  axios(config)
    .then(function (response) {
      if (response.data.status == 200) {
        //vm.$store.state.modalServices = false;
        rootStore.dispatch("_getHouseContainers", { id: route.params.id });
        cleanData();
      }
    })
    .catch(function (error) {
      console.error(error);
    });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function _validaData() {
  if (route.params.id) {
    await rootStore.dispatch("_getHouseContainers", { vm: route.params.id });
  }
}
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
function abrirEditarClinte(id_role: number) {
  _callModalEntitie(id_role);
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _setDataContainers(id: number, name: string, cantidad: number) {
  rootStore.state.master_itemsContainers.push({
    id: id,
    name: name,
    // @ts-expect-error nrocontainer is not defined in this scope
    nro_container: nrocontainer,
    // @ts-expect-error nroprecinto is not defined in this scope
    nro_precinto: nroprecinto,
    cantidad: cantidad,
  });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _delContainers(index: number) {
  rootStore.state.master_itemsContainers.splice(index, 1);
}
function limpiarData() {
  rootStore.state.house_id_agente = "";
  rootStore.state.house_id_consigner = "";
  rootStore.state.house_id_notify = "";
  rootStore.state.house_id_airlines = "";
  rootStore.state.house_id_coloader = "";
  rootStore.state.house_id_agente = "";
  rootStore.state.house_id_naviera = "";
  rootStore.state.house_blmaster = "";
  rootStore.state.house_id_motonave = "";
  rootStore.state.house_viaje = "";
  rootStore.state.house_bultos = "";
  rootStore.state.house_peso = "";
  rootStore.state.house_volumen = "";
  rootStore.state.house_id_condicion = "";
  rootStore.state.house_id_coins = "";
  rootStore.state.house_monto = "";
  rootStore.state.house_id = "";
}

onMounted(async () => {
  if (!route.params.id) {
    limpiarData();
  }

  await Promise.all([
    rootStore.dispatch("_getProveedor"),
    rootStore.dispatch("_getProveedorRolShipper"),
    rootStore.dispatch("_getProveedorRolNaviera"),
    rootStore.dispatch("_getMotonave"),
    rootStore.dispatch("cargarClientes"),
    cargarHousesAsociados(),
  ]);
  // this.$store.state.spiner = true;

  // this.$store.state.spiner = false;
});
</script>

<template>
  <div class="mb-10">
    <h3>Datos del Embarque</h3>

    <v-row density="compact">
      <v-col
        cols="12"
        md="12"
      >
        <!--  v-if="$store.state.house_id_trasnport.id != 3" -->
        <v-autocomplete
          :items="rootStore.state.itemsProveedorRolShipper"
          item-title="namelong"
          item-value="id"
          label="Proveedor"
          v-model="rootStore.state.house_id_agente"
          menu-icon=""
        >
          <template #append-inner>
            <v-icon
              @mousedown.stop
              @click.stop="_callModalEntitie(1)"
              class="btn__add"
              color="primary"
              :disabled="isFormActionsDisabled"
            >
              mdi-plus
            </v-icon>
          </template>
        </v-autocomplete>
      </v-col>
      <v-col
        cols="12"
        md="12"
      >
        <v-autocomplete
          :items="rootStore.state.clientes"
          item-title="namelong"
          item-value="id"
          label="Cliente HBL"
          v-model="rootStore.state.house_id_consigner"
          menu-icon=""
        >
          <template #append-inner>
            <v-icon
              @mousedown.stop
              @click.stop="_callModalEntitie(11)"
              class="btn__add"
              color="primary"
              :disabled="isFormActionsDisabled"
            >
              mdi-plus
            </v-icon>
          </template>
          <template #prepend>
            <v-icon
              @click="abrirEditarClinte(11)"
              class="btn__add"
              color="primary"
              v-if="rootStore.state.house_id_consigner"
              :disabled="isFormActionsDisabled"
            >
              mdi-pencil
            </v-icon>
          </template>
        </v-autocomplete>
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <v-text-field
          v-model="rootStore.state.house_blmaster"
          label="N° BL House"
        />
      </v-col>

      <v-col
        cols="12"
        md="6"
      >
        <v-autocomplete
          :items="rootStore.state.clientes"
          item-title="namelong"
          item-value="id"
          label="Consigne HBL"
          v-model="rootStore.state.house_id_consigner_real"
          menu-icon=""
        >
          <template #append-inner>
            <v-icon
              @mousedown.stop
              @click.stop="_callModalEntitie(11)"
              class="btn__add"
              color="primary"
              :disabled="isFormActionsDisabled"
            >
              mdi-plus
            </v-icon>
          </template>
        </v-autocomplete>
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <v-autocomplete
          :items="rootStore.state.clientes"
          item-title="namelong"
          item-value="id"
          label="Notify HBL"
          v-model="rootStore.state.house_id_notify"
          menu-icon=""
        >
          <template #append-inner>
            <v-icon
              @mousedown.stop
              @click.stop="_callModalEntitie(11)"
              class="btn__add"
              color="primary"
              :disabled="isFormActionsDisabled"
            >
              mdi-plus
            </v-icon>
          </template>
        </v-autocomplete>
      </v-col>

      <v-col cols="12">
        <v-autocomplete
          :items="pricingStore.listEjecutivo"
          item-title="nombrecompleto"
          item-value="id"
          label="Vendedor"
          v-model="rootStore.state.house_id_vendedor"
        />
      </v-col>
      <v-col cols="12">
        <v-autocomplete
          :items="pricingStore.listEjecutivo"
          item-title="nombrecompleto"
          item-value="id"
          label="Pricing"
          v-model="rootStore.state.house_id_pricing"
        />
      </v-col>

      <v-col
        cols="12"
        md="6"
      >
        <v-autocomplete
          :items="itemsMotonave"
          item-title="name"
          item-value="id"
          label="Motonave"
          v-model="rootStore.state.house_id_motonave"
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <v-text-field
          v-model="rootStore.state.house_viaje"
          label="Viaje"
        />
      </v-col>

      <v-col
        cols="12"
        md="3"
        lg="3"
        xl="3"
      >
        <v-autocomplete
          :items="itemsFleteCon"
          item-title="name"
          item-value="id"
          label="Condición"
          v-model="rootStore.state.house_id_condicion"
        />
      </v-col>
      <v-col
        cols="12"
        md="3"
        lg="3"
        xl="3"
      >
        <v-text-field
          v-model="rootStore.state.house_monto"
          type="number"
          label="Monto"
        />
      </v-col>
      <v-col
        cols="12"
        md="3"
        lg="3"
        xl="3"
      >
        <v-autocomplete
          :items="itemsCoinsList"
          item-title="symbol"
          item-value="id"
          label="Moneda"
          v-model="rootStore.state.house_id_coins"
        />
      </v-col>
      <v-col
        cols="12"
        v-if="lstHouse.length > 0"
      >
        <v-select
          :items="lstHouse"
          v-model="idHouse"
          label="Cambiar de House"
          item-title="house"
          @update:model-value="cambiarHouse"
          return-object
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        cols="12"
        md="3"
        lg="3"
        xl="3"
        v-if="mostrarContenedor"
      >
        <v-autocomplete
          :items="itemsContainers"
          item-title="name"
          item-value="id"
          return-object
          label="Tipo de contenedor"
          v-model="rootStore.state.house_id_containers"
        />
      </v-col>
      <v-col
        cols="12"
        md="3"
        lg="3"
        xl="3"
        v-if="mostrarContenedor"
      >
        <v-text-field
          label="N°. Contenedor"
          v-model="rootStore.state.house_nro_containers"
        />
      </v-col>
      <v-col
        cols="12"
        md="3"
        lg="3"
        xl="3"
        v-if="mostrarContenedor"
      >
        <v-text-field
          label="N°. Precinto"
          v-model="rootStore.state.house_nro_precinto"
        />
      </v-col>
      <v-col
        cols="12"
        md="3"
        lg="3"
        xl="3"
        v-if="mostrarContenedor"
      >
        <v-text-field
          v-model="rootStore.state.house_cantidad"
          label="Cant."
        >
          <template #append-inner>
            <v-icon
              class="btn__add"
              @click="
                _setHouseContainers(
                  rootStore.state.house_id_containers.id,
                  rootStore.state.house_id_containers.name,
                  rootStore.state.house_nro_containers,
                  rootStore.state.house_nro_precinto,
                  rootStore.state.house_cantidad,
                )
              "
              color="green"
            >
              mdi-plus
            </v-icon>
          </template>
        </v-text-field>
      </v-col>

      <v-col
        cols="12"
        v-if="mostrarContenedor"
      >
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
                  N°. Precinto
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
                v-for="item in rootStore.state.itemsHouseContainers"
                :key="item.id"
              >
                <td>{{ item.name }}</td>
                <td>{{ item.nro_containers }}</td>
                <td>{{ item.nro_precinto }}</td>
                <td>{{ item.quantity }}</td>

                <td>
                  <v-icon
                    class="btn__add"
                    size="small"
                    color="red"
                    @click="_deleteContainers(item.id)"
                  >
                    mdi-delete
                  </v-icon>
                </td>
              </tr>
            </tbody>
          </template>
        </v-table>
      </v-col>
    </v-row>
  </div>
</template>

<style lang="scss" scoped>
.btn__add {
  cursor: pointer;
}
</style>
