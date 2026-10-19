<template>
  <v-card>
    <v-card-title class="px-2 container-narrow d-flex align-center flex-wrap">
      Datos para rótulos en la entrega del producto
      <v-spacer></v-spacer>
      <v-btn
        v-if="!showNavigationButtons"
        color="light-blue-darken-2"
        class="ma-2"
        size="small"
        @click="modificarCliente"
      >
        <v-icon start size="small">mdi-account-edit</v-icon>
        {{ isFormReadonly ? "EDITAR CLIENTE" : "GUARDAR CAMBIOS" }}
      </v-btn>
    </v-card-title>
    <v-card-text>
      <div class="container-narrow">
        <v-form ref="formInformacionEntrega" :readonly="isFormReadonly">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                density="compact"
                label="Destinatario"
                v-model="entitiesStore.informacionEntrega.destinatario"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                density="compact"
                label="DNI O RUC"
                v-model="
                  entitiesStore.informacionEntrega.dni_destinatario
                "
              ></v-text-field>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                density="compact"
                label="Persona que recoge"
                v-model="entitiesStore.informacionEntrega.receptor"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                density="compact"
                label="DNI"
                v-model="entitiesStore.informacionEntrega.dni_receptor"
              ></v-text-field>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" md="6">
              <v-autocomplete
                density="compact"
                :items="$store.state.itemsState"
                item-title="name"
                item-value="id"
                label="Departamento"
                v-model="
                  entitiesStore.informacionEntrega.id_departamento
                "
                @update:model-value="
                  _getCity(
                    entitiesStore.informacionEntrega.id_departamento,
                  )
                "
              ></v-autocomplete>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" md="6">
              <v-autocomplete
                density="compact"
                :items="$store.state.itemsCity"
                item-title="name"
                item-value="id"
                label="Provincia"
                v-model="entitiesStore.informacionEntrega.id_provincia"
                @update:model-value="
                  _getTown(
                    entitiesStore.informacionEntrega.id_provincia,
                  )
                "
              ></v-autocomplete>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" md="6">
              <v-autocomplete
                density="compact"
                :items="$store.state.itemsTown"
                item-title="name"
                item-value="id"
                label="Distrito"
                v-model="entitiesStore.informacionEntrega.id_distrito"
              ></v-autocomplete>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                density="compact"
                label="Agencia"
                v-model="entitiesStore.informacionEntrega.agencia"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
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
              ></v-text-field>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                density="compact"
                label="Cliente"
                v-model="entitiesStore.cliente.nombrecompleto"
                readonly
              ></v-text-field>
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
      <v-btn color="primary" @click="entitiesStore.stepper--"
        >Regresar</v-btn
      >
    </v-card-actions>
  </v-card>
</template>

<script>
import { mapActions } from "vuex";
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useEntitiesStore } from "@/stores/entities";
export default {
  name: "SeccionInformacionEntrega",
  data() {
    return {};
  },
  computed: {
    ...mapStores(useEntitiesStore),
    isFormReadonly() {
      return this.entitiesStore.isReadonly;
    },
    showFormActions() {
      return !this.entitiesStore.isReadonly;
    },
    showNavigationButtons() {
      return !(
        this.entitiesStore.isEdit ||
        this.entitiesStore.isReadonly
      );
    },
  },
  methods: {
    ...mapActions(["_getCity", "_getTown"]),
    ...mapPiniaActions(useEntitiesStore, ["actualizarCliente"]),
    validarTelefono(v) {
      if (v && !/^\+?\d+$/.test(v)) {
        return "Debe ingresar un teléfono válido";
      }

      return true;
    },
    getPrefix() {
      let pais = this.$store.state.itemsPais.find(
        (v) => v.id == this.entitiesStore.cliente.id_pais,
      );
      if (pais) {
        return pais.phoneprefix;
      }
      return "+xx";
    },
    obtenerFlag() {
      let pais = this.$store.state.itemsPais.find(
        (v) => v.id == this.entitiesStore.cliente.id_pais,
      );
      let flag = "";
      if (pais) {
        flag = `https://flagcdn.com/w40/${pais.codigo_iso.toLowerCase()}.png`;
      }
      return flag;
    },
    async modificarCliente() {
      var vm = this;
      if (vm.isFormReadonly) {
        vm.entitiesStore.isReadonly = false;
        vm.entitiesStore.isEdit = true;
        vm.$swal({
          icon: "info",
          text: "Ahora puede modificar los campos",
        });
        return;
      }

      vm.$store.state.spiner = true;
      await vm.actualizarCliente();
      vm.$store.state.spiner = false;
      vm.$store.state.recargarClienteFlag =
        !vm.$store.state.recargarClienteFlag;
      vm.$store.state.modalEntitie = false;

      vm.entitiesStore.isReadonly = true;
      vm.entitiesStore.isEdit = false;
    },
  },
};
</script>

<style>
.container-narrow {
  max-width: 1100px;
  margin: 0 auto;
}
</style>
