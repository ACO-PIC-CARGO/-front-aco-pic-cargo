<template>
  <v-container fluid>
    <v-card elevation="0">
      <v-card-title primary-title>
        <center>Datos de la Carga</center>
      </v-card-title>
      <v-card-text>
        <v-form ref="frmPuerto">
          <v-row>
            <v-col cols="6">
              <v-autocomplete
                label="Puerto Origen"
                variant="outlined"
                density="compact"
                class="my-1"
                :items="getPuertoOrigen()"
                item-title="name"
                item-value="id_port"
                v-model="aduanaStore.datosPrincipales.idorigen"
                readonly
              ></v-autocomplete>
            </v-col>
            <v-col cols="6">
              <v-autocomplete
                label="Puerto Destino"
                variant="outlined"
                density="compact"
                class="my-1"
                :items="getPuertoDestino()"
                item-title="name"
                item-value="id_port"
                v-model="aduanaStore.datosPrincipales.iddestino"
                readonly
              >
              </v-autocomplete>
            </v-col>
            <v-col cols="6" class="py-1" v-if="mostrarComboPercepcionAduana()">
              <v-autocomplete
                label="Primera o Segunda Importación"
                readonly
                variant="outlined"
                density="compact"
                :rules="[(v) => !!v || 'Dato requerido']"
                class="my-1"
                :items="masterusuariosStore.lstPercepcionAduana"
                item-title="descripcion"
                item-value="id"
                v-model="
                  aduanaStore.datosPrincipales.id_percepcionaduana
                "
              >
              </v-autocomplete>
            </v-col>
          </v-row>
        </v-form>

        <v-row v-if="isAereo()">
          <v-col cols="12">
            <v-table density="compact" class="elevation-1 my-2">
              <thead class="bg-teal-lighten-2 text-white">
                <tr>
                  <th>Cant. Bultos</th>
                  <th>Peso (kg)</th>
                  <th>Volumen (m³)</th>
                  <th>Peso volumétrico (kg)</th>
                  <th>Peso cargable (kg)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    {{ aduanaStore.datosPrincipales.numerobultos }}
                  </td>
                  <td>{{ aduanaStore.datosPrincipales.peso }}</td>
                  <td>{{ aduanaStore.datosPrincipales.volumen }}</td>
                  <td>
                    {{ pesoVolumetrico !== null ? pesoVolumetrico + ' kg' : '' }}
                  </td>
                  <td>
                    {{ pesoCargable !== null ? pesoCargable + ' kg' : '' }}
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-col>
        </v-row>
        <v-row v-else>
          <v-col cols="12" align="right">
            <!-- <v-btn color="success" @click="dialogConteiner = !dialogConteiner">
              Agregar Contenedor
            </v-btn> -->
          </v-col>
          <v-col cols="12">
            <v-data-table
              :headers="headers"
              :items="aduanaStore.datosPrincipales.containers"
              class="elevation-1"
            >
              <template v-slot:[`item.action`]="item">
                <v-btn variant="text"
                  icon
                  color="red"
                  @click="eliminarContainer({ index: item.index })"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
              <template v-slot:[`item.number`]="item">
                {{ item.index + 1 }}
              </template>
            </v-data-table>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    <!-- AGREGAR CONTAINER -->
    <v-dialog
      v-model="dialogConteiner"
      scrollable
      persistent
      max-width="30%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title primary-title> Añadir Contenedor </v-card-title>
        <v-card-text>
          <!-- {{ $store.state.itemsContainers }} -->
          <v-form ref="frmContainer">
            <v-select
              :items="$store.state.itemsContainers"
              v-model="containers.container"
              label="Container"
              item-title="name"
              item-value="id"
              :rules="[(v) => !!v || 'Dato Requerido']"
              :error-messages="err"
              return-object
            ></v-select>
            <v-text-field
              name="Cantidad"
              label="Cantidad"
              v-model="containers.cantidad"
              type="number"
              :rules="[(v) => !!v || 'Dato Requerido']"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="success" @click="guardarContainer()">Aceptar</v-btn>
          <v-btn color="red" @click="dialogConteiner = !dialogConteiner">
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { mapActions } from "vuex";
import Swal from "sweetalert2";
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { usePricingStore } from "@/stores/pricing";
import { useAduanaStore } from "@/stores/aduana";
export default {
  name: "DatosCargaComponent",
  data() {
    return {
      headers: [
        { title: "", key: "action" },
        { title: "#", key: "number" },
        { title: "Tipo Contendor", key: "description" },
        { title: "Cantidad", key: "cantidad" },
      ],
      dialogConteiner: false,
      numerobultos: "",
      volumen: "",
      peso: "",
      err: "",
      containers: {
        container: "",
        cantidad: "",
      },
    };
  },
  async mounted() {
    await this._getContainers();
  },
  methods: {
    ...mapActions(["_getContainers"]),
    ...mapPiniaActions(usePricingStore, ["getItemsServices", "getMultiplicador"]),
    añadirCarga() {
      this.err = "";
      if (this.numerobultos > 0 && this.volumen > 0 && this.peso > 0) {
        this.aduanaStore.datosPrincipales.numerobultos =
          this.numerobultos;
        this.aduanaStore.datosPrincipales.volumen = this.volumen;
        this.aduanaStore.datosPrincipales.peso = this.peso;
      } else {
        this.err = "Datos requerido y mayor que cero";
      }
    },
    async guardarContainer() {
      this.err = "";
      if ((await this.$refs.frmContainer.validate()).valid) {
        if (
          this.aduanaStore.datosPrincipales.containers.filter(
            (v) => v.id == this.containers.container.id
          ).length == 0
        ) {
          this.aduanaStore.datosPrincipales.containers.push({
            id: this.containers.container.id,
            description: this.containers.container.name,
            cantidad: this.containers.cantidad,
          });
          this.dialogConteiner = false;
          this.containers = {
            container: "",
            cantidad: "",
          };
        } else {
          this.err = "Contenedor ya se encuentra en la lista";
        }
      }
    },
    eliminarContainer({ index = null }) {
      this.aduanaStore.datosPrincipales.containers.splice(index, 1);
    },
    async aceptar() {
      let validate = true;
      if ((await this.$refs.frmPuerto.validate()).valid) {
        if (
          this.aduanaStore.datosPrincipales.idtipocarga.code == "FCL"
        ) {
          if (
            this.aduanaStore.datosPrincipales.containers.length == 0
          ) {
            Swal.fire({
              icon: "error",
              title: "Aviso",
              text: "Se necesita al menos un contenedor",
            });
            validate = false;
          }
        }
        if (
          this.aduanaStore.datosPrincipales.idtipocarga.code != "FCL"
        ) {
          if (!this.numerobultos && !this.volumen && !this.peso) {
            Swal.fire({
              icon: "error",
              title: "Aviso",
              text: "Se necesita los datos de la carga",
            });
            validate = false;
          }
        }
        if (!!validate) {
          this.$store.state.spiner = true;
          await this.getItemsServices();
          await this.getMultiplicador();
          this.$store.state.spiner = false;
          this.aduanaStore.step3 = true;
        }
        //
      }
      // this.$store.commit("SET_STEP_3", true);
    },
    getPuertoOrigen() {
      let puertos = [];
      if (this.aduanaStore.datosPrincipales.iddestino) {
        var id_port = this.aduanaStore.listPortEnd.filter(
          (v) =>
            v.id_port == this.aduanaStore.datosPrincipales.iddestino
        )[0];

        puertos = this.aduanaStore.listPortBegin.filter(
          (v) => v.id_port != id_port
        );
      } else {
        puertos = this.aduanaStore.listPortBegin;
      }
      return puertos;
    },
    getPuertoDestino() {
      let puertos = [];
      if (this.aduanaStore.datosPrincipales.idorigen) {
        var id_port = this.aduanaStore.listPortBegin.filter(
          (v) =>
            v.id_port == this.aduanaStore.datosPrincipales.idorigen
        )[0].id_port;
        puertos = this.aduanaStore.listPortEnd.filter(
          (v) => v.id_port != id_port
        );
      } else {
        puertos = this.aduanaStore.listPortEnd;
      }
      return puertos;
    },
    isFCL() {
      let id = this.aduanaStore.datosPrincipales.idtipocarga;
      let code = this.aduanaStore.listShipment.filter(
        (v) => v.id == id
      )[0].code;

      let validate = code == "FCL" ? true : false;
      return validate;
    },
    isAereo() {
      let id = this.aduanaStore.datosPrincipales.idtipocarga;
      let code = this.aduanaStore.listShipment.filter(
        (v) => v.id == id
      )[0].code;
      return code == "Aéreo";
    },
    mostrarComboPercepcionAduana() {
      let esPeru = JSON.parse(sessionStorage.getItem("iso_pais")) == 9589;
      return (
        esPeru &&
        this.aduanaStore.listModality.some(
          (v) =>
            v.id == this.aduanaStore.datosPrincipales.idsentido &&
            v.code == "I"
        )
      );
    },
  },
  computed: {
    ...mapStores(useAduanaStore, useMasterusuariosStore),
    pesoVolumetrico() {
      const datos = this.aduanaStore.datosPrincipales || {};
      const volumen = parseFloat(datos.volumen || 0); // m³
      if (!volumen) return null;

      // Determinar tipo de embarque para elegir el factor volumétrico
      let factorVolumetrico = 166.66; // Aéreo
      try {
        const idTipo = this.aduanaStore.datosPrincipales.idtipocarga;
        const shipment = this.aduanaStore.listShipment.find(
          (v) => v.id == (idTipo && typeof idTipo === 'object' ? idTipo.id : idTipo)
        );
        const code = shipment ? shipment.code : "";
        if (code === "LCL") {
          factorVolumetrico = 1000;
        }
      } catch (e) {}

      const pv = volumen > 0 ? volumen * factorVolumetrico : 0;
      if (!pv || !isFinite(pv)) return null;
      return parseFloat(pv.toFixed(2));
    },
    pesoCargable() {
      const datos = this.aduanaStore.datosPrincipales || {};
      const pesoReal = parseFloat(datos.peso || 0); // kg
      const volumen = parseFloat(datos.volumen || 0); // m³

      // Si no hay datos suficientes, no mostramos nada
      if (!pesoReal && !volumen) return null;

      // Determinar tipo de embarque para elegir el factor volumétrico
      let factorVolumetrico = 166.66; // Aéreo (LxAxH cm / 6000)
      try {
        const idTipo = this.aduanaStore.datosPrincipales.idtipocarga;
        const shipment = this.aduanaStore.listShipment.find(
          (v) => v.id == idTipo
        );
        const code = shipment ? shipment.code : "";

        // Marítimo LCL / Consolidado: divisor 1000 en cm → factor 1000 kg/m³
        if (code === "LCL") {
          factorVolumetrico = 1000;
        }
      } catch (e) {
        // si algo falla, usamos el factor por defecto
      }

      const pesoVolumetrico = volumen > 0 ? volumen * factorVolumetrico : 0;

      const chargeable = Math.max(pesoReal || 0, pesoVolumetrico || 0);
      if (!chargeable || !isFinite(chargeable)) return null;
      return parseFloat(chargeable.toFixed(2));
    },
  },
};
</script>

<style>
.center {
  align-content: center !important;
  align-items: center !important;
  text-align: center !important;
}
</style>
