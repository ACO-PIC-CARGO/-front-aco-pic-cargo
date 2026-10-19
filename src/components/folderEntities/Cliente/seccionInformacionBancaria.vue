<template>
  <v-card>
    <v-card-title class="px-2 container-narrow d-flex align-center flex-wrap">
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
    <v-card-text class="px-2">
      <div class="container-narrow">
        <v-list-subheader class="px-0">
          <b>Información Bancaria</b>

          <template v-if="showFormActions">
            <v-btn
              color="primary"
              rounded
              size="small"
              class="ml-auto"
              @click="agregarCuentaBancaria()"
              >Agregar Cuenta</v-btn
            >
          </template>
        </v-list-subheader>
        <v-row>
          <v-col cols="12">
            <v-form ref="formInformacionBancaria" :readonly="isFormReadonly">
              <v-data-table
                :headers="
                  isInternacional()
                    ? headersInformacionBancaria2
                    : headersInformacionBancaria1
                "
                :items="entitiesStore.lstInformacionBancaria"
                class="elevation-5"
                item-value="index"
                disable-sort
              >
                <template v-slot:[`item.nrocuenta`]="{ item }">
                  <v-text-field
                    v-model="item.nro_cuenta"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    placeholder="Nro Cuenta"
                  ></v-text-field>
                </template>
                <template v-slot:[`item.cci`]="{ item }">
                  <v-text-field
                    v-model="item.cci"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    placeholder="CCI"
                  ></v-text-field>
                </template>
                <template v-slot:[`item.banco`]="{ item }">
                  <v-autocomplete
                    :items="$store.state.bank.list"
                    item-title="name"
                    item-value="id"
                    placeholder="Bancos"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    v-model="item.id_banco"
                  ></v-autocomplete>
                </template>
                <template v-slot:[`item.moneda`]="{ item }">
                  <v-autocomplete
                    :items="coinsStore.itemsCoinsList"
                    item-title="acronym"
                    item-value="id"
                    placeholder="Monedas"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    v-model="item.id_coins"
                  ></v-autocomplete>
                </template>
                <template v-slot:[`item.swift`]="{ item }">
                  <v-text-field
                    placeholder="Nro swift"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    v-model="item.nro_swift"
                  ></v-text-field>
                </template>
                <template v-slot:[`item.intermediario`]="{ item }">
                  <v-autocomplete
                    :items="$store.state.bank.list"
                    item-title="name"
                    item-value="id"
                    placeholder="Bancos"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    v-model="item.id_intermediario"
                  ></v-autocomplete>
                </template>
                <template v-slot:[`item.cuenta_intermediario`]="{ item }">
                  <v-text-field
                    placeholder="Cuenta Intermediario"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    v-model="item.nro_cuenta_intermediario"
                  ></v-text-field>
                </template>
                <template
                  v-slot:[`item.action`]="{ item, index }"
                  v-if="showFormActions"
                >
                  <v-btn variant="text"
                    color="red"
                    icon
                    @click="eliminarInformacionBancaria(index)"
                  >
                    <v-icon> mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-data-table>
            </v-form>
          </v-col>
        </v-row>
      </div>
    </v-card-text>
    <v-card-actions v-if="showNavigationButtons">
      <v-btn color="primary" @click="entitiesStore.stepper--"
        >Regresar</v-btn
      >
      <v-btn color="primary" class="ml-auto" @click="validarFormulario"
        >Continuar</v-btn
      >
    </v-card-actions>
  </v-card>
</template>

<script>
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useCoinsStore } from "@/stores/coins";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { useEntitiesStore } from "@/stores/entities";
export default {
  name: "SeccionInformacionBancaria",
  data() {
    return {
      headersInformacionBancaria1: [
        { title: "Nro de Cuenta", key: "nrocuenta" },
        { title: "CCI", key: "cci" },
        { title: "Banco", key: "banco" },
        { title: "Moneda", key: "moneda" },
        { title: "Acciones", key: "action" },
      ],
      headersInformacionBancaria2: [
        { title: "Nro de Cuenta", key: "nrocuenta" },
        { title: "CCI", key: "cci" },
        { title: "Banco", key: "banco" },
        { title: "Moneda", key: "moneda" },
        { title: "Nro. de Swift", key: "swift" },
        { title: "Banco Intermediario", key: "intermediario" },
        {
          title: "Nro Cuenta de Banco Intermediario",
          key: "cuenta_intermediario",
        },
        { title: "Acciones", key: "action" },
      ],
    };
  },
  computed: {
    ...mapStores(useEntitiesStore, useMasterusuariosStore, useCoinsStore),
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
    ...mapPiniaActions(useEntitiesStore, ["actualizarCliente"]),
    isInternacional() {
      let val = this.masterusuariosStore.lstTipoTransaccion.some(
        (v) =>
          v.codigo == "02" &&
          v.id == this.entitiesStore.cliente.id_tipotransaccion,
      );

      return val;
    },
    agregarCuentaBancaria() {
      this.entitiesStore.lstInformacionBancaria.push({
        nro_cuenta: "",
        cci: "",
        id_banco: "",
        id_coins: "",
        nro_swift: "",
        id_intermediario: "",
        nro_cuenta_intermediario: "",
      });
    },
    eliminarInformacionBancaria(index) {
      this.entitiesStore.lstInformacionBancaria.splice(index, 1);
    },
    async validarFormulario() {
      var vm = this;
      let ok = true;
      if (vm.entitiesStore.lstInformacionBancaria.length > 0) {
        if (!(await vm.$refs.formInformacionBancaria.validate()).valid) {
          ok = false;
        }
      }

      if (ok) {
        vm.entitiesStore.stepper = 5;
      }
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
  watch: {
    "entitiesStore.isStep4Valid": {
      async handler(newValue) {
        if (!newValue) {
          await this.$refs.formInformacionBancaria.validate();
        }
      },
      immediate: true,
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
