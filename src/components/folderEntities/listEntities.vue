<template>
  <div>
    <v-card elevation="0">
      <v-card-title class="d-flex align-center flex-wrap">
        <v-btn
          v-if="$route.params.id_role"
          color="primary"
          :to="`/home/folderEntities/control/${$route.params.id_role}`"
          elevation="0"
          rounded
          class="mb-2 ml-5"
          :loading="!$store.state.dataList"
        >
          AGREGAR NUEVO
        </v-btn>
        <v-spacer></v-spacer>

        <v-text-field
          v-model="search"
          append-inner-icon="mdi-magnify"
          label="Buscar"
          single-line
          hide-details
        ></v-text-field>
      </v-card-title>

      <v-container v-if="!$store.state.dataList" style="height: 400px">
        <v-row class="fill-height align-content-center justify-center">
          <v-col class="text-subtitle-1 text-center" cols="12">
            Cargando informacíon
          </v-col>
          <v-col cols="6">
            <v-progress-linear
              color="deep-purple-accent-4"
              indeterminate
              rounded
              height="6"
            ></v-progress-linear>
          </v-col>
        </v-row>
      </v-container>

      <v-data-table
        v-if="$store.state.dataList"
        :row-props="({ item }) => ({ class: itemRowBackground(item) })"
        :headers="headers"
        :items="itemsEntities"
        :search="search"
      >
        <template v-slot:[`item.moredata`]="{ item }">
          <v-tooltip location="top">
            <template v-slot:activator="{ props }">
              <v-btn
                class="mx-2"
                icon
                elevation="0"
                size="x-small"
               
                v-bind="props"
                @click="openPhone(item.id)"
                color="blue-grey-darken-3"
              >
                <v-icon> mdi-phone </v-icon>
              </v-btn>
            </template>
            <span>Teléfonos</span>
          </v-tooltip>

          <!--  <v-icon small color="red" @click="deleteItem(item)">
            mdi-delete
          </v-icon> -->
        </template>
        <template v-slot:[`item.moredata2`]="{ item }">
          <v-tooltip location="bottom">
            <template v-slot:activator="{ props }">
              <v-btn
                class="mx-2"
                icon
                elevation="0"
                size="x-small"
               
                v-bind="props"
                @click="openContacts(item.id)"
                color="blue-grey-darken-3"
              >
                <v-icon> mdi-account-multiple </v-icon>
              </v-btn>
            </template>
            <span>Contactos</span>
          </v-tooltip>
          <!--  <v-icon small color="red" @click="deleteItem(item)">
            mdi-delete
          </v-icon> -->
        </template>
        <template v-slot:[`item.actions`]="{ item }">
          <v-icon
            v-if="$route.params.id_role" size="28"
            color="orange"
            class="mr-2"
            @click="editEntitie(item.id)"
          >
            mdi-pencil
          </v-icon>
          <v-icon
            v-if="!$route.params.id_role" size="28"
            color="primary"
            class="mr-2"
            @click="sendData(item.id)"
          >
            mdi-cursor-default-click
          </v-icon>
          <!--  <v-icon small color="red" @click="deleteItem(item)">
            mdi-delete
          </v-icon> -->
        </template>
      </v-data-table>
    </v-card>

    <v-footer color="transparent" height="72">
      <div>
        <div class="circle__legends colorRed"></div>
        Entidad sin documento
      </div>
    </v-footer>
  </div>
</template>
<script>
import { mapState, mapActions } from "vuex";

export default {
  name: "listEntitiesCom",
  data() {
    return {
      search: "",
      headers: [
        {
          title: "Documento",
          align: "start",
          key: "documentlong",
        },
        { title: "Nombre Comercial", key: "namelong" },
        { title: "Ubigeo", key: "location" },
        { title: "Dirección", key: "address" },
        { title: "Notas", key: "notes" },
        { title: "Teléfonos", key: "moredata" },
        { title: "Contactos", key: "moredata2" },
        { title: "Acciones", key: "actions" },
      ],
      dataList: false,

      nameTitle: "",
      btnTitle: "",
    };
  },
  async mounted() {
    console.log(this.$route.params.id_role);
    if (this.$route.params.id_role == 11) {
      this.$store.state.menuName = "CLIENTES";
      this.btnTitle = "CLIENTE";
    } else if (this.$route.params.id_role == 15) {
      this.$store.state.menuName = "PROVEEDORES";
      this.btnTitle = "PROVEEDOR";
    }
    await this._getEntities(this.$route.params.id_role);
  },
  computed: {
    ...mapState(["itemsEntities"]),
  },
  methods: {
    ...mapActions(["_getEntities", "_getPhone", "_getContacts"]),
    validData() {
      if (this.$route.params.id_role == 11) {
        this.$store.state.menuName = "CLIENTES";
        this.btnTitle = "CLIENTE";
      } else if (this.$route.params.id_role == 15) {
        this.$store.state.menuName = "PROVEEDORES";
        this.btnTitle = "PROVEEDOR";
      }
    },

    openPhone(id_entitie) {
      this.$store.state.id_entitie_selected = id_entitie;
      this._getPhone();
      this.$store.state.modalPhonesEdit = !this.$store.state.modalPhonesEdit;
    },

    openContacts(id_entitie) {
      this.$store.state.id_entitie_selected = id_entitie;
      this._getContacts();
      this.$store.state.modalContactsEdit =
        !this.$store.state.modalContactsEdit;
    },

    sendData(id) {
      this.$store.state.master_id_agente = id;
      this.$store.state.modalAgente = false;
    },

    editEntitie(id) {
      this.$router.push("/home/folderEntities/control/edit/" + id);
    },

    itemRowBackground: function (item) {
      return item.document === "" || item.document === null
        ? "rowRed"
        : "white";
    },
  },
};
</script>

<style lang="scss">
.rowRed {
  background: #ffd6d3;
  color: #540000;
}

.circle__legends {
  height: 20px;
  width: 20px;
  background: #ffd6d3;
  float: left;
  border-radius: 250px;
  margin-right: 10px;
}
</style>
