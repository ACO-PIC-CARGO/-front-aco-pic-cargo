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
        <v-btn size="small" color="success" @click="open_insert()"> Nuevo </v-btn>
        <v-btn size="small" class="mx-1" color="#2962FF" @click="open_filter()">
          Fitrar
        </v-btn>
        <v-btn size="small" class="mx-1" color="#004D40"> Exportar </v-btn>
      </v-card-title>

      <v-data-table
        v-if="!loading"
        class="elevation-1"
        :headers="headers"
        :items="$store.state.document.list"
        item-value="id"
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
      v-model="showFilterDrawerNew"
      absolute
      location="right"
      temporary
      
      width="30%"
    >
      <v-list-item>
        
          <v-list-item-title class="text-h6"
            >Nuevo Tipo de Documento
          </v-list-item-title>
        
      </v-list-item>

      <v-spacer></v-spacer>

      <v-container>
        <v-card-text>
          <v-form ref="formNew">
            <v-row>
              <v-text-field
                type="text"
                label="Nombre (Descripción Corta) (*)"
                v-model="document.name"
                :rules="[(v) => validateName(v)]"
                clearable
              >
              </v-text-field>
            </v-row>
            <v-row>
              <v-text-field
                type="text"
                label="Descripción Larga (*)"
                v-model="document.description"
                :rules="[(v) => validateDescription(v)]"
                clearable
              >
              </v-text-field>
            </v-row>
          </v-form>
          <v-row>
            <v-switch
              density="compact"
              :label="`Estado: ${document.status ? 'Activo' : 'Inactivo'}`"
              v-model="document.status"
              :value-comparator="(value, checked) => Boolean(value) === checked"
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
      location="right"
      temporary
      
      width="30%"
    >
      <v-container v-if="!loading_as">
        <v-list-item class="px-0">
          
            <v-list-item-title class="text-h6">
              Ver: {{ $store.state.document.record.name }}
            </v-list-item-title>
          
        </v-list-item>
        <v-spacer></v-spacer>

        <v-card-text>
          <v-row>
            <v-text-field
              label="Código"
              readonly
              :model-value="$store.state.document.record.code"
            ></v-text-field>
          </v-row>
          <v-row>
            <v-text-field
              label="Nombre (Descripción Corta)"
              readonly
              :model-value="$store.state.document.record.name"
            ></v-text-field>
          </v-row>
          <v-row>
            <v-text-field
              label="Descripción Larga"
              readonly
              :model-value="$store.state.document.record.description"
            ></v-text-field>
          </v-row>
          <v-row>
            <v-switch
              readonly
              :label="`Estado: ${
                !!$store.state.document.record.status ? 'Activo' : 'Inactivo'
              }`"
              color="success"
              v-model="$store.state.document.record.status"
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
      location="right"
      temporary
      
      width="30%"
    >
      <v-container v-if="!loading_as">
        <v-list-item class="px-0">
          
            <v-list-item-title class="text-h6">
              Modificar: {{ $store.state.document.record.name }}
            </v-list-item-title>
          
        </v-list-item>
        <v-spacer></v-spacer>

        <v-card-text>
          <v-row>
            <v-text-field
              type="text"
              label="Código"
              v-model="document.code"
              readonly
            >
            </v-text-field>
          </v-row>
          <v-form ref="form">
            <v-row>
              <v-text-field
                type="text"
                label="Nombre (Descripción Corta) (*)"
                v-model="document.name"
                :rules="[(v) => validateName(v)]"
                clearable
              >
              </v-text-field>
            </v-row>
            <v-row>
              <v-text-field
                type="text"
                label="Descripción Larga (*)"
                v-model="document.description"
                :rules="[(v) => validateDescription(v)]"
                clearable
              >
              </v-text-field>
            </v-row>
          </v-form>
          <v-row>
            <v-switch
              :label="`Estado: ${document.status ? 'Activo' : 'Inactivo'}`"
              v-model="document.status"
              :value-comparator="(value, checked) => Boolean(value) === checked"
              color="success"
              @update:model-value="updateStatus"
            ></v-switch>
          </v-row>
        </v-card-text>

        <v-card-actions class="justify-end mt-3">
          <v-btn class="mx-1" color="success" @click="update"> Aceptar</v-btn>
          <v-btn
            class="mx-1"
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
      location="right"
      temporary
      
      width="30%"
    >
      <v-list-item>
        
          <v-list-item-title class="text-h6">
            Filtrar Registros
          </v-list-item-title>
        
      </v-list-item>

      <v-spacer></v-spacer>

      <v-container>
        <v-card-text>
          <v-row>
            <v-text-field
              label="Código"
              v-model="documents.code"
              clearable
            ></v-text-field>
          </v-row>
          <v-row>
            <v-text-field
              type="text"
              label="Nombre (Descripción Corta)"
              clearable
              v-model="documents.name"
            >
            </v-text-field>
          </v-row>
          <v-row>
            <v-text-field
              label="Descripción Larga"
              v-model="documents.description"
              clearable
            ></v-text-field>
          </v-row>
          <v-row>
            <v-radio-group v-model="documents.status" inline density="compact">
              <v-radio label="Activo" color="green" :value="1"></v-radio>
              <v-radio label="Inactivo" color="red" :value="0"></v-radio>
              <v-radio label="Todos" color="blue" value="null"></v-radio>
            </v-radio-group>
          </v-row>
        </v-card-text>

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

export default {
  name: "ListDocumentsComponent",
  data() {
    return {
      headers: [
        { title: "Código", align: "start", key: "code" },
        { title: "Nombre (Descripción Corta)", key: "name" },
        { title: "Descripción Larga", key: "description" },
       { title: "Estado", key: "status" },
        { title: "Creación", key: "created_at" },

        { title: "Última Actualización", key: "updated_at" },
        { title: "Acciones", key: "action" },
      ],
      loading: true,
      loading_as: true,
      item: "",
      search: "",
      documents: {
        code: "",
        name: "",
        description: "",
        status: 1,
      },
      document: {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
        code: "",
        name: "",
        description: "",
        status: 1,
      },
      originalDocument: {},
      originalDocuments: {},
      showFilterDrawerNew: false,
      showFilterDrawerRead: false,
      showFilterDrawerUpdate: false,
      showFilterDrawer: false,
      id: "",
    };
  },
  created() {
    this.originalDocument = { ...this.document };
    this.originalDocuments = { ...this.documents };
  },
  async mounted() {
    await this.fetchDataDocument(this.documents);
    this.$store.state.mainTitle = `Tipo de Documentos`;
  },
  methods: {
    ...mapActions([
      "fetchDataDocument",
      "insertDocument",
      "readDocument",
      "updateDocument",
    ]),
    async clear(option) {
      if (option == "filter") {
        this.documents = { ...this.originalDocuments };
      } else {
        this.document = { ...this.originalDocument };
      }
      await this.fetchDataDocument(this.documents);
      this.showFilterDrawer = false;
    },
    async reset_records() {
      this.clear("filter");
    },
    updateStatus(newValue) {
      this.document.status = newValue ? 1 : 0;
    },
    async insert() {
      if ((await this.$refs.formNew.validate()).valid) {
        this.clear("filter");
        await this.insertDocument(this.document);
      }
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
          await this.updateDocument(item);
        }
      });
    },
    open_filter() {
      this.showFilterDrawer = !this.showFilterDrawer;
    },
    open_insert() {
      this.resetForms();
      this.clear();
      this.showFilterDrawerNew = !this.showFilterDrawerNew;
    },
    async open_read(id) {
      this.loading_as = true;
      this.showFilterDrawerRead = !this.showFilterDrawerRead;
      await this.readDocument(id);
    },
    async open_update(id) {
      this.loading_as = true;
      this.resetForms();
      this.showFilterDrawerUpdate = !this.showFilterDrawerUpdate;
      await this.readDocument(id);
      this.id = id;
    },
    async update() {
      if ((await this.$refs.form.validate()).valid) {
        let data = {
          id: this.id,
          name: this.document.name,
          description: this.document.description,
          status: this.document.status,
        };
        this.clear("filter");
        await this.updateDocument(data);
      }
    },
    async filter() {
      let data = { ...this.documents };
      data.status = data.status == "null" ? "" : data.status;
      if (data.code === null) data.code = "";
      if (data.name === null) data.name = "";
      if (data.description === null) data.description = "";
      await this.fetchDataDocument(data);
      this.showFilterDrawer = false;
    },
    validateName(v) {
      let length = 255;
      if (!v) {
        return "El nombre es requerido";
      } else if (v.length > length) {
        return `El nombre debe tener un máximo de  ${length} caracteres `;
      } else {
        return true;
      }
    },
    validateDescription(v) {
      let length = 255;
      if (!v) {
        return "La descripción larga es requerida";
      } else if (v.length > length) {
        return `La descripción larga debe tener un máximo de  ${length} caracteres`;
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
    "$store.state.document.record": {
      handler(newRecord, oldRecord) {
        if (newRecord && Object.keys(newRecord).length > 0) {
          const { code, name, description, status } = newRecord;
          this.document = { code, name, description, status };
          this.loading_as = false;
        }
      },
      immediate: true,
    },
    "$store.state.document.loading": {
      handler(newList, oldList) {
        this.loading = newList == true ? false : true;
      },
      immediate: true,
    },
  },
};
</script>
