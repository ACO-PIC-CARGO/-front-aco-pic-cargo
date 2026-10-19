<template>
  <v-card>
    <v-card-title class="px-2 container-narrow d-flex align-center flex-wrap">
      <v-spacer></v-spacer>
      <v-btn
        v-if="!showNavigationButtons"
        color="light-blue-darken-2"
        class="ma-2"
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
        <v-list-subheader class="px-0">
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
        </v-list-subheader>
        <v-row>
          <v-col cols="12">
            <v-form ref="formProv_convenios" :readonly="isFormReadonly">
              <v-data-table
                :headers="headersConvenios"
                :items="entitiesStore.lstConvenios"
                class="elevation-5"
                item-value="index"
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
                      @update:model-value="subirArchivoConvenio(item)"
                    ></v-file-input>
                  </div>
                </template>

                <template
                  v-slot:[`item.action`]="{ item, index }"
                  v-if="showFormActions"
                >
                  <v-btn variant="text" icon color="red" @click="eliminarConvenio(index)">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-data-table>
            </v-form>
          </v-col>
        </v-row>

        <br />

        <!-- ===== TARIFAS ===== -->
        <v-list-subheader class="px-0">
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
        </v-list-subheader>
        <v-row>
          <v-col cols="12">
            <v-form ref="formProv_tarifas" :readonly="isFormReadonly">
              <v-data-table
                :headers="headersTarifas"
                :items="entitiesStore.lstTarifas"
                class="elevation-5"
                item-value="index"
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
                      @update:model-value="subirArchivoTarifa(item)"
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
                  <v-btn variant="text" icon color="red" @click="eliminarTarifa(index)">
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
import { mapActions } from "vuex";
import moment from "moment";
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useEntitiesStore } from "@/stores/entities";
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
    ...mapActions(["_uploadFile"]),
    ...mapPiniaActions(useEntitiesStore, ["actualizarProveedor"]),
   
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
      this.entitiesStore.lstConvenios.push({
        fecha: moment().format("YYYY-MM-DD"),
        dias_credito: 0,
        email_soporte: "",
      });
    },
    eliminarConvenio(index) {
      this.entitiesStore.lstConvenios.splice(index, 1);
    },
    generarCodigoTarifa() {
      var vm = this;

      let codigoMaximo = 0;
      vm.entitiesStore.lstTarifas.filter((v) => {
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
      this.entitiesStore.lstTarifas.push({
        fecha: moment().format("YYYY-MM-DD"),
        codigo: this.generarCodigoTarifa(),
        email_soporte: "",
        tarifa: 0,
      });
    },
    eliminarTarifa(index) {
      this.entitiesStore.lstTarifas.splice(index, 1);
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

          vm.entitiesStore.lstConvenios.map((itemConvenio) => {
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

          vm.entitiesStore.lstTarifas.map((itemTarifa) => {
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
    async validarFormulario() {
      var vm = this;

      let ok1 = true;
      if (vm.entitiesStore.lstConvenios.length > 0) {
        if (!(await vm.$refs.formProv_convenios.validate()).valid) {
          ok1 = false;
        }
      }

      let ok2 = true;
      if (vm.entitiesStore.lstTarifas.length > 0) {
        if (!(await vm.$refs.formProv_tarifas.validate()).valid) {
          ok2 = false;
        }
      }

      if (ok1 && ok2) {
        vm.entitiesStore.stepper = 4;
      }
    },
    async modificarProveedor() {
      var vm = this;

      // Si está en modo solo lectura, pasar a modo edición y no guardar todavía
      if (vm.isFormReadonly) {
        vm.entitiesStore.isReadonly = false;
        vm.entitiesStore.isEdit = true;
        vm.$swal({
          icon: "info",
          text: "Ahora puede modificar los campos",
        });
        return;
      }

      vm.entitiesStore.isStep1Valid = true;
      vm.entitiesStore.isStep2Valid = true;
      vm.entitiesStore.isStep3Valid = true;
      vm.entitiesStore.isStep4Valid = true;

      let okStep3_1 = true;
      if (vm.entitiesStore.lstConvenios.length > 0) {
        vm.entitiesStore.lstConvenios.map((v) => {
          if (!v.fecha || v.dias_credito < 0) {
            okStep3_1 = false;
          }
        });
      }

      let okStep3_2 = true;
      if (vm.entitiesStore.lstTarifas.length > 0) {
        vm.entitiesStore.lstTarifas.map((v) => {
          if (!v.fecha || !v.codigo || v.tarifa < 0) {
            okStep3_2 = false;
          }
        });
      }

      if (!okStep3_1 || !okStep3_2) {
        vm.entitiesStore.isStep3Valid = false;
        this.$swal({
          icon: "warning",
          text: "Por favor complete todos los campos requeridos en Convenios y Tarifas",
        });
      } else {
        vm.$store.state.spiner = true;
        await vm.actualizarProveedor();
        vm.$store.state.spiner = false;

        // Volver a modo solo lectura después de guardar correctamente
        vm.entitiesStore.isReadonly = true;
        vm.entitiesStore.isEdit = false;
      }
    },
  },
  watch: {
    "entitiesStore.isStep3Valid": {
      async handler(newValue) {
        if (!newValue) {
          await this.$refs.formProv_convenios.validate();
          await this.$refs.formProv_tarifas.validate();
        }
      },
      immediate: true,
    },
    "entitiesStore.lstConvenios": {
      handler(newValue) {
        if (newValue[0]) {
          this.entitiesStore.proveedor.convenioActual = newValue[0];
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
.customFile .v-input__prepend {
  margin-right: 0;
}
.container-narrow {
  max-width: 1100px;
  margin: 0 auto;
}
</style>
