<template>
  <v-card class="px-5">
    <v-card elevation="0">
      <v-container v-if="loading" style="height: 400px">
        <v-row class="fill-height" align-content="center" justify="center">
          <v-col class="text-subtitle-1 text-center" cols="12">
            Cargando información ....
          </v-col>
          <v-col cols="6">
            <v-progress-linear
              color="deep-purple accent-4"
              indeterminate
              rounded
              height="6"
            ></v-progress-linear>
          </v-col>
        </v-row>
      </v-container>

      <v-card-title v-if="!loading" class="elevation-0">
        <v-text-field
          append-icon="mdi-magnify"
          label="Buscar"
          single-line
          hide-details
          v-model="search"
        >
        </v-text-field>

        <v-spacer></v-spacer>

        <!-- <v-btn
          small
          color="success"
          @click="$router.push({ name: 'newEnterprise' })"
        >
          Nuevo
        </v-btn> -->
        <v-btn small class="mx-1" color="#2962FF" dark @click="open_filter()">
          Filtrar
        </v-btn>
        <v-btn small class="mx-1" color="#004D40" dark> Exportar </v-btn>
      </v-card-title>

      <v-data-table
        v-if="!loading"
        class="elevation-1"
        :headers="headers"
        :items="$store.state.enterprises.list"
        item-key="id"
        :search="search"
        dense
      >
        <template v-slot:[`item.status`]="{ item }">
          {{ item.status == 1 ? "Activo" : "Inactivo" }}
        </template>
        <template v-slot:[`item.action`]="{ item }">
          <v-btn icon>
            <v-icon color="warning" @click="updateEnterpriseRoute(item.id)"
              >mdi-pencil</v-icon
            >
          </v-btn>
          <v-btn icon>
            <v-icon color="success" @click="readEnterprise(item.id)"
              >mdi-eye</v-icon
            >
          </v-btn>
          <v-btn
            icon
            color="red"
            @click="switch_status(item)"
            v-if="item.status && !idPrincipales.includes(item.id)"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-navigation-drawer
      v-model="showFilterDrawer"
      absolute
      bottom
      temporary
      right
      width="30%"
      height="100vh"
    >
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title class="text-h6">
            Filtrar Registros
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-spacer></v-spacer>

      <v-container fluid>
        <v-card-text>
          <v-row>
            <v-autocomplete
              label="Tipo de Documento"
              v-model="enterprise.id_document"
              :items="itemsDocumentsPais"
              item-text="description"
              item-value="id"
              clearable
            ></v-autocomplete>
          </v-row>
          <v-row>
            <v-text-field
              type="text"
              label="N° de Documento"
              clearable
              v-model="enterprise.document"
            >
            </v-text-field>
          </v-row>
          <v-row>
            <v-text-field
              label="Nombre Comercial"
              clearable
              v-model="enterprise.trade_name"
            ></v-text-field>
          </v-row>
          <v-row>
            <v-text-field
              label="Nombre Negocio"
              clearable
              v-model="enterprise.business_name"
            ></v-text-field>
          </v-row>
          <v-row>
            <v-autocomplete
              label="País"
              :items="itemsPais"
              item-value="id"
              item-text="name"
              @change="_getState(enterprise.id_pais)"
              v-model="enterprise.id_pais"
            >
            </v-autocomplete>
          </v-row>
          <v-row>
            <v-autocomplete
              label="Región"
              :items="itemsState"
              clearable
              item-value="id"
              item-text="name"
              @change="_getCity(enterprise.id_state)"
              v-model="enterprise.id_state"
            >
            </v-autocomplete>
          </v-row>
          <v-row>
            <v-autocomplete
              label="Provincia"
              :items="itemsCity"
              clearable
              item-value="id"
              item-text="name"
              @change="_getTown(enterprise.id_city)"
              v-model="enterprise.id_city"
            >
            </v-autocomplete>
          </v-row>
          <v-row>
            <v-autocomplete
              label="Distrito"
              v-model="enterprise.id_town"
              clearable
              :items="itemsTown"
              item-value="id"
              item-text="name"
            ></v-autocomplete>
          </v-row>
          <v-row>
            <v-text-field
              label="Dirección"
              v-model="enterprise.address"
              clearable
            ></v-text-field>
          </v-row>
          <v-row>
            <v-radio-group v-model="enterprise.status" row dense>
              <v-radio label="Activo" color="green" :value="1"></v-radio>
              <v-radio label="Inactivo" color="red" :value="0"></v-radio>
              <v-radio label="Todos" color="blue" value="null"></v-radio>
            </v-radio-group>
          </v-row>
        </v-card-text>
      </v-container>
      <v-card-actions class="justify-end mt-3">
        <v-btn class="mx-1" color="success" @click="filtar()"> Aceptar</v-btn>
        <v-btn class="mx-1" color="ligth" @click="reset_records()"
          >Limpiar</v-btn
        >
        <v-btn class="mx-1" dark color="warning" @click="volver()">
          Cerrar
        </v-btn>
      </v-card-actions>
    </v-navigation-drawer>
  </v-card>
</template>

<script>
import { mapState, mapActions } from "vuex";
import Swal from "sweetalert2";

export default {
  name: "ListEnterpriseComponent",
  data() {
    return {
      idPrincipales: ["1", "2", 1, 2],
      headers: [
        // { text: "Código", align: "start", value: "code" },
        { text: "Tipo de Documento", value: "td_name" },
        { text: "Nro. Documento", value: "document" },
        { text: "Nombre Comercial", value: "trade_name" },
        { text: "Nombre Negocio", value: "business_name" },
        { text: "País", value: "lp_name" },
        { text: "Región", value: "ls_name" },
        { text: "Provincia", value: "lc_name" },
        { text: "Distrito", value: "lt_name" },
        { text: "Dirección", value: "address" },
        { text: "Teléfono", value: "phone" },
        { text: "Estado", value: "status" },
        { text: "Creación", value: "created_at" },

        { text: "Última Actualización", value: "updated_at" },
        { text: "Acciones", value: "action" },
      ],
      dataList: false,
      item: "",
      showFilterDrawer: false,
      search: "",
      status: true,
      enterprise: {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
        id: "",
        slogan: "",
        document: "",
        trade_name: "",
        business_name: "",
        address: "",
        status: 1,
        id_pais: "",
        id_state: "",
        id_city: "",
        id_town: "",
        id_document: "",
        id_logo: "",
        ic: "",
      },
      loading: true,
      originalenterprise: {},
    };
  },
  created() {
    this.originalenterprise = { ...this.enterprise };
  },
  async mounted() {
    this.$store.state.spiner = false;
    await this.fetchDataEnterprise(this.enterprise);
    this.$store.state.mainTitle = `EMPRESAS`;
    await this._getDocumentsPais();
    await this._getPais();
    await this._callState();
  },
  watch: {
    "$store.state.enterprises.loading": {
      handler(newList, oldList) {
        this.loading = newList == true ? false : true;
      },
      immediate: true,
    },
  },
  methods: {
    ...mapActions([
      "fetchDataEnterprise",
      "readEnterprise",
      "updateEnterprise",
      "_getDocumentsPais",
      "_getPais",
      "_getState",
      "_getCity",
      "_getTown",
      "switchEnterprise",
      "eliminarBranch",
      "validarUsuarioAdmin",
    ]),
    updateStatus(newValue) {
      this.enterprise.status = newValue ? 1 : 0;
    },
    readEnterprise(id) {
      this.$router.push({ name: "readEnterprise", params: { id: id } });
    },
    async _callState() {
      if (this.id_pais > 0) {
        await this._getState(this.id_pais);
      }
    },
    volver() {
      this.$router.go(-1);
    },
    async filtar() {
      this.enterprise.status =
        this.enterprise.status == "null" ? "" : this.enterprise.status;
      if (this.enterprise.slogan === null) this.enterprise.slogan = "";
      if (this.enterprise.document === null) this.enterprise.document = "";
      if (this.enterprise.trade_name === null) this.enterprise.trade_name = "";
      if (this.enterprise.business_name === null)
        this.enterprise.business_name = "";
      if (this.enterprise.address === null) this.enterprise.address = "";
      if (this.enterprise.status === null) this.enterprise.status = "";
      if (this.enterprise.id_pais === null) this.enterprise.id_pais = "";
      if (this.enterprise.id_state === null) this.enterprise.id_state = "";
      if (this.enterprise.id_city === null) this.enterprise.id_city = "";
      if (this.enterprise.id_town === null) this.enterprise.id_town = "";
      if (this.enterprise.id_document === null)
        this.enterprise.id_document = "";
      if (this.enterprise.id_logo === null) this.enterprise.id_logo = "";
      if (this.enterprise.ic === null) this.enterprise.ic = "";

      await this.fetchDataEnterprise(this.enterprise);
      this.showFilterDrawer = false;
    },
    updateEnterpriseRoute(id) {
      this.$router.push({ name: "updateEnterprise", params: { id: id } });
    },
    clear() {
      Object.assign(this.enterprise, this.originalenterprise);
    },
    async reset_records() {
      this.clear();
    },
    async switch_status(item) {
      let val = true;
      let msg = "";
      this.payfile = null;

      await Swal.fire({
        title: "Ingrese sus datos Administrador",
        html:
          '<input id="swal-input1" class="swal2-input" placeholder="Nombre">' +
          '<input id="swal-input2" type="password" class="swal2-input" placeholder="Clave">',
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: "Aceptar",
        cancelButtonText: "Cancelar",
        preConfirm: () => {
          const input1 = document.getElementById("swal-input1").value.trim();
          const input2 = document.getElementById("swal-input2").value.trim();
          if (!input1 || !input2) {
            Swal.showValidationMessage("Por favor, complete ambos campos");
            return false;
          }
          return { usuario: input1, clave: input2 };
        },
      }).then(async (result) => {
        if (!result.isConfirmed) {
          // Usuario canceló
          val = false;
          msg = "Operación cancelada";
          return;
        }

        if (result.value) {
          const res = await this.validarUsuarioAdmin({
            usuario: result.value.usuario,
            clave: result.value.clave,
          });

          if (res && res.estadoflag) {
            val = true;
          } else {
            val = false;
            msg = res?.mensaje || "Credenciales incorrectas";
          }
        } else {
          val = false;
          msg = "Debe ingresar las credenciales";
        }
      });

      if (!val) {
        await swal.fire({
          icon: "error",
          text: msg,
        });
        return false;
      }
      await this.eliminar(item);
    },

    async eliminar(item) {
      Swal.fire({
        title: "¿Estás seguro?",
        text: `La eliminación será definitiva, y no se podrá recupear la sucursal`,
        confirmButtonColor: "red",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, inactivar",
        cancelButtonColor: "orange",
        cancelButtonText: "Cancelar",
      }).then(async (result) => {
        if (result.isConfirmed) {
          item.status = 0;
          this.clear();
          await this.eliminarBranch(item);
        }
      });
    },
    open_filter() {
      this.showFilterDrawer = !this.showFilterDrawer;
    },
  },
  computed: {
    ...mapState([
      "itemsDocumentsPais",
      "itemsPais",
      "itemsState",
      "itemsCity",
      "itemsTown",
    ]),
  },
};
</script>
