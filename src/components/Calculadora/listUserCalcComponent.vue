<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Search"
          single-line
          hide-details
          outlined
          dense
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="6">
        <v-btn color="green" dark @click="exportar()" :loading="loading"
          >Exportar</v-btn
        >
      </v-col>
      <v-col cols="12" md="12">
        <v-data-table
          :headers="headers"
          :items="$store.state.calculadoras.listUser"
          :search="search"
          item-key="index"
          id="tblListUser"
          class="elevation-2"
        >
          <template v-slot:[`item.action`]="{ item }">
            <v-btn small min-width="180px" color="info" class="ma-1" @click="abrirModalPreview(item)">
              <v-icon class="mr-3">mdi-eye</v-icon> Ver Preview
            </v-btn>
            <v-btn small min-width="180px" color="success" class="ma-1">
              <v-icon class="mr-3">mdi-invoice-text-send-outline</v-icon> Enviar
              Pricing
            </v-btn>

            <!-- <v-btn x-small icon color="primary" @click="openCall(item)">
            <v-icon>mdi-phone</v-icon>
          </v-btn>
          <v-btn x-small icon color="info" @click="openHistoryCall(item)">
            <v-icon>mdi-clipboard-text-clock</v-icon>
          </v-btn> -->
          </template>
        </v-data-table>
      </v-col>
    </v-row>
    <previewQuote :dialog="dialog" :data="dataCotizacion"/>
  </v-container>
</template>

<script>
import { mapActions } from "vuex";
import moment from "moment";
import funcion from "../mixins/funciones";
import previewQuote from "./previewQuote.vue";
// import axios from '@/api/axios-config';
export default {
  components: {
    previewQuote,
  },
  mixins: [funcion],
  data() {
    return {
      dialog: false,
      dialogCotizacion: false,
      expanded: [],
      singleExpand: false,
      search: "",
      dialogCalls: false,
      dialogCallHistory: false,
      loading: false,
      title: "",
      costos: [],

      itemResumen: [],
      headers: [
        // { text: "Acciones", value: "accion" },
        { text: "Fecha Registro", value: "created_at" },
        { text: "Cliente", value: "nombre" },
        { text: "Tipo", value: "tipo" },
        { text: "Puerto Origen", value: "port_origen" },
        { text: "Puerto Destino", value: "port_destino" },
        { text: "Peso", value: "peso" },
        { text: "Volumen", value: "volumen" },
        // { text: "", value: "servicios" },
        { text: "Valor Mercancía", value: "valormercancia" },
        { text: "Correo", value: "email" },
        { text: "Teléfono", value: "telefono" },
        { text: "", value: "action", sortable: false },
      ],

      datos: {
        desgloseKey: [],
        desglose: false,
        desgloseValues: [],
        desgloseValuesCostos: [],
        resumen: [],
        show: false,
        flete: [],
        impuestosBajos: [],
        totalVenta: [],
        impuestosMedios: [],
        impuestosAltos: [],
        honorarios: [],
        servicioLogistico: [],
        Serviciologis: [],
        impuestosAltosTotal: [],
        impuestosBajosTotal: [],
        impuestosMediosTotal: [],
        servicioLogisticoTotal: [],
        venta: [],
        token: [],
        tipo: [],
        totalIGVFleteCostos: [],
        totalIGVCostos: [],
        activar: false,
        cliente: "",
        contacto: "",
        correo: "",
        ejecutivo: "",
        naviera: [],
      },
      dataCotizacion: {},
    };
  },
  async mounted() {
    await this.getListUserCalc();
  },
  methods: {
    ...mapActions([
      "getListUserCalc",
      "ExportarListUser",
      "getCboStatus",
      "SetCall",
      "GetCotFCL",
      "GetCotLCL",
      "GetCotAereo",
      "GetCotFCLResumen",
      "GetCotLCLResumen",
      "GetCotAereoResumen",
      "getModulesEntities",
    ]),
    getFecha(fecha) {
      moment.locale("es");
      return moment(fecha).format("YYYY-MMM-DD");
    },
    abrirModalPreview(data) {
      this.dialog = true
      this.dataCotizacion = data;
    },
    async exportar() {
      this.loading = true;
      await this.ExportarListUser();
      this.loading = false;
    },
    openCall(user) {
      this.user = user;
      let fechahora = moment(this.fecha).format("YYYY-MM-DDTHH:mm");
      this.call.date = fechahora;
      this.dialogCalls = true;
    },
    async registrarLlamada() {
      if (this.$refs.frmCall.validate()) {
        let data = {
          iduser: this.user.usuario_id,
          statuscall: this.call.statuscall,
          isuser: this.user.usuario_system,
          date: moment(this.call.date).format("YYYY-MM-DD HH:mm"),
          comentario: this.call.comentario,
          identities: this.call.identities.id_entitie
            ? this.call.identities.name
            : `${JSON.parse(sessionStorage.getItem("dataUser"))[0].surname} ${
                JSON.parse(sessionStorage.getItem("dataUser"))[0].second_surname
              } ${JSON.parse(sessionStorage.getItem("dataUser"))[0].names}`,
        };
        this.$store.state.overlay = true;
        await this.SetCall(data);
        // await this.getListUserCalc();

        this.call = {
          iduser: "",
          statuscall: "",
          isuser: "",
          date: "",
          comentario: "",
          fecha: new Date(),
        };
        this.dialogCalls = false;

        this.$store.state.overlay = false;
      }
    },
    calcResumen() {
      let items = [];
      let hoy = moment(new Date()).format("YYYY-MM-DD");
      // if (this.$store.state.calculadoras.listUser.length > 0) {
      //   while (items.length <= 1) {
      //     if (
      //       this.$store.state.calculadoras.listUser.filter(
      //         (v) =>
      //           moment(v.usuario_creacion).format("YYYY-MM-DD") == hoy ||
      //           moment(v.usuario_updated).format("YYYY-MM-DD") == hoy,
      //       ).length > 0
      //     ) {
      //       items.push({
      //         day: hoy,
      //       });
      //     }
      //     hoy = moment(hoy).subtract(1, "days").format("YYYY-MM-DD");
      //   }
      // }
      // items.forEach((element) => {
      //   element.new = this.$store.state.calculadoras.listUser.filter(
      //     (v) =>
      //       moment(v.usuario_creacion).format("YYYY-MM-DD") == element.day &&
      //       v.list_cotizacion.length == 1,
      //   ).length;
      //   element.recurrente = this.$store.state.calculadoras.listUser.filter(
      //     (v) =>
      //       moment(v.usuario_creacion).format("YYYY-MM-DD") == element.day &&
      //       v.list_cotizacion.length != 1,
      //   ).length;
      // });
      this.itemResumen = items;
    },
    openHistoryCall(item) {
      this.user = item;
      this.calls = item.list_call;

      this.dialogCallHistory = true;
    },
    clickRow(item, event) {
      if (event.isExpanded) {
        const index = this.expanded.findIndex((i) => i === item);
        this.expanded.splice(index, 1);
      } else {
        this.expanded.push(item);
      }
    },
    obtener_fecha(date) {
      moment.locale("es");
      return moment(date).format("YYYY-MMM-DD HH:mm");
    },
    async obtenerFCL(token, item) {
      this.title =
        "Número de cotización:" +
        token +
        "-FCL." +
        " Cliente: " +
        item.usuario_nombre;
      let tipoCon = "Maritimo - Completo";

      await this.GetCotFCL(token);
      await this.GetCotFCLResumen(token);
      await this.calculoPrincpipal("FLETE MARÍTIMO", tipoCon);
      await this.calculo(tipoCon);
      this.dialogCotizacion = true;
    },
    async obtenerLCL(token, item) {
      this.title =
        "Número de cotización:" +
        token +
        "-LCL." +
        " Cliente: " +
        item.usuario_nombre;
      let tipoCon = "Maritimo - Compartido";

      await this.GetCotLCL(token);
      await this.GetCotLCLResumen(token);
      await this.calculoPrincpipal("FLETE MARÍTIMO", tipoCon);
      await this.calculo(tipoCon);
      this.dialogCotizacion = true;
    },

    async obtenerAEREO(token, item) {
      this.title =
        "Número de cotización:" +
        token +
        "-AEREO." +
        " Cliente: " +
        item.usuario_nombre;
      let tipoCon = "Aereo";

      await this.GetCotAereo(token);
      await this.GetCotAereoResumen(token);
      await this.getModulesEntities();
      await this.calculoPrincpipal("FLETE AÉREO", tipoCon);
      await this.calculo(tipoCon);
      this.dialogCotizacion = true;
    },

    // -----------------------------------------------------------
    calculo(tipoCon) {
      let resumen2 = this.$store.state.calculadoras.datosresumen;

      let impuestosBajosTotal = resumen2
        .filter(function (item) {
          if (item.tipo == "IMPUESTOS DE ADUANA BAJOS") {
            return item;
          }
        })
        .map(function (duration) {
          return duration.valor.toFixed(2);
        });

      let impuestosMediosTotal = resumen2
        .filter(function (item) {
          if (item.tipo == "IMPUESTOS DE ADUANA MEDIOS") {
            return item;
          }
        })
        .map(function (duration) {
          return duration.valor.toFixed(2);
        });

      let impuestosAltosTotal = resumen2
        .filter(function (item) {
          if (item.tipo == "IMPUESTOS DE ADUANA ALTOS") {
            return item;
          }
        })
        .map(function (duration) {
          return duration.valor.toFixed(2);
        });
      var Serviciologistico;
      let preServiciologistico = resumen2
        .filter(function (item) {
          if (
            item.tipo == "SERVICIO LOGÍSTICO" ||
            item.tipo == "GANANCIA - SERVICIO LOGÍSTICO"
          ) {
            return item;
          }
        })
        .map(function (duration) {
          return duration.valor.toFixed(2);
        });

      if (preServiciologistico.length > 1) {
        Serviciologistico = preServiciologistico
          .reduce(function (accumulator, current) {
            return [+accumulator + +current];
          })
          .map(function (duration) {
            return duration.toFixed(2);
          });
      } else {
        Serviciologistico = preServiciologistico;
      }

      let venta = resumen2.filter(function (item) {
        if (
          item.tipo !== "IMPUESTOS DE ADUANA BAJOS" &&
          item.tipo !== "IMPUESTOS DE ADUANA ALTOS" &&
          item.tipo !== "IMPUESTOS DE ADUANA MEDIOS"
        ) {
          return item;
        }
      });

      this.datos.impuestosAltosTotal = impuestosAltosTotal;
      this.datos.impuestosMediosTotal = impuestosMediosTotal;
      this.datos.impuestosBajosTotal = impuestosBajosTotal;
      this.datos.Serviciologis = Serviciologistico;
      this.datos.venta = venta;
      this.datos.tipo = tipoCon;
    },
    // ----------------------------------------------------------------------
    calculoPrincpipal(transportes, tipoCon) {
      let response = this.$store.state.calculadoras.datos;
      let flete = response
        .filter(function (item) {
          if (item.tipo == transportes) {
            return item;
          }
        })
        .filter(function (item) {
          if (item.valor > 0) {
            return item;
          }
        });

      let impuestosBajos = response
        .filter(function (item) {
          if (item.tipo == "IMPUESTOS DE ADUANA BAJOS") {
            return item;
          } else {
            return false;
          }
        })
        .map(function (duration) {
          if (duration !== false) {
            return duration.valor.toFixed(2);
          } else {
            return duration;
          }
        });

      // let IPM = response
      //   .filter(function (item) {
      //     if (
      //       item.tipo == "IMPUESTOS DE ADUANA BAJOS" &&
      //       item.nombre == "IPM"
      //     ) {
      //       return item;
      //     } else {
      //       return false;
      //     }
      //   })
      //   .map(function (duration) {
      //     if (duration !== false) {
      //       return duration.valor.toFixed(2);
      //     } else {
      //       return duration;
      //     }
      //   });

      let impuestosMedios = response
        .filter(function (item) {
          if (item.tipo == "IMPUESTOS DE ADUANA MEDIOS") {
            return item;
          } else {
            return false;
          }
        })
        .map(function (duration) {
          if (duration !== false) {
            return duration.valor.toFixed(2);
          } else {
            return duration;
          }
        });

      let impuestosAltos = response
        .filter(function (item) {
          if (item.tipo == "IMPUESTOS DE ADUANA ALTOS") {
            return item;
          } else {
            return false;
          }
        })
        .map(function (duration) {
          if (duration !== false) {
            return duration.valor.toFixed(2);
          } else {
            return duration;
          }
        });

      let transporte = response.filter(function (item) {
        if (item.tipo == "TRANSPORTE DE MERCANCÍA") {
          return item;
        } else {
          return false;
        }
      });

      let honorarios = response.filter(function (item) {
        if (item.tipo == "TRÁMITES Y HONORARIOS DE AGENCIA DE ADUANA") {
          return item;
        } else {
          return false;
        }
      });

      let seguro = response.filter(function (item) {
        if (item.tipo == "SEGURO DE MERCANCÍA SUGERIDO") {
          return item;
        } else {
          return false;
        }
      });

      let servicioLogistico = response.filter(function (item) {
        if (
          item.tipo == "SERVICIO LOGÍSTICO" ||
          item.tipo == "GANANCIA - SERVICIO LOGÍSTICO" ||
          item.detalles == "Ganancia"
        ) {
          return item;
        } else {
          return false;
        }
      });

      let desgloseValuesCostos = response.filter(function (item) {
        if (
          item.tipo !== "IMPUESTOS DE ADUANA BAJOS" &&
          item.tipo !== "IMPUESTOS DE ADUANA ALTOS" &&
          item.tipo !== "IMPUESTOS DE ADUANA MEDIOS" &&
          item.tipo !== transportes &&
          item.tipo !== "SERVICIO LOGÍSTICO" &&
          item.tipo !== "GANANCIA - SERVICIO LOGÍSTICO" &&
          item.detalles !== "Ganancia" &&
          item.tipo !== "TRÁMITES Y HONORARIOS DE AGENCIA DE ADUANA"
        ) {
          if (item.valor > 0) {
            return item;
          }
        }
      });

      let desgloseValues = response.filter(function (item) {
        if (
          item.tipo !== "IMPUESTOS DE ADUANA BAJOS" &&
          item.tipo !== "IMPUESTOS DE ADUANA ALTOS" &&
          item.tipo !== "IMPUESTOS DE ADUANA MEDIOS" &&
          item.tipo !== transportes &&
          item.tipo !== "SERVICIO LOGÍSTICO" &&
          item.tipo !== "GANANCIA - SERVICIO LOGÍSTICO" &&
          item.detalles !== "Ganancia"
        ) {
          if (item.valor !== 0) {
            return item;
          }
        }
      });

      let PretotalIGVCostos, totalIGVCostos;

      switch (flete[0].detalles_calculos.pais_destino) {
        case "PERU":
          PretotalIGVCostos = response.filter(function (item) {
            if (
              item.tipo !== "IMPUESTOS DE ADUANA BAJOS" &&
              item.tipo !== "IMPUESTOS DE ADUANA ALTOS" &&
              item.tipo !== "IMPUESTOS DE ADUANA MEDIOS" &&
              item.tipo !== "SERVICIO LOGÍSTICO" &&
              item.tipo !== "GANANCIA - SERVICIO LOGÍSTICO" &&
              item.tipo !== transportes &&
              item.tipo !== "FLETE" &&
              item.detalles !== "Ganancia" &&
              item.tipo !== "THCD" &&
              item.tipo !== "TCHD DOCUMENTACION" &&
              item.tipo !== "SEGURO DE MERCANCÍA SUGERIDO"
            ) {
              if (item.valor > 0) {
                return item;
              }
            }
          });
          totalIGVCostos = [0];

          if (PretotalIGVCostos.length > 1) {
            totalIGVCostos = PretotalIGVCostos.map(function (duration) {
              return (duration.valor * 0.18).toFixed(2);
            })
              .reduce(function (accumulator, current) {
                return [+accumulator + +current];
              })
              .map(function (duration) {
                return duration.toFixed(2);
              });
          }

          break;
        case "PANAMA":
          PretotalIGVCostos = response.filter(function (item) {
            if (item.tipo == "PORT CHARGES" || item.tipo == "MANEJOS") {
              if (item.valor > 0) {
                return item;
              }
            }
          });
          totalIGVCostos = [0];

          if (PretotalIGVCostos.length > 1) {
            totalIGVCostos = PretotalIGVCostos.map(function (duration) {
              return (duration.valor * 0.07).toFixed(2);
            })
              .reduce(function (accumulator, current) {
                return [+accumulator + +current];
              })
              .map(function (duration) {
                return duration.toFixed(2);
              });
          }

          break;
        case "VENEZUELA":
          totalIGVCostos = [0];
          break;

        default:
      }

      let desgloseTotal = response
        .filter(function (item) {
          if (
            item.tipo !== "IMPUESTOS DE ADUANA BAJOS" &&
            item.tipo !== "IMPUESTOS DE ADUANA ALTOS" &&
            item.tipo !== "IMPUESTOS DE ADUANA MEDIOS" &&
            item.tipo !== "SERVICIO LOGÍSTICO" &&
            item.tipo !== "GANANCIA - SERVICIO LOGÍSTICO" &&
            item.detalles !== "Ganancia"
          ) {
            if (item.valor > 0) {
              return item;
            }
          }
        })
        .map(function (duration) {
          return duration.valor.toFixed(2);
        })
        .reduce(function (accumulator, current) {
          return [+accumulator + +current];
        });

      let preservicioLogisticoTotal = response
        .filter(function (item) {
          if (
            item.tipo == "SERVICIO LOGÍSTICO" ||
            item.tipo == "GANANCIA - SERVICIO LOGÍSTICO" ||
            item.detalles == "Ganancia"
          ) {
            return item;
          }
        })
        .map(function (duration) {
          return duration.valor;
        });
      var servicioLogisticoTotal;
      if (preservicioLogisticoTotal.length > 1) {
        servicioLogisticoTotal = preservicioLogisticoTotal.reduce(function (
          accumulator,
          current,
        ) {
          return [+accumulator + +current];
        });
      } else {
        servicioLogisticoTotal = preservicioLogisticoTotal;
      }

      let totalIGVFleteCostos =
        Number(desgloseTotal[0]) + Number(totalIGVCostos[0]);

      var totalVenta =
        Number(servicioLogisticoTotal[0]) + Number(desgloseTotal[0]);

      var naviera;
      switch (tipoCon) {
        case "Maritimo - Completo":
          {
            naviera = flete[0].detalles_calculos.naviera;
          }
          break;
        case "Maritimo - Compartido":
          {
            naviera = flete[0].detalles_calculos.agentes_lcl_nombre;
          }
          break;
        case "Aereo":
          {
            naviera = flete[0].detalles_calculos.agentes_aereo_nombre;
          }
          break;

        default:
      }

      this.datos.desgloseValues = desgloseValues;
      this.datos.desgloseValuesCostos = desgloseValuesCostos;
      this.datos.show = true;
      this.datos.flete = flete;
      this.datos.impuestosAltos = impuestosAltos;
      this.datos.impuestosMedios = impuestosMedios;
      this.datos.impuestosBajos = impuestosBajos;
      this.datos.servicioLogistico = servicioLogistico;
      this.datos.transporte = transporte;
      this.datos.seguro = seguro;
      this.datos.honorarios = honorarios;
      this.datos.naviera = naviera;
      this.datos.totalIGVFleteCostos = totalIGVFleteCostos.toFixed(2);
      this.datos.totalIGVCostos = totalIGVCostos[0];
      this.datos.servicioLogisticoTotal = servicioLogisticoTotal;
      this.datos.desgloseTotal = desgloseTotal[0];
      this.datos.totalVenta = totalVenta;
    },

    igv(item, pais, totalIGVCostos) {
      var valor;
      switch (pais) {
        case "PERU":
          if (
            item.tipo != "THCD" &&
            item.tipo != "TCHD DOCUMENTACION" &&
            item.tipo != "SEGURO DE MERCANCÍA SUGERIDO" &&
            item.tipo != "FLETE" &&
            item.tipo != "FLETE MARÍTIMO" &&
            item.tipo != "FLETE AÉREO" &&
            totalIGVCostos > 0
          ) {
            if (
              item.tipo == "SERVICIO LOGÍSTICO" ||
              item.tipo == "GANANCIA - SERVICIO LOGÍSTICO"
            ) {
              valor = ((item.valor / 3) * 2 * 0.18).toFixed(2);
            } else {
              valor = (item.valor * 0.18).toFixed(2);
            }
          } else {
            valor = "n/a";
          }

          break;
        case "PANAMA":
          if (
            item.tipo == "PORT CHARGES" ||
            (item.tipo == "MANEJOS" && totalIGVCostos > 0)
          ) {
            valor = (item.valor * 0.07).toFixed(2);
          } else {
            valor = "n/a";
          }

          break;
        case "VENEZUELA":
          valor = "n/a";
          break;

        default:
      }
      return valor;
    },
    igvMasTotal(item, pais, totalIGVCostos) {
      var valor;
      switch (pais) {
        case "PERU":
          if (
            item.tipo != "THCD" &&
            item.tipo != "TCHD DOCUMENTACION" &&
            item.tipo != "SEGURO DE MERCANCÍA SUGERIDO" &&
            item.tipo != "FLETE" &&
            item.tipo != "FLETE MARÍTIMO" &&
            item.tipo != "FLETE AÉREO" &&
            totalIGVCostos > 0
          ) {
            if (
              item.tipo == "SERVICIO LOGÍSTICO" ||
              item.tipo == "GANANCIA - SERVICIO LOGÍSTICO"
            ) {
              valor = ((item.valor / 3) * 2 * 0.18 + item.valor).toFixed(2);
            } else {
              valor = (item.valor * 1.18).toFixed(2);
            }
          } else {
            valor = item.valor;
          }

          break;
        case "PANAMA":
          if (
            item.tipo == "PORT CHARGES" ||
            (item.tipo == "MANEJOS" && totalIGVCostos > 0)
          ) {
            valor = (item.valor * 0.07 + item.valor).toFixed(2);
          } else {
            valor = item.valor;
          }

          break;
        case "VENEZUELA":
          valor = item.valor;
          break;

        default:
      }
      return valor;
    },
    totalGeneralCostos(item, pais) {
      var valor;
      switch (pais) {
        case "PERU":
          valor = item;
          break;
        case "PANAMA":
          valor = item;
          break;
        case "VENEZUELA":
          valor = "";
          break;

        default:
      }
      return valor;
    },
    totalGeneralMasIGVGanancias(item, item2, pais, totalIGVCostos) {
      var valor;
      switch (pais) {
        case "PERU":
          if (totalIGVCostos > 0) {
            valor = ((Number(item) / 3) * 2 * 0.18 + Number(item2)).toFixed(2);
          } else {
            valor = "n/a";
          }

          break;
        case "PANAMA":
          if (totalIGVCostos > 0) {
            valor = Number(item2).toFixed(2);
          } else {
            valor = "n/a";
          }

          break;
        case "VENEZUELA":
          valor = "n/a";
          break;

        default:
      }
      return valor;
    },
    totalGeneralMasIgvVEnta(
      servicioLogisticoTotal,
      totalIGVFleteCostos,
      pais,
      totalIGVCostos,
      totalVenta,
    ) {
      var valor;
      switch (pais) {
        case "PERU":
          if (totalIGVCostos > 0) {
            valor = (
              Number(totalIGVFleteCostos) +
              Number(
                (servicioLogisticoTotal / 3) * 2 * 0.18 +
                  servicioLogisticoTotal,
              )
            ).toFixed(2);
          } else {
            valor = "n/a";
          }

          break;
        case "PANAMA":
          if (totalIGVCostos > 0) {
            valor = (Number(totalVenta) + Number(totalIGVCostos)).toFixed(2);
          } else {
            valor = "n/a";
          }

          break;
        case "VENEZUELA":
          valor = "n/a";
          break;

        default:
      }
      return valor;
    },

    conver_conten(valor) {
      var contenedores = " ";
      var flete = valor[0].input_contenedores;
      for (var i = 0; i < flete.length; i++) {
        switch (flete[i][0]) {
          case 1:
            contenedores += flete[i][1] + "*20' STD, ";
            break;
          case 2:
            contenedores += flete[i][1] + "*40' STD, ";
            break;
          case 3:
            contenedores += flete[i][1] + "*40' HC, ";
            break;
          case 4:
            contenedores += flete[i][1] + "*40' NOR";
            break;

          default:
        }
      }
      return contenedores;
    },
  },
};
</script>
