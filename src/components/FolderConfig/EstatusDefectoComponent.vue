<template>
  <v-card>
    <v-card-title class="d-flex align-center flex-wrap">
      <span class="headline text-h5">Configuración de Estatus por Defecto</span>
      <v-spacer></v-spacer>
    </v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12" md="6">
          <v-select
            v-model="estatusSeleccionado"
            :items="estatusDisponibles"
            item-title="name"
            item-value="id"
            label="Estatus por defecto para cotizaciones"
            density="compact"
            variant="outlined"
            :loading="loadingEstatus"
          ></v-select>
        </v-col>
        <v-col cols="12" md="6">
          <v-btn 
            color="primary" 
            @click="guardarEstatusDefecto" 
            :disabled="!estatusSeleccionado"
            :loading="guardando"
          >
            <v-icon start>mdi-content-save</v-icon>
            Guardar Configuración
          </v-btn>
        </v-col>
      </v-row>
      
      <v-divider class="my-4"></v-divider>
      
      <v-row>
        <v-col cols="12">
          <h3>Información actual:</h3>
          <v-chip 
            v-if="configuracionActual" 
            color="success" 
            variant="outlined"
            class="ma-2"
          >
            <v-icon start>mdi-check-circle</v-icon>
            Estatus actual: {{ configuracionActual.name }}
          </v-chip>
          <v-chip 
            v-else 
            color="warning" 
            variant="outlined"
            class="ma-2"
          >
            <v-icon start>mdi-alert-circle</v-icon>
            Sin configuración establecida
          </v-chip>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script>
import axios from 'axios';
import Swal from 'sweetalert2';

export default {
  name: 'EstatusDefectoComponent',
  data() {
    return {
      estatusSeleccionado: null,
      estatusDisponibles: [],
      configuracionActual: null,
      loadingEstatus: false,
      guardando: false,
    };
  },
  async mounted() {
    await this.cargarDatos();
  },
  methods: {
    async cargarDatos() {
      this.loadingEstatus = true;
      try {
        // Cargar estatus disponibles para la empresa
        await this.cargarEstatusDisponibles();
        
        // Cargar configuración actual
        await this.cargarConfiguracionActual();
      } catch (error) {
        console.error('Error cargando datos:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los datos de configuración.'
        });
      } finally {
        this.loadingEstatus = false;
      }
    },
    
    async cargarEstatusDisponibles() {
      const id_branch = JSON.parse(sessionStorage.getItem('dataUser'))[0].id_branch;
      const config = {
        method: 'post',
        url: `${import.meta.env.VUE_APP_URL_MAIN}getQuoteStatus`,
        headers: {
          'auth-token': sessionStorage.getItem('auth-token'),
          'Content-Type': 'application/json',
        },
        data: {
          id_branch: id_branch
        }
      };
      
      // Debug request
      console.log('[EstatusDefecto] getQuoteStatus -> request', {
        method: config.method,
        url: config.url,
        hasAuth: !!config.headers['auth-token'],
        body: config.data
      });

      const response = await axios(config);

      // Debug response
      console.log('[EstatusDefecto] getQuoteStatus -> response', {
        estadoflag: response?.data?.estadoflag,
        mensaje: response?.data?.mensaje,
        cantidad: Array.isArray(response?.data?.data) ? response.data.data.length : 0
      });
      if (response.data.estadoflag && response.data.data) {
        this.estatusDisponibles = response.data.data;
      }
    },
    
    async cargarConfiguracionActual() {
      // Buscar en la lista de estatus cuál tiene defaultstatus = 1 para esta empresa
      const estatusConDefault = this.estatusDisponibles.find(estatus => estatus.defaultstatus === 1 || estatus.defaultstatus === '1' || estatus.defaultstatus === true);
      if (estatusConDefault) {
        this.configuracionActual = estatusConDefault;
        this.estatusSeleccionado = estatusConDefault.id;
      } else {
        this.configuracionActual = null;
        this.estatusSeleccionado = null;
      }
    },
    
    async guardarEstatusDefecto() {
      if (!this.estatusSeleccionado) {
        Swal.fire({
          icon: 'warning',
          text: 'Seleccione un estatus por defecto.'
        });
        return;
      }
      
      this.guardando = true;
      try {
        const id_branch = JSON.parse(sessionStorage.getItem('dataUser'))[0].id_branch;
        const payload = {
          id_estatus_defecto: this.estatusSeleccionado,
          id_branch: id_branch,
        };
        
        const config = {
          method: 'put',
          url: `${import.meta.env.VUE_APP_URL_MAIN}configurar_estatus_defecto`,
          headers: {
            'auth-token': sessionStorage.getItem('auth-token'),
            'Content-Type': 'application/json',
          },
          data: payload,
        };
        
        // Debug request
        console.log('[EstatusDefecto] configurar_estatus_defecto -> request', {
          method: config.method,
          url: config.url,
          hasAuth: !!config.headers['auth-token'],
          payload
        });

        const response = await axios(config);
        
        // Debug response
        console.log('[EstatusDefecto] configurar_estatus_defecto -> response', {
          estadoflag: response?.data?.estadoflag,
          mensaje: response?.data?.mensaje
        });
        const ok = response?.data?.estadoflag;
        
        Swal.fire({
          icon: ok ? 'success' : 'error',
          title: ok ? 'Guardado' : 'Error',
          text: ok ? 'Configuración guardada correctamente.' : (response?.data?.mensaje || 'No se pudo guardar.'),
        });
        
        if (ok) {
          // Recargar la lista completa para obtener los valores actualizados
          await this.cargarEstatusDisponibles();
          await this.cargarConfiguracionActual();
        }
      } catch (error) {
        console.error('Error guardando configuración:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'No se pudo guardar la configuración.'
        });
      } finally {
        this.guardando = false;
      }
    },
  },
};
</script>

<style scoped>
.headline {
  font-weight: 500;
}
</style>
