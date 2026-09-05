<template>
  <v-card elevation="0">
    <!-- Diálogo para Nuevo Servicio -->
    <v-dialog v-model="dialog" max-width="30%">
      <v-card>
        <v-card-title primary-title> Nuevo Servicio </v-card-title>
        <v-card-text>
          <v-select
            :items="begEndList"
            v-model="servicio.id_begend"
            item-text="name"
            item-value="id"
            label="Categoria..."
          ></v-select>
          <v-text-field
            label="Descripción"
            v-model="servicio.service"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="success" @click="guardarServicio">Guardar</v-btn>
          <v-btn color="red" @click="dialog = false" dark>Cancelar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Título y Subcabecera -->
    <v-card-title primary-title>
      SERVICIOS A REALIZAR:
      <v-btn icon color="primary" @click="dialog = true">
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </v-card-title>
    <v-subheader class="mt-0">
      <h4>Desmarque los servicios que NO desea utilizar.</h4>
    </v-subheader>

    <!-- Lista de Servicios por Categoría -->
    <v-card-text>
      <v-row>
        <v-col
          cols="12"
          lg="3"
          xl="3"
          v-for="cat in categoriasConfig"
          :key="cat.code"
        >
          <h4 class="mb-2">{{ cat.title }}</h4>
          <div v-for="service in getServicesByCode(cat.code)" :key="service.id">
            <v-checkbox
              dense
              v-model="service.status"
              @change="showConfirmationDialog(service)"
              readonly
            >
              <template v-slot:label>
                {{ service.service }}
              </template>
            </v-checkbox>
            <template
              v-if="
                service.code_service == 14 &&
                service.status == 1 &&
                isEmpresaPermitida
              "
            >
              <v-autocomplete
                :items="$store.state.town.lstTown"
                item-text="nombrecompleto"
                item-value="id"
                dense
                outlined
                label="Distrito"
                class="pr-10"
                v-model="$store.state.pricing.datosPrincipales.id_town"
                readonly
              />
            </template>
          </div>

          <!-- Campos adicionales solo para la sección OPCIONAL -->
          <template v-if="cat.code === 'OP'">
            <v-text-field
              prefix="$"
              :color="requiereValorMercancia ? 'red' : ''"
              :error-messages="errorValorMercancia"
              v-model="amountModel"
              label="Valor de la mercancia"
              type="number"
              step="0.10"
              min="0"
              placeholder="Valor de la mercancia..."
              autocomplete="off"
              dense
              :required="requiereValorMercancia"
              :rules="[
                (v) =>
                  !requiereValorMercancia ||
                  (!!v && Number(v) > 0) ||
                  'Dato Requerido',
                (v) =>
                  !v ||
                  /^(?!0\d+|\d*e)\d*(?:\.\d+)?$/.test(v) ||
                  'Debe ser un número real entero positivo',
              ]"
              @input="recargarCostos"
              @blur="recargarCostos"
            ></v-text-field>

            <v-text-field
              v-model="descripcionCargaModel"
              label="Descripción de carga"
              placeholder="Descripción de carga"
              autocomplete="off"
              dense
            ></v-text-field>
          </template>
        </v-col>
      </v-row>
    </v-card-text>

    <v-divider></v-divider>

    <v-card-actions class="sticky-actions pa-3" v-if="mostrarBtn">
      <v-spacer></v-spacer>
      <v-btn color="primary" large @click="continuarLlenadoCostos">
        <v-icon left>mdi-arrow-right-bold</v-icon>
        Continuar
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import { mapState, mapActions, mapGetters } from "vuex";

export default {
  props: {
    mostrarBtn: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      dialog: false,
      mostrarContinuarFlag: true,
      servicio: {
        codebegend: "OP",
        id_begend: "0",
        service: "",
        status: true,
      },
      categoriasConfig: [
        { code: "OR", title: "ORIGEN" },
        { code: "FL", title: "FLETE" },
        { code: "DE", title: "DESTINO" },
        { code: "OP", title: "OPCIONAL" },
      ],
    };
  },
  async mounted() {
    let port = this.$store.state.pricing.listPortEnd.find(
      (v) => v.id_port == this.$store.state.pricing.datosPrincipales.iddestino,
    );
    if (port) {
      await this.cargarTownParaPricing({ id_pais: port.id_pais });
    }
  },
  computed: {
    ...mapState({
      begEndList: (state) => state.pricing.begEndList,
      listServices: (state) => state.pricing.listServices,
      opcionCostos: (state) => state.pricing.opcionCostos,
      errorValorMercancia: (state) => state.pricing.errorValorMercancia,
    }),
    ...mapGetters(["isEmpresaPermitida"]),
    iddestino() {
      return this.$store.state.pricing.datosPrincipales.iddestino;
    },
    // Two-way bindings para propiedades de Vuex usando getters/setters computados
    amountModel: {
      get() {
        return this.$store.state.pricing.datosPrincipales.amount;
      },
      set(value) {
        this.$store.state.pricing.datosPrincipales.amount = value;
      },
    },
    descripcionCargaModel: {
      get() {
        return this.$store.state.pricing.datosPrincipales.descripcioncarga;
      },
      set(value) {
        this.$store.state.pricing.datosPrincipales.descripcioncarga = value;
      },
    },

    requiereValorMercancia() {
      const keywords = ["seguro", "impuesto", "impuestos", "aduana en destino"];
      return this.listServices.some((s) => {
        if (!s || !(s.status === true || s.status === 1)) return false;
        const name = this.normalizeText(s.service);
        return keywords.some((k) => name.includes(k));
      });
    },
  },
  methods: {
    ...mapActions([
      "getItemsServices",
      "getImpuestos",
      "getItemsServicesDetails",
      "getBegEndList",
      "cargarTownParaPricing",
    ]),

    normalizeText(str) {
      return String(str || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    },

    getServicesByCode(code) {
      if (code !== "OP") {
        return this.listServices.filter((v) => v.codebegend === code);
      }

      // Lógica de "serviciosOpcionalesUnicos" optimizada dentro de una función pura
      const vistos = new Set();
      return this.listServices
        .filter((v) => v.codebegend === "OP")
        .filter((s) => {
          const name = (s.service || "").trim().toLowerCase();
          if (!name) return true;
          if (vistos.has(name)) return false;
          vistos.add(name);
          return true;
        });
    },

    guardarServicio() {
      const selectedCategory = this.begEndList.find(
        (v) => v.id === this.servicio.id_begend,
      );

      if (selectedCategory) {
        this.servicio.codebegend = selectedCategory.code;
      }

      this.listServices.push({ ...this.servicio });
      this.dialog = false;
      this.resetFormularioServicio();
    },

    resetFormularioServicio() {
      this.servicio = {
        codebegend: "OP",
        id_begend: "0",
        service: "",
        status: true,
      };
    },

    recargarCostos() {
      this.$store.state.pricing.errorValorMercancia = "";
      this.$store.state.pricing.actualizarCostosFlag =
        !this.$store.state.pricing.actualizarCostosFlag;
    },

    continuarLlenadoCostos() {
      if (this.requiereValorMercancia) {
        const amount = this.$store.state.pricing.datosPrincipales.amount;
        if (!amount || amount <= 0) {
          this.$store.state.pricing.errorValorMercancia =
            "Datos Requeridos y mayor que 0";
          return false;
        }
      } else {
        this.$store.state.pricing.errorValorMercancia = "";
      }
      this.$emit("activarLlenadoCostos");
      this.mostrarContinuarFlag = false;
    },

    showConfirmationDialog(service) {
      const mensajeTransporte =
        "Tarifa no incluye transporte en destino se puede hacer pero necesitamos dirección de entrega";
      const esServicioTransporte =
        service.service.trim() === "TRANSPORTE EN DESTINO";

      if (esServicioTransporte) {
        const opciones = this.opcionCostos || [];

        opciones.forEach((opcion) => {
          if (!Array.isArray(opcion.listNotasQuote)) {
            opcion.listNotasQuote = [];
          }

          const existeNota = opcion.listNotasQuote.some(
            (n) =>
              n.descripcion === mensajeTransporte &&
              !n.statusincluye &&
              !n.statusnoincluye,
          );

          if (service.status && !existeNota) {
            opcion.listNotasQuote.push({
              descripcion: mensajeTransporte,
              estado: 1,
              statusincluye: 0,
              statusnoincluye: 0,
            });
          } else if (!service.status) {
            opcion.listNotasQuote = opcion.listNotasQuote.filter(
              (n) =>
                !(
                  n.descripcion === mensajeTransporte &&
                  !n.statusincluye &&
                  !n.statusnoincluye
                ),
            );
          }
        });
      }

      this.$emit("recargarCostos");
      if (!this.requiereValorMercancia) {
        this.$store.state.pricing.errorValorMercancia = "";
      }
    },
    async buscarYCARGAR(idDestino) {
      if (!idDestino) return;

      const listaPuertos = this.$store.state.pricing.listPortEnd || [];

      // Usamos Number() o String() para evitar problemas de tipos
      let port = listaPuertos.find(
        (v) => String(v.id_port) === String(idDestino),
      );

      if (port) {
        await this.cargarTownParaPricing({ id_pais: port.id_pais });
      }
    },
  },
  watch: {
    iddestino: {
      handler(nuevoValor) {
        this.buscarYCARGAR(nuevoValor);
      },
      immediate: true,
    },

    "$store.state.pricing.listPortEnd": {
      handler() {
        this.buscarYCARGAR(this.iddestino);
      },
      deep: true,
    },
  },
};
</script>

<style scoped>
.sticky-actions {
  position: sticky;
  bottom: 0;
  background: white;
  border-top: 1px solid #eee;
  z-index: 2;
}
</style>
