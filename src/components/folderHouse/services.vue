<template>
  <div>
    <p>{{ selected_certificado }}</p>
    <h3>Servicios a Realizar</h3>

    <v-fab-transition>
      <v-btn
        @click="showModalServices"
        color="green"
        absolute
        top
        right
        small
        fab
        :dark="!isFormActionsDisabled"
        :disabled="isFormActionsDisabled"
      >
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </v-fab-transition>
    <v-simple-table dense>
      <template v-slot:default>
        <thead>
          <tr>
            <!-- <th width="25%" class="text-left">Ubicación/Tramo</th> -->
            <th width="20%" class="text-left">Fecha realizado</th>
            <th width="40%" class="text-left">Servicio</th>
            <th width="25%" class="text-center">Realizado (Sí/No)</th>
            <th width="5%" class="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr
            :style="`background:${item.color}`"
            v-for="(item, index) in $store.state.itemsHouseServices"
            :key="item.id"
          >
            <!-- <td>{{ item.namebegend }}</td> -->
            <td>
              <v-menu
                ref="menu"
                v-model="item.showDatePicker"
                :close-on-content-click="false"
                transition="scale-transition"
                offset-y
                min-width="auto"
                :disabled="isFormActionsDisabled"
              >
                <template v-slot:activator="{ on, attrs }">
                  <v-text-field
                    :value="formatFecha(item.date_service || item.updated_at)"
                    prepend-icon="mdi-calendar"
                    readonly
                    v-bind="attrs"
                    v-on="on"
                    dense
                    :disabled="isFormActionsDisabled"
                    hide-details
                    style="max-width: 140px"
                  ></v-text-field>
                </template>
                <v-date-picker
                  :value="
                    getDateForPicker(item.date_service || item.updated_at)
                  "
                  @input="updateServiceDate(item, $event)"
                  locale="es"
                  :first-day-of-week="1"
                ></v-date-picker>
              </v-menu>
            </td>
            <td>{{ item.nameservice }}</td>

            <td>
              <div class="d-flex justify-center">
                <v-switch
                  v-if="item.nameservice != 'CERTIFICADO DE ORIGEN'"
                  dense
                  color="primary"
                  :true-value="1"
                  :false-value="0"
                  v-model="item.status"
                  :disabled="getDisabledPropServiceStatus(index)"
                  @change="toggleServiceStatusSwitch(item, index)"
                ></v-switch>
              </div>

              <v-menu
                v-if="item.nameservice == 'CERTIFICADO DE ORIGEN'"
                offset-y
              >
                <template v-slot:activator="{ on, attrs }">
                  <v-btn large color="default" v-bind="attrs" v-on="on">
                    {{
                      item.status == 1
                        ? "SI"
                        : item.status == 0
                        ? "NO"
                        : item.status == 2
                        ? "NO APLICA"
                        : ""
                    }}
                  </v-btn>
                </template>
                <v-list>
                  <v-list-item @click="_editServices(item.id, 1)" link>
                    <v-list-item-title>SI</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="_editServices(item.id, 0)" link>
                    <v-list-item-title>NO</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="_editServices(item.id, 2)" link>
                    <v-list-item-title>NO APLICA</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </td>
            <td class="text-center">
              <v-icon
                class="btn_add"
                dense
                color="red"
                @click="deleteService(index)"
                :disabled="isFormActionsDisabled"
                >mdi-delete</v-icon
              >
            </td>
          </tr>
        </tbody>
      </template>
    </v-simple-table>

    <!-- Campos de Aduana -->
    <v-card class="mt-4" outlined>
      <v-card-title class="py-2">
        <v-icon left color="indigo">mdi-ferry</v-icon>
        Datos de Aduana
        <v-spacer></v-spacer>
        <span class="caption grey--text text--darken-1">Información SUNAT</span>
      </v-card-title>
      <v-card-text class="pt-0">
        <v-row dense>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="$store.state.house_nro_declaracion_aduana"
              label="N° Declaración de Aduana"
              prepend-icon="mdi-file-document-outline"
              :disabled="isFormActionsDisabled"
              outlined
              dense
              hide-details="auto"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="$store.state.house_canal_aduana"
              label="Canal de Aduana"
              prepend-icon="mdi-traffic-light"
              :disabled="isFormActionsDisabled"
              outlined
              dense
              hide-details="auto"
            ></v-text-field>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    <v-card class="mt-2">
      <v-card-title primary-title> BL TELEXT </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="3">
            <v-switch
              :label="$store.state.telexconfirmado ? 'Si' : 'No'"
              v-model="$store.state.telexconfirmado"
            />
          </v-col>
          <v-col cols="9">
            <FormatFecha
              v-if="$store.state.telexconfirmado"
              :outlined="true"
              label="Fecha de confirmación"
              v-model="$store.state.fechaconfirmaciontelex"
              :clearable="true"
            />
          </v-col>

          <v-btn
            v-if="mostrarBtnTelex"
            :loading="loading"
            color="success"
            @click="confirmarTelex()"
          >
            Confirmar Telex
          </v-btn>
        </v-row>
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialogConfirmarTelex" max-width="30%">
      <v-card>
        <v-card-title primary-title>
          Confirmar liberación de Telex
          <v-spacer></v-spacer>
          <v-btn icon @click="dialogConfirmarTelex = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="frmConfirmar">
            <v-select
              :items="cboConfirmaTelex"
              v-model="$store.state.telexconfirmado"
              label="Estado del documento"
              outlined
              dense
            ></v-select>
            <FormatFecha
              :outlined="true"
              :dense="true"
              label="Fecha de confirmación"
              v-model="$store.state.fechaconfirmaciontelex"
              :clearable="true"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn :loading="loading" color="success" @click="confirmarTelex()"
            >Confirmar</v-btn
          >
          <v-btn
            :loading="loading"
            color="error"
            @click="dialogConfirmarTelex = false"
            text
            >Cancelar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- Botón "Imprimir Formato" movido a sección de Acciones en controlHouse.vue -->
  </div>
</template>
<script>
import { mapActions } from "vuex";
import axios from "@/api/axios-config";
import moment from "moment";
import FormatFecha from "../comun/FormatFecha.vue";
import Swal from "sweetalert2";
export default {
  components: {
    FormatFecha,
  },
  name: "services",
  props: {
    isFormActionsDisabled: Boolean,
  },
  data() {
    return {
      loading: false,
      mostrarBtnTelex: false,
      itemsCertificado: [
        { value: 1, text: "Si" },
        { value: 0, text: "No" },
        { value: 2, text: "No Aplica" },
      ],
      selected_certificado: "",
      dialogConfirmarTelex: false,
      cboConfirmaTelex: [
        { text: "Confirmado", value: true },
        { text: "Sin Confirmar", value: false },
      ],
      telexconfirmado: "",
      fechaconfirmaciontelex: "",
    };
  },
  computed: {},
  async mounted() {
    await this._validaData();
  },
  watch: {
    "$store.state.itemsHouseServices": {
      handler(newValue) {
        newValue.forEach((item) => {
          this.logNameService(item);
        });
      },
      deep: true,
    },
    "$store.state.telexconfirmado"() {
      this.mostrarBtnTelex = true;
      if (!this.$store.state.telexconfirmado) {
        this.$store.state.fechaconfirmaciontelex = null;
      }
    },
  },

  methods: {
    ...mapActions([
      "getQuoteDataNoAsignadaHouseByIncoterms",
      "_getPortBegin",
      "_getPortEnd",
      "setConfirmarTelex",
    ]),
    abrirModalConfirmaTelex() {
      this.dialogConfirmarTelex = true;
    },
    async confirmarTelex() {
      const { telexconfirmado, fechaconfirmaciontelex } = this.$store.state;
      if (!this.telexconfirmado) {
        this.fechaconfirmaciontelex = false;
      }

      if (telexconfirmado && !fechaconfirmaciontelex) {
        Swal.fire({
          icon: "warning", // Cambiado a 'warning' porque es una omisión, no un error de sistema
          title: "Acción requerida",
          text: "Debe ingresar una fecha de confirmación para proceder con el estado 'Confirmado'.",
        });
        return;
      }

      if (!telexconfirmado && fechaconfirmaciontelex) {
        Swal.fire({
          icon: "warning",
          title: "Inconsistencia en los datos",
          text: "No es posible establecer una fecha si el documento no ha sido confirmado.",
        });
        return;
      }
      this.$store.state.spiner = true;
      this.loading = true;
      await this.setConfirmarTelex({
        id: this.$route.params.id,
        telexconfirmado: this.$store.state.telexconfirmado,
        fechaconfirmaciontelex: this.$store.state.fechaconfirmaciontelex,
      });
      this.loading = false;
      this.dialogConfirmarTelex = false;
      this.$store.state.spiner = false;
    },
    getDisabledPropServiceStatus(index) {
      return !!this.isFormActionsDisabled;
    },
    logNameService(value) {
      return value;
    },
    formatFecha(val) {
      if (!val) return "";
      try {
        const d = moment(val);
        if (!d.isValid()) return String(val);
        return d.format("DD/MM/YYYY");
      } catch (e) {
        return String(val);
      }
    },
    getDateForPicker(val) {
      if (!val) return null;
      try {
        const d = moment(val);
        if (!d.isValid()) return null;
        return d.format("YYYY-MM-DD");
      } catch (e) {
        return null;
      }
    },
    async updateServiceDate(item, newDate) {
      if (!newDate) return;

      item.showDatePicker = false;

      const formattedDate = moment(newDate).format("YYYY-MM-DD");
      this.$set(item, "date_service", formattedDate);
    },
    send() {
      alert("Jpla");
    },
    _deleteServices(id) {
      var vm = this;
      var data = {
        id: id,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "deleteServices",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      axios(config)
        .then(async function (response) {
          if (response.data.status == 200) {
            await vm._validaData();
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    _activeServices(id) {
      var vm = this;
      var data = {
        id: id,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "activeServices",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      axios(config)
        .then(async function (response) {
          if (response.data.status == 200) {
            await vm._validaData();
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    _inactiveServices(id) {
      var vm = this;
      var data = {
        id: id,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "inactiveServices",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      axios(config)
        .then(async function (response) {
          if (response.data.status == 200) {
            await vm._validaData();
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    _editServices(id, status) {
      var vm = this;
      var data = {
        id: id,
        status: status,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "editServices",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      axios(config)
        .then(function (response) {
          if (response.data.status == 200) {
            vm._validaData();
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async _validaData() {
      var vm = this;

      if (vm.$route.params.id) {
        vm.$store.state.house_Id_get = vm.$route.params.id;
        var data = {
          id: vm.$route.params.id,
          id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0]
            .id_branch,
        };

        var config = {
          method: "post",
          url: process.env.VUE_APP_URL_MAIN + "getHouseServices",
          headers: {
            "Content-Type": "application/json",
          },
          data: data,
        };

        await axios(config)
          .then(function (response) {
            sessionStorage.setItem("auth-token", response.data.token);

            if (response.data.estadoflag) {
              let lstServices = [];
              let itemImpuestos = null;
              response.data.data.map((it, i) => {
                // Regla: todos en 0 (No) excepto si updated_at y created_at son distintos,
                // en cuyo caso se respeta el status que viene del backend.
                const changed =
                  it.updated_at &&
                  it.created_at &&
                  it.updated_at !== it.created_at;

                const item = {
                  ...it,
                  status: changed ? it.status : 0,
                };

                if ((item.nameservice || "").toUpperCase() == "IMPUESTOS") {
                  itemImpuestos = item;
                } else {
                  lstServices.push(item);
                }
              });

              if (itemImpuestos !== null) {
                lstServices.push(itemImpuestos);
              }

              vm.$store.state.itemsHouseServices =
                vm._sortServicesByName(lstServices);
            } else {
              vm.$store.state.itemsHouseServices = [];
            }
          })
          .catch(function (error) {
            console.log(error);
          });
      }
    },
    showModalServices() {
      var vm = this;

      vm.$store.state.modalServices_manualMode = false;
      if (
        (!vm.$store.state.house_cotizacion &&
          !vm.$store.state.itemsHouseServices.length) ||
        (!vm.$store.state.house_incoterms &&
          !vm.$store.state.itemsHouseServices.length)
      ) {
        vm.$swal({
          icon: "question",
          html: "<b>¿Desea asociar una cotización para cargar los servicios?</b>",
          showConfirmButton: true,
          confirmButtonText: "Sí",
          confirmButtonColor: "#4CAF50",
          showDenyButton: true,
          denyButtonText: "No tengo una cotización",
          allowOutsideClick: false,
        }).then(({ isDenied }) => {
          if (isDenied) {
            vm.$swal({
              icon: "info",
              html: "<b>Los servicios se cargarán según el incoterm seleccionado. Si no ha seleccionado un incoterm, seleccione uno para cargar los servicios.</b>",
              showConfirmButton: true,
              confirmButtonText: "Aceptar",
              confirmButtonColor: "#4CAF50",
              allowOutsideClick: false,
            }).then(async (result) => {
              if (vm.$store.state.house_incoterms) {
                vm.$store.state.spiner = true;

                await vm._getServicesByIncoterms(
                  vm.$store.state.house_sentido,
                  vm.$store.state.house_id_trasnport,
                  vm.$store.state.house_incoterms,
                );

                vm.$store.state.spiner = false;
              }
            });
          }
        });
      } else {
        if (vm.$store.state.itemsHouseServices.length) {
          vm.$store.state.modalServices_manualMode = true;
        }
      }
    },
    toggleServiceStatusSwitch(item, index) {
      // Solo actualiza el estado local. La fecha mostrada proviene de update_at del backend.
      // El backend actualizará update_at cuando se guarde el House (setHouseEdit).
      const isOn =
        item.status === 1 || item.status === "1" || item.status === true;
      item.status = isOn ? 1 : 0;
    },
    _sortServicesByName(list) {
      if (!Array.isArray(list)) return [];
      const sorted = list.slice().sort((a, b) => {
        const A = (a.nameservice || "").toString();
        const B = (b.nameservice || "").toString();
        return A.localeCompare(B, "es", { sensitivity: "base" });
      });
      const idx = sorted.findIndex(
        (s) => String(s.nameservice).toUpperCase() === "IMPUESTOS",
      );
      if (idx > -1) {
        const [imp] = sorted.splice(idx, 1);
        sorted.push(imp);
      }
      return sorted;
    },
    deleteService(index) {
      this.$store.state.itemsHouseServices.splice(index, 1);
    },
    async _activePort(id_transport) {
      await this._getPortBegin({ id_transport: id_transport });
      await this._getPortEnd({ id_transport: id_transport });
      if (this.$store.state.master_id_trasnport.id == 1) {
        this.$store.state.embar_title_nacn = "Aerolinea";
      } else if (this.$store.state.master_id_trasnport.id == 2) {
        this.$store.state.embar_title_nacn = "Naviera";
      } else if (this.$store.state.master_id_trasnport.id == 3) {
        this.$store.state.embar_title_nacn = "Coloader";
      } else {
        this.$store.state.embar_title_nacn = "Aerolinea/Coloader/Naviera";
      }
    },
    async _getServicesByIncoterms(
      id_modality = 0,
      id_shipment = 0,
      id_incoterms = 0,
    ) {
      var vm = this;
      var data = {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
        id_modality: id_modality,
        id_shipment: id_shipment,
        id_incoterms: id_incoterms,
      };

      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + `getServicesByIncoterms`,
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };

      await axios(config)
        .then(function (response) {
          sessionStorage.setItem("auth-token", response.data.token);

          if (response.data.estadoflag) {
            let lstServices = [];
            let itemImpuestos = null;

            response.data.data.map((item, i) => {
              const dataService = {
                id_begend: item.id_begend,
                namebegend: item.namebegend,
                position_begend: item.position_begend,
                nameservice: item.namegroupservice,
                status: 0,
                updated_at: null,
              };

              if (item.namegroupservice.toUpperCase() == "IMPUESTOS") {
                itemImpuestos = dataService;
              } else {
                lstServices.push(dataService);
              }
            });

            if (itemImpuestos !== null) {
              lstServices.push(itemImpuestos);
            }

            vm.$store.state.itemsHouseServices =
              vm._sortServicesByName(lstServices);
          } else {
            vm.$store.state.itemsHouseServices = [];

            vm.$swal({
              icon: "error",
              text: response.data.mensaje,
            });
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    },
  },
};
</script>

<style lang="scss" scoped>
.listMain {
  padding: 0px;
}

.btn_add {
  cursor: pointer;
}
</style>
