<template>
  <div ref="contenedorServicios">
    <p>{{ selected_certificado }}</p>

    <h3>Servicios a Realizar</h3>

    <v-simple-table dense>
      <template v-slot:default>
        <thead>
          <tr>
            <th width="20%" class="text-left">Fecha realizado</th>
            <th width="40%" class="text-left">Servicio</th>
            <th width="25%" class="text-center">Realizado (Sí/No)</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(item, index) in $store.state.itemsHouseServices"
            :key="item.id"
            :style="`background:${item.color}`"
          >
            <td>
              <v-text-field
                :value="formatFecha(item.date_service || item.updated_at)"
                prepend-icon="mdi-calendar"
                readonly
                dense
                disabled
                hide-details
                style="max-width: 140px;"
              ></v-text-field>
            </td>
            <td>{{ item.nameservice }}</td>

            <td>
              <div class="d-flex justify-center">

                <!-- Switch normal -->
                <v-switch
                  v-if="item.nameservice != 'CERTIFICADO DE ORIGEN'"
                  dense
                  color="primary"
                  v-model="item.status"
                  :disabled="true"
                  readonly
                ></v-switch>

                <!-- Menú especial -->
                <v-menu v-else offset-y>
                  <template v-slot:activator="{ on, attrs }">
                    <v-btn large color="default" v-bind="attrs" v-on="on" :disabled="true">
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

              </div>
            </td>
          </tr>
        </tbody>
      </template>
    </v-simple-table>

    <!-- Campos de Aduana (solo lectura) -->
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
              :value="$store.state.house_nro_declaracion_aduana"
              label="N° Declaración de Aduana"
              prepend-icon="mdi-file-document-outline"
              readonly
              disabled
              outlined
              dense
              hide-details="auto"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              :value="$store.state.house_canal_aduana"
              label="Canal de Aduana"
              prepend-icon="mdi-traffic-light"
              readonly
              disabled
              outlined
              dense
              hide-details="auto"
            ></v-text-field>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialogFormato" max-width="30%" v-if="false">
      <v-card>
        <v-card-title primary-title>
          Imprimir Formato {{ tipoAreo ? "Guía aérea" : "BL" }}
        </v-card-title>

        <v-card-text>
          Imprimir con fondo
          <v-radio-group v-model="formatoflag">
            <v-radio label="Sí" :value="true"></v-radio>
            <v-radio label="No" :value="false"></v-radio>
          </v-radio-group>
        </v-card-text>

        <v-card-actions>
          <v-btn color="success" v-if="tipoAreo" block @click="exportarFormatoAWB">
            Imprimir Formato Guía Aérea
          </v-btn>

          <v-btn color="success" v-else block @click="exportarFormatoHBL">
            Imprimir Formato BL
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogNotificacionesLista" max-width="500" v-if="false">
      <v-card>
        <v-card-title class="text-h6">
          Seleccione notificación
          <v-spacer></v-spacer>
          <v-btn icon @click="dialogNotificacionesLista = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text>
          <v-list dense two-line>
            <v-list-item
              v-for="(item, idx) in itemsNotificaciones"
              :key="idx"
              @click="seleccionarNotificacion(item)"
            >
              <v-list-item-content>
                <v-list-item-title>{{ item.title }}</v-list-item-title>
              </v-list-item-content>
              <v-list-item-icon>
                <v-icon color="primary">mdi-chevron-right</v-icon>
              </v-list-item-icon>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { mapActions } from "vuex";
import axios from '@/api/axios-config';;
import moment from "moment";
import { v4 as uuidv4 } from "uuid";
export default {
  name: "services",
  props: {
    isFormActionsDisabled: Boolean,
    itemsNotificaciones: {
      type: Array,
      default: () => [],
    },
  },
  data: () => ({
    itemsCertificado: [
      { value: 1, text: "Si" },
      { value: 0, text: "No" },
      { value: 2, text: "No Aplica" },
    ],
    selected_certificado: "",
    dialogFormato: false,
    formatoflag: true,
    dialogNotificacionesLista: false,
    loadingBotonTracking: false,
    fab: false,
    transition: "slide-y-reverse-transition",
    directionSpeedDial: "bottom",
  }),
  computed: {
    getDisabledPropServiceStatus() {
      return () => true;
    },
  },
  async mounted() {
    await this._validaData();
    this.updateSpeedDialDirection();
    window.addEventListener("resize", this.updateSpeedDialDirection);
    window.addEventListener("scroll", this.updateSpeedDialDirection, true);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.updateSpeedDialDirection);
    window.removeEventListener("scroll", this.updateSpeedDialDirection, true);
  },
  methods: {
    ...mapActions([
      "getQuoteDataNoAsignadaHouseByIncoterms",
      "_getPortBegin",
      "_getPortEnd",
    ]),
    irEditar() {
      this.$emit("ir-editar");
    },
    guardarHouse() {
      this.$emit("guardar-house");
    },
    eliminarHouse() {
      this.$emit("eliminar-house");
    },
    updateSpeedDialDirection() {
      this.$nextTick(() => {
        const cont = this.$refs.contenedorServicios;
        if (!cont) return;

        const height = cont.clientHeight || 0;

        const threshold = 400; // si el contenedor es muy alto, abrir hacia arriba
        this.directionSpeedDial = height > threshold ? "top" : "bottom";
      });
    },
    seleccionarNotificacion(item) {
      this.dialogNotificacionesLista = false;
      this.$emit("send-notificacion", item);
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
    async generarTracking() {
      try {
        this.loadingBotonTracking = true;
        const token = uuidv4();
        const data = {
          id_house: this.$route.params.id,
          token: token,
          fecha: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
            .toISOString()
            .substr(0, 10),
        };
        const config = {
          method: "put",
          url: process.env.VUE_APP_URL_MAIN + `setTrackingToken`,
          headers: {
           
            "Content-Type": "application/json",
          },
          data,
        };
        const response = await axios(config);
        sessionStorage.setItem("auth-token", response.data.token);
        if (response.data.estadoflag) {
          this.$store.state.house_enlace_tracking =
            "https://aco.agentedecargaonline.com/tracking/" +
            response.data.data[0].token;
          this.$swal({ icon: "success", text: "Enlace de tracking generado" });
        } else {
          this.$swal({ icon: "info", text: response.data.mensaje || "No se pudo generar tracking" });
        }
      } catch (err) {
        console.error(err);
        this.$swal({ icon: "error", text: "Error al generar tracking" });
      } finally {
        this.loadingBotonTracking = false;
      }
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

                if ((item.nameservice || '').toUpperCase() == "IMPUESTOS") {
                  itemImpuestos = item;
                } else {
                  lstServices.push(item);
                }
              });

              if (itemImpuestos !== null) {
                lstServices.push(itemImpuestos);
              }

              vm.$store.state.itemsHouseServices = vm._sortServicesByName(
                lstServices
              );
            } else {
              vm.$store.state.itemsHouseServices = [];
            }
          })
          .catch(function (error) {
            console.log(error);
          });
      }
    },
    _sortServicesByName(list) {
      if (!Array.isArray(list)) return [];
      const sorted = list.slice().sort((a, b) => {
        const A = (a.nameservice || '').toString();
        const B = (b.nameservice || '').toString();
        return A.localeCompare(B, 'es', { sensitivity: 'base' });
      });
      const idx = sorted.findIndex(
        (s) => String(s.nameservice).toUpperCase() === 'IMPUESTOS'
      );
      if (idx > -1) {
        const [imp] = sorted.splice(idx, 1);
        sorted.push(imp);
      }
      return sorted;
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
                  vm.$store.state.house_incoterms
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
      if (!item.status) {
        this.$store.state.itemsHouseServices =
          this.$store.state.itemsHouseServices.map((itemHS, i) => {
            return {
              ...itemHS,
              status: i > index ? 0 : itemHS.status,
            };
          });
      }
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
      id_incoterms = 0
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
                updated_at: item.updated_at,
                namebegend: item.namebegend,
                position_begend: item.position_begend,
                nameservice: item.namegroupservice,
                status: 0,
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

            vm.$store.state.itemsHouseServices = lstServices;
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
    abriModalaFormato() {
      this.dialogFormato = true;
    },
    async exportarFormatoAWB() {
      try {
        const response = await axios({
          method: "get",
          url: `${process.env.VUE_APP_URL_MAIN}generar_formato_awb`,
          params: {
            id_house: this.$route.params.id,
            formatoflag: this.formatoflag,
          },
          headers: {
           
          },
          responseType: "blob", // 👈 importante
        });

        const blob = new Blob([response.data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        const timestamp = moment().format("YYYY_MM_DD_HH_mm_ss");
        const filename = `formato_awb_${timestamp}.xlsx`;
        link.download = filename; // nombre del archivo
        link.click();

        // Limpieza opcional
        window.URL.revokeObjectURL(link.href);
      } catch (err) {
        console.error("Error exportando archivo:", err);
      }
      this.dialogFormato = false;
    },
    async exportarFormatoHBL() {
      try {
        const response = await axios({
          method: "get",
          url: `${process.env.VUE_APP_URL_MAIN}generar_formato_bl`,
          params: {
            id_house: this.$route.params.id,
            formatoflag: this.formatoflag,
          },
          headers: {
           
          },
          responseType: "blob", // 👈 importante
        });

        const blob = new Blob([response.data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        const timestamp = moment().format("YYYY_MM_DD_HH_mm_ss");
        const filename = `formato_bl_${timestamp}.xlsx`;
        link.download = filename; // nombre del archivo
        link.click();

        // Limpieza opcional
        window.URL.revokeObjectURL(link.href);
      } catch (err) {
        console.error("Error exportando archivo:", err);
      }
      this.dialogFormato = false;
    },
  },
  computed: {
    tipoAreo() {
      let val = this.$store.state.itemsShipment.filter(
        (v) => v.id == this.$store.state.house_id_trasnport
      );
      if (val.length > 0) {
        return val[0].code == "Aéreo";
      }
      console.log(val);
      return true;
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

.acciones-dial ::v-deep .v-speed-dial__list {
  align-items: flex-start !important;
}
.acciones-dial ::v-deep .v-speed-dial__list .v-btn {
  align-self: flex-start;
  min-width: 180px;
}
.acciones-dial ::v-deep .v-speed-dial__list .v-btn .v-btn__content {
  justify-content: flex-start;
  width: 100%;
  font-size: 0.98rem;
  line-height: 1.2;
}
.acciones-dial ::v-deep .v-speed-dial__list .v-btn .v-icon {
  font-size: 22px !important;
}
</style>
