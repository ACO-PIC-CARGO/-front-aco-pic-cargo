<template>
  <v-card fluid class="px-5">
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
        <v-btn small color="success" @click="open_insert()"> Nuevo </v-btn>
        <v-btn small class="mx-1" color="#2962FF" dark @click="open_filter()">
          Filtrar
        </v-btn>
        <v-btn small class="mx-1" color="#004D40" dark> Exportar </v-btn>
      </v-card-title>

      <v-data-table
        v-if="!loading"
        class="elevation-1"
        :headers="headers"
        :items="$store.state.marketing.list"
        item-key="id"
        :search="search"
      >
        <template v-slot:[`item.status`]="{ item }">
          {{ !!item.status ? "Activo" : "Inactivo" }}
        </template>
        <template v-slot:[`item.action`]="{ item }">
          <v-btn icon>
            <v-icon color="primary" @click="open_read(item.id)">mdi-eye</v-icon>
          </v-btn>
          <v-btn icon>
            <v-icon color="warning" @click="open_update(item.id)"
              >mdi-pencil</v-icon
            >
          </v-btn>

          <v-btn
            icon
            color="red"
            @click="switch_status(item)"
            v-if="item.status"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-navigation-drawer
      v-model="showFilterDrawerUpdate"
      absolute
      bottom
      temporary
      right
      width="30%"
      height="100vh"
    >
      <v-container v-if="!loading_as">
        <v-list-item class="px-0">
          <v-list-item-content>
            <v-list-item-title class="text-h6">
              Modificar: {{ $store.state.marketing.record.name }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-spacer></v-spacer>

        <v-card-text>
          <v-row>
            <v-text-field
              label="Código"
              readonly
              :value="$store.state.marketing.record.code"
            ></v-text-field>
          </v-row>
          <v-form ref="form">
            <v-row>
              <v-text-field
                type="text"
                label="Nombre (*)"
                v-model="marketing.name"
                clearable
                :rules="[(v) => validateName(v)]"
                lazy-validation
              >
              </v-text-field>
            </v-row>
            <v-row>
              <v-text-field
                type="text"
                label="Descripción"
                v-model="marketing.description"
                clearable
                :rules="[(v) => validateDescription(v)]"
                lazy-validation
              >
              </v-text-field>
            </v-row>
          </v-form>

          <v-row>
            <v-text-field
              type="number"
              label="Posición (*)"
              v-model="marketing.position"
              :rules="[(v) => validatePosition(v)]"
              lazy-validation
              @blur="validateEditarPositionAPI"
              :error-messages="errorPosition"
              clearable
            >
            </v-text-field>
          </v-row>
          <v-row>
            <v-switch
              :label="`Estado: ${marketing.status ? 'Activo' : 'Inactivo'}`"
              v-model="marketing.status"
              color="success"
              @change="updateStatus"
            ></v-switch>
          </v-row>
        </v-card-text>

        <v-card-actions class="justify-end mt-3">
          <v-btn class="mx-1" color="success" @click="submit_update()">
            Aceptar</v-btn
          >
          <v-btn
            class="mx-1"
            dark
            color="warning"
            @click="showFilterDrawerUpdate = !showFilterDrawerUpdate"
          >
            Cerrar</v-btn
          >
        </v-card-actions>
      </v-container>

      <v-container v-if="loading_as" style="height: 400px">
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
    </v-navigation-drawer>

    <v-navigation-drawer
      v-model="showFilterDrawerRead"
      absolute
      bottom
      temporary
      right
      width="30%"
      height="100vh"
    >
      <v-container v-if="!loading_as">
        <v-list-item class="px-0">
          <v-list-item-content>
            <v-list-item-title class="text-h6">
              Ver: {{ $store.state.marketing.record.name }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-spacer></v-spacer>

        <v-card-text>
          <v-row>
            <v-text-field
              label="Código"
              readonly
              :value="$store.state.marketing.record.code"
            ></v-text-field>
          </v-row>
          <v-row>
            <v-text-field
              label="Nombre"
              readonly
              :value="$store.state.marketing.record.name"
            ></v-text-field>
          </v-row>
          <v-row>
            <v-text-field
              label="Descripción"
              readonly
              :value="$store.state.marketing.record.description"
            ></v-text-field>
          </v-row>
          <v-row>
            <v-text-field
              label="Posición"
              readonly
              :value="$store.state.marketing.record.position"
            ></v-text-field>
          </v-row>
          <v-row>
            <v-switch
              readonly
              :label="`Estado: ${
                !!$store.state.marketing.record.status ? 'Activo' : 'Inactivo'
              }`"
              color="success"
              v-model="$store.state.marketing.record.status"
            ></v-switch>
          </v-row>
        </v-card-text>

        <v-card-actions class="justify-end mt-3">
          <v-btn
            class="mx-1"
            dark
            color="warning"
            @click="showFilterDrawerRead = !showFilterDrawerRead"
          >
            Cerrar</v-btn
          >
        </v-card-actions>
      </v-container>

      <v-container v-if="loading_as" style="height: 400px">
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
    </v-navigation-drawer>

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

      <v-container>
        <v-card-text>
          <v-row>
            <v-text-field
              type="text"
              label="Nombre"
              v-model="marketing_list.name"
              clearable
            >
            </v-text-field>
          </v-row>
          <v-row>
            <v-text-field
              label="Descripción"
              v-model="marketing_list.description"
              clearable
            ></v-text-field>
          </v-row>
          <v-row>
            <v-text-field
              type="number"
              label="Posición"
              v-model="marketing_list.position"
              clearable
            ></v-text-field>
          </v-row>
          <v-row>
            <v-radio-group v-model="marketing_list.status" row dense>
              <v-radio label="Activo" color="green" :value="1"></v-radio>
              <v-radio label="Inactivo" color="red" :value="0"></v-radio>
              <v-radio label="Todos" color="blue" value="null"></v-radio>
            </v-radio-group>
          </v-row>
        </v-card-text>

        <v-card-actions class="justify-end mt-3">
          <v-btn class="mx-1" color="success" @click="filtar()"> Aceptar</v-btn>
          <v-btn class="mx-1" color="ligth" @click="clear('filter')">
            Limpiar</v-btn
          >
          <v-btn
            class="mx-1"
            dark
            color="warning"
            @click="showFilterDrawer = !showFilterDrawer"
          >
            Cerrar</v-btn
          >
        </v-card-actions>
      </v-container>
    </v-navigation-drawer>

    <v-navigation-drawer
      v-model="showFilterDrawerNew"
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
            Nuevo Tipo de Marketing
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-spacer></v-spacer>

      <v-container v-if="!loading_as">
        <v-card-text>
          <v-form ref="formNew">
            <v-row>
              <v-text-field
                type="text"
                label="Nombre (*)"
                v-model="marketing.name"
                :rules="[(v) => validateName(v)]"
                lazy-validation
                clearable
              >
              </v-text-field>
            </v-row>
            <v-row>
              <v-text-field
                type="text"
                label="Descripción"
                v-model="marketing.description"
                :rules="[(v) => validateDescription(v)]"
                lazy-validation
                clearable
              >
              </v-text-field>
            </v-row>
            <v-row>
              <v-text-field
                type="number"
                min="1"
                label="Posición (*)"
                v-model="marketing.position"
                :rules="[(v) => validatePosition(v)]"
                lazy-validation
                clearable
                @blur="validateNuevoPositionAPI"
                :error-messages="errorPosition"
              >
              </v-text-field>
            </v-row>
          </v-form>
          <v-row>
            <v-switch
              dense
              :label="`Estado: ${marketing.status ? 'Activo' : 'Inactivo'}`"
              v-model="marketing.status"
              hide-details
              color="success"
              @change="updateStatus"
            ></v-switch>
          </v-row>
        </v-card-text>

        <v-card-actions class="justify-end mt-3">
          <v-btn class="mx-1" color="success" @click="submit_insert()">
            Aceptar</v-btn
          >
          <v-btn
            class="mx-1"
            dark
            color="warning"
            @click="showFilterDrawerNew = !showFilterDrawerNew"
          >
            Cerrar</v-btn
          >
        </v-card-actions>
      </v-container>

      <v-container v-if="loading_as" style="height: 400px">
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
    </v-navigation-drawer>
  </v-card>
</template>

<script>
import { mapState, mapActions } from "vuex";
import Swal from "sweetalert2";
import axios from '@/api/axios-config';

export default {
  name: "ListMarketingComponent",
  data() {
    return {
      headers: [
        { text: "Código", align: "start", value: "code" },
        { text: "Nombre", value: "name" },
        { text: "Descripción", value: "description" },
        { text: "Posición (Orden)", value: "position" },
        { text: "Estado", value: "status" },
        { text: "Creación", value: "created_at" },

        { text: "Última Actualización", value: "updated_at" },
        { text: "Acciones", value: "action" },
      ],
      dataList: false,
      item: "",
      showFilterDrawer: false,
      showFilterDrawerNew: false,
      showFilterDrawerRead: false,
      showFilterDrawerUpdate: false,
      search: "",
      status: true,
      marketing_list: {
        name: "",
        description: "",
        position: "",
        status: 1,
      },
      marketing: {
        id: "",
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
        name: "",
        description: "",
        position: "",
        status: 1,
      },
      loading: true,
      loading_as: true,
      originalMarkting: {},
      originalMarktingList: {},
      drawer: false,
      errorPosition: null,
      response_filter: null,
    };
  },
  created() {
    this.originalMarkting = { ...this.marketing };
    this.originalMarktingList = { ...this.marketing_list };
  },
  async mounted() {
    await this.fetchDataMarketing(this.marketing_list);
    this.$store.state.mainTitle = `Tipo de Marketing`;
  },
  methods: {
    ...mapActions([
      "fetchDataMarketing",
      "insertMarketing",
      "lastPositionMarketing",
      "readMarketing",
      "updateMarketing",
    ]),
    updateStatus(newValue) {
      this.marketing.status = newValue ? 1 : 0;
    },
    open_insert() {
      this.loading_as = true;
      this.errorPosition = null;
      this.resetMarketing();
      this.resetForms();
      this.lastPositionMarketing();
      this.showFilterDrawerNew = !this.showFilterDrawerNew;
    },
    submit_insert() {
      this.validateNuevoPositionAPI();
      setTimeout(async () => {
        if (this.$refs.formNew.validate() && this.errorPosition == null) {
          this.clear("filter");
          await this.insertMarketing(this.marketing);
        }
      }, 500);
    },
    async open_read(id) {
      this.loading_as = true;
      this.showFilterDrawerRead = !this.showFilterDrawerRead;
      await this.readMarketing(id);
    },
    async filtar() {
      let data = { ...this.marketing_list };
      data.status = data.status == "null" ? "" : data.status;
      if (data.name === null) data.name = "";
      if (data.position === null) data.position = "";
      if (data.description === null) data.description = "";
      await this.fetchDataMarketing(data);
      this.showFilterDrawer = false;
    },
    async open_update(id) {
      this.loading_as = true;
      this.errorPosition = null;
      this.resetForms();
      await this.readMarketing(id);
      this.showFilterDrawerUpdate = !this.showFilterDrawerUpdate;
      this.marketing.id = id;
    },
    submit_update() {
      this.validateEditarPositionAPI();
      setTimeout(async () => {
        if (this.$refs.form.validate() && this.errorPosition == null) {
          this.clear("filter");
          await this.updateMarketing(this.marketing);
        }
      }, 500);
    },
    object_to_update(initialObject, finalObject) {
      const fields = Object.keys(finalObject);
      fields.forEach((field) => {
        finalObject[field] = initialObject[field];
        finalObject["id_branch"] = JSON.parse(
          sessionStorage.getItem("dataUser")
        )[0].id_branch;
      });
    },
    async switch_status(item) {
      Swal.fire({
        title: "¿Estás seguro?",
        text: `Si inactiva el registro, éste no aparecerá disponible en otros formularios ¿Está seguro de que desea inactivarlo?`,
        confirmButtonColor: "red",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sí, inactivar",
        cancelButtonColor: "orange",
        cancelButtonText: "Cancelar",
      }).then(async (result) => {
        if (result.isConfirmed) {
          item.status = 0;
          this.clear("filter");
          await this.updateMarketing(item);
        }
      });
    },
    async validateNuevoPositionAPI() {
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          `validar_nuevo_posicion_marketing?` +
          `id_branch=${
            JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
          }` +
          `&position=${this.marketing.position}`,
        headers: {
          "Content-Type": "application/json",
         
        },
      };
      await axios(config)
        .then((response) => {
          let data_res = response.data;
          this.errorPosition = data_res.estadoflag ? null : data_res.mensaje;
          if (!data_res.estadoflag) this.marketing.position = "";
        })
        .catch((error) => {
          console.log("Error al obtener los datos:", error);
        });
    },
    async validateEditarPositionAPI() {
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          `validar_editar_posicion_marketing?` +
          `id=${this.marketing.id}` +
          `&id_branch=${
            JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
          }` +
          `&position=${this.marketing.position}`,
        headers: {
          "Content-Type": "application/json",
         
        },
      };
      await axios(config)
        .then((response) => {
          let data_res = response.data;
          this.errorPosition = data_res.estadoflag ? null : data_res.mensaje;
          if (!data_res.estadoflag) this.marketing.position = "";
        })
        .catch((error) => {
          console.log("Error al obtener los datos:", error);
        });
    },
    resetMarketing() {
      Object.assign(this.marketing, this.originalMarkting);
      Object.assign(this.marketing_list, this.originalMarktingList);
    },
    open_filter() {
      this.showFilterDrawer = !this.showFilterDrawer;
    },
    validateName(v) {
      let length = 150;
      if (!v) {
        return "El nombre es requerido";
      } else if (v.length > length) {
        return `El nombre debe tener un máximo de ${length} caracteres`;
      } else {
        return true;
      }
    },
    validateDescription(v) {
      let length = 455;
      if (!v) {
        return true;
      } else if (v.length > length) {
        return `La descripción debe tener un máximo de ${length} caracteres`;
      }
      return true;
    },
    validatePosition(v) {
      if (!v) {
        return "La posición es requerida";
      } else {
        return true;
      }
    },
    async clear(option) {
      if (option == "filter") {
        this.marketing_list = { ...this.originalMarkting };
      } else {
        this.marketing = { ...this.originalMarktingList };
      }
      await this.fetchDataMarketing(this.marketing_list);
      this.showFilterDrawer = false;
    },
    resetForms() {
      if (this.$refs.formNew) this.$refs.formNew.reset();
      if (this.$refs.form) this.$refs.form.reset();
    },
    async reset_records() {
      this.clear("filter");
      this.filtar();
    },
  },
  watch: {
    "$store.state.marketing.record": {
      handler(newRecord, oldRecord) {
        if (newRecord && Object.keys(newRecord).length > 0) {
          const { id, name, description, position, status } = newRecord;
          this.marketing = { id, name, description, position, status };
          this.loading_as = false;
        }
      },
      immediate: true,
    },
    "$store.state.marketing.loading": {
      handler(newList, oldList) {
        this.loading = newList == true ? false : true;
      },
      immediate: true,
    },
    showFilterDrawerNew: {
      handler(newList, oldList) {
        if (newList) {
          this.resetMarketing();
        }
      },
      immediate: true,
    },
    "$store.state.marketing.last_position": {
      handler(newRecord, oldRecord) {
        if (newRecord && Object.keys(newRecord).length > 0) {
          if (newRecord.maxposition > 0) {
            this.marketing.position = newRecord.maxposition;
            this.loading_as = false;
          }
        }
      },
      immediate: true,
    },
  },
};
</script>
