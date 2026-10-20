<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from "vue";
import { useStore } from "vuex";
import Swal from "sweetalert2";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { usePricingStore } from "@/stores/pricing";
import { sessionIsoPais, sessionSucursal } from "@/utils/sesion";
import type { TipoContenedor } from "@/types/catalogos";
import type { Puerto } from "@/types/cotizacion";

withDefaults(defineProps<{ mostrarproveedor?: boolean }>(), {
  mostrarproveedor: true,
});

const rootStore = useStore();
const pricingStore = usePricingStore();
const masterusuariosStore = useMasterusuariosStore();

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
  // Solo aplica para embarques aéreos
  if (!isAereo()) return null;

  const datos = pricingStore.datosPrincipales || {};
  const volumen = parseFloat(String(datos.volumen || 0)); // m³
  if (!volumen) return null;

  const pv = volumen > 0 ? volumen * 166.66 : 0;
  if (!pv || !isFinite(pv)) return null;
  return parseFloat(pv.toFixed(2));
});
const pesoCargable = computed(() => {
  // Solo aplica para embarques aéreos
  if (!isAereo()) return null;

  const datos = pricingStore.datosPrincipales || {};
  const pesoReal = parseFloat(String(datos.peso || 0)); // kg
  const volumen = parseFloat(String(datos.volumen || 0)); // m³

  if (!pesoReal && !volumen) return null;

  const pesoVolumetrico = volumen > 0 ? volumen * 166.66 : 0;

  const chargeable = Math.max(pesoReal || 0, pesoVolumetrico || 0);
  if (!chargeable || !isFinite(chargeable)) return null;
  return parseFloat(chargeable.toFixed(2));
});

onMounted(async () => {
  await rootStore.dispatch("_getContainers");
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function esFobFlag() {
  const valBranch = [1, 2, "1", "2"];
  const branch = sessionSucursal();

  if (!valBranch.includes(branch.id)) return false;

  return pricingStore.listIncoterms.some(
    (v) =>
      v.id == pricingStore.datosPrincipales.idincoterms && v.name == "FOB",
  );
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function añadirCarga() {
  err.value = "";
  if (
    (numerobultos.value as unknown as number) > 0 &&
    (volumen.value as unknown as number) > 0 &&
    (peso.value as unknown as number) > 0
  ) {
    pricingStore.datosPrincipales.numerobultos = numerobultos.value;
    pricingStore.datosPrincipales.volumen = volumen.value;
    pricingStore.datosPrincipales.peso = peso.value;
  } else {
    err.value = "Datos requerido y mayor que cero";
  }
}
 
async function guardarContainer() {
  err.value = "";
  if ((await frmContainer.value!.validate()).valid) {
    if (
      pricingStore.datosPrincipales.containers!.filter(
        (v) => v.id == containers.value.container.id,
      ).length == 0
    ) {
      pricingStore.datosPrincipales.containers!.push({
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
  pricingStore.datosPrincipales.containers!.splice(index as number, 1);
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function aceptar() {
  let validate = true;
  if ((await frmPuerto.value!.validate()).valid) {
    if (isFCL()) {
      if (pricingStore.datosPrincipales.containers!.length == 0) {
        Swal.fire({
          icon: "error",
          title: "Aviso",
          text: "Se necesita al menos un contenedor",
        });
        validate = false;
      }
    }
    if (!isFCL()) {
      if (!numerobultos.value && !volumen.value && !peso.value) {
        Swal.fire({
          icon: "error",
          title: "Aviso",
          text: "Se necesita los datos de la carga",
        });
        validate = false;
      }
    }
    if (validate) {
      rootStore.state.spiner = true;
      await pricingStore.getItemsServices();
      await pricingStore.getMultiplicador();
      rootStore.state.spiner = false;
      pricingStore.step3 = true;
    }
    //
  }
  // this.$store.commit("SET_STEP_3", true);
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getPuertoOrigen() {
  let puertos: Puerto[] = [];
  if (pricingStore.datosPrincipales.iddestino) {
    const id_port = pricingStore.listPortEnd.filter(
      (v) => v.id_port == pricingStore.datosPrincipales.iddestino,
    )[0];

    puertos = pricingStore.listPortBegin.filter(
      (v) => v.id_port != (id_port as unknown as number),
    );
  } else {
    puertos = pricingStore.listPortBegin;
  }
  return puertos;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getPuertoDestino() {
  let puertos: Puerto[] = [];
  if (pricingStore.datosPrincipales.idorigen) {
    const id_port = pricingStore.listPortBegin.filter(
      (v) => v.id_port == pricingStore.datosPrincipales.idorigen,
    )[0]!.id_port;
    puertos = pricingStore.listPortEnd.filter((v) => v.id_port != id_port);
  } else {
    puertos = pricingStore.listPortEnd;
  }
  return puertos;
}
function isFCL() {
  const tipoCarga = pricingStore.datosPrincipales.idtipocarga;
  const id =
    tipoCarga && typeof tipoCarga === "object" ? tipoCarga.id : tipoCarga;
  const shipment = (pricingStore.listShipment || []).find(
    (item) => item && item.id == id,
  );
  return shipment?.code === "FCL";
}
function isAereo() {
  const inVal = ["Aéreo", "LCL"];
  const tipo = pricingStore.datosPrincipales.idtipocarga;
  const id = tipo && typeof tipo === "object" ? tipo.id : tipo;
  if (!id) return false;
  const items = pricingStore.listShipment || [];
  const it = items.find((v) => v.id == id);
  return it && inVal.includes(it.code!);
}
function ocultarLCL() {
  const inVal = ["LCL"];
  const tipo = pricingStore.datosPrincipales.idtipocarga;
  const id = tipo && typeof tipo === "object" ? tipo.id : tipo;
  if (!id) return false;
  const items = pricingStore.listShipment || [];
  const it = items.find((v) => v.id == id);
  return it && inVal.includes(it.code!);
}
function mostrarComboPercepcionAduana() {
  const esPeru = sessionIsoPais() == 9589;
  return (
    esPeru &&
    pricingStore.listModality.some(
      (v) =>
        v.id == pricingStore.datosPrincipales.idsentido && v.code == "I",
    )
  );
}
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
            <v-col cols="12">
              <v-autocomplete
                label="Proveedor"
                variant="outlined"
                density="compact"
                class="my-1"
                :items="rootStore.state.itemsProveedorList"
                item-title="namelong"
                item-value="id"
                readonly
                v-model="pricingStore.datosPrincipales.id_proveedor"
                v-if="mostrarproveedor"
              />
            </v-col>
            <v-col
              cols="12"
              lg="6"
              xl="6"
            >
              <v-autocomplete
                label="Puerto Origen"
                variant="outlined"
                density="compact"
                class="my-1"
                :items="pricingStore.listPortBegin"
                item-title="name"
                item-value="id_port"
                v-model="pricingStore.datosPrincipales.idorigen"
                readonly
              />
            </v-col>
            <v-col
              cols="12"
              lg="6"
              xl="6"
            >
              <v-autocomplete
                label="Puerto Destino"
                variant="outlined"
                density="compact"
                class="my-1"
                :items="pricingStore.listPortEnd"
                item-title="name"
                item-value="id_port"
                v-model="pricingStore.datosPrincipales.iddestino"
                readonly
              />
            </v-col>

            <v-col
              cols="12"
              lg="6"
              xl="6"
              class="py-1 rows"
            >
              <v-row>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-checkbox
                    label="Individual"
                    v-model="
                      pricingStore.datosPrincipales.esindividualflag
                    "
                    :value="true"
                    density="compact"
                    disabled
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-checkbox
                    label="Grupal"
                    v-model="pricingStore.datosPrincipales.esgrupalflag"
                    :value="true"
                    density="compact"
                    disabled
                  />
                </v-col>
              </v-row>
            </v-col>

            <v-col
              cols="12"
              lg="6"
              xl="6"
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
                  pricingStore.datosPrincipales.id_percepcionaduana
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
                  <th v-if="!ocultarLCL">
                    Peso volumétrico (kg)
                  </th>
                  <th v-if="!ocultarLCL">
                    Peso cargable (kg)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    {{ pricingStore.datosPrincipales.numerobultos }}
                  </td>
                  <td>{{ pricingStore.datosPrincipales.peso }}</td>
                  <td>{{ pricingStore.datosPrincipales.volumen }}</td>
                  <td v-if="!ocultarLCL">
                    {{
                      pesoVolumetrico !== null ? pesoVolumetrico + " kg" : ""
                    }}
                  </td>
                  <td v-if="!ocultarLCL">
                    {{ pesoCargable !== null ? pesoCargable + " kg" : "" }}
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
              :items="pricingStore.datosPrincipales.containers!"
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
