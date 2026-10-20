<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef, watch } from "vue";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import { useEntitiesStore } from "@/stores/entities";
import { usePricingStore } from "@/stores/pricing";
import { useAduanaStore } from "@/stores/aduana";
import type { Incoterm } from "@/types/cotizacion";
import type { ClienteListado } from "@/types/entidades";

withDefaults(
  defineProps<{ mostrarBtn?: boolean; editableFlag?: boolean }>(),
  { mostrarBtn: true, editableFlag: true },
);
const emit = defineEmits<{
  activarDatosCarga: [activar: boolean];
  recargarServiciosCostos: [recargar: boolean];
}>();

const appStore = useAppStore();
const aduanaStore = useAduanaStore();
const pricingStore = usePricingStore();
const entitiesStore = useEntitiesStore();

const search = ref("");
const buscarClienteDialog = ref(false);
const mostrarContinuarFlag = ref(true);
const headers = [
  { title: "Documento", key: "document" },
  { title: "Nombres (s)", key: "nombrecompleto" },
  { title: "Teléfono", key: "phone" },
  { value: "action" },
];
const frmDatosPrincipales = useTemplateRef("frmDatosPrincipales");

const incoterms = computed(() => {
  const Icoterms: Incoterm[] = [];
  [...aduanaStore.listIncoterms].forEach((element) => {
    element.text = element.name + " - " + element.description;
    Icoterms.push(element);
  });

  return Icoterms;
});
const mostrarProveedorFlag = computed(() => {
  const exw = aduanaStore.listIncoterms.filter(
    (v) =>
      v.id == aduanaStore.datosPrincipales.idincoterms &&
      v.name == "EXW",
  );

  return exw.length > 0 ? true : false;
});

watch(
  () => appStore.registroClienteFlag,
  async () => {
    appStore.spiner = true;
    await appStore._getEntitiesCliente();
    appStore.spiner = false;
    if (entitiesStore.id) {
      const cliente = appStore.itemsEntities.filter(
        (v: ClienteListado) => v.id == entitiesStore.id,
      )[0]!;
      aduanaStore.datosPrincipales.id_entitie = cliente.id;
      aduanaStore.datosPrincipales.nombre =
        cliente.nombrecompleto;
      aduanaStore.datosPrincipales.telefono = cliente.phone;
    }
    buscarClienteDialog.value = false;
  },
);

onMounted(async () => {
  frmDatosPrincipales.value!.resetValidation();
  // this.mostrar = true;
});

function registrarNuevoCliente() {
  appStore.modalEntitie = true;
}
function abrirModalCliente() {
  buscarClienteDialog.value = true;
  appStore.itemsEntities = [];
  appStore._getEntitiesCliente();
}
function guardarCliente(e: unknown, { item }: { item: ClienteListado }) {
  if (!item.phone) {
    Swal.fire({
      icon: "warning",
      title: "¡Advertencia!",
      text: "El cliente seleccionado no tiene un número de teléfono registrado. Por favor, seleccione otro cliente o puede actualizar luego en el fichero de cliente.",
    });
  }
  aduanaStore.datosPrincipales.id_entitie = item.id;
  aduanaStore.datosPrincipales.nombre = item.nombrecompleto;
  aduanaStore.datosPrincipales.telefono = item.phone;
  buscarClienteDialog.value = false;
}
async function continuarDatosCarga() {
  if ((await frmDatosPrincipales.value!.validate()).valid) {
    emit("activarDatosCarga", true);
    mostrarContinuarFlag.value = false;
  }
}
function recargarServiciosCostos() {
  if (
    !aduanaStore.datosPrincipales.idsentido ||
    !aduanaStore.datosPrincipales.idincoterms ||
    // @ts-expect-error an array never equals 0, so this operand is always false.
    Object.keys(aduanaStore.datosPrincipales.idtipocarga) === 0
  ) {
    return;
  }
  emit("recargarServiciosCostos", true);
}
</script>

<template>
  <v-container
    fluid
    class="pa-0"
  >
    <v-card
      elevation="0"
      ref="frmPuerto"
    >
      <v-card-title> Datos Principales </v-card-title>
      <v-card-text>
        <v-form
          class=""
          ref="frmDatosPrincipales"
        >
          <v-container>
            <v-row>
              <v-col
                cols="12"
                class="my-0 py-0"
              >
                <v-autocomplete
                  label="Tipo de Marketing"
                  variant="outlined"
                  density="compact"
                  :rules="[(v) => !!v || 'Dato requerido']"
                  class="my-1"
                  :items="pricingStore.listMarketing"
                  item-title="name"
                  item-value="id"
                  v-model="aduanaStore.datosPrincipales.id_marketing"
                />
                <v-autocomplete
                  label="Estado de la cotización"
                  variant="outlined"
                  density="compact"
                  :rules="[(v) => !!v || 'Dato requerido']"
                  class="my-0"
                  :items="pricingStore.listQuoteStatus"
                  item-title="name"
                  item-value="id"
                  v-model="aduanaStore.datosPrincipales.id_status"
                  :item-props="(item) => ({ disabled: item.status != 1 })"
                />
              </v-col>
              <v-col
                cols="12"
                class="my-0 py-0"
              >
                <v-autocomplete
                  label="Ejecutivo"
                  variant="outlined"
                  density="compact"
                  :rules="[(v) => !!v || 'Dato requerido']"
                  class="my-0"
                  :items="pricingStore.listEjecutivo"
                  item-title="nombrecompleto"
                  item-value="id"
                  v-model="aduanaStore.datosPrincipales.id_vendedor"
                />
              </v-col>

              <v-col
                cols="12"
                class="my-0 py-0"
              >
                <v-autocomplete
                  label="Pricing"
                  variant="outlined"
                  density="compact"
                  :rules="[(v) => !!v || 'Dato requerido']"
                  class="my-0"
                  :items="pricingStore.listEjecutivo"
                  item-title="nombrecompleto"
                  item-value="id"
                  v-model="aduanaStore.datosPrincipales.id_pricing"
                />
              </v-col>

              <v-col
                cols="12"
                class="my-0 py-0"
              >
                <v-text-field
                  label="Nombre del cliente"
                  variant="outlined"
                  placeholder="Nombre del cliente"
                  :append-inner-icon="'mdi-account-search'"
                  v-model="aduanaStore.datosPrincipales.nombre"
                  @click:append-inner.stop="abrirModalCliente()"
                  @click="abrirModalCliente()"
                  :rules="[(v) => !!v || 'El nombre es requerido']"
                  density="compact"
                  required
                  autocomplete="off"
                  id="nombre"
                  name="nombre"
                  readonly
                />
              </v-col>

              <v-col
                cols="12"
                class="my-0 py-0"
              >
                <v-text-field
                  label="Teléfono"
                  variant="outlined"
                  placeholder="Teléfono..."
                  density="compact"
                  readonly
                  v-model="aduanaStore.datosPrincipales.telefono"
                />
              </v-col>

              <v-col
                cols="12"
                class="my-0 py-0"
              >
                <v-autocomplete
                  label="Sentido"
                  variant="outlined"
                  density="compact"
                  :rules="[(v) => !!v || 'Dato requerido']"
                  class="my-0"
                  :items="aduanaStore.listModality"
                  item-title="name"
                  item-value="id"
                  v-model="aduanaStore.datosPrincipales.idsentido"
                  @update:model-value="recargarServiciosCostos()"
                  :disabled="!editableFlag"
                />
              </v-col>

              <v-col
                cols="12"
                class="my-0 py-0"
              >
                <!-- @vue-expect-error return-object writes the row into the id-or-row field -->
                <v-autocomplete
                  label="Tipo de Embarque"
                  variant="outlined"
                  density="compact"
                  :rules="[(v) => !!v || 'Dato requerido']"
                  class="my-0"
                  :items="aduanaStore.listShipment"
                  item-title="embarque"
                  item-value="id"
                  v-model="aduanaStore.datosPrincipales.idtipocarga"
                  @update:model-value="recargarServiciosCostos()"
                  return-object
                  :disabled="!editableFlag"
                />
              </v-col>
              <v-col
                cols="12"
                class="my-0 py-0"
              >
                <v-autocomplete
                  label="Incoterms"
                  variant="outlined"
                  density="compact"
                  :rules="[(v) => !!v || 'Dato requerido']"
                  class="my-0"
                  :items="incoterms"
                  item-title="text"
                  item-value="id"
                  v-model="aduanaStore.datosPrincipales.idincoterms"
                  @update:model-value="recargarServiciosCostos()"
                >
                  <template #selection="data">
                    {{ data.item.name }} - {{ data.item.description }}
                  </template>
                </v-autocomplete>
              </v-col>

              <v-col
                cols="12"
                class="my-0 py-0"
              >
                <v-text-field
                  name="name"
                  label="Nombre del proveedor"
                  id="id"
                  v-model="aduanaStore.datosPrincipales.proveedor"
                  density="compact"
                  variant="outlined"
                  v-if="mostrarProveedorFlag"
                />
              </v-col>

              <v-col
                cols="12"
                class="my-0 py-0"
              >
                <v-text-field
                  name="Teléfono"
                  label="Teléfono del proveedor"
                  v-model="
                    aduanaStore.datosPrincipales.telefonoproveedor
                  "
                  density="compact"
                  variant="outlined"
                  :rules="[
                    (v) => {
                      if (v === '' || /^\+?\d+$/.test(v)) {
                        return true; // Válido si está en blanco o cumple con el formato
                      } else {
                        return 'Formato de teléfono no válido';
                      }
                    },
                  ]"
                  v-if="mostrarProveedorFlag"
                />
              </v-col>

              <v-col
                cols="12"
                class="my-0 py-0"
              >
                <v-text-field
                  label="Dirección del proveedor"
                  v-model="
                    aduanaStore.datosPrincipales.direccionproveedor
                  "
                  density="compact"
                  variant="outlined"
                  v-if="mostrarProveedorFlag"
                />
              </v-col>
              <v-col
                cols="12"
                class="my-0 py-0 align-right"
                v-if="mostrarContinuarFlag && mostrarBtn"
              >
                <v-btn
                  color="#3F51B5"
                  @click="continuarDatosCarga()"
                  size="small"
                >
                  Continuar Datos Carga
                </v-btn>
              </v-col>
            </v-row>
          </v-container>
        </v-form>
      </v-card-text>
    </v-card>
    <!-- dIALOG -->
    <v-dialog
      v-model="buscarClienteDialog"
      max-width="80%"
    >
      <v-card>
        <v-card-title class="d-flex align-center flex-wrap">
          Buscar Cliente<v-spacer />
          <v-btn
            color="success"
            @click="registrarNuevoCliente"
            size="small"
          >
            Nuevo Cliente
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  label="Buscar..."
                  v-model="search"
                />
              </v-col>
              <v-col cols="12">
                <v-data-table
                  :headers="headers"
                  :items="appStore.itemsEntities"
                  :search="search"
                  @dblclick:row="guardarCliente"
                  item-value="index"
                  :loading="appStore.itemsEntities.length == 0"
                  loading-text="Buscando Clientes..."
                >
                  <template #[`item.action`]="{ item }">
                    <v-btn
                      size="small"
                      color="success"
                      @click="guardarCliente(null, { item: item as ClienteListado })"
                    >
                      Seleccionar <v-icon class="mx-2">
                        mdi-account-plus
                      </v-icon>
                    </v-btn>
                  </template>
                </v-data-table>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.align-right {
  text-align: right;
}
</style>
