<template>
    <v-card>
      <v-container fluid>
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
          <v-btn small color="success" @click="addComentarioPredefinido()">Nuevo</v-btn>
          <v-btn small class="ml-1" color="#2962FF" dark @click="showFilterComentariosPredefinidos()">Filtrar</v-btn>
          <v-btn small class="ml-1" color="#004D40" dark @click="exportToExcel" :loading="isExportBtnLoading">Exportar</v-btn>
        </v-card-title>
    
        <v-data-table
          v-if="!loading"
          class="elevation-1"
          :headers="headers"
          :items="$store.state.comentariosPredefinidos.list"
          item-key="id"
          :search="search"
          :loading="isDataTableLoading"
        >
          <template v-slot:[`item.status`]="{ item }">
            {{ !!item.status ? "Activo" : "Inactivo" }}
          </template>
          <template v-slot:[`item.created_at`]="{ item }">
            {{ getFechaBonita(item.created_at) }}
          </template>
          <template v-slot:[`item.updated_at`]="{ item }">
            {{ getFechaBonita(item.updated_at) }}
          </template>
          <template v-slot:[`item.action`]="{ item }">            
            <v-btn icon>
              <v-icon color="warning" @click="editComentarioPredefinido(item)">mdi-pencil</v-icon>
            </v-btn> 
            <v-btn icon>
              <v-icon color="primary" @click="viewComentarioPredefinido(item)">mdi-eye</v-icon>
            </v-btn>   
            <v-btn icon color="red" @click="changeStatusComentarioPredefinido(item)" v-if="item.status">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>
        </v-data-table>
    
        <!--ADD NEW RECORD-->
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
              <v-list-item-title class="text-h6">NUEVO COMENTARIO</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
    
          <v-spacer></v-spacer>
    
          <v-container>
            <v-card-text>
              <v-form ref="formNewComentarioPredefinido">
                <v-row>
                  <v-text-field
                    type="text"
                    label="Código"
                    v-model="record.code"
                    :rules="[(v) => validateCodigo(v)]"
                    lazy-validation
                    :error-messages="errorCodigo"
                    readonly
                    :loading="isAutoGeneratingCode"
                  >
                  </v-text-field>
                </v-row>
                <v-row>
                  <v-text-field
                    type="text"
                    label="Comentario"
                    v-model="record.comentario"
                    :rules="[(v) => validateComentario(v)]"
                    lazy-validation
                    :error-messages="errorComentario"
                    clearable
                  >
                  </v-text-field>
                </v-row>
                <v-row>
                  <v-switch
                    dense
                    :label="`Estado: ${record.status ? 'Activo' : 'Inactivo'}`"
                    v-model="record.status"
                    hide-details
                    color="success"
                  ></v-switch>
                </v-row>
              </v-form>              
            </v-card-text>
          </v-container>
    
          <v-container>
            <v-card-actions class="justify-end mt-3">
              <v-btn 
                class="mx-1" 
                color="success" 
                @click="saveComentarioPredefinido"
                :loading="isSubmitBtnLoading"
              >Aceptar</v-btn>
              <v-btn 
                class="mx-1" 
                dark 
                color="warning" 
                @click="showFilterDrawerNew = !showFilterDrawerNew"
              >Cerrar</v-btn>
            </v-card-actions>
          </v-container>
        </v-navigation-drawer>
    
        <!--VIEW RECORD-->
        <v-navigation-drawer
          v-model="showFilterDrawerView"
          absolute
          bottom
          temporary
          right
          width="30%"
          height="100vh"
        >
          <v-container>
            <v-list-item class="px-0">
              <v-list-item-content>
                <v-list-item-title class="text-h6">
                  COMENTARIO {{ record.code ? `[${record.code}]` : "" }} - MODO VISTA
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
    
            <v-spacer></v-spacer>
            <v-card-text>
              <v-row>
                <v-text-field
                  label="Código"
                  readonly
                  :value="record.code"
                ></v-text-field>
              </v-row>
              <v-row>
                <v-text-field
                  label="Comentario"
                  readonly
                  :value="record.comentario"
                ></v-text-field>
              </v-row>
              <v-row>
                <v-switch
                  readonly
                  :label="`Estado: ${
                    record.status ? 'Activo' : 'Inactivo'
                  }`"
                  color="success"
                  v-model="record.status"
                ></v-switch>
              </v-row>
            </v-card-text>
            <v-card-actions class="justify-end mt-3">
              <v-btn
                class="mx-1"
                dark
                color="warning"
                @click="showFilterDrawerView = !showFilterDrawerView"
              >Cerrar</v-btn>
            </v-card-actions>
          </v-container>
        </v-navigation-drawer>
    
        <!--EDIT RECORD-->
        <v-navigation-drawer
          v-model="showFilterDrawerEdit"
          absolute
          bottom
          temporary
          right
          width="30%"
          height="100vh"
        >
          <v-container>
            <v-list-item class="px-0">
              <v-list-item-content>
                <v-list-item-title class="text-h6">
                  MODIFICAR COMENTARIO: {{ record.code ? `[${record.code}]` : "" }}
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
    
            <v-spacer></v-spacer>
    
            <v-card-text>    
              <v-form ref="formEditComentarioPredefinido">
                <v-row>
                  <v-text-field
                    type="text"
                    label="Código"
                    v-model="record.code"
                    readonly
                    :loading="isAutoGeneratingCode"
                  >
                  </v-text-field>
                </v-row>
                <v-row>
                  <v-text-field
                    type="text"
                    label="Comentario"
                    v-model="record.comentario"
                    @blur="validateComentario()"
                    :rules="[(v) => validateComentario(v)]"
                    lazy-validation
                    :error-messages="errorComentario"
                    clearable
                  >
                  </v-text-field>
                </v-row>
                <v-row>
                  <v-switch
                    :label="`Estado: ${record.status ? 'Activo' : 'Inactivo'}`"
                    v-model="record.status"
                    color="success"
                  ></v-switch>
                </v-row>
              </v-form>             
            </v-card-text>
    
            <v-card-actions class="justify-end mt-3">
              <v-btn 
                class="mx-1" 
                color="success" 
                @click="saveChangesComentarioPredefinido"
                :loading="isSubmitBtnLoading"
              >Aceptar</v-btn>
              <v-btn
                class="mx-1"
                dark
                color="warning"
                @click="showFilterDrawerEdit = !showFilterDrawerEdit"
              >Cerrar</v-btn>
            </v-card-actions>
          </v-container>
        </v-navigation-drawer>
    
        <!--FILTER RECORD-->
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
                FILTRAR REGISTROS
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
    
          <v-spacer></v-spacer>
    
          <v-container>
            <v-card-text>
              <v-row>
                <v-text-field
                  label="Código"
                  v-model="filterData.code"
                  clearable
                ></v-text-field>
              </v-row>
              <v-row>
                <v-text-field
                  label="Comentario"
                  v-model="filterData.comentario"
                  clearable
                ></v-text-field>
              </v-row>
              <v-row>
                <v-radio-group v-model="filterData.status" row dense>
                  <v-radio label="Activo" color="green" :value="1"></v-radio>
                  <v-radio label="Inactivo" color="red" :value="0"></v-radio>
                  <v-radio label="Todos" color="blue" value="null"></v-radio>
                </v-radio-group>
              </v-row>
            </v-card-text>
          </v-container>
    
          <v-container>
            <v-card-actions class="justify-end mt-3">
              <v-btn 
                class="mx-1" 
                color="success" 
                @click="filterComentariosPredefinidos"
                :loading="isSubmitBtnLoading"
              >Aceptar</v-btn>
              <v-btn 
                class="mx-1" 
                color="ligth" 
                @click="resetFilterComentariosPredefinidos"
              >Limpiar</v-btn>
              <v-btn
                class="mx-1"
                dark
                color="warning"
                @click="showFilterDrawer = !showFilterDrawer"
              >Cerrar</v-btn>
            </v-card-actions>
          </v-container>
        </v-navigation-drawer>
      </v-container>
    </v-card>
</template>
  
<script>
  import { mapState, mapActions } from "vuex";
  import Swal from "sweetalert2";
  import axios from '@/api/axios-config';
  
  export default {
    name: "ListComentariosPredefinidosComponent",
    data() {
      return {
        headers: [
          { text: "Código", align: "start", value: "code", width: "15%" },
          { text: "Comentario", value: "comentario", width: "32.5%" },
          { text: "Estado", value: "status", width: "12.5%" },
          { text: "Creación", value: "created_at", width: "15%" },  
          { text: "Última Actualización", value: "updated_at", width: "15%" },
          { text: "Acciones", value: "action", width: "10%" },
        ],
        loading: false,
        search: "",
        record: {
          id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
          code: "",
          comentario: "",
          status: 1,
        },
        showFilterDrawerNew: false,
        showFilterDrawerView: false,
        showFilterDrawerEdit: false,
        showFilterDrawer: false,
        errorCodigo: null,
        errorComentario: null,
        isDataTableLoading: false,
        isSubmitBtnLoading: false,
        isExportBtnLoading: false,
        isAutoGeneratingCode: false,
        filterData: {
          code: "",
          comentario: "",
          status: 1,
        },
      };
    },
    async mounted() {
      await this.fetchListadoComentariosPredefinidos(this.filterData);

      this.$store.state.mainTitle = "LISTADO DE COMENTARIOS PREDEFINIDOS DE BITÁCORA";
    },
    methods: {
      ...mapActions([
        "fetchListadoComentariosPredefinidos", 
        "fetchMaxCodeListadoComentariosPredefinidos", 
        "insertComentarioPredefinido", 
        "deleteComentarioPredefinido", 
        "updateComentarioPredefinido", 
        "exportToExcelListadoComentarioPredefinidos"
      ]),
      validateCodigo(v) {
        if (!v) {
          return "El código es requerido";
        } else if (v.length > 5) {
          return "El código permite hasta 5 caracteres";
        } else {
          return true;
        }
      },
      validateComentario(v) {
        if (!v) {
          return "El comentario es requerido";
        } else if (v.length > 255) {
          return "El comentario admite hasta 255 caracteres ";
        } else {
          return true;
        }
      },
      createCode() {
        let codigoMaximo = 0;
        this.$store.state.comentariosPredefinidos.list.filter(v => {
          if (codigoMaximo < parseInt(v.code)) {
            codigoMaximo = parseInt(v.code);
          }
        });

        const codigo = (parseInt(codigoMaximo) + 1).toString().padStart(5, '0');

        return codigo;
      },
      async autogenerateCode() {
        var vm = this;

        vm.isAutoGeneratingCode = true;
        await vm.fetchMaxCodeListadoComentariosPredefinidos();
        vm.isAutoGeneratingCode = false;

        return (parseInt(vm.$store.state.comentariosPredefinidos.maxCode) + 1).toString().padStart(5, '0');
      },
      async addComentarioPredefinido() {
        var vm = this;
    
        vm.record.code        = "";
        vm.record.comentario  = "";
        vm.record.status      = true;

        this.$refs.formNewComentarioPredefinido.resetValidation();

        vm.showFilterDrawerNew = !vm.showFilterDrawerNew;

        await vm.autogenerateCode()
          .then(res => vm.record.code = res);
      },
      async saveComentarioPredefinido() {
        var vm = this;
        if (vm.$refs.formNewComentarioPredefinido.validate()) {
          vm.isSubmitBtnLoading = true;
          await vm.insertComentarioPredefinido(vm.record);
          vm.isSubmitBtnLoading = false;

          vm.showFilterDrawerUpdate = !vm.showFilterDrawerUpdate;
        }        
      },      
      viewComentarioPredefinido(item) {
        var vm = this;

        vm.record = { 
          ...item, 
          status: !!item.status 
        };

        vm.showFilterDrawerView = !vm.showFilterDrawerView;
      },
      async editComentarioPredefinido(item) {
        var vm = this;        

        vm.record = { 
          ...item,
          code: item.code ? item.code : "",
          status: !!item.status 
        };

        vm.showFilterDrawerEdit = !vm.showFilterDrawerEdit;

        if (!vm.record.code)
        {
          await vm.autogenerateCode()
            .then(res => vm.record.code = res);
        }        
      },
      async changeStatusComentarioPredefinido(item) {
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
            await this.deleteComentarioPredefinido(item);
          }
        });
      },
      async saveChangesComentarioPredefinido() {
        var vm = this;
        if (vm.$refs.formEditComentarioPredefinido.validate())
        {
          vm.isSubmitBtnLoading = true;
          await vm.updateComentarioPredefinido(vm.record);
          vm.isSubmitBtnLoading = false;

          vm.showFilterDrawerUpdate = !vm.showFilterDrawerUpdate;
        }        
      },
      showFilterComentariosPredefinidos() {
        var vm = this;

        vm.showFilterDrawer = !vm.showFilterDrawer;
      },
      async filterComentariosPredefinidos() {
        var vm = this;

        vm.isSubmitBtnLoading = true;
        await vm.fetchListadoComentariosPredefinidos(vm.filterData);
        vm.isSubmitBtnLoading = false;
        
        vm.showFilterDrawer = !vm.showFilterDrawer;
      },
      async resetFilterComentariosPredefinidos() {
        var vm = this;

        vm.filterData.code        = "";
        vm.filterData.comentario  = "";
        vm.filterData.status      = 1;

        await vm.fetchListadoComentariosPredefinidos(vm.filterData);

        vm.showFilterDrawer = !vm.showFilterDrawer;
      },
      async exportToExcel() {
        var vm = this;

        vm.isExportBtnLoading = true;
        await vm.exportToExcelListadoComentarioPredefinidos();
        vm.isExportBtnLoading = false;
      },
      getFechaBonita(fecha) {
        if (fecha) {
          return fecha.split("-").reverse().join("-");
        }
        return "";
      }
    },
    watch: {
      "$store.state.comentariosPredefinidos.loading": {
        handler(newValue, oldValue) {          
          this.isDataTableLoading = newValue;
        },
        immediate: true,
      },
    },
  };
</script>
  