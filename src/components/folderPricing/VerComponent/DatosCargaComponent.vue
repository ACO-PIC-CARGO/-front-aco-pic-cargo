<template>
  <v-container fluid>
    <v-card elevation="0">
      <v-card-title primary-title>
        <center>Datos de la Carga</center>
      </v-card-title>
      <v-card-text>
        <v-form ref="frmPuerto">
          <v-row>
            <v-col cols="12">
              <v-autocomplete
                label="Proveedor"
                outlined
                dense
                class="my-1"
                :items="$store.state.itemsProveedorList"
                item-text="namelong"
                item-value="id"
                readonly
                v-model="$store.state.pricing.datosPrincipales.id_proveedor"
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" lg="6" xl="6">
              <v-autocomplete
                label="Puerto Origen"
                outlined
                dense
                class="my-1"
                :items="getPuertoOrigen()"
                item-text="name"
                item-value="id_port"
                v-model="$store.state.pricing.datosPrincipales.idorigen"
                readonly
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" lg="6" xl="6">
              <v-autocomplete
                label="Puerto Destino"
                outlined
                dense
                class="my-1"
                :items="getPuertoDestino()"
                item-text="name"
                item-value="id_port"
                v-model="$store.state.pricing.datosPrincipales.iddestino"
                readonly
              >
              </v-autocomplete>
            </v-col>

            <v-col cols="12" lg="6" xl="6" class="py-1" rows v-if="esFobFlag()">
              <v-row>
                <v-col cols="12" md="6">
                  <v-checkbox
                    label="Individual"
                    v-model="
                      $store.state.pricing.datosPrincipales.esindividualflag
                    "
                    :value="true"
                    dense
                  ></v-checkbox>
                </v-col>
                <v-col cols="12" md="6">
                  <v-checkbox
                    label="Grupal"
                    v-model="$store.state.pricing.datosPrincipales.esgrupalflag"
                    :value="true"
                    dense
                  ></v-checkbox>
                </v-col>
              </v-row>
            </v-col>

            <v-col
              cols="12"
              lg="6"
              xl="6"
              class="py-1"
              v-if="mostrarComboPercepcionAduana()"
            >
              <v-autocomplete
                label="Primera o Segunda Importación"
                readonly
                outlined
                dense
                :rules="[(v) => !!v || 'Dato requerido']"
                class="my-1"
                :items="$store.state.masterusuarios.lstPercepcionAduana"
                item-text="descripcion"
                item-value="id"
                v-model="
                  $store.state.pricing.datosPrincipales.id_percepcionaduana
                "
              >
              </v-autocomplete>
            </v-col>
          </v-row>
        </v-form>

        <v-row v-if="isAereo()">
          <v-col cols="12">
            <v-simple-table dense class="elevation-1 my-2">
              <thead class="teal lighten-2 white--text">
                <tr>
                  <th>Cant. Bultos</th>
                  <th>Peso (kg)</th>
                  <th>Volumen (m³)</th>
                  <th v-if="!ocultarLCL">Peso volumétrico (kg)</th>
                  <th v-if="!ocultarLCL">Peso cargable (kg)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    {{ $store.state.pricing.datosPrincipales.numerobultos }}
                  </td>
                  <td>{{ $store.state.pricing.datosPrincipales.peso }}</td>
                  <td>{{ $store.state.pricing.datosPrincipales.volumen }}</td>
                  <td v-if="!ocultarLCL">
                    {{
                      pesoVolumetrico !== null ? pesoVolumetrico + " kg" : ""
                    }}
                  </td>
                  <td v-if="!ocultarLCL">
                    {{ pesoCargable !== null ? pesoCargable + " kg" : "" }}
                  </td>
                </tr>
              </tbody>
            </v-simple-table>
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
              :items="$store.state.pricing.datosPrincipales.containers"
              class="elevation-1"
            >
              <template v-slot:[`item.action`]="item">
                <v-btn
                  icon
                  color="red"
                  dark
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
              item-text="name"
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
          <v-btn color="red" dark @click="dialogConteiner = !dialogConteiner">
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
export default {
  name: "DatosCargaComponent",
  data() {
    return {
      headers: [
        { text: "", value: "action" },
        { text: "#", value: "number" },
        { text: "Tipo Contendor", value: "description" },
        { text: "Cantidad", value: "cantidad" },
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
    ...mapActions(["_getContainers", "getItemsServices", "getMultiplicador"]),
    esFobFlag() {
      let valBranch = [1, 2, "1", "2"];
      let branch = JSON.parse(sessionStorage.getItem("dataBranch"))[0];

      if (!valBranch.includes(branch.id)) return false;

      return this.$store.state.pricing.listIncoterms.some(
        (v) =>
          v.id == this.$store.state.pricing.datosPrincipales.idincoterms &&
          v.name == "FOB",
      );
    },
    añadirCarga() {
      this.err = "";
      if (this.numerobultos > 0 && this.volumen > 0 && this.peso > 0) {
        this.$store.state.pricing.datosPrincipales.numerobultos =
          this.numerobultos;
        this.$store.state.pricing.datosPrincipales.volumen = this.volumen;
        this.$store.state.pricing.datosPrincipales.peso = this.peso;
      } else {
        this.err = "Datos requerido y mayor que cero";
      }
    },
    guardarContainer() {
      this.err = "";
      if (this.$refs.frmContainer.validate()) {
        if (
          this.$store.state.pricing.datosPrincipales.containers.filter(
            (v) => v.id == this.containers.container.id,
          ).length == 0
        ) {
          this.$store.state.pricing.datosPrincipales.containers.push({
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
      this.$store.state.pricing.datosPrincipales.containers.splice(index, 1);
    },
    async aceptar() {
      let validate = true;
      if (this.$refs.frmPuerto.validate()) {
        if (
          this.$store.state.pricing.datosPrincipales.idtipocarga.code == "FCL"
        ) {
          if (
            this.$store.state.pricing.datosPrincipales.containers.length == 0
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
          this.$store.state.pricing.datosPrincipales.idtipocarga.code != "FCL"
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
          this.$store.state.pricing.step3 = true;
        }
        //
      }
      // this.$store.commit("SET_STEP_3", true);
    },
    getPuertoOrigen() {
      let puertos = [];
      if (this.$store.state.pricing.datosPrincipales.iddestino) {
        var id_port = this.$store.state.pricing.listPortEnd.filter(
          (v) =>
            v.id_port == this.$store.state.pricing.datosPrincipales.iddestino,
        )[0];

        puertos = this.$store.state.pricing.listPortBegin.filter(
          (v) => v.id_port != id_port,
        );
      } else {
        puertos = this.$store.state.pricing.listPortBegin;
      }
      return puertos;
    },
    getPuertoDestino() {
      let puertos = [];
      if (this.$store.state.pricing.datosPrincipales.idorigen) {
        var id_port = this.$store.state.pricing.listPortBegin.filter(
          (v) =>
            v.id_port == this.$store.state.pricing.datosPrincipales.idorigen,
        )[0].id_port;
        puertos = this.$store.state.pricing.listPortEnd.filter(
          (v) => v.id_port != id_port,
        );
      } else {
        puertos = this.$store.state.pricing.listPortEnd;
      }
      return puertos;
    },
    isFCL() {
      let id = this.$store.state.pricing.datosPrincipales.idtipocarga;
      let code = this.$store.state.pricing.listShipment.filter(
        (v) => v.id == id,
      )[0].code;

      let validate = code == "FCL" ? true : false;
      return validate;
    },
    isAereo() {
      let inVal = ["Aéreo", "LCL"];
      const tipo = this.$store.state.pricing.datosPrincipales.idtipocarga;
      const id = tipo && typeof tipo === "object" ? tipo.id : tipo;
      if (!id) return false;
      const items = this.$store.state.pricing.listShipment || [];
      const it = items.find((v) => v.id == id);
      return it && inVal.includes(it.code);
    },
    ocultarLCL() {
      let inVal = ["LCL"];
      const tipo = this.$store.state.pricing.datosPrincipales.idtipocarga;
      const id = tipo && typeof tipo === "object" ? tipo.id : tipo;
      if (!id) return false;
      const items = this.$store.state.pricing.listShipment || [];
      const it = items.find((v) => v.id == id);
      return it && inVal.includes(it.code);
    },
    mostrarComboPercepcionAduana() {
      let esPeru = JSON.parse(sessionStorage.getItem("iso_pais")) == 9589;
      return (
        esPeru &&
        this.$store.state.pricing.listModality.some(
          (v) =>
            v.id == this.$store.state.pricing.datosPrincipales.idsentido &&
            v.code == "I",
        )
      );
    },
  },
  computed: {
    pesoVolumetrico() {
      // Solo aplica para embarques aéreos
      if (!this.isAereo()) return null;

      const datos = this.$store.state.pricing.datosPrincipales || {};
      const volumen = parseFloat(datos.volumen || 0); // m³
      if (!volumen) return null;

      const pv = volumen > 0 ? volumen * 166.66 : 0;
      if (!pv || !isFinite(pv)) return null;
      return parseFloat(pv.toFixed(2));
    },
    pesoCargable() {
      // Solo aplica para embarques aéreos
      if (!this.isAereo()) return null;

      const datos = this.$store.state.pricing.datosPrincipales || {};
      const pesoReal = parseFloat(datos.peso || 0); // kg
      const volumen = parseFloat(datos.volumen || 0); // m³

      if (!pesoReal && !volumen) return null;

      const pesoVolumetrico = volumen > 0 ? volumen * 166.66 : 0;

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
