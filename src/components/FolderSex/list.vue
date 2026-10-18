<template>
  <v-card fluid class="px-5">
    <v-container v-if="loading" style="height: 400px">
      <v-row class="fill-height align-content-center justify-center">
        <v-col class="text-body-large text-center" cols="12">
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

    <v-card-title v-if="!loading" class="elevation-0 d-flex align-center flex-wrap">
      <v-text-field
        append-inner-icon="mdi-magnify"
        label="Buscar"
        single-line
        hide-details
        v-model="search"
      >
      </v-text-field>
      <v-spacer></v-spacer>
      <v-btn size="small" color="success" @click="open_new()"> Nuevo </v-btn>
      <v-btn size="small" class="mx-1" color="#2962FF" @click="open_filter()">
        Fitrar
      </v-btn>
      <v-btn size="small" class="mx-1" color="#004D40"> Exportar </v-btn>
    </v-card-title>

    <v-data-table
      v-if="!loading"
      class="elevation-1"
      :headers="headers"
      :items="$store.state.sex.list"
      item-value="id"
      :search="search"
    >
      <template v-slot:[`item.status`]="{ item }">
        {{ !!item.status ? "Activo" : "Inactivo" }}
      </template>
      <template v-slot:[`item.action`]="{ item }">
        <v-btn variant="text" icon>
          <v-icon color="primary" @click="open_read(item.id)">mdi-eye</v-icon>
        </v-btn>
        <v-btn variant="text" icon>
          <v-icon color="warning" @click="open_update(item.id)"
            >mdi-pencil</v-icon
          >
        </v-btn>

        <v-btn variant="text" icon color="red" @click="switch_status(item)" v-if="item.status">
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </template>
    </v-data-table>

    <v-navigation-drawer
      v-model="showFilterDrawerNew"
      location="right"
      temporary
      
      width="30%"
    >
      <v-list-item>
        
          <v-list-item-title class="text-headline-small"> Nuevo Género </v-list-item-title>
        
      </v-list-item>

      <v-spacer></v-spacer>

      <v-container>
        <v-card-text>
          <v-form ref="form1">
            <v-row>
              <v-text-field
                type="text"
                label="Acrónimo (*)"
                v-model="record.acronym"
                @blur="validate_nuevo_acronym()"
                :rules="[(v) => validateAcronym(v)]"
                :error-messages="errorAcronym"
                clearable
              >
              </v-text-field>
            </v-row>
            <v-row>
              <v-text-field
                type="text"
                label="Nombre (*)"
                v-model="record.name"
                :rules="[(v) => validateName(v)]"
                clearable
              >
              </v-text-field>
            </v-row>
            <v-row>
              <v-text-field
                type="text"
                label="Descripción"
                v-model="record.description"
                :rules="[(v) => validateDescription(v)]"
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
              :value-comparator="(value, checked) => Boolean(value) === checked"
              hide-details
              color="success"
              @update:model-value="updateStatus"
            ></v-switch>
          </v-row>
        </v-card-text>
      </v-container>

      <v-container>
        <v-card-actions class="justify-end mt-3">
          <v-btn class="mx-1" color="success" @click="insert()"> Aceptar</v-btn>
          <v-btn class="mx-1" color="warning" @click="close_drawer('new')">
            Cerrar</v-btn
          >
        </v-card-actions>
      </v-container>
    </v-navigation-drawer>

    <v-navigation-drawer
      v-model="showFilterDrawerRead"
      location="right"
      temporary
      
      width="30%"
    >
      <v-container v-if="!loading_as">
        <v-list-item class="px-0">
          
            <v-list-item-title class="text-headline-small">
              Ver: {{ $store.state.sex.record.name }}
            </v-list-item-title>
          
        </v-list-item>

        <v-spacer></v-spacer>
        <v-card-text>
          <v-row>
            <v-text-field
              label="Código"
              readonly
              :model-value="$store.state.sex.record.code"
            ></v-text-field>
          </v-row>
          <v-row>
            <v-text-field
              label="Nombre"
              readonly
              :model-value="$store.state.sex.record.name"
            ></v-text-field>
          </v-row>
          <v-row>
            <v-text-field
              label="Acrónimo"
              readonly
              :model-value="$store.state.sex.record.acronym"
            ></v-text-field>
          </v-row>
          <v-row>
            <v-text-field
              label="Descripción"
              readonly
              :model-value="$store.state.sex.record.description"
            ></v-text-field>
          </v-row>
          <v-row>
            <v-switch
              readonly
              :label="`Estado: ${
                !!$store.state.sex.record.status ? 'Activo' : 'Inactivo'
              }`"
              color="success"
              v-model="$store.state.sex.record.status"
              :value-comparator="(value, checked) => Boolean(value) === checked"
            ></v-switch>
          </v-row>
        </v-card-text>
        <v-card-actions class="justify-end mt-3">
          <v-btn
            class="mx-1"
            color="warning"
            @click="showFilterDrawerRead = !showFilterDrawerRead"
          >
            Cerrar</v-btn
          >
        </v-card-actions>
      </v-container>

      <v-container v-if="loading_as" style="height: 400px">
        <v-row class="fill-height align-content-center justify-center">
          <v-col class="text-body-large text-center" cols="12">
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
      location="right"
      temporary
      
      width="30%"
    >
      <v-container v-if="!loading_as">
        <v-list-item class="px-0">
          
            <v-list-item-title class="text-headline-small">
              Modificar: {{ $store.state.sex.record.name }}
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
                label="Acrónimo (*)"
                v-model="record.acronym"
                @blur="validate_editar_acronym()"
                :rules="[(v) => validateAcronym(v)]"
                :error-messages="errorAcronym"
                clearable
              >
              </v-text-field>
            </v-row>
            <v-row>
              <v-text-field
                type="text"
                label="Nombre (*)"
                v-model="record.name"
                :rules="[(v) => validateName(v)]"
                clearable
              >
              </v-text-field>
            </v-row>
            <v-row>
              <v-text-field
                type="text"
                label="Descripción"
                v-model="record.description"
                :rules="[(v) => validateDescription(v)]"
                clearable
              >
              </v-text-field>
            </v-row>
          </v-form>

          <v-row>
            <v-switch
              :label="`Estado: ${record.status ? 'Activo' : 'Inactivo'}`"
              v-model="record.status"
              :value-comparator="(value, checked) => Boolean(value) === checked"
              color="success"
              @update:model-value="updateStatus"
            ></v-switch>
          </v-row>
        </v-card-text>

        <v-card-actions class="justify-end mt-3">
          <v-btn class="mx-1" color="success" @click="btnUpdate">
            Aceptar</v-btn
          >
          <v-btn
            class="mx-1"
            color="warning"
            @click="close_drawer('update')"
          >
            Cerrar</v-btn
          >
        </v-card-actions>
      </v-container>

      <v-container v-if="loading_as" style="height: 400px">
        <v-row class="fill-height align-content-center justify-center">
          <v-col class="text-body-large text-center" cols="12">
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
      location="right"
      temporary
      
      width="30%"
    >
      <v-list-item>
        
          <v-list-item-title class="text-headline-small">
            Filtrar Registros
          </v-list-item-title>
        
      </v-list-item>

      <v-spacer></v-spacer>

      <v-container>
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
              label="Acrónimo"
              v-model="records.acronym"
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
      </v-container>

      <v-container>
        <v-card-actions class="justify-end mt-3">
          <v-btn class="mx-1" color="success" @click="filter()"> Aceptar</v-btn>
          <v-btn class="mx-1" color="ligth" @click="reset_records()">
            Limpiar</v-btn
          >
          <v-btn
            class="mx-1"
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
import axios from '@/api/http';

export default {
  name: "ListSexComponent",
  data() {
    return {
      headers: [
        { title: "Código", align: "start", key: "code" },
        { title: "Acrónimo", key: "acronym" },
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
        acronym: "",
        description: "",
        status: 1,
      },
      record: {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
        acronym: "",
        name: "",
        code: "",
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
      rulesPassed: false,
      errorAcronym: null,
    };
  },
  created() {
    this.originalRecord = { ...this.record };
    this.originalRecords = { ...this.records };
  },
  async mounted() {
    await this.fetchDataSex(this.records);
    this.$store.state.mainTitle = `Género`;
  },
  methods: {
    ...mapActions(["fetchDataSex", "insertSex", "readSex", "updateSex"]),
    updateStatus(newValue) {
      this.record.status = newValue ? 1 : 0;
    },
    insert() {
      this.validate_nuevo_acronym();
      setTimeout(async () => {
        if ((await this.$refs.form1.validate()).valid && this.errorAcronym == null) {
          this.resetRecord("filter");
          await this.insertSex(this.record);
        }
      }, 500);
    },
    async resetRecord(option) {
      if (option == "filter") {
        this.records = { ...this.originalRecords };
      } else {
        this.record = { ...this.originalRecord };
      }
      await this.fetchDataSex(this.records);
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
          await this.updateSex(item);
        }
      });
    },
    async open_read(id) {
      this.loading_as = true;
      this.showFilterDrawerRead = !this.showFilterDrawerRead;
      await this.readSex(id);
    },
    async open_update(id) {
      this.loading_as = true;
      this.errorAcronym = null;
      this.showFilterDrawerUpdate = !this.showFilterDrawerUpdate;
      await this.readSex(id);
      this.id = id;
    },
    async btnUpdate() {
      this.validate_editar_acronym();
      setTimeout(async () => {
        if ((await this.$refs.form.validate()).valid && this.errorAcronym == null) {
          let data = {
            id: this.id,
            id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0]
              .id_branch,
            acronym: this.record.acronym,
            name: this.record.name,
            description: this.record.description,
            status: this.record.status,
          };
          this.resetRecord("filter");
          await this.updateSex(data);
        }
      }, 500);
    },
    open_new() {
      this.loading_as = true;
      this.resetRecord();
      this.errorAcronym = null;
      if (this.$refs.form1) {
        this.$refs.form1.reset();
      }
      this.showFilterDrawerNew = !this.showFilterDrawerNew;
    },
    open_filter() {
      this.showFilterDrawer = !this.showFilterDrawer;
    },
    async filter() {
      let data = { ...this.records };
      data.status = data.status == "null" ? "" : data.status;
      if (data.code === null) data.code = "";
      if (data.acronym === null) data.acronym = "";
      if (data.name === null) data.name = "";
      if (data.description === null) data.description = "";
      await this.fetchDataSex(data);
      this.showFilterDrawer = false;
    },
    validateAcronym(v) {
      if (!v) {
        return "El acrónimo es requerido";
      } else if (v.length > 4) {
        return "El acrónimo permite hasta 4 caracteres";
      } else {
        return true;
      }
    },
    validateName(v) {
      if (!v) {
        return "El nombre es requerido";
      } else if (v.length > 255) {
        return "El nombre permite hasta  255 caracteres ";
      } else {
        return true;
      }
    },
    validateDescription(v) {
      if (!v) {
        return true;
      } else if (v.length > 255) {
        return "La descripción permite hasta 255 caracteres";
      }
      return true;
    },
    async validate_nuevo_acronym() {
      this.errorAcronym = null;

      var config = {
        method: "get",
        url:
          import.meta.env.VITE_URL_MAIN +
          `validar_nuevo_acronimo_sex?` +
          `acronym=${encodeURIComponent(this.record.acronym)}` +
          `&id_branch=${this.record.id_branch}`,
        headers: {
          "Content-Type": "application/json",
         
        },
      };

      await axios(config)
        .then((response) => {
          let data = response.data;
          this.errorAcronym = data.estadoflag ? null : data.mensaje;
          if (!data.estadoflag) this.record.acronym = "";
        })
        .catch((error) => {
          console.log("Error al obtener los datos:", error);
        });
    },
    async validate_editar_acronym() {
      this.errorAcronym = null;

      var config = {
        method: "get",
        url:
          import.meta.env.VITE_URL_MAIN +
          `validar_editar_acronimo_sex?` +
          `id=${this.id}` +
          `&acronym=${encodeURIComponent(this.record.acronym)}` +
          `&id_branch=${this.record.id_branch}`,
        headers: {
          "Content-Type": "application/json",
         
        },
      };

      await axios(config)
        .then((response) => {
          let data = response.data;
          this.errorAcronym = data.estadoflag ? null : data.mensaje;
          if (!data.estadoflag) this.record.acronym = "";
        })
        .catch((error) => {
          console.log("Error al obtener los datos:", error);
        });
    },
    close_drawer(param) {
      switch (param) {
        case "new":
          this.$refs.form1.reset();
          this.showFilterDrawerNew = !this.showFilterDrawerNew;
          break;
        case "update":
          this.$refs.form.reset();
          this.showFilterDrawerUpdate = !this.showFilterDrawerUpdate;
          break;
      }
    },
  },
  computed: {
    ...mapState(["list"]),
  },
  watch: {
    "$store.state.sex.record": {
      handler(newRecord, oldRecord) {
        if (newRecord && Object.keys(newRecord).length > 0) {
          this.record.code = newRecord.code;
          this.record.acronym = newRecord.acronym;
          this.record.name = newRecord.name;
          this.record.description = newRecord.description;
          this.record.status = newRecord.status;
          this.loading_as = false;
        }
      },
      immediate: true,
    },
    "$store.state.sex.loading": {
      handler(newList, oldList) {
        this.loading = newList == true ? false : true;
      },
      immediate: true,
    },
  },
};
</script>
