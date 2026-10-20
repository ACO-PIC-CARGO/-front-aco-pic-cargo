<script setup lang="ts">
import { useTemplateRef } from "vue";
import { useAppStore } from "@/stores/app";
import { useHousesStore } from "@/stores/houses";
import FormatFecha from "../comun/FormatFecha.vue";

const appStore = useAppStore();
const housesStore = useHousesStore();
const frmFiltro = useTemplateRef("frmFiltro");

async function filtrar() {
  appStore.spiner = true;

  await housesStore.listarHouse(housesStore.house_filtro);
  appStore.spiner = false;
  housesStore.house_filtrarData = false;
}
async function activarPort(id_transport: number) {
  await appStore._getPortBegin({ id_transport: id_transport });
  await appStore._getPortEnd({ id_transport: id_transport });
}
async function limpiar() {
  appStore.spiner = true;

  frmFiltro.value!.reset();
  housesStore.house_filtro.pagina = 1;
  housesStore.house_filtro.limite = 10;

  await appStore._getTotalHouseListAll();
  await appStore._getHouseListAll();

  housesStore.house_filtrarData =
    !housesStore.house_filtrarData;

  appStore.spiner = false;
}
</script>

<template>
  <v-card elevation="0">
    <v-card-title class="bg-black text-white rounded-0">
      EXPEDIENTES HOUSE's
    </v-card-title>
    <v-card-title>FILTRAR REGISTROS</v-card-title>

    <v-card-text>
      <v-form ref="frmFiltro">
        <v-autocomplete
          :items="appStore.itemsMasterList"
          item-title="code_master"
          item-value="id"
          label="Exp. Máster"
          density="compact"
          v-model="housesStore.house_filtro.id_master"
        />

        <v-autocomplete
          :items="appStore.itemsModality"
          item-title="name"
          item-value="id"
          label="Sentido"
          density="compact"
          v-model="housesStore.house_filtro.id_sentido"
        />

        <v-autocomplete
          :items="appStore.itemsShipment"
          item-title="embarque"
          item-value="id"
          label="Tipo Embarque"
          density="compact"
          v-model="housesStore.house_filtro.id_tipo_embarque"
          return-object
          @update:model-value="
            activarPort(housesStore.house_filtro.id_tipo_embarque.id_transport)
          "
        />
        <v-autocomplete
          :items="appStore.itemsPortEnd"
          item-title="name"
          item-value="id_port"
          label="Destino"
          density="compact"
          v-model="housesStore.house_filtro.id_destino"
        />

        <v-autocomplete
          :items="appStore.clientes"
          item-title="namelong"
          item-value="id"
          label="Cliente del House"
          density="compact"
          v-model="housesStore.house_filtro.id_cliente"
        />

        <v-autocomplete
          :items="appStore.itemsPortBegin"
          item-title="name"
          item-value="id_port"
          label="Origen"
          density="compact"
          v-model="housesStore.house_filtro.id_origen"
        />

        <v-row>
          <v-col
            cols="12"
            md="6"
          >
            <FormatFecha
              v-model="housesStore.house_filtro.fecha_etd_desde"
              label="Fecha ETD Desde "
              :dense="true"
              :clearable="true"
            />
          </v-col>
          <v-col
            cols="12"
            md="6"
          >
            <FormatFecha
              v-model="housesStore.house_filtro.fecha_etd_hasta"
              label="Fecha ETD Hasta"
              :dense="true"
              :clearable="true"
            />
          </v-col>
          <v-col
            cols="12"
            md="6"
          >
            <FormatFecha
              v-model="housesStore.house_filtro.fecha_eta_desde"
              label="Fecha ETA Desde"
              :dense="true"
              :clearable="true"
            />
          </v-col>
          <v-col
            cols="12"
            md="6"
          >
            <FormatFecha
              v-model="housesStore.house_filtro.fecha_eta_hasta"
              label="Fecha ETA Hasta"
              :dense="true"
              :clearable="true"
            />
          </v-col>
        </v-row>

        <!-- <v-text-field
          type="date"
          label="Fecha ETD"
          dense
          v-model="$store.state.house_filtro.fecha_etd"
        ></v-text-field>

        <v-text-field
          type="date"
          label="Fecha ETA"
          dense
          v-model="$store.state.house_filtro.fecha_eta"
        ></v-text-field> -->
      </v-form>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn
        size="small"
        class="mx-1"
        color="success"
        @click="filtrar()"
      >
        Aceptar
      </v-btn>
      <v-btn
        size="small"
        class="mx-1"
        color="error"
        @click="
          housesStore.house_filtrarData = !housesStore.house_filtrarData
        "
      >
        Cancelar
      </v-btn>
      <v-btn
        size="small"
        class="mx-1"
        color="default"
        @click="limpiar()"
      >
        Limpiar
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style></style>
