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
                variant="outlined"
                density="compact"
                class="my-1"
                :items="$store.state.itemsProveedorList"
                item-title="namelong"
                item-value="id"
                readonly
                v-model="pricingStore.datosPrincipales.id_proveedor"
                v-if="mostrarproveedor"
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" lg="6" xl="6">
              <v-autocomplete
                label="Puerto Origen"
                variant="outlined"
                density="compact"
                class="my-1"
                :items="pricingStore.listPortBegin"
                item-title="name"
                item-value="id_port"
                v-model="pricingStore.datosPrincipales.idorigen"
                readonly
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" lg="6" xl="6">
              <v-autocomplete
                label="Puerto Destino"
                variant="outlined"
                density="compact"
                class="my-1"
                :items="pricingStore.listPortEnd"
                item-title="name"
                item-value="id_port"
                v-model="pricingStore.datosPrincipales.iddestino"
                readonly
              >
              </v-autocomplete>
            </v-col>

            <v-col cols="12" lg="6" xl="6" class="py-1 rows">
              <v-row>
                <v-col cols="12" md="6">
                  <v-checkbox
                    label="Individual"
                    v-model="
                      pricingStore.datosPrincipales.esindividualflag
                    "
                    :value="true"
                    density="compact"
                    disabled
                  ></v-checkbox>
                </v-col>
                <v-col cols="12" md="6">
                  <v-checkbox
                    label="Grupal"
                    v-model="pricingStore.datosPrincipales.esgrupalflag"
                    :value="true"
                    density="compact"
                    disabled
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
                variant="outlined"
                density="compact"
                :rules="[(v) => !!v || 'Dato requerido']"
                class="my-1"
                :items="masterusuariosStore.lstPercepcionAduana"
                item-title="descripcion"
                item-value="id"
                v-model="
                  pricingStore.datosPrincipales.id_percepcionaduana
                "
              />
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
                  <th v-if="!ocultarLCL">Peso volumétrico (kg)</th>
                  <th v-if="!ocultarLCL">Peso cargable (kg)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    {{ pricingStore.datosPrincipales.numerobultos }}
                  </td>
                  <td>{{ pricingStore.datosPrincipales.peso }}</td>
                  <td>{{ pricingStore.datosPrincipales.volumen }}</td>
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
              :items="pricingStore.datosPrincipales.containers"
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
export default {
  props: {
    mostrarproveedor: {
      type: Boolean,
      default: true,
    },
  },
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
    esFobFlag() {
      let valBranch = [1, 2, "1", "2"];
      let branch = JSON.parse(sessionStorage.getItem("dataBranch"))[0];

      if (!valBranch.includes(branch.id)) return false;

      return this.pricingStore.listIncoterms.some(
        (v) =>
          v.id == this.pricingStore.datosPrincipales.idincoterms &&
          v.name == "FOB",
      );
    },
    añadirCarga() {
      this.err = "";
      if (this.numerobultos > 0 && this.volumen > 0 && this.peso > 0) {
        this.pricingStore.datosPrincipales.numerobultos =
          this.numerobultos;
        this.pricingStore.datosPrincipales.volumen = this.volumen;
        this.pricingStore.datosPrincipales.peso = this.peso;
      } else {
        this.err = "Datos requerido y mayor que cero";
      }
    },
    async guardarContainer() {
      this.err = "";
      if ((await this.$refs.frmContainer.validate()).valid) {
        if (
          this.pricingStore.datosPrincipales.containers.filter(
            (v) => v.id == this.containers.container.id,
          ).length == 0
        ) {
          this.pricingStore.datosPrincipales.containers.push({
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
      this.pricingStore.datosPrincipales.containers.splice(index, 1);
    },
    async aceptar() {
      let validate = true;
      if ((await this.$refs.frmPuerto.validate()).valid) {
        if (this.isFCL()) {
          if (
            this.pricingStore.datosPrincipales.containers.length == 0
          ) {
            Swal.fire({
              icon: "error",
              title: "Aviso",
              text: "Se necesita al menos un contenedor",
            });
            validate = false;
          }
        }
        if (!this.isFCL()) {
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
          this.pricingStore.step3 = true;
        }
        //
      }
      // this.$store.commit("SET_STEP_3", true);
    },
    getPuertoOrigen() {
      let puertos = [];
      if (this.pricingStore.datosPrincipales.iddestino) {
        var id_port = this.pricingStore.listPortEnd.filter(
          (v) =>
            v.id_port == this.pricingStore.datosPrincipales.iddestino,
        )[0];

        puertos = this.pricingStore.listPortBegin.filter(
          (v) => v.id_port != id_port,
        );
      } else {
        puertos = this.pricingStore.listPortBegin;
      }
      return puertos;
    },
    getPuertoDestino() {
      let puertos = [];
      if (this.pricingStore.datosPrincipales.idorigen) {
        var id_port = this.pricingStore.listPortBegin.filter(
          (v) =>
            v.id_port == this.pricingStore.datosPrincipales.idorigen,
        )[0].id_port;
        puertos = this.pricingStore.listPortEnd.filter(
          (v) => v.id_port != id_port,
        );
      } else {
        puertos = this.pricingStore.listPortEnd;
      }
      return puertos;
    },
    isFCL() {
      const tipoCarga = this.pricingStore.datosPrincipales.idtipocarga;
      const id = tipoCarga && typeof tipoCarga === "object"
        ? tipoCarga.id
        : tipoCarga;
      const shipment = (this.pricingStore.listShipment || []).find(
        (item) => item && item.id == id,
      );
      return shipment?.code === "FCL";
    },
    isAereo() {
      let inVal = ["Aéreo", "LCL"];
      const tipo = this.pricingStore.datosPrincipales.idtipocarga;
      const id = tipo && typeof tipo === "object" ? tipo.id : tipo;
      if (!id) return false;
      const items = this.pricingStore.listShipment || [];
      const it = items.find((v) => v.id == id);
      return it && inVal.includes(it.code);
    },
    ocultarLCL() {
      let inVal = ["LCL"];
      const tipo = this.pricingStore.datosPrincipales.idtipocarga;
      const id = tipo && typeof tipo === "object" ? tipo.id : tipo;
      if (!id) return false;
      const items = this.pricingStore.listShipment || [];
      const it = items.find((v) => v.id == id);
      return it && inVal.includes(it.code);
    },
    mostrarComboPercepcionAduana() {
      let esPeru = JSON.parse(sessionStorage.getItem("iso_pais")) == 9589;
      return (
        esPeru &&
        this.pricingStore.listModality.some(
          (v) =>
            v.id == this.pricingStore.datosPrincipales.idsentido &&
            v.code == "I",
        )
      );
    },
  },
  computed: {
    ...mapStores(usePricingStore, useMasterusuariosStore),
    pesoVolumetrico() {
      // Solo aplica para embarques aéreos
      if (!this.isAereo()) return null;

      const datos = this.pricingStore.datosPrincipales || {};
      const volumen = parseFloat(datos.volumen || 0); // m³
      if (!volumen) return null;

      const pv = volumen > 0 ? volumen * 166.66 : 0;
      if (!pv || !isFinite(pv)) return null;
      return parseFloat(pv.toFixed(2));
    },
    pesoCargable() {
      // Solo aplica para embarques aéreos
      if (!this.isAereo()) return null;

      const datos = this.pricingStore.datosPrincipales || {};
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
