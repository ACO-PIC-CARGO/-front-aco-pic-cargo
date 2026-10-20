<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useAppStore } from "@/stores/app";
import axios from "@/api/http";
import { useHousesStore } from "@/stores/houses";
import { usePricingStore } from "@/stores/pricing";

defineProps<{ isFormActionsDisabled?: boolean }>();

const appStore = useAppStore();
const route = useRoute();
const housesStore = useHousesStore();
const pricingStore = usePricingStore();
const itemsContainers = computed(() => appStore.itemsContainers);

function cleanData() {
  housesStore.house_cantidad = "";
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
        housesStore._getHouseContainers(undefined as never);
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
        housesStore._getHouseContainers(undefined as never);
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
    // vm.$store.state.house_Id_get = vm.$route.params.id;
    // var data = {
    //   id: vm.$route.params.id,
    //   id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
    // };
    // var config = {
    //   method: "post",
    //   url: import.meta.env.VITE_URL_MAIN + "getHouseListId/",
    //   headers: {
    //
    //     "Content-Type": "application/json",
    //   },
    //   data: data,
    // };
    // axios(config)
    //   .then(function (response) {
    //     vm.$store.state.copy_house = response.data.data[0];
    //     vm.$store.state.house_id_agente = response.data.data[0].id_agent;
    //     vm.$store.state.house_id_consigner =
    //       response.data.data[0].id_consigner;
    //     vm.$store.state.house_id_notify = response.data.data[0].id_notify;
    //     vm.$store.state.house_id_airlines =
    //       response.data.data[0].id_aerolinea;
    //     vm.$store.state.house_id_coloader =
    //       response.data.data[0].id_coloader;
    //     vm.$store.state.house_id_agente = response.data.data[0].id_agent;
    //     vm.$store.state.house_id_naviera = response.data.data[0].id_naviera;
    //     vm.$store.state.house_blmaster = response.data.data[0].nro_hbl;
    //     vm.$store.state.house_id_motonave =
    //       response.data.data[0].id_motonave;
    //     vm.$store.state.house_viaje = response.data.data[0].nro_viaje;
    //     vm.$store.state.house_bultos = response.data.data[0].bultos;
    //     vm.$store.state.house_peso = response.data.data[0].peso;
    //     vm.$store.state.house_volumen = response.data.data[0].volumen;
    //     vm.$store.state.house_id_condicion =
    //       response.data.data[0].id_conditions;
    //     vm.$store.state.house_id_coins = response.data.data[0].id_moneda;
    //     vm.$store.state.house_monto = response.data.data[0].monto;
    //     vm.$store.state.house_id = response.data.data[0].id;

    //     vm.$store.state.drawer = false;
    //   })
    //   .catch(function (error) {
    //     console.error(error);
    //   });
    await housesStore._getHouseContainers(undefined as never);
  }
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
function _setDataContainers(id: number, name: string, cantidad: number) {
  appStore.master_itemsContainers.push({
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
  appStore.master_itemsContainers.splice(index, 1);
}
function limpiarData() {
  housesStore.house_id_agente = "";
  appStore.house_id_consigner = "";
  housesStore.house_id_notify = "";
  housesStore.house_id_airlines = "";
  housesStore.house_id_coloader = "";
  housesStore.house_id_agente = "";
  housesStore.house_id_naviera = "";
  housesStore.house_blmaster = "";
  housesStore.house_id_motonave = "";
  housesStore.house_viaje = "";
  housesStore.house_bultos = "";
  housesStore.house_peso = "";
  housesStore.house_volumen = "";
  housesStore.house_id_condicion = "";
  housesStore.house_id_coins = "";
  housesStore.house_monto = "";
  housesStore.house_id = "";
}

onMounted(async () => {
  limpiarData();
  await Promise.all([
    appStore._getProveedor(),
    appStore.cargarClientes(),
    appStore._getProveedorRolShipper(),
    // this.getListQuote(),
  ]);

  // this.$store.state.spiner = true;

  // this.$store.state.spiner = false;
});
</script>

<template>
  <div>
    <h3>Datos del Embarque</h3>

    <v-row density="compact">
      <v-col
        cols="12"
        md="12"
      >
        <!--  v-if="$store.state.house_id_trasnport.id != 3" -->
        <v-text-field
          label="Proveedor"
          v-model="housesStore.house.proveedor"
          readonly
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <v-text-field
          label="Consigne HBL"
          v-model="housesStore.house.consigner_real"
          readonly
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <v-text-field
          label="Notify HBL"
          v-model="housesStore.house.notify"
          readonly
        />
      </v-col>

      <v-col cols="12">
        <v-autocomplete
          :items="pricingStore.listEjecutivo"
          item-title="nombrecompleto"
          item-value="id"
          label="Vendedor"
          v-model="housesStore.house.id_vendedor"
        />
      </v-col>
      <v-col cols="12">
        <v-autocomplete
          :items="pricingStore.listEjecutivo"
          item-title="nombrecompleto"
          item-value="id"
          label="Pricing"
          v-model="housesStore.house.id_pricing"
        />
      </v-col>

      <!-- Fila 3: Motonave + Viaje (sin N° BL House en vista) -->
      <v-col
        cols="12"
        md="6"
      >
        <v-text-field
          v-model="housesStore.house.motonave"
          label="Motonave"
          readonly
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <v-text-field
          v-model="housesStore.house.nro_viaje"
          label="Viaje"
          readonly
        />
      </v-col>

      <v-col
        cols="12"
        md="4"
        lg="4"
        xl="4"
      >
        <v-text-field
          label="Condición"
          v-model="housesStore.house.conditions"
          readonly
        />
      </v-col>
      <v-col
        cols="12"
        md="4"
        lg="4"
        xl="4"
      >
        <v-text-field
          label="Monto"
          suffix="USD"
          v-model="housesStore.house.monto"
          readonly
        />
      </v-col>
      <v-col
        cols="12"
        md="4"
        lg="4"
        xl="4"
      >
        <v-text-field
          label="Moneda"
          v-model="housesStore.house.moneda"
          readonly
        />
      </v-col>

      <v-col
        cols="12"
        md="3"
        lg="3"
        xl="3"
        v-if="appStore.master_id_trasnport.id == 2"
      >
        <v-autocomplete
          :items="itemsContainers"
          item-title="name"
          item-value="id"
          return-object
          label="Tipo de contenedor"
          v-model="housesStore.house_id_containers"
        />
      </v-col>
      <v-col
        cols="12"
        md="3"
        lg="3"
        xl="3"
        v-if="appStore.master_id_trasnport.id == 2"
      >
        <v-text-field
          label="N°. Contenedor"
          v-model="housesStore.house_nro_containers"
        />
      </v-col>
      <v-col
        cols="12"
        md="3"
        lg="3"
        xl="3"
        v-if="appStore.master_id_trasnport.id == 2"
      >
        <v-text-field
          label="N°. Precinto"
          v-model="housesStore.house_nro_precinto"
        />
      </v-col>
      <v-col
        cols="12"
        md="3"
        lg="3"
        xl="3"
        v-if="appStore.master_id_trasnport.id == 2"
      >
        <v-text-field
          v-model="housesStore.house_cantidad"
          label="Cant."
        >
          <template #append-inner>
            <v-icon
              class="btn__add"
              @click="
                _setHouseContainers(
                  housesStore.house_id_containers.id,
                  housesStore.house_id_containers.name,
                  housesStore.house_nro_containers as string,
                  housesStore.house_nro_precinto as string,
                  housesStore.house_cantidad as string,
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
        v-if="appStore.master_id_trasnport.id == 2"
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
                v-for="item in housesStore.itemsHouseContainers"
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
