<template>
  <v-card fluid class="px-5">
    <v-card elevation="0">
      <v-container v-if="loading" style="height: 400px">
        <v-row class="fill-height align-content-center justify-center">
          <v-col class="text-subtitle-1 text-center" cols="12">
            Cargando información ....
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
        <v-btn size="small" class="mx-1" color="success" @click="open_new()">
          Nuevo
        </v-btn>
        <v-btn size="small" dark class="mx-1" color="#2962FF" @click="open_filter()">
          Fitrar
        </v-btn>
        <v-btn size="small" class="mx-1" color="#004D40" dark> Exportar </v-btn>
      </v-card-title>

      <v-data-table
        v-if="!loading"
        class="elevation-1"
        :headers="headers"
        :items="$store.state.groupservices.list"
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
          <v-btn icon>
            <v-btn
              icon
              color="red"
              @click="switch_status(item)"
              v-if="item.status"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-navigation-drawer
      v-model="showFilterDrawerNew"
      absolute
      location="bottom right"
      temporary
      
      width="30%"
      height="100vh"
    >
      <v-container class="">
        <v-list-item class="px-0">
          
            <v-list-item-title class="text-h6">
              Nuevo Servicio
            </v-list-item-title>
          
        </v-list-item>

        <v-spacer></v-spacer>

        <v-card-text>
          <v-form ref="formNew">
            <v-row>
              <v-text-field
                type="text"
                label="Nombre (*)"
                v-model="record.name"
                :rules="[(v) => validateName(v)]"
                lazy-validation
                clearable
              >
              </v-text-field>
            </v-row>
            <v-row>
              <v-text-field
                type="text"
                label="Descripción (*)"
                v-model="record.description"
                :rules="[(v) => validateDescription(v)]"
                lazy-validation
                clearable
              >
              </v-text-field>
            </v-row>
          </v-form>
          <v-row>
            <v-switch
              density="compact"
              :label="`Estado: ${record.status ? 'Activo' : 'Inactivo'}`"
              v-model="record.status"
              hide-details
              color="success"
              @update:model-value="updateStatus"
            ></v-switch>
          </v-row>
        </v-card-text>

        <v-card-actions class="justify-end mt-3">
          <v-btn class="mx-1" color="success" @click="insert()"> Aceptar</v-btn>
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
    </v-navigation-drawer>

    <v-navigation-drawer
      v-model="showFilterDrawerRead"
      absolute
      location="bottom right"
      temporary
      
      width="30%"
      height="100vh"
    >
      <v-container v-if="!loading_as">
        <v-list-item class="px-0">
          
            <v-list-item-title class="text-h6">
              Ver: {{ $store.state.groupservices.record.name }}
            </v-list-item-title>
          
        </v-list-item>

        <v-spacer></v-spacer>
        <v-card-text>
          <v-row>
            <v-text-field
              label="Código"
              readonly
              :model-value="$store.state.groupservices.record.code"
            ></v-text-field>
          </v-row>
          <v-row>
            <v-text-field
              label="Nombre"
              readonly
              :model-value="$store.state.groupservices.record.name"
            ></v-text-field>
          </v-row>
          <v-row>
            <v-text-field
              label="Descripción"
              readonly
              :model-value="$store.state.groupservices.record.description"
            ></v-text-field>
          </v-row>
          <v-row>
            <v-switch
              readonly
              :label="`Estado: ${
                !!$store.state.groupservices.record.status
                  ? 'Activo'
                  : 'Inactivo'
              }`"
              color="success"
              v-model="$store.state.groupservices.record.status"
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
        <v-row class="fill-height align-content-center justify-center">
          <v-col class="text-subtitle-1 text-center" cols="12">
            Cargando información ....
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
    </v-navigation-drawer>

    <v-navigation-drawer
      v-model="showFilterDrawerUpdate"
      absolute
      location="bottom right"
      temporary
      
      width="30%"
      height="100vh"
    >
      <v-container v-if="!loading_as">
        <v-card-title>
          <v-list-item class="px-0">
            
              <v-list-item-title class="text-h6">
                Modificar: {{ $store.state.groupservices.record.name }}
              </v-list-item-title>
            
          </v-list-item>

          <v-spacer></v-spacer>

          <v-card-text>
            <v-row>
              <v-text-field
                type="text"
                label="Código"
                v-model="record.code"
                readonly
              >
              </v-text-field>
            </v-row>
            <v-form ref="form">
              <v-row>
                <v-text-field
                  type="text"
                  label="Nombre (*)"
                  v-model="record.name"
                  :rules="[(v) => validateName(v)]"
                  lazy-validation
                  clearable
                >
                </v-text-field>
              </v-row>
              <v-row>
                <v-text-field
                  type="text"
                  label="Descripción (*)"
                  v-model="record.description"
                  :rules="[(v) => validateDescription(v)]"
                  lazy-validation
                  clearable
                >
                </v-text-field>
              </v-row>
            </v-form>
            <v-row>
              <v-switch
                :label="`Estado: ${record.status ? 'Activo' : 'Inactivo'}`"
                v-model="record.status"
                color="success"
                @update:model-value="updateStatus"
              ></v-switch>
            </v-row>
          </v-card-text>
        </v-card-title>
        <v-card-actions class="justify-end mt-3">
          <v-btn class="mx-1" color="success" @click="btnUpdate">
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
        <v-row class="fill-height align-content-center justify-center">
          <v-col class="text-subtitle-1 text-center" cols="12">
            Cargando información ....
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
    </v-navigation-drawer>

    <v-navigation-drawer
      v-model="showFilterDrawer"
      absolute
      location="bottom right"
      temporary
      
      width="30%"
      height="100vh"
    >
      <v-container>
        <v-list-item class="px-0">
          
            <v-list-item-title class="text-h6">
              Filtrar Registros
            </v-list-item-title>
          
        </v-list-item>

        <v-spacer></v-spacer>

        <v-card-text>
          <v-row>
            <v-text-field
              label="Código"
              v-model="records.code"
              clearable
            ></v-text-field>
          </v-row>
          <v-row>
            <v-text-field
              label="Nombre"
              v-model="records.name"
              clearable
            ></v-text-field>
          </v-row>
          <v-row>
            <v-text-field
              label="Descripción"
              v-model="records.description"
              clearable
            ></v-text-field>
          </v-row>
          <v-row>
            <v-radio-group v-model="records.status" inline density="compact">
              <v-radio label="Activo" color="green" :value="1"></v-radio>
              <v-radio label="Inactivo" color="red" :value="0"></v-radio>
              <v-radio label="Todos" color="blue" value="null"></v-radio>
            </v-radio-group>
          </v-row>
        </v-card-text>

        <v-card-actions class="justify-end mt-3">
          <v-btn class="mx-1" color="success" @click="filter()">
            Aceptar
          </v-btn>
          <v-btn class="mx-1" color="default" @click="reset_records()">
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
  </v-card>
</template>

<script>
import { mapState, mapActions } from "vuex";
import Swal from "sweetalert2";

export default {
  name: "ListGroupservicesComponent",
  data() {
    return {
      headers: [
        { title: "Código", align: "start", key: "code" },
        { title: "Nombre", key: "name" },
        { title: "Descripción", key: "description" },
        { title: "Estado", key: "status" },
        { title: "Creación", key: "created_at" },

        { title: "Última Actualización", key: "updated_at" },
        { title: "Acciones", key: "action" },
      ],
      loading: true,
      loading_as: true,
      item: "",
      search: "",
      records: {
        code: "",
        name: "",
        description: "",
        status: 1,
      },
      record: {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
        code: "",
        name: "",
        description: "",
        status: 1,
      },
      originalRecord: {},
      originalRecords: {},
      showFilterDrawerNew: false,
      showFilterDrawerRead: false,
      showFilterDrawerUpdate: false,
      showFilterDrawer: false,
      id: "",
      response_filter: null,
    };
  },
  created() {
    this.originalRecord = { ...this.record };
    this.originalRecords = { ...this.records };
  },
  async mounted() {
    await this.fetchDataGroupServices(this.records);
    this.$store.state.mainTitle = `Servicio`;
  },
  methods: {
    ...mapActions([
      "fetchDataGroupServices",
      "insertGroupServices",
      "readGroupServices",
      "updateGroupServices",
    ]),
    updateStatus(newValue) {
      this.record.status = newValue ? 1 : 0;
    },
    async insert() {
      if (this.$refs.formNew.validate()) {
        this.resetRecord("filter");
        await this.insertGroupServices(this.record);
      }
    },
    async resetRecord(option) {
      if (option == "filter") {
        this.records = { ...this.originalRecords };
      } else {
        this.record = { ...this.originalRecord };
      }
      await this.fetchDataGroupServices(this.records);
      this.showFilterDrawer = false;
    },
    async reset_records() {
      this.resetRecord("filter");
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
          this.resetRecord("filter");
          await this.updateGroupServices(item);
        }
      });
    },
    async open_read(id) {
      this.loading_as = true;
      this.showFilterDrawerRead = !this.showFilterDrawerRead;
      await this.readGroupServices(id);
    },
    async open_update(id) {
      this.loading_as = true;
      this.resetForms();
      this.showFilterDrawerUpdate = !this.showFilterDrawerUpdate;
      await this.readGroupServices(id);
      this.id = id;
    },
    async btnUpdate() {
      let data = {
        id: this.id,
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
        name: this.record.name,
        description: this.record.description,
        status: this.record.status,
      };
      if (this.$refs.form.validate()) {
        this.resetRecord("filter");
        await this.updateGroupServices(data);
      }
    },
    open_new() {
      this.resetRecord();
      this.resetForms();
      this.showFilterDrawerNew = !this.showFilterDrawerNew;
    },
    open_filter() {
      this.showFilterDrawer = !this.showFilterDrawer;
    },
    async filter() {
      let data = { ...this.records };
      data.status = data.status == "null" ? "" : data.status;
      if (data.code === null) data.code = "";
      if (data.name === null) data.name = "";
      if (data.description === null) data.description = "";
      await this.fetchDataGroupServices(data);
      this.showFilterDrawer = false;
    },
    validateName(v) {
      let length = 50;
      if (!v) {
        return "El nombre es requerido";
      } else if (v.length > length) {
        return `El nombre permite hasta ${length} caracteres`;
      } else {
        return true;
      }
    },
    validateDescription(v) {
      let length = 50;
      if (!v) {
        return "La descripción es requerida";
      } else if (v.length > length) {
        return `La descripción permite hasta ${length} caracteres`;
      } else {
        return true;
      }
    },
    resetForms() {
      if (this.$refs.formNew) this.$refs.formNew.reset();
      if (this.$refs.form) this.$refs.form.reset();
    },
  },
  computed: {
    ...mapState(["list"]),
  },
  watch: {
    "$store.state.groupservices.record": {
      handler(newRecord, oldRecord) {
        if (newRecord && Object.keys(newRecord).length > 0) {
          const { code, name, description, status } = newRecord;
          this.record = { code, name, description, status };
          this.loading_as = false;
        }
      },
      immediate: true,
    },
    "$store.state.groupservices.loading": {
      handler(newList, oldList) {
        this.loading = newList == true ? false : true;
      },
      immediate: true,
    },
  },
};
</script>
