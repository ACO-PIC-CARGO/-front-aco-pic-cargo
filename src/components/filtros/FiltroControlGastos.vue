<script setup lang="ts">
import { useTemplateRef } from "vue";
import { useAppStore } from "@/stores/app";
import { useMasterusuariosStore } from "@/stores/masterusuarios";

const appStore = useAppStore();
const masterusuariosStore = useMasterusuariosStore();
const frmFiltro = useTemplateRef("frmFiltro");

async function filtrar() {
  appStore.spiner = true;

  if (
    appStore.controlgastosfiltro.id_tipo_embarqu &&
    Object.keys(appStore.controlgastosfiltro.id_tipo_embarque)
      .length > 0
  ) {
    appStore.controlgastosfiltro.id_transport =
      appStore.controlgastosfiltro.id_tipo_embarque.id_transport;
  } else {
    appStore.controlgastosfiltro.id_transport = null;
  }
  await appStore._getControlList();

  appStore.cg_filtrarData = !appStore.cg_filtrarData;

  appStore.spiner = false;
}
async function activarPort(id_transport: number | string) {
  await appStore._getPortBegin({ id_transport: id_transport });
  await appStore._getPortEnd({ id_transport: id_transport });
}
async function limpiar() {
  appStore.spiner = true;

  frmFiltro.value!.reset();

  appStore.controlgastosfiltro.status_operativo = "";
  appStore.controlgastosfiltro.status_administrativo = "";
  appStore.controlgastosfiltro.pagina = 1;
  appStore.controlgastosfiltro.limite = 10;

  await appStore._getControlList();

  appStore.cg_filtrarData = !appStore.cg_filtrarData;

  appStore.spiner = false;
}
</script>

<template>
  <v-card elevation="0">
    <v-card-title class="bg-black text-white rounded-0">
      EXPEDIENTES MÁSTER
    </v-card-title>
    <v-card-title>FILTRAR REGISTROS</v-card-title>

    <v-card-text>
      <v-form ref="frmFiltro">
        <v-autocomplete
          :items="appStore.itemsModality"
          item-title="name"
          item-value="id"
          label="Sentido"
          density="compact"
          v-model="appStore.controlgastosfiltro.id_sentido"
        />

        <v-autocomplete
          :items="appStore.itemsShipment"
          item-title="embarque"
          item-value="id"
          label="Tipo Embarque"
          density="compact"
          v-model="appStore.controlgastosfiltro.id_tipo_embarque"
          return-object
          @update:model-value="
            activarPort(
              appStore.controlgastosfiltro.id_tipo_embarque.id_transport,
            )
          "
        />

        <v-autocomplete
          :items="appStore.itemsPortBegin"
          item-title="name"
          item-value="id_port"
          label="Origen"
          density="compact"
          v-model="appStore.controlgastosfiltro.id_origen"
        />

        <v-autocomplete
          :items="appStore.itemsPortEnd"
          item-title="name"
          item-value="id_port"
          label="Destino"
          density="compact"
          v-model="appStore.controlgastosfiltro.id_destino"
        />

        <v-autocomplete
          :items="masterusuariosStore.lstCanales"
          item-title="descripcion"
          item-value="id"
          label="Canal"
          density="compact"
          v-model="appStore.controlgastosfiltro.id_canal"
        />

        <v-autocomplete
          :items="appStore.itemsProveedorList"
          item-title="namelong"
          item-value="id"
          label="Agente"
          density="compact"
          v-model="appStore.controlgastosfiltro.id_agente"
        />

        <v-text-field
          
          label="Nro MBL"
          density="compact"
          v-model="appStore.controlgastosfiltro.nro_mbl"
        />

        <v-text-field
          type="date"
          label="Fecha ETD"
          density="compact"
          v-model="appStore.controlgastosfiltro.fecha_etd"
        />

        <v-text-field
          type="date"
          label="Fecha ETA"
          density="compact"
          v-model="appStore.controlgastosfiltro.fecha_eta"
        />

        <v-row>
          <v-col class="col">
            <p>Estado Operativo</p>
            <v-radio-group
              v-model="appStore.controlgastosfiltro.status_operativo"
            >
              <v-radio
                color="green"
                label="Abierto"
                value="0"
              />
              <v-radio
                color="error"
                label="Cerrado"
                value="1"
              />
              <v-radio
                color="default"
                label="Todos"
                value="2"
              />
            </v-radio-group>
          </v-col>

          <v-col class="col">
            <p class="text-truncate">
              Estado Administrativo
            </p>
            <v-radio-group
              v-model="appStore.controlgastosfiltro.status_administrativo"
            >
              <v-radio
                color="green"
                label="Abierto"
                value="0"
              />
              <v-radio
                color="error"
                label="Cerrado"
                value="1"
              />
              <v-radio
                color="default"
                label="Todos"
                value="2"
              />
            </v-radio-group>
          </v-col>
        </v-row>
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
        @click="appStore.cg_filtrarData = !appStore.cg_filtrarData"
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
