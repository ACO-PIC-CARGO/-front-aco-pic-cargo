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
        @click="modificarProveedor"
      >
        <v-icon start size="small">mdi-account-edit</v-icon>
        {{ isFormReadonly ? "EDITAR PROVEEDOR" : "GUARDAR CAMBIOS" }}
      </v-btn>
    </v-card-title>
    <v-card-text class="px-2">
      <div class="container-narrow">
        <!-- ===== CONVENIOS ===== -->
        <v-subheader class="px-0">
          <b>Convenios</b>

          <template v-if="showFormActions">
            <v-btn
              color="primary"
              rounded
              size="small"
              class="ml-auto"
              @click="agregarConvenio()"
              >AGREGAR CONVENIO</v-btn
            >
          </template>
        </v-subheader>
        <v-row>
          <v-col cols="12">
            <v-form ref="formProv_convenios" :readonly="isFormReadonly">
              <v-data-table
                :headers="headersConvenios"
                :items="$store.state.entities.lstConvenios"
                class="elevation-5"
                item-key="index"
              >
                <template v-slot:[`item.fecha`]="{ item }">
                  <v-text-field
                    type="date"
                    v-model="item.fecha"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  ></v-text-field>
                </template>

                <template v-slot:[`item.dias_credito`]="{ item }">
                  <v-text-field
                    type="number"
                    suffix="días"
                    v-model="item.dias_credito"
                    :rules="[
                      (v) =>
                        v >= 0 ||
                        'Es necesario que ponga un número entero positivo',
                    ]"
                  ></v-text-field>
                </template>

                <template v-slot:[`item.email_soporte`]="{ item }">
                  <div class="d-flex">
                    <v-text-field
                      v-model="item.email_soporte"
                      :rules="[(v) => validarCorreoElectronico(v)]"
                    ></v-text-field>
                    <v-file-input
                      v-if="showFormActions"
                      accept=".xlsx,.xls,.doc,.docx,.ppt,.pptx,.txt,.pdf,.gif,.jpg,.jpeg,.png"
                      label="Adjuntar Archivo"
                      hide-input
                      class="customFile"
                      v-model="fileinput"
                      @change="subirArchivoConvenio(item)"
                    ></v-file-input>
                  </div>
                </template>

                <template
                  v-slot:[`item.action`]="{ item, index }"
                  v-if="showFormActions"
                >
                  <v-btn icon color="red" @click="eliminarConvenio(index)">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-data-table>
            </v-form>
          </v-col>
        </v-row>

        <br />

        <!-- ===== TARIFAS ===== -->
        <v-subheader class="px-0">
          <b>Tarifas</b>

          <template v-if="showFormActions">
            <v-btn
              color="primary"
              rounded
              size="small"
              class="ml-auto"
              @click="agregarTarifa()"
              >AGREGAR TARIFA</v-btn
            >
          </template>
        </v-subheader>
        <v-row>
          <v-col cols="12">
            <v-form ref="formProv_tarifas" :readonly="isFormReadonly">
              <v-data-table
                :headers="headersTarifas"
                :items="$store.state.entities.lstTarifas"
                class="elevation-5"
                item-key="index"
              >
                <template v-slot:[`item.fecha`]="{ item }">
                  <v-text-field
                    type="date"
                    v-model="item.fecha"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  ></v-text-field>
                </template>

                <template v-slot:[`item.codigo`]="{ item }">
                  <v-text-field
                    v-model="item.codigo"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  ></v-text-field>
                </template>

                <template v-slot:[`item.email_soporte`]="{ item }">
                  <div class="d-flex">
                    <v-text-field
                      v-model="item.email_soporte"
                      :rules="[(v) => validarCorreoElectronico(v)]"
                    ></v-text-field>
                    <v-file-input
                      v-if="showFormActions"
                      accept=".xlsx,.xls,.doc,.docx,.ppt,.pptx,.txt,.pdf,.gif,.jpg,.jpeg,.png"
                      label="Adjuntar Archivo"
                      hide-input
                      class="customFile"
                      v-model="fileinput"
                      @change="subirArchivoTarifa(item)"
                    ></v-file-input>
                  </div>
                </template>

                <template v-slot:[`item.tarifa`]="{ item }">
                  <v-text-field v-model="item.tarifa"></v-text-field>
                </template>

                <template
                  v-slot:[`item.action`]="{ item, index }"
                  v-if="showFormActions"
                >
                  <v-btn icon color="red" @click="eliminarTarifa(index)">
                    <v-icon>mdi-delete</v-icon>
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
import moment from "moment";
export default {
  name: "SeccionConvenios",
  data() {
    return {
      headersConvenios: [
        { title: "Fecha", key: "fecha", width: "20%" },
        { title: "Días para Crédito", key: "dias_credito", width: "30%" },
        { title: "Email Soporte", key: "email_soporte", width: "40%" },
        { title: "Acciones", key: "action", width: "10%" },
      ],
      headersTarifas: [
        { title: "Fecha", key: "fecha", width: "20%" },
        { title: "Código", key: "codigo", width: "20%" },
        { title: "Email Soporte", key: "email_soporte", width: "30%" },
        { title: "Tarifa", key: "tarifa", width: "20%" },
        { title: "Acciones", key: "action", width: "10%" },
      ],
      fileinput: null,
      isFileLoading: false,
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
    ...mapActions(["_uploadFile", "actualizarProveedor"]),
   
    validarCorreoElectronico(v) {
      if (
        v &&
        !/^(([^<>()[\]\\.,;:\s@']+(\.[^<>()\\[\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
          v,
        )
      ) {
        return "Debe ingresar un correo electrónico válido";
      }

      return true;
    },
    agregarConvenio() {
      this.$store.state.entities.lstConvenios.push({
        fecha: moment().format("YYYY-MM-DD"),
        dias_credito: 0,
        email_soporte: "",
      });
    },
    eliminarConvenio(index) {
      this.$store.state.entities.lstConvenios.splice(index, 1);
    },
    generarCodigoTarifa() {
      var vm = this;

      let codigoMaximo = 0;
      vm.$store.state.entities.lstTarifas.filter((v) => {
        let codigoParseado = v.codigo.includes("T")
          ? parseInt(v.codigo.slice(1))
          : parseInt(v.codigo);

        if (codigoMaximo < codigoParseado) {
          codigoMaximo = codigoParseado;
        }
      });

      let codigo = (parseInt(codigoMaximo) + 1).toString().padStart(5, "0");

      return "T".concat(codigo);
    },
    agregarTarifa() {
      this.$store.state.entities.lstTarifas.push({
        fecha: moment().format("YYYY-MM-DD"),
        codigo: this.generarCodigoTarifa(),
        email_soporte: "",
        tarifa: 0,
      });
    },
    eliminarTarifa(index) {
      this.$store.state.entities.lstTarifas.splice(index, 1);
    },
    async subirArchivoConvenio(item = {}) {
      var vm = this;

      if (vm.fileinput) {
        vm.isFileLoading = true;
        await vm._uploadFile(vm.fileinput);
        vm.isFileLoading = false;

        if (vm.$store.state.files.payPath) {
          vm.$swal({
            icon: "success",
            text: "Archivo cargado",
          });

          vm.$store.state.entities.lstConvenios.map((itemConvenio) => {
            if (itemConvenio.id == item.id) {
              itemConvenio["id_path"] = vm.$store.state.files.payPath;
            }

            return itemConvenio;
          });
        } else {
          vm.$swal({
            icon: "error",
            text: "Comuníquese con el administrador",
          });
        }
      }
    },
    async subirArchivoTarifa(item = {}) {
      var vm = this;

      if (vm.fileinput) {
        vm.isFileLoading = true;
        await vm._uploadFile(vm.fileinput);
        vm.isFileLoading = false;

        if (vm.$store.state.files.payPath) {
          vm.$swal({
            icon: "success",
            text: "Archivo cargado",
          });

          vm.$store.state.entities.lstTarifas.map((itemTarifa) => {
            if (itemTarifa.id == item.id) {
              itemTarifa["id_path"] = vm.$store.state.files.payPath;
            }

            return itemTarifa;
          });
        } else {
          vm.$swal({
            icon: "error",
            text: "Comuníquese con el administrador",
          });
        }
      }
    },
    validarFormulario() {
      var vm = this;

      let ok1 = true;
      if (vm.$store.state.entities.lstConvenios.length > 0) {
        if (!vm.$refs.formProv_convenios.validate()) {
          ok1 = false;
        }
      }

      let ok2 = true;
      if (vm.$store.state.entities.lstTarifas.length > 0) {
        if (!vm.$refs.formProv_tarifas.validate()) {
          ok2 = false;
        }
      }

      if (ok1 && ok2) {
        vm.$store.state.entities.stepper = 4;
      }
    },
    async modificarProveedor() {
      var vm = this;

      // Si está en modo solo lectura, pasar a modo edición y no guardar todavía
      if (vm.isFormReadonly) {
        vm.$store.state.entities.isReadonly = false;
        vm.$store.state.entities.isEdit = true;
        vm.$swal({
          icon: "info",
          text: "Ahora puede modificar los campos",
        });
        return;
      }

      vm.$store.state.entities.isStep1Valid = true;
      vm.$store.state.entities.isStep2Valid = true;
      vm.$store.state.entities.isStep3Valid = true;
      vm.$store.state.entities.isStep4Valid = true;

      let okStep3_1 = true;
      if (vm.$store.state.entities.lstConvenios.length > 0) {
        vm.$store.state.entities.lstConvenios.map((v) => {
          if (!v.fecha || v.dias_credito < 0) {
            okStep3_1 = false;
          }
        });
      }

      let okStep3_2 = true;
      if (vm.$store.state.entities.lstTarifas.length > 0) {
        vm.$store.state.entities.lstTarifas.map((v) => {
          if (!v.fecha || !v.codigo || v.tarifa < 0) {
            okStep3_2 = false;
          }
        });
      }

      if (!okStep3_1 || !okStep3_2) {
        vm.$store.state.entities.isStep3Valid = false;
        this.$swal({
          icon: "warning",
          text: "Por favor complete todos los campos requeridos en Convenios y Tarifas",
        });
      } else {
        vm.$store.state.spiner = true;
        await vm.actualizarProveedor();
        vm.$store.state.spiner = false;

        // Volver a modo solo lectura después de guardar correctamente
        vm.$store.state.entities.isReadonly = true;
        vm.$store.state.entities.isEdit = false;
      }
    },
  },
  watch: {
    "$store.state.entities.isStep3Valid": {
      handler(newValue) {
        if (!newValue) {
          this.$refs.formProv_convenios.validate();
          this.$refs.formProv_tarifas.validate();
        }
      },
      immediate: true,
    },
    "$store.state.entities.lstConvenios": {
      handler(newValue) {
        if (newValue[0]) {
          this.$store.state.entities.proveedor.convenioActual = newValue[0];
        }
      },
      deep: true,
    },
  },
};
</script>

<style>
.customFile {
  flex-grow: 0 !important;
  flex-direction: row-reverse !important;
}
.customFile .v-input__prepend-outer {
  margin-right: 0;
}
.container-narrow {
  max-width: 1100px;
  margin: 0 auto;
}
</style>
