<template>
  <v-card>
    <v-card-title class="px-2 container-narrow">
      <v-spacer></v-spacer>
      <v-btn
        v-if="!showNavigationButtons"
        color="light-blue-darken-2"
        class="ma-2"
        dark
        size="small"
        @click="modificarCliente"
      >
        <v-icon start size="small">mdi-account-edit</v-icon>
        {{ isFormReadonly ? "EDITAR CLIENTE" : "GUARDAR CAMBIOS" }}
      </v-btn>
    </v-card-title>
    <v-card-text class="px-2">
      <div class="container-narrow">
        <v-subheader class="px-0">
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
        </v-subheader>
        <v-row>
          <v-col cols="12">
            <v-form ref="formInformacionBancaria" :readonly="isFormReadonly">
              <v-data-table
                :headers="
                  isInternacional()
                    ? headersInformacionBancaria2
                    : headersInformacionBancaria1
                "
                :items="$store.state.entities.lstInformacionBancaria"
                class="elevation-5"
                item-key="index"
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
                    :items="$store.state.coins.itemsCoinsList"
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
                  <v-btn
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
      <v-btn color="primary" @click="$store.state.entities.stepper--"
        >Regresar</v-btn
      >
      <v-btn color="primary" class="ml-auto" @click="validarFormulario"
        >Continuar</v-btn
      >
    </v-card-actions>
  </v-card>
</template>

<script>
import { mapActions } from "vuex";
export default {
  name: "SeccionInformacionBancaria",
  data() {
    return {
      headersInformacionBancaria1: [
        { text: "Nro de Cuenta", value: "nrocuenta" },
        { text: "CCI", value: "cci" },
        { text: "Banco", value: "banco" },
        { text: "Moneda", value: "moneda" },
        { text: "Acciones", value: "action" },
      ],
      headersInformacionBancaria2: [
        { text: "Nro de Cuenta", value: "nrocuenta" },
        { text: "CCI", value: "cci" },
        { text: "Banco", value: "banco" },
        { text: "Moneda", value: "moneda" },
        { text: "Nro. de Swift", value: "swift" },
        { text: "Banco Intermediario", value: "intermediario" },
        {
          text: "Nro Cuenta de Banco Intermediario",
          value: "cuenta_intermediario",
        },
        { text: "Acciones", value: "action" },
      ],
    };
  },
  computed: {
    isFormReadonly() {
      return this.$store.state.entities.isReadonly;
    },
    showFormActions() {
      return !this.$store.state.entities.isReadonly;
    },
    showNavigationButtons() {
      return !(
        this.$store.state.entities.isEdit ||
        this.$store.state.entities.isReadonly
      );
    },
  },
  methods: {
    ...mapActions(["actualizarCliente"]),
    isInternacional() {
      let val = this.$store.state.masterusuarios.lstTipoTransaccion.some(
        (v) =>
          v.codigo == "02" &&
          v.id == this.$store.state.entities.cliente.id_tipotransaccion,
      );

      return val;
    },
    agregarCuentaBancaria() {
      this.$store.state.entities.lstInformacionBancaria.push({
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
      this.$store.state.entities.lstInformacionBancaria.splice(index, 1);
    },
    validarFormulario() {
      var vm = this;
      let ok = true;
      if (vm.$store.state.entities.lstInformacionBancaria.length > 0) {
        if (!vm.$refs.formInformacionBancaria.validate()) {
          ok = false;
        }
      }

      if (ok) {
        vm.$store.state.entities.stepper = 5;
      }
    },
    async modificarCliente() {
      var vm = this;
      if (vm.isFormReadonly) {
        vm.$store.state.entities.isReadonly = false;
        vm.$store.state.entities.isEdit = true;
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

      vm.$store.state.entities.isReadonly = true;
      vm.$store.state.entities.isEdit = false;
    },
  },
  watch: {
    "$store.state.entities.isStep4Valid": {
      handler(newValue) {
        if (!newValue) {
          this.$refs.formInformacionBancaria.validate();
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
