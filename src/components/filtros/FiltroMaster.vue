<script setup lang="ts">
import { useTemplateRef } from "vue";
import { useStore } from "vuex";
import FormatFecha from "../comun/FormatFecha.vue";
import { useMasterusuariosStore } from "@/stores/masterusuarios";

const rootStore = useStore();
const masterusuariosStore = useMasterusuariosStore();
const frmFiltro = useTemplateRef("frmFiltro");

async function filtrar() {
  rootStore.state.spiner = true;

  rootStore.state.master_filtro.pagina = 1;
  rootStore.state.master_filtro.limite = 10;

  await rootStore.dispatch("_getTotalMasterList");
  await rootStore.dispatch("_getMasterList");

  rootStore.state.master_filtrarData =
    !rootStore.state.master_filtrarData;

  rootStore.state.spiner = false;
}
async function activarPort(id_transport: number) {
  await rootStore.dispatch("_getPortBegin", { id_transport: id_transport });
  await rootStore.dispatch("_getPortEnd", { id_transport: id_transport });
}
async function limpiar() {
  rootStore.state.spiner = true;

  frmFiltro.value!.reset();

  rootStore.state.master_filtro.status_operativo = "";
  rootStore.state.master_filtro.status_administrativo = "";
  rootStore.state.master_filtro.pagina = 1;
  rootStore.state.master_filtro.limite = 10;

  await rootStore.dispatch("_getTotalMasterList");
  await rootStore.dispatch("_getMasterList");

  rootStore.state.master_filtrarData =
    !rootStore.state.master_filtrarData;

  rootStore.state.spiner = false;
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
          :items="masterusuariosStore.lstCanales"
          item-title="descripcion"
          item-value="id"
          label="Canal"
          density="compact"
          v-model="rootStore.state.master_filtro.id_canal"
        />

        <v-autocomplete
          :items="rootStore.state.itemsModality"
          item-title="name"
          item-value="id"
          label="Sentido"
          density="compact"
          v-model="rootStore.state.master_filtro.id_sentido"
        />

        <v-autocomplete
          :items="rootStore.state.itemsShipment"
          item-title="embarque"
          item-value="id"
          label="Tipo Embarque"
          density="compact"
          v-model="rootStore.state.master_filtro.id_tipo_embarque"
          return-object
          @update:model-value="
            activarPort(
              rootStore.state.master_filtro.id_tipo_embarque.id_transport,
            )
          "
        />

        <v-autocomplete
          :items="rootStore.state.itemsPortBegin"
          item-title="name"
          item-value="id_port"
          label="Origen"
          density="compact"
          v-model="rootStore.state.master_filtro.id_origen"
        />

        <v-autocomplete
          :items="rootStore.state.itemsPortEnd"
          item-title="name"
          item-value="id_port"
          label="Destino"
          density="compact"
          v-model="rootStore.state.master_filtro.id_destino"
        />

        <v-autocomplete
          :items="rootStore.state.itemsProveedorList"
          item-title="namelong"
          item-value="id"
          label="Agente"
          density="compact"
          v-model="rootStore.state.master_filtro.id_agente"
        />
        <v-row>
          <v-col
            cols="12"
            md="6"
          >
            <FormatFecha
              v-model="rootStore.state.master_filtro.fecha_etd_desde"
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
              v-model="rootStore.state.master_filtro.fecha_etd_hasta"
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
              v-model="rootStore.state.master_filtro.fecha_eta_desde"
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
              v-model="rootStore.state.master_filtro.fecha_eta_hasta"
              label="Fecha ETA Hasta"
              :dense="true"
              :clearable="true"
            />
          </v-col>
          <v-col class="col">
            <p>Estado Operativo</p>
            <v-radio-group
              v-model="rootStore.state.master_filtro.status_operativo"
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
              v-model="rootStore.state.master_filtro.status_administrativo"
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
        @click="
          rootStore.state.master_filtrarData = !rootStore.state.master_filtrarData
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
