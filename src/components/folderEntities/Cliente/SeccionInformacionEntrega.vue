<script setup lang="ts">
import { computed } from "vue";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import { useEntitiesStore } from "@/stores/entities";
import type { Pais } from "@/types/catalogos";

const appStore = useAppStore();
const entitiesStore = useEntitiesStore();

const isFormReadonly = computed(() => {
  return entitiesStore.isReadonly;
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const showFormActions = computed(() => {
  return !entitiesStore.isReadonly;
});
const showNavigationButtons = computed(() => {
  return !(
    entitiesStore.isEdit ||
    entitiesStore.isReadonly
  );
});

function validarTelefono(v: string) {
  if (v && !/^\+?\d+$/.test(v)) {
    return "Debe ingresar un teléfono válido";
  }

  return true;
}
function getPrefix() {
  const pais = (appStore.itemsPais as Pais[]).find(
    (v) => v.id == entitiesStore.cliente.id_pais,
  );
  if (pais) {
    return pais.phoneprefix;
  }
  return "+xx";
}
function obtenerFlag() {
  const pais = (appStore.itemsPais as Pais[]).find(
    (v) => v.id == entitiesStore.cliente.id_pais,
  );
  let flag = "";
  if (pais) {
    flag = `https://flagcdn.com/w40/${pais.codigo_iso!.toLowerCase()}.png`;
  }
  return flag;
}
async function modificarCliente() {
  if (isFormReadonly.value) {
    entitiesStore.isReadonly = false;
    entitiesStore.isEdit = true;
    Swal.fire({
      icon: "info",
      text: "Ahora puede modificar los campos",
    });
    return;
  }

  appStore.spiner = true;
  await entitiesStore.actualizarCliente();
  appStore.spiner = false;
  appStore.recargarClienteFlag =
    !appStore.recargarClienteFlag;
  appStore.modalEntitie = false;

  entitiesStore.isReadonly = true;
  entitiesStore.isEdit = false;
}
</script>

<template>
  <v-card>
    <v-card-title class="px-2 container-narrow d-flex align-center flex-wrap">
      Datos para rótulos en la entrega del producto
      <v-spacer />
      <v-btn
        v-if="!showNavigationButtons"
        color="light-blue-darken-2"
        class="ma-2"
        size="small"
        @click="modificarCliente"
      >
        <v-icon
          start
          size="small"
        >
          mdi-account-edit
        </v-icon>
        {{ isFormReadonly ? "EDITAR CLIENTE" : "GUARDAR CAMBIOS" }}
      </v-btn>
    </v-card-title>
    <v-card-text>
      <div class="container-narrow">
        <v-form
          ref="formInformacionEntrega"
          :readonly="isFormReadonly"
        >
          <v-row>
            <v-col
              cols="12"
              md="6"
            >
              <v-text-field
                density="compact"
                label="Destinatario"
                v-model="entitiesStore.informacionEntrega.destinatario"
              />
            </v-col>
            <v-col
              cols="12"
              md="6"
            >
              <v-text-field
                density="compact"
                label="DNI O RUC"
                v-model="
                  entitiesStore.informacionEntrega.dni_destinatario
                "
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col
              cols="12"
              md="6"
            >
              <v-text-field
                density="compact"
                label="Persona que recoge"
                v-model="entitiesStore.informacionEntrega.receptor"
              />
            </v-col>
            <v-col
              cols="12"
              md="6"
            >
              <v-text-field
                density="compact"
                label="DNI"
                v-model="entitiesStore.informacionEntrega.dni_receptor"
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col
              cols="12"
              md="6"
            >
              <v-autocomplete
                density="compact"
                :items="appStore.itemsState"
                item-title="name"
                item-value="id"
                label="Departamento"
                v-model="
                  entitiesStore.informacionEntrega.id_departamento
                "
                @update:model-value="
                  appStore._getCity(entitiesStore.informacionEntrega.id_departamento)
                "
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col
              cols="12"
              md="6"
            >
              <v-autocomplete
                density="compact"
                :items="appStore.itemsCity"
                item-title="name"
                item-value="id"
                label="Provincia"
                v-model="entitiesStore.informacionEntrega.id_provincia"
                @update:model-value="
                  appStore._getTown(entitiesStore.informacionEntrega.id_provincia)
                "
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col
              cols="12"
              md="6"
            >
              <v-autocomplete
                density="compact"
                :items="appStore.itemsTown"
                item-title="name"
                item-value="id"
                label="Distrito"
                v-model="entitiesStore.informacionEntrega.id_distrito"
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col
              cols="12"
              md="6"
            >
              <v-text-field
                density="compact"
                label="Agencia"
                v-model="entitiesStore.informacionEntrega.agencia"
              />
            </v-col>
            <v-col
              cols="12"
              md="6"
            >
              <v-text-field
                density="compact"
                label="Celular"
                v-model="
                  entitiesStore.informacionEntrega.celular_agencia
                "
                :rules="[(v) => validarTelefono(v)]"
                :prefix="getPrefix()"
                :style="{
                  backgroundImage: `url(${obtenerFlag()})`,
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '20px 15px',
                  backgroundPosition: '4px center',
                  paddingLeft: '30px',
                }"
                hide-details
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col
              cols="12"
              md="6"
            >
              <v-text-field
                density="compact"
                label="Cliente"
                v-model="entitiesStore.cliente.nombrecompleto"
                readonly
              />
            </v-col>
          </v-row>

          <!--<v-row>
                  <v-col cols="12" md="6">
                    <div class="d-flex align-center">
                      Estado
                      <v-switch
                        hide-details
                        v-model="$store.state.entities.informacionEntrega.status"
                        class="mt-0 ml-2"
                      ></v-switch>
                    </div>
                  </v-col>
                </v-row>-->
        </v-form>
      </div>
    </v-card-text>
    <v-card-actions v-if="showNavigationButtons">
      <v-btn
        color="primary"
        @click="entitiesStore.stepper--"
      >
        Regresar
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style>
.container-narrow {
  max-width: 1100px;
  margin: 0 auto;
}
</style>
