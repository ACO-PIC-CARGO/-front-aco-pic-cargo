<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from "vue";
import { useStore } from "vuex";
import Swal from "sweetalert2";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { usePricingStore } from "@/stores/pricing";
import { useAduanaStore } from "@/stores/aduana";
import { sessionIsoPais } from "@/utils/sesion";
import type { TipoContenedor } from "@/types/catalogos";
import type { Puerto, TipoCarga } from "@/types/cotizacion";

const rootStore = useStore();
const aduanaStore = useAduanaStore();
const masterusuariosStore = useMasterusuariosStore();
const pricingStore = usePricingStore();

const headers = [
  { title: "", key: "action" },
  { title: "#", key: "number" },
  { title: "Tipo Contendor", key: "description" },
  { title: "Cantidad", key: "cantidad" },
];
const dialogConteiner = ref(false);
const numerobultos = ref("");
const volumen = ref("");
const peso = ref("");
const err = ref("");
const containers = ref({
  container: "" as unknown as TipoContenedor,
  cantidad: "",
});
const frmContainer = useTemplateRef("frmContainer");
const frmPuerto = useTemplateRef("frmPuerto");


const pesoVolumetrico = computed(() => {
  const datos = aduanaStore.datosPrincipales || {};
  const volumen = parseFloat(String(datos.volumen || 0)); // m³
  if (!volumen) return null;

  // Determinar tipo de embarque para elegir el factor volumétrico
  let factorVolumetrico = 166.66; // Aéreo
  try {
    const idTipo = aduanaStore.datosPrincipales.idtipocarga;
    const shipment = aduanaStore.listShipment.find(
      (v) => v.id == (idTipo && typeof idTipo === 'object' ? idTipo.id : idTipo)
    );
    const code = shipment ? shipment.code : "";
    if (code === "LCL") {
      factorVolumetrico = 1000;
    }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {}

  const pv = volumen > 0 ? volumen * factorVolumetrico : 0;
  if (!pv || !isFinite(pv)) return null;
  return parseFloat(pv.toFixed(2));
});
const pesoCargable = computed(() => {
  const datos = aduanaStore.datosPrincipales || {};
  const pesoReal = parseFloat(String(datos.peso || 0)); // kg
  const volumen = parseFloat(String(datos.volumen || 0)); // m³

  // Si no hay datos suficientes, no mostramos nada
  if (!pesoReal && !volumen) return null;

  // Determinar tipo de embarque para elegir el factor volumétrico
  let factorVolumetrico = 166.66; // Aéreo (LxAxH cm / 6000)
  try {
    const idTipo = aduanaStore.datosPrincipales.idtipocarga;
    const shipment = aduanaStore.listShipment.find(
      (v) => v.id == idTipo
    );
    const code = shipment ? shipment.code : "";

    // Marítimo LCL / Consolidado: divisor 1000 en cm → factor 1000 kg/m³
    if (code === "LCL") {
      factorVolumetrico = 1000;
    }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // si algo falla, usamos el factor por defecto
  }

  const pesoVolumetrico = volumen > 0 ? volumen * factorVolumetrico : 0;

  const chargeable = Math.max(pesoReal || 0, pesoVolumetrico || 0);
  if (!chargeable || !isFinite(chargeable)) return null;
  return parseFloat(chargeable.toFixed(2));
});



// eslint-disable-next-line @typescript-eslint/no-unused-vars
function añadirCarga() {
  err.value = "";
  if (
    (numerobultos.value as unknown as number) > 0 &&
    (volumen.value as unknown as number) > 0 &&
    (peso.value as unknown as number) > 0
  ) {
    aduanaStore.datosPrincipales.numerobultos =
      numerobultos.value;
    aduanaStore.datosPrincipales.volumen = volumen.value;
    aduanaStore.datosPrincipales.peso = peso.value;
  } else {
    err.value = "Datos requerido y mayor que cero";
  }
}
async function guardarContainer() {
  err.value = "";
  if ((await frmContainer.value!.validate()).valid) {
    if (
      aduanaStore.datosPrincipales.containers!.filter(
        (v) => v.id == containers.value.container.id
      ).length == 0
    ) {
      aduanaStore.datosPrincipales.containers!.push({
        id: containers.value.container.id,
        description: containers.value.container.name,
        cantidad: containers.value.cantidad as unknown as number,
      });
      dialogConteiner.value = false;
      containers.value = {
        container: "" as unknown as TipoContenedor,
        cantidad: "",
      };
    } else {
      err.value = "Contenedor ya se encuentra en la lista";
    }
  }
}
function eliminarContainer({ index = null }: { index?: number | null }) {
  aduanaStore.datosPrincipales.containers!.splice(index as number, 1);
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function aceptar() {
  let validate = true;
  if ((await frmPuerto.value!.validate()).valid) {
    if (
      (aduanaStore.datosPrincipales.idtipocarga as TipoCarga).code == "FCL"
    ) {
      if (
        aduanaStore.datosPrincipales.containers!.length == 0
      ) {
        Swal.fire({
          icon: "error",
          title: "Aviso",
          text: "Se necesita al menos un contenedor",
        });
        validate = false;
      }
    }
    if (
      (aduanaStore.datosPrincipales.idtipocarga as TipoCarga).code != "FCL"
    ) {
      if (!numerobultos.value && !volumen.value && !peso.value) {
        Swal.fire({
          icon: "error",
          title: "Aviso",
          text: "Se necesita los datos de la carga",
        });
        validate = false;
      }
    }
    if (!!validate) {
      rootStore.state.spiner = true;
      await pricingStore.getItemsServices();
      await pricingStore.getMultiplicador();
      rootStore.state.spiner = false;
      aduanaStore.step3 = true;
    }
    //
  }
  // this.$store.commit("SET_STEP_3", true);
}
function getPuertoOrigen() {
  let puertos: Puerto[] = [];
  if (aduanaStore.datosPrincipales.iddestino) {
    const id_port = aduanaStore.listPortEnd.filter(
      (v) =>
        v.id_port == aduanaStore.datosPrincipales.iddestino
    )[0];

    puertos = aduanaStore.listPortBegin.filter(
      (v) => v.id_port != (id_port as unknown as number)
    );
  } else {
    puertos = aduanaStore.listPortBegin;
  }
  return puertos;
}
function getPuertoDestino() {
  let puertos: Puerto[] = [];
  if (aduanaStore.datosPrincipales.idorigen) {
    const id_port = aduanaStore.listPortBegin.filter(
      (v) =>
        v.id_port == aduanaStore.datosPrincipales.idorigen
    )[0]!.id_port;
    puertos = aduanaStore.listPortEnd.filter(
      (v) => v.id_port != id_port
    );
  } else {
    puertos = aduanaStore.listPortEnd;
  }
  return puertos;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isFCL() {
  const id = aduanaStore.datosPrincipales.idtipocarga;
  const code = aduanaStore.listShipment.filter(
    (v) => v.id == id
  )[0]!.code;

  const validate = code == "FCL" ? true : false;
  return validate;
}
function isAereo() {
  const id = aduanaStore.datosPrincipales.idtipocarga;
  const code = aduanaStore.listShipment.filter(
    (v) => v.id == id
  )[0]!.code;
  return code == "Aéreo";
}
function mostrarComboPercepcionAduana() {
  const esPeru = sessionIsoPais() == 9589;
  return (
    esPeru &&
    aduanaStore.listModality.some(
      (v) =>
        v.id == aduanaStore.datosPrincipales.idsentido &&
        v.code == "I"
    )
  );
}

onMounted(async () => {
  await rootStore.dispatch("_getContainers");
});
</script>

<template>
  <v-container fluid>
    <v-card elevation="0">
      <v-card-title primary-title>
        <center>Datos de la Carga</center>
      </v-card-title>
      <v-card-text>
        <v-form ref="frmPuerto">
          <v-row>
            <v-col cols="6">
              <v-autocomplete
                label="Puerto Origen"
                variant="outlined"
                density="compact"
                class="my-1"
                :items="getPuertoOrigen()"
                item-title="name"
                item-value="id_port"
                v-model="aduanaStore.datosPrincipales.idorigen"
                readonly
              />
            </v-col>
            <v-col cols="6">
              <v-autocomplete
                label="Puerto Destino"
                variant="outlined"
                density="compact"
                class="my-1"
                :items="getPuertoDestino()"
                item-title="name"
                item-value="id_port"
                v-model="aduanaStore.datosPrincipales.iddestino"
                readonly
              />
            </v-col>
            <v-col
              cols="6"
              class="py-1"
              v-if="mostrarComboPercepcionAduana()"
            >
              <v-autocomplete
                label="Primera o Segunda Importación"
                readonly
                variant="outlined"
                density="compact"
                :rules="[(v) => !!v || 'Dato requerido']"
                class="my-1"
                :items="masterusuariosStore.lstPercepcionAduana"
                item-title="descripcion"
                item-value="id"
                v-model="
                  aduanaStore.datosPrincipales.id_percepcionaduana
                "
              />
            </v-col>
          </v-row>
        </v-form>

        <v-row v-if="isAereo()">
          <v-col cols="12">
            <v-table
              density="compact"
              class="elevation-1 my-2"
            >
              <thead class="bg-teal-lighten-2 text-white">
                <tr>
                  <th>Cant. Bultos</th>
                  <th>Peso (kg)</th>
                  <th>Volumen (m³)</th>
                  <th>Peso volumétrico (kg)</th>
                  <th>Peso cargable (kg)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    {{ aduanaStore.datosPrincipales.numerobultos }}
                  </td>
                  <td>{{ aduanaStore.datosPrincipales.peso }}</td>
                  <td>{{ aduanaStore.datosPrincipales.volumen }}</td>
                  <td>
                    {{ pesoVolumetrico !== null ? pesoVolumetrico + ' kg' : '' }}
                  </td>
                  <td>
                    {{ pesoCargable !== null ? pesoCargable + ' kg' : '' }}
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-col>
        </v-row>
        <v-row v-else>
          <v-col
            cols="12"
            align="right"
          >
            <!-- <v-btn color="success" @click="dialogConteiner = !dialogConteiner">
              Agregar Contenedor
            </v-btn> -->
          </v-col>
          <v-col cols="12">
            <v-data-table
              :headers="headers"
              :items="aduanaStore.datosPrincipales.containers!"
              class="elevation-1"
            >
              <template #[`item.action`]="item">
                <v-btn
                  variant="text"
                  icon
                  color="red"
                  @click="eliminarContainer({ index: item.index })"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
              <template #[`item.number`]="item">
                {{ item.index + 1 }}
              </template>
            </v-data-table>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    <!-- AGREGAR CONTAINER -->
    <v-dialog
      v-model="dialogConteiner"
      scrollable
      persistent
      max-width="30%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title primary-title>
          Añadir Contenedor
        </v-card-title>
        <v-card-text>
          <!-- {{ $store.state.itemsContainers }} -->
          <v-form ref="frmContainer">
            <v-select
              :items="rootStore.state.itemsContainers"
              v-model="containers.container"
              label="Container"
              item-title="name"
              item-value="id"
              :rules="[(v) => !!v || 'Dato Requerido']"
              :error-messages="err"
              return-object
            />
            <v-text-field
              name="Cantidad"
              label="Cantidad"
              v-model="containers.cantidad"
              type="number"
              :rules="[(v) => !!v || 'Dato Requerido']"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="success"
            @click="guardarContainer()"
          >
            Aceptar
          </v-btn>
          <v-btn
            color="red"
            @click="dialogConteiner = !dialogConteiner"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style>
.center {
  align-content: center !important;
  align-items: center !important;
  text-align: center !important;
}
</style>
