<script setup lang="ts">
import { nextTick, onMounted, ref, useTemplateRef } from "vue";
import { useStore } from "vuex";
import { useCalculadorasStore } from "@/stores/calculadoras";
import type { SucursalSesion } from "@/types/sesion";

const componentProps = withDefaults(defineProps<{ type?: string; idModality?: number }>(), {
  type: "FCL",
  idModality: 1,
});

const calculadorasStore = useCalculadorasStore();
const rootStore = useStore();

const branchPais = () => (JSON.parse(sessionStorage.getItem("dataBranch") as string) as SucursalSesion[])[0]!.id_pais!;

const dialogNuevo = ref(false);
const snackbar = ref(false);
const modalityId = ref(componentProps.idModality);
const headers = [
  { key: "modality", title: "Modalidad" },
  { key: "pais", title: "Pais" },
  { key: "code", title: "Código" },
  { key: "descripcion", title: "Servicio" },
  { key: "orden", title: "Orden" },
  { key: "opcionflag", title: "Opcional" },
];
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const items = [
  {
    modality: "Importación",
    pais: "Perú",
    // section: "ORIGEN: FLETE Y GASTOS DE ORIGEN",
    code: "001",
    descripcion: "Almacén aduanero",
    opcionalflag: false,
    orden: 1,
  },
];

const modality: { name?: string } = {};
const pais: { name?: string } = {};
const code = ref("");
const orden = ref("");
const descripcion = ref("");
const opcionalflag = ref(false);
const id_pais = ref<number | string>("");
const loading = ref(false);
const frmServicio = useTemplateRef("frmServicio");

onMounted(async () => {
  id_pais.value = branchPais();
});
// components() {},
function mostrarAdvertencia() {
  snackbar.value = true;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function abrirModalServicio() {
  dialogNuevo.value = true;
  nextTick(() => {
    frmServicio.value!.reset();
    setTimeout(() => {
      id_pais.value = branchPais();
      modalityId.value = 1;
    }, 100);
  });
}
async function anadirServ() {
  if ((await frmServicio.value!.validate()).valid) {
    loading.value = true;
    const serv = {
      id_modality: modalityId.value,
      modality: modality.name,
      id_pais: id_pais.value,
      pais: pais.name,
      code: code.value,
      descripcion: descripcion.value,
      orden: orden.value,
      opcionalflag: opcionalflag.value,
    };
    await calculadorasStore.PostCalcServicio(serv);
    dialogNuevo.value = false;
    loading.value = false;
  }
}
</script>

<template>
  <v-container grid-list-xs>
    <v-row>
      <v-col
        cols="12"
        style="text-align: end"
      >
        <v-spacer />
        <!-- <v-btn color="success" small @click="abrirModalServicio"
          >Añadir Servicio</v-btn
        > -->
      </v-col>
      <v-col cols="12">
        <v-data-table
          :headers="headers"
          :items="calculadorasStore.lstServicio"
        >
          <template #[`item.opcionflag`]="{ item }">
            {{ item.opcionflag ? "Si" : "No" }}
          </template>
        </v-data-table>
      </v-col>
    </v-row>
    <v-dialog
      v-model="dialogNuevo"
      persistent
      width="40%"
    >
      <v-card>
        <v-card-title
          class="my-2"
          primary-title
        >
          Nuevo Servicio
        </v-card-title>
        <v-card-text>
          <v-form ref="frmServicio">
            <v-row>
              <v-col
                cols="12"
                class="py-0"
              >
                <v-autocomplete
                  variant="outlined"
                  label="Modalidad"
                  :items="rootStore.state.itemsModality"
                  density="compact"
                  item-value="id"
                  item-title="name"
                  v-model="modalityId"
                  :rules="[(v) => !!v || 'Dato requerido']"
                  disabled
                />
              </v-col>
              <v-col
                cols="12"
                class="py-0"
              >
                <v-autocomplete
                  variant="outlined"
                  label="Pais"
                  :items="rootStore.state.itemsPais"
                  density="compact"
                  item-value="id"
                  item-title="name"
                  v-model="id_pais"
                  :rules="[(v) => !!v || 'Dato requerido']"
                  disabled
                >
                  <template #item="{ props }">
                    <v-list-item
                      v-bind="props"
                      class="text-uppercase"
                    />
                  </template>
                </v-autocomplete>
              </v-col>
              <v-col
                cols="12"
                class="py-0"
              >
                <v-text-field
                  label="Código"
                  variant="outlined"
                  density="compact"
                  append-inner-icon="mdi-information"
                  v-model="code"
                  @click:append-inner="mostrarAdvertencia()"
                  :rules="[(v) => !!v || 'Dato requerido']"
                />
              </v-col>
              <v-col
                cols="12"
                class="py-0"
              >
                <v-text-field
                  label="Descripción"
                  variant="outlined"
                  density="compact"
                  v-model="descripcion"
                  :rules="[(v) => !!v || 'Dato requerido']"
                />
              </v-col>
              <v-col
                cols="12"
                class="py-0"
              >
                <v-text-field
                  type="number"
                  label="Orden"
                  variant="outlined"
                  density="compact"
                  v-model="orden"
                  :rules="[(v) => !!v || 'Dato requerido']"
                />
              </v-col>
              <v-col
                cols="12"
                class="py-0"
              >
                <v-switch
                  label="Opcional"
                  v-model="opcionalflag"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            size="small"
            color="success"
            :loading="loading"
            @click="anadirServ"
          >
            Añadir
          </v-btn>
          <v-btn
            size="small"
            color="error"
            @click="dialogNuevo = false"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-snackbar v-model="snackbar">
      <p>Código para Impuestos (01)</p>
      <p>Código para Transporte local y entrega (02)</p>

      <v-btn
        block
        color="red"
        @click="snackbar = false"
      >
        Close
      </v-btn>
    </v-snackbar>
  </v-container>
</template>

<style></style>
