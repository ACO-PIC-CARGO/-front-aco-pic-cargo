<template>
  <div>
    <h3>Datos del Embarque</h3>

    <!-- FILA 1: Motonave/Vuelo y Viaje -->
    <v-row dense>
      <v-col cols="12" md="6">
        <template v-if="isFCL() || isLCL()">
          <v-autocomplete
            :items="itemsMotonave"
            item-text="name"
            item-value="id"
            label="Motonave"
            v-model="$store.state.master_id_motonave"
          />
        </template>
        <template v-else-if="isAereo()">
          <v-text-field
            v-model="$store.state.master_vuelo"
            label="Vuelo"
          />
        </template>
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="$store.state.master_viaje"
          label="Viaje"
        />
      </v-col>
    </v-row>

    <!-- FILA 2: FCL vs LCL/Aéreo -->
    <v-row dense>
      <template v-if="isFCL()">
        <!-- FCL: Tipo de Contenedor, Cantidad, Número de Contenedor, Sello -->
        <v-col cols="12" md="3">
          <v-autocomplete
            :items="itemsContainers"
            item-text="name"
            item-value="id"
            return-object
            label="Tipo de Contenedor"
            v-model="$store.state.master_id_containers"
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            type="number"
            v-model="$store.state.master_cantidad"
            label="Cantidad"
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            v-model="$store.state.master_nro_containers"
            label="Número de Contenedor"
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            v-model="$store.state.master_nro_precinto"
            label="Sello"
          />
        </v-col>
      </template>
      <template v-else>
        <!-- LCL/Aéreo: Peso, Volumen, Peso Cargable -->
        <v-col cols="12" md="4">
          <v-text-field
            type="number"
            suffix="kg"
            label="Peso"
            v-model="$store.state.master_peso"
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field
            type="number"
            suffix="m3"
            label="Volumen"
            v-model="$store.state.master_volumen"
          />
        </v-col>
        <v-col cols="12" md="4" v-if="isAereo()">
          <v-text-field
            :value="pesoVolumetrico"
            label="Peso Volumétrico"
            suffix="kg"
            readonly
          />
        </v-col>
        <v-col cols="12" md="4" v-if="isAereo()">
          <v-text-field
            :value="pesoCargable"
            label="Peso Cargable"
            suffix="kg"
            readonly
          />
        </v-col>
      </template>
    </v-row>

    <!-- FILA 3: Tipo de flete y Monto -->
    <v-row dense>
      <v-col cols="12" md="6">
        <v-autocomplete
          :items="itemsFleteCon"
          item-text="name"
          item-value="id"
          label="Condición"
          v-model="$store.state.master_id_condicion"
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="$store.state.master_monto"
          type="number"
          label="Monto"
        />
      </v-col>
    </v-row>

      <!--  <v-col cols="4">
        <v-autocomplete
          :items="itemsContainers"
          item-text="name"
          item-value="id"
          return-object
          label="Tipo de contenedor"
          v-model="$store.state.master_id_containers"
        ></v-autocomplete>
      </v-col>
     <v-col cols="12" md="3" lg="3" xl="3">
        <v-text-field label="Nro. Contenedor"></v-text-field>
      </v-col>
     <v-col cols="12" md="3" lg="3" xl="3">
        <v-text-field label="Nro. Precinto"></v-text-field>
      </v-col> -->
      <!-- <v-col cols="2">
        <v-text-field v-model="$store.state.master_cantidad" label="Cant.">
          <v-icon
            class="btn__add"
            @click.native="
              _setDataContainers(
                $store.state.master_id_containers.id,
                $store.state.master_id_containers.id,
                $store.state.master_id_containers.id,
                $store.state.master_id_containers.name,
                $store.state.master_cantidad
              )
            "
            slot="append"
            color="green"
          >
            mdi-plus
          </v-icon>
        </v-text-field>
      </v-col> -->

      <v-col cols="12" md="12" v-if="isFCL()">
        <v-btn
          small
          color="primary"
          elevation="0"
          rounded
          @click="$store.state.modalContainers = !$store.state.modalContainers"
          :disabled="isFormActionsDisabled"
          >AGREGAR CONTENEDOR</v-btn
        >

        <v-simple-table fixed-header height="180px">
          <template v-slot:default>
            <thead>
              <tr>
                <th class="text-left">Nombre</th>
                <th class="text-left">N°. Contenedor</th>
                <th class="text-left">N° Precinto</th>
                <th class="text-left">Cantidad</th>
                <th class="text-left">Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in $store.state.master_itemsContainers"
                :key="item.name"
              >
                <td>{{ item.name }}</td>
                <td>{{ item.nro_container }}</td>
                <td>{{ item.nro_precinto }}</td>
                <td>{{ item.cantidad }}</td>
                <td>
                  <v-btn
                    @click.native="_delContainers(index)"
                    small
                    icon
                    :disabled="isFormActionsDisabled"
                  >
                    <v-icon color="red">mdi-delete</v-icon>
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </template>
        </v-simple-table>
        <!-- <div
          v-if="$store.state.master_itemsContainers.length === 0"
          class="text-center"
        >
          <img width="10%" :src="$store.state.imgList" alt="" />
          <p>LISTA DE CONTENTEDORES</p>
        </div> -->
      </v-col>
 
    </v-row>
  </div>
</template>

<script>
import { mapState, mapActions } from "vuex";
//import axios from '@/api/axios-config';
export default {
  name: "dataEmbar",
  props: {
    isFormActionsDisabled: Boolean,
  },
  data() {
    return {
      headers: [
        { text: "Fecha", value: "fecha" },
        { text: "Ejecutivo", value: "namelong" },
        { text: "Estado/ Comentario", value: "comentario" },
        {},
      ],
      itemsAgente: [],
    };
  },
  async mounted() {
    Promise.all([
      await this._getProveedor(),
      await this._getMotonave(),
      await this._getContainers(),
      await this._getFleteCon(),
      await this._getCoinsList(),
      await this.cargarClientes(),
      await this._getProveedorRolAgente(),
      await this._getProveedorRolAerolinea(),
      await this._getProveedorRolColoader(),
      await this._getProveedorRolNaviera(),
    ]);

    //this._validaData();
  },
  computed: {
    ...mapState([
      "itemsCoinsList",
      "itemsAgents",
      "itemsConsigners",
      "itemsNotify",
      "itemsMotonave",
      "itemsContainers",
      "itemsFleteCon",
      "datanroMaster",
      "itemsShipment",
      "itemsProveedorList",
    ]),
    mostrarCboAerolinea() {
      return !(this.isFCL() || this.isLCL());
    },
    obtenerLabelConsignerMasterMBL() {
      return this.isAereo() ? "Consigner Master AWE" : "Consigner Master MBL";
    },
    obtenerLabelNotifyMasterMBL() {
      return this.isAereo() ? "Notify Master AWE" : "Notify Master MBL";
    },
    obtenerLabelBLMaster() {
      return this.isAereo() ? "BL Máster Nro." : "BL Máster";
    },
    obtenerInputTypeBLMaster() {
      return this.isAereo() ? "number" : "text";
    },
    obtenerContainerName() {
      return (containerID) =>
        this.itemsContainers.filter((v) => v.id == containerID).length
          ? this.itemsContainers.find((v) => v.id == containerID).name
          : "";
    },
    obtenerItemsProveedoresCboAgente() {
      return this.itemsProveedorList.filter(
        (item) => item.rol.toUpperCase() !== "SHIPPER"
      ); // PROVEEDORES QUE NO SEAN DE TIPO SHIPPER
    },
    obtenerItemsProveedores() {
      return (tipoProveedor) =>
        this.itemsProveedorList.filter(
          (item) => item.rol.toUpperCase() === tipoProveedor.toUpperCase()
        );
    },
    pesoCargable() {
      if (this.isFCL()) return "";
      const kg = parseFloat(this.$store.state.master_peso || 0);
      const m3 = parseFloat(this.$store.state.master_volumen || 0);
      const chargeable = Math.max(kg, m3 * 166.66);
      return isNaN(chargeable) ? 0 : parseFloat(chargeable.toFixed(2));
    },
    pesoVolumetrico() {
      if (this.isFCL()) return "";
      if (!this.isAereo()) return "";
      const m3 = parseFloat(this.$store.state.master_volumen || 0);
      const pv = m3 > 0 ? m3 * 166.66 : 0;
      return isNaN(pv) ? 0 : parseFloat(pv.toFixed(2));
    },
  },
  methods: {
    ...mapActions([
      "_getnroMaster",
      "_getAgents",
      "_getConsigners",
      "_getNotify",
      "_getMotonave",
      "_getContainers",
      "_getFleteCon",
      "_getCoinsList",
      "_getProveedor",
      "cargarClientes",
      "_getProveedorRolAgente",
      "_getProveedorRolAerolinea",
      "_getProveedorRolColoader",
      "_getProveedorRolNaviera",
    ]),

    isAereo() {
      let val = false;
      let id = this.$store.state.master_id_trasnport.id
        ? this.$store.state.master_id_trasnport.id
        : this.$store.state.master_id_trasnport;

      let code =
        this.itemsShipment.filter((v) => v.id == id).length > 0
          ? this.itemsShipment.filter((v) => v.id == id)[0].code
          : "";

      if (code == "Aéreo") {
        val = true;
      }
      return val;
    },
    isLCL() {
      let val = false;
      let id = this.$store.state.master_id_trasnport.id
        ? this.$store.state.master_id_trasnport.id
        : this.$store.state.master_id_trasnport;

      let code =
        this.itemsShipment.filter((v) => v.id == id).length > 0
          ? this.itemsShipment.filter((v) => v.id == id)[0].code
          : "";

      if (code == "LCL") {
        val = true;
      }
      return val;
    },
    isFCL() {
      let val = false;
      let id = this.$store.state.master_id_trasnport.id
        ? this.$store.state.master_id_trasnport.id
        : this.$store.state.master_id_trasnport;

      let code =
        this.itemsShipment.filter((v) => v.id == id).length > 0
          ? this.itemsShipment.filter((v) => v.id == id)[0].code
          : "";

      if (code == "FCL") {
        val = true;
      }
      return val;
    },
    _callModalEntitie(id_role) {
      this.$store.state.id_role_actual = id_role;
      if (id_role == 1) {
        this.$store.state.modalAgente = !this.$store.state.modalAgente;
      } else if (id_role == 11) {
        this.$store.state.modalEntitie = !this.$store.state.modalEntitie;
      } else if (id_role == 17) {
        this.$store.state.modalColoader = !this.$store.state.modalColoader;
      } else if (id_role == 2) {
        this.$store.state.modalNaviera = !this.$store.state.modalNaviera;
      }
    },

    _setDataContainers(id, name, nrocontainer, nroprecinto, cantidad) {
      this.$store.state.master_itemsContainers.push({
        id: id,
        name: name,
        nro_container: nrocontainer,
        nro_precinto: nroprecinto,
        cantidad: cantidad,
      });
    },

    _delContainers(index) {
      this.$store.state.master_itemsContainers.splice(index, 1);
    },
  },
};
</script>

<style lang="scss" scoped>
.btn__add {
  cursor: pointer;
}

.div__container {
  overflow-y: scroll;
  height: 180px;
}
</style>
