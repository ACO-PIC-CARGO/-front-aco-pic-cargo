<script setup lang="ts">
import { useTemplateRef } from "vue";
import { useStore } from "vuex";
import FormatFecha from "../comun/FormatFecha.vue";
import { useHousesStore } from "@/stores/houses";

const rootStore = useStore();
const housesStore = useHousesStore();
const frmFiltro = useTemplateRef("frmFiltro");

async function filtrar() {
  rootStore.state.spiner = true;

  await housesStore.listarHouse(rootStore.state.house_filtro);
  rootStore.state.spiner = false;
  rootStore.state.house_filtrarData = false;
}
async function activarPort(id_transport: number) {
  await rootStore.dispatch("_getPortBegin", { id_transport: id_transport });
  await rootStore.dispatch("_getPortEnd", { id_transport: id_transport });
}
async function limpiar() {
  rootStore.state.spiner = true;

  frmFiltro.value!.reset();
  rootStore.state.house_filtro.pagina = 1;
  rootStore.state.house_filtro.limite = 10;

  await rootStore.dispatch("_getTotalHouseListAll");
  await rootStore.dispatch("_getHouseListAll");

  rootStore.state.house_filtrarData =
    !rootStore.state.house_filtrarData;

  rootStore.state.spiner = false;
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
          :items="rootStore.state.itemsMasterList"
          item-title="code_master"
          item-value="id"
          label="Exp. Máster"
          density="compact"
          v-model="rootStore.state.house_filtro.id_master"
        />

        <v-autocomplete
          :items="rootStore.state.itemsModality"
          item-title="name"
          item-value="id"
          label="Sentido"
          density="compact"
          v-model="rootStore.state.house_filtro.id_sentido"
        />

        <v-autocomplete
          :items="rootStore.state.itemsShipment"
          item-title="embarque"
          item-value="id"
          label="Tipo Embarque"
          density="compact"
          v-model="rootStore.state.house_filtro.id_tipo_embarque"
          return-object
          @update:model-value="
            activarPort(rootStore.state.house_filtro.id_tipo_embarque.id_transport)
          "
        />
        <v-autocomplete
          :items="rootStore.state.itemsPortEnd"
          item-title="name"
          item-value="id_port"
          label="Destino"
          density="compact"
          v-model="rootStore.state.house_filtro.id_destino"
        />

        <v-autocomplete
          :items="rootStore.state.clientes"
          item-title="namelong"
          item-value="id"
          label="Cliente del House"
          density="compact"
          v-model="rootStore.state.house_filtro.id_cliente"
        />

        <v-autocomplete
          :items="rootStore.state.itemsPortBegin"
          item-title="name"
          item-value="id_port"
          label="Origen"
          density="compact"
          v-model="rootStore.state.house_filtro.id_origen"
        />

        <v-row>
          <v-col
            cols="12"
            md="6"
          >
            <FormatFecha
              v-model="rootStore.state.house_filtro.fecha_etd_desde"
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
              v-model="rootStore.state.house_filtro.fecha_etd_hasta"
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
              v-model="rootStore.state.house_filtro.fecha_eta_desde"
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
              v-model="rootStore.state.house_filtro.fecha_eta_hasta"
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
          rootStore.state.house_filtrarData = !rootStore.state.house_filtrarData
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
