<script setup lang="ts">
import { useTemplateRef } from "vue";
import { useStore } from "vuex";
import { useMasterusuariosStore } from "@/stores/masterusuarios";

const rootStore = useStore();
const masterusuariosStore = useMasterusuariosStore();
const frmFiltro = useTemplateRef("frmFiltro");

async function filtrar() {
  rootStore.state.spiner = true;

  if (
    rootStore.state.controlgastosfiltro.id_tipo_embarqu &&
    Object.keys(rootStore.state.controlgastosfiltro.id_tipo_embarque)
      .length > 0
  ) {
    rootStore.state.controlgastosfiltro.id_transport =
      rootStore.state.controlgastosfiltro.id_tipo_embarque.id_transport;
  } else {
    rootStore.state.controlgastosfiltro.id_transport = null;
  }
  await rootStore.dispatch("_getControlList");

  rootStore.state.cg_filtrarData = !rootStore.state.cg_filtrarData;

  rootStore.state.spiner = false;
}
async function activarPort(id_transport: number | string) {
  await rootStore.dispatch("_getPortBegin", { id_transport: id_transport });
  await rootStore.dispatch("_getPortEnd", { id_transport: id_transport });
}
async function limpiar() {
  rootStore.state.spiner = true;

  frmFiltro.value!.reset();

  rootStore.state.controlgastosfiltro.status_operativo = "";
  rootStore.state.controlgastosfiltro.status_administrativo = "";
  rootStore.state.controlgastosfiltro.pagina = 1;
  rootStore.state.controlgastosfiltro.limite = 10;

  await rootStore.dispatch("_getControlList");

  rootStore.state.cg_filtrarData = !rootStore.state.cg_filtrarData;

  rootStore.state.spiner = false;
}
</script>

<template>
  <v-card elevation="0">
    <v-card-title class="bg-black text-white rounded-0"
      >EXPEDIENTES MÁSTER</v-card-title
    >
    <v-card-title>FILTRAR REGISTROS</v-card-title>

    <v-card-text>
      <v-form ref="frmFiltro">
        <v-autocomplete
          :items="rootStore.state.itemsModality"
          item-title="name"
          item-value="id"
          label="Sentido"
          density="compact"
          v-model="rootStore.state.controlgastosfiltro.id_sentido"
        ></v-autocomplete>

        <v-autocomplete
          :items="rootStore.state.itemsShipment"
          item-title="embarque"
          item-value="id"
          label="Tipo Embarque"
          density="compact"
          v-model="rootStore.state.controlgastosfiltro.id_tipo_embarque"
          return-object
          @update:model-value="
            activarPort(
              rootStore.state.controlgastosfiltro.id_tipo_embarque.id_transport,
            )
          "
        ></v-autocomplete>

        <v-autocomplete
          :items="rootStore.state.itemsPortBegin"
          item-title="name"
          item-value="id_port"
          label="Origen"
          density="compact"
          v-model="rootStore.state.controlgastosfiltro.id_origen"
        ></v-autocomplete>

        <v-autocomplete
          :items="rootStore.state.itemsPortEnd"
          item-title="name"
          item-value="id_port"
          label="Destino"
          density="compact"
          v-model="rootStore.state.controlgastosfiltro.id_destino"
        ></v-autocomplete>

        <v-autocomplete
          :items="masterusuariosStore.lstCanales"
          item-title="descripcion"
          item-value="id"
          label="Canal"
          density="compact"
          v-model="rootStore.state.controlgastosfiltro.id_canal"
        ></v-autocomplete>

        <v-autocomplete
          :items="rootStore.state.itemsProveedorList"
          item-title="namelong"
          item-value="id"
          label="Agente"
          density="compact"
          v-model="rootStore.state.controlgastosfiltro.id_agente"
        ></v-autocomplete>

        <v-text-field
          
          label="Nro MBL"
          density="compact"
          v-model="rootStore.state.controlgastosfiltro.nro_mbl"
        ></v-text-field>

        <v-text-field
          type="date"
          label="Fecha ETD"
          density="compact"
          v-model="rootStore.state.controlgastosfiltro.fecha_etd"
        ></v-text-field>

        <v-text-field
          type="date"
          label="Fecha ETA"
          density="compact"
          v-model="rootStore.state.controlgastosfiltro.fecha_eta"
        ></v-text-field>

        <v-row>
          <v-col class="col">
            <p>Estado Operativo</p>
            <v-radio-group
              v-model="rootStore.state.controlgastosfiltro.status_operativo"
            >
              <v-radio color="green" label="Abierto" value="0"></v-radio>
              <v-radio color="error" label="Cerrado" value="1"></v-radio>
              <v-radio color="default" label="Todos" value="2"></v-radio>
            </v-radio-group>
          </v-col>

          <v-col class="col">
            <p class="text-truncate">Estado Administrativo</p>
            <v-radio-group
              v-model="rootStore.state.controlgastosfiltro.status_administrativo"
            >
              <v-radio color="green" label="Abierto" value="0"></v-radio>
              <v-radio color="error" label="Cerrado" value="1"></v-radio>
              <v-radio color="default" label="Todos" value="2"></v-radio>
            </v-radio-group>
          </v-col>
        </v-row>
      </v-form>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn size="small" class="mx-1" color="success" @click="filtrar()">
        Aceptar
      </v-btn>
      <v-btn
        size="small"
        class="mx-1"
        color="error"
        @click="rootStore.state.cg_filtrarData = !rootStore.state.cg_filtrarData"
      >
        Cancelar
      </v-btn>
      <v-btn size="small" class="mx-1" color="default" @click="limpiar()">
        Limpiar
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style></style>
