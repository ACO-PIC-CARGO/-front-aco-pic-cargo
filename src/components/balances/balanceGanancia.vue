<template fluid>
  <v-container fluid>
    <v-dialog
      v-model="dialog"
      persistent
      width="30%"
      transition="dialog-transition"
      transparent
    >
      <v-card>
        <ProgressBar :progress="progress" height="30vh" />
      </v-card>
    </v-dialog>
    <!--  -->
    <v-dialog
      v-model="dialogComparar"
      persistent
      max-width="50%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title class="d-flex align-center flex-wrap" primary-title>
          SE REALIZARÁ LA COMPARACIÓN ENTRE REPORTE DE GANANCIAS
          <v-spacer></v-spacer>
          <v-btn variant="text" icon color="default" @click="dialogComparar = !dialogComparar">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="frmCompare">
            <v-col>
              <v-autocomplete item-title="text"
                :items="months"
                v-model="id_month"
                label="MES"
                :rules="[(v) => !!v || 'Dato Requerido']"
              >
              </v-autocomplete>
            </v-col>
            <v-col>
              <v-autocomplete item-title="text"
                :items="years"
                item-value="value"
                v-model="year"
                label="AÑO"
              ></v-autocomplete>
            </v-col>
            <v-col>
              <v-alert
                border="start"
                border-color="deep-purple-accent-4"
                color="surface"
                elevation="2"
              >
                <p>VERSUS</p>
                PROYECCIÓN DE GASTOS
                {{ $store.state.proyecciones.proyeccionaprobada }}
              </v-alert>
            </v-col>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn size="small" color="success" @click="comparar">Comparar</v-btn>
          <v-btn
            size="small"
            color="red"
            @click="dialogComparar = !dialogComparar"
            >Cerrar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-navigation-drawer
      v-model="filtar"
      absolute
      location="right"
      temporary
      width="20%"
    >
      <v-list-item>
        
          <v-list-item-title class="text-h6">
            Filtrar Detalle
          </v-list-item-title>
        
      </v-list-item>

      <v-divider></v-divider>
      <v-list density="compact" nav>
        <v-radio-group v-model="tipofiltro" inline>
          <v-radio label="Ingreso" :value="1"></v-radio>
          <v-radio label="Gasto" color="red" :value="2"></v-radio>
        </v-radio-group>
      </v-list>
      <v-divider></v-divider>
      <v-list density="compact" nav>
        <v-row v-if="tipofiltro == 1">
          <v-col cols="12">
            <v-autocomplete
              label="Tipo de Ingreso"
              :items="$store.state.balances.tipoingreso"
              v-model="tipoingreso"
              auto-select-first
              clearable
              density="compact"
              item-title="description"
              item-value="id"
            ></v-autocomplete>
          </v-col>
          <v-col cols="12">
            <v-autocomplete
              label="Subtipo de Ingreso"
              :items="tiposubingresoFilter"
              v-model="tiposubingreso"
              auto-select-first
              clearable
              density="compact"
              item-title="description"
              item-value="id"
            ></v-autocomplete>
          </v-col>
          <v-col cols="12">
            <v-text-field
              type="number"
              label="Expediente"
              v-model="nro_expediente"
              clearable
              density="compact"
              step="1"
            ></v-text-field>
          </v-col>
          <v-col cols="12">
            <v-text-field
              type="number"
              label="Monto"
              v-model="monto"
              clearable
              density="compact"
              step="0.01"
            ></v-text-field>
          </v-col>
        </v-row>
        <v-row v-if="tipofiltro == 2">
          <v-col cols="12">
            <v-autocomplete
              label="Tipo de Gasto"
              :items="$store.state.balances.tipogastos"
              v-model="tipogastos"
              auto-select-first
              clearable
              density="compact"
              item-title="description"
              item-value="id"
            ></v-autocomplete>
          </v-col>
          <v-col cols="12">
            <v-autocomplete
              label="Subtipo de Gasto"
              :items="tiposubgastosFilter"
              v-model="tiposubgastos"
              auto-select-first
              clearable
              density="compact"
              item-title="description"
              item-value="id"
            ></v-autocomplete>
          </v-col>
          <v-col cols="12">
            <v-autocomplete
              label="Proveedor"
              :items="$store.state.provedores"
              v-model="proveedor"
              auto-select-first
              clearable
              density="compact"
              item-title="namelong"
              item-value="id"
            ></v-autocomplete>
          </v-col>
          <v-col cols="12">
            <v-text-field
              type="number"
              label="Monto"
              v-model="monto"
              clearable
              density="compact"
              step="0.01"
            ></v-text-field>
          </v-col>
        </v-row>
      </v-list>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn size="small" color="success" :disabled="!tipofiltro" @click="filtrar()"
          >Aceptar</v-btn
        >
        <v-btn size="small" color="red" @click="filtar = !filtar">Cerrar</v-btn>
      </v-card-actions>
    </v-navigation-drawer>
    <!--  -->
    <v-card>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-autocomplete item-title="text"
              :items="months"
              v-model="month"
              label="Mes(s)"
              auto-select-first
              chips
              multiple
              closable-chips
              density="compact"
              clearable
            >
            </v-autocomplete>
          </v-col>
          <v-col cols="12" md="2">
            <v-autocomplete item-title="text"
              :items="years"
              item-value="value"
              v-model="year"
              label="Año"
              density="compact"
            ></v-autocomplete>
          </v-col>

          <v-spacer vertical></v-spacer>
          <v-col cols="12" md="4">
            <v-btn
              class="mx-1"
              size="small"
              color="#0500EE"
              @click="ListBalanaceGanancia()"
              >Generar</v-btn
            >
            <v-btn class="mx-1" size="small" color="success" @click="exportar()"
              >Exportar</v-btn
            >
            <v-btn
              class="mx-1"
              size="small"
              color="#00789D"
              @click="filtar = !filtar"
              >Filtrar</v-btn
            >
            <v-btn
              class="mx-1"
              size="small"
              color="#FF6D00"
              @click="dialogComparar = !dialogComparar"
              >Comparar</v-btn
            >
          </v-col>
        </v-row>
        <v-tabs v-model="tab" align-tabs="center" stacked>
          <v-tab
            value="resumen"
            prepend-icon="mdi-all-inclusive"
            :disabled="itemsResumen.length == 0"
          >
            Resumen
          </v-tab>

          <v-tab
            value="filtro"
            prepend-icon="mdi-filter-multiple"
            :disabled="
              itemsGananciaFiltro.length == 0 && itemsGastosFiltro.length == 0
            "
          >
            Filtro
          </v-tab>
          <v-tab
            value="compare"
            prepend-icon="mdi-compare-horizontal"
            :disabled="this.$store.state.balances.comparativo.length == 0"
          >
            Comparación
          </v-tab>
        </v-tabs>
        <!--  -->
        <v-tabs-window v-model="tab" class="mt-5">
          <v-tabs-window-item value="resumen" v-if="itemsResumen.length > 0">
            <v-card flat>
              <v-row>
                <v-col cols="12">
                  <center><h2>Ganancia</h2></center>
                </v-col>
                <v-col cols="12">
                  <v-table>
                    <thead>
                      <tr>
                        <th>Descripcion</th>
                        <th v-if="month.includes('01')">Enero</th>
                        <th v-if="month.includes('02')">Febrero</th>
                        <th v-if="month.includes('03')">Marzo</th>
                        <th v-if="month.includes('04')">Abril</th>
                        <th v-if="month.includes('05')">Mayo</th>
                        <th v-if="month.includes('06')">Junio</th>
                        <th v-if="month.includes('07')">Julio</th>
                        <th v-if="month.includes('08')">Agosto</th>
                        <th v-if="month.includes('09')">Septiembre</th>
                        <th v-if="month.includes('10')">Octubre</th>
                        <th v-if="month.includes('11')">Noviembre</th>
                        <th v-if="month.includes('12')">Diciembre</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(element, index) in itemsResumen" :key="index">
                        <td>{{ element.description }}</td>
                        <td v-if="month.includes('01')">{{ element.enero }}</td>
                        <td v-if="month.includes('02')">
                          {{ element.febrero }}
                        </td>
                        <td v-if="month.includes('03')">{{ element.marzo }}</td>
                        <td v-if="month.includes('04')">{{ element.abril }}</td>
                        <td v-if="month.includes('05')">{{ element.mayo }}</td>
                        <td v-if="month.includes('06')">{{ element.junio }}</td>
                        <td v-if="month.includes('07')">{{ element.julio }}</td>
                        <td v-if="month.includes('08')">
                          {{ element.agosto }}
                        </td>
                        <td v-if="month.includes('09')">
                          {{ element.septiembre }}
                        </td>
                        <td v-if="month.includes('10')">
                          {{ element.octubre }}
                        </td>
                        <td v-if="month.includes('11')">
                          {{ element.noviembre }}
                        </td>
                        <td v-if="month.includes('12')">
                          {{ element.diciembre }}
                        </td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-col>
                <v-col cols="12">
                  <v-expansion-panels variant="popout">
                    <v-expansion-panel>
                      <v-expansion-panel-title class="t-siaplican">
                        <h2>Conceptos que SI aplican</h2>
                        <template v-slot:actions>
                          <v-icon color="#000000"> mdi-currency-usd </v-icon>
                        </template>
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <v-table class="myTable">
                          <thead class="headerTable">
                            <tr>
                              <th class="headerTable">Descripcion</th>
                              <th
                                class="headerTable"
                                v-if="month.includes('01')"
                              >
                                Enero
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('02')"
                              >
                                Febrero
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('03')"
                              >
                                Marzo
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('04')"
                              >
                                Abril
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('05')"
                              >
                                Mayo
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('06')"
                              >
                                Junio
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('07')"
                              >
                                Julio
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('08')"
                              >
                                Agosto
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('09')"
                              >
                                Septiembre
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('10')"
                              >
                                Octubre
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('11')"
                              >
                                Noviembre
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('12')"
                              >
                                Diciembre
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            <tr class="totalStyle">
                              <td>Totales</td>
                              <td v-if="month.includes('01')">
                                {{
                                  parseFloat(
                                    parseFloat(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !!v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.enero) {
                                            return (
                                              parseFloat(sum) +
                                              parseFloat(item.enero)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    ) -
                                      parseFloat(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !!v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.enero) {
                                              return (
                                                parseFloat(sum) +
                                                parseFloat(item.enero)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      )
                                  ).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('02')">
                                {{
                                  parseFloat(
                                    parseFloat(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !!v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.febrero) {
                                            return (
                                              parseFloat(sum) +
                                              parseFloat(item.febrero)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    ) -
                                      parseFloat(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !!v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.febrero) {
                                              return (
                                                parseFloat(sum) +
                                                parseFloat(item.febrero)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      )
                                  ).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('03')">
                                {{
                                  parseFloat(
                                    parseFloat(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !!v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.marzo) {
                                            return (
                                              parseFloat(sum) +
                                              parseFloat(item.marzo)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    ) -
                                      parseFloat(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !!v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.marzo) {
                                              return (
                                                parseFloat(sum) +
                                                parseFloat(item.marzo)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      )
                                  ).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('04')">
                                {{
                                  parseFloat(
                                    parseFloat(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !!v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.abril) {
                                            return (
                                              parseFloat(sum) +
                                              parseFloat(item.abril)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    ) -
                                      parseFloat(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !!v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.abril) {
                                              return (
                                                parseFloat(sum) +
                                                parseFloat(item.abril)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      )
                                  ).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('05')">
                                {{
                                  parseFloat(
                                    parseFloat(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !!v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.mayo) {
                                            return (
                                              parseFloat(sum) +
                                              parseFloat(item.mayo)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    ) -
                                      parseFloat(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !!v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.mayo) {
                                              return (
                                                parseFloat(sum) +
                                                parseFloat(item.mayo)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      )
                                  ).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('06')">
                                {{
                                  parseFloat(
                                    parseFloat(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !!v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.junio) {
                                            return (
                                              parseFloat(sum) +
                                              parseFloat(item.junio)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    ) -
                                      parseFloat(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !!v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.junio) {
                                              return (
                                                parseFloat(sum) +
                                                parseFloat(item.junio)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      )
                                  ).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('07')">
                                {{
                                  parseFloat(
                                    parseFloat(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !!v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.julio) {
                                            return (
                                              parseFloat(sum) +
                                              parseFloat(item.julio)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    ) -
                                      parseFloat(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !!v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.julio) {
                                              return (
                                                parseFloat(sum) +
                                                parseFloat(item.julio)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      )
                                  ).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('08')">
                                {{
                                  parseFloat(
                                    parseFloat(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !!v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.agosto) {
                                            return (
                                              parseFloat(sum) +
                                              parseFloat(item.agosto)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    ) -
                                      parseFloat(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !!v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.agosto) {
                                              return (
                                                parseFloat(sum) +
                                                parseFloat(item.agosto)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      )
                                  ).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('09')">
                                {{
                                  parseFloat(
                                    parseFloat(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !!v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.septiembre) {
                                            return (
                                              parseFloat(sum) +
                                              parseFloat(item.septiembre)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    ) -
                                      parseFloat(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !!v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.septiembre) {
                                              return (
                                                parseFloat(sum) +
                                                parseFloat(item.septiembre)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      )
                                  ).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('10')">
                                {{
                                  parseFloat(
                                    parseFloat(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !!v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.octubre) {
                                            return (
                                              parseFloat(sum) +
                                              parseFloat(item.octubre)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    ) -
                                      parseFloat(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !!v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.octubre) {
                                              return (
                                                parseFloat(sum) +
                                                parseFloat(item.octubre)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      )
                                  ).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('11')">
                                {{
                                  parseFloat(
                                    parseFloat(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !!v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.noviembre) {
                                            return (
                                              parseFloat(sum) +
                                              parseFloat(item.noviembre)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    ) -
                                      parseFloat(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !!v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.noviembre) {
                                              return (
                                                parseFloat(sum) +
                                                parseFloat(item.noviembre)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      )
                                  ).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('12')">
                                {{
                                  parseFloat(
                                    parseFloat(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !!v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.diciembre) {
                                            return (
                                              parseFloat(sum) +
                                              parseFloat(item.diciembre)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    ) -
                                      parseFloat(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !!v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.diciembre) {
                                              return (
                                                parseFloat(sum) +
                                                parseFloat(item.diciembre)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      )
                                  ).toFixed(2)
                                }}
                              </td>
                            </tr>
                            <tr
                              v-for="element in itemsResumenGananciaxTipoIngreso.filter(
                                (v) => !!v.aplica
                              )"
                              :key="element"
                              class="colorIngreso"
                            >
                              <td>{{ element.tipo_ingreso }}</td>
                              <td v-if="month.includes('01')">
                                {{ element.enero ? element.enero : 0 }}
                              </td>
                              <td v-if="month.includes('02')">
                                {{ element.febrero ? element.febrero : 0 }}
                              </td>
                              <td v-if="month.includes('03')">
                                {{ element.marzo ? element.marzo : 0 }}
                              </td>
                              <td v-if="month.includes('04')">
                                {{ element.abril ? element.abril : 0 }}
                              </td>
                              <td v-if="month.includes('05')">
                                {{ element.mayo ? element.mayo : 0 }}
                              </td>
                              <td v-if="month.includes('06')">
                                {{ element.junio ? element.junio : 0 }}
                              </td>
                              <td v-if="month.includes('07')">
                                {{ element.julio ? element.julio : 0 }}
                              </td>
                              <td v-if="month.includes('08')">
                                {{ element.agosto ? element.agosto : 0 }}
                              </td>
                              <td v-if="month.includes('09')">
                                {{
                                  element.septiembre ? element.septiembre : 0
                                }}
                              </td>
                              <td v-if="month.includes('10')">
                                {{ element.octubre ? element.octubre : 0 }}
                              </td>
                              <td v-if="month.includes('11')">
                                {{ element.noviembre ? element.noviembre : 0 }}
                              </td>
                              <td v-if="month.includes('12')">
                                {{ element.diciembre ? element.diciembre : 0 }}
                              </td>
                            </tr>

                            <tr
                              v-for="element in itemsResumenGastoxTipoGasto.filter(
                                (v) => !!v.aplica
                              )"
                              :key="element"
                              class="colorEgreso"
                            >
                              <td>{{ element.gasto_description }}</td>
                              <td v-if="month.includes('01')">
                                {{ element.enero ? element.enero : 0 }}
                              </td>
                              <td v-if="month.includes('02')">
                                {{ element.febrero ? element.febrero : 0 }}
                              </td>
                              <td v-if="month.includes('03')">
                                {{ element.marzo ? element.marzo : 0 }}
                              </td>
                              <td v-if="month.includes('04')">
                                {{ element.abril ? element.abril : 0 }}
                              </td>
                              <td v-if="month.includes('05')">
                                {{ element.mayo ? element.mayo : 0 }}
                              </td>
                              <td v-if="month.includes('06')">
                                {{ element.junio ? element.junio : 0 }}
                              </td>
                              <td v-if="month.includes('07')">
                                {{ element.julio ? element.julio : 0 }}
                              </td>
                              <td v-if="month.includes('08')">
                                {{ element.agosto ? element.agosto : 0 }}
                              </td>
                              <td v-if="month.includes('09')">
                                {{
                                  element.septiembre ? element.septiembre : 0
                                }}
                              </td>
                              <td v-if="month.includes('10')">
                                {{ element.octubre ? element.octubre : 0 }}
                              </td>
                              <td v-if="month.includes('11')">
                                {{ element.noviembre ? element.noviembre : 0 }}
                              </td>
                              <td v-if="month.includes('12')">
                                {{ element.diciembre ? element.diciembre : 0 }}
                              </td>
                            </tr>
                          </tbody>
                        </v-table>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </v-col>
                <v-col
                  cols="12"
                  v-if="$store.state.balances.flujoprepostmes.length > 0"
                >
                  <v-expansion-panels variant="popout">
                    <v-expansion-panel>
                      <v-expansion-panel-title class="t-flujoprepost">
                        <h2>Fluje de Dinero</h2>
                        <template v-slot:actions>
                          <v-icon color="#fff"> mdi-cash-100 </v-icon>
                        </template>
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <FlujoPrePostComponet :month="month" :year="year" />
                      </v-expansion-panel-text> </v-expansion-panel
                  ></v-expansion-panels>
                </v-col>

                <v-col cols="12">
                  <v-expansion-panels variant="popout">
                    <v-expansion-panel>
                      <v-expansion-panel-title class="t-noaplican">
                        <h2>Conceptos que NO aplican</h2>
                        <template v-slot:actions>
                          <v-icon color="#ffffff">
                            mdi-currency-usd-off
                          </v-icon>
                        </template>
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <v-table class="myTable">
                          <thead>
                            <tr class="headerTable">
                              <th class="headerTable">Descripcion</th>
                              <th
                                class="headerTable"
                                v-if="month.includes('01')"
                              >
                                Enero
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('02')"
                              >
                                Febrero
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('03')"
                              >
                                Marzo
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('04')"
                              >
                                Abril
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('05')"
                              >
                                Mayo
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('06')"
                              >
                                Junio
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('07')"
                              >
                                Julio
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('08')"
                              >
                                Agosto
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('09')"
                              >
                                Septiembre
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('10')"
                              >
                                Octubre
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('11')"
                              >
                                Noviembre
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('12')"
                              >
                                Diciembre
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            <tr class="totalStyle">
                              <td>Totales</td>
                              <td v-if="month.includes('01')">
                                {{
                                  parseFloat(
                                    parseFloat(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.enero) {
                                            return (
                                              parseFloat(sum) +
                                              parseFloat(item.enero)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    ) -
                                      parseFloat(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.enero) {
                                              return (
                                                parseFloat(sum) +
                                                parseFloat(item.enero)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      )
                                  ).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('02')">
                                {{
                                  parseFloat(
                                    parseFloat(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.febrero) {
                                            return (
                                              parseFloat(sum) +
                                              parseFloat(item.febrero)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    ) -
                                      parseFloat(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.febrero) {
                                              return (
                                                parseFloat(sum) +
                                                parseFloat(item.febrero)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      )
                                  ).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('03')">
                                {{
                                  parseFloat(
                                    parseFloat(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.marzo) {
                                            return (
                                              parseFloat(sum) +
                                              parseFloat(item.marzo)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    ) -
                                      parseFloat(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.marzo) {
                                              return (
                                                parseFloat(sum) +
                                                parseFloat(item.marzo)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      )
                                  ).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('04')">
                                {{
                                  parseFloat(
                                    parseFloat(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.abril) {
                                            return (
                                              parseFloat(sum) +
                                              parseFloat(item.abril)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    ) -
                                      parseFloat(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.abril) {
                                              return (
                                                parseFloat(sum) +
                                                parseFloat(item.abril)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      )
                                  ).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('05')">
                                {{
                                  parseFloat(
                                    parseFloat(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.mayo) {
                                            return (
                                              parseFloat(sum) +
                                              parseFloat(item.mayo)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    ) -
                                      parseFloat(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.mayo) {
                                              return (
                                                parseFloat(sum) +
                                                parseFloat(item.mayo)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      )
                                  ).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('06')">
                                {{
                                  parseFloat(
                                    parseFloat(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.junio) {
                                            return (
                                              parseFloat(sum) +
                                              parseFloat(item.junio)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    ) -
                                      parseFloat(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.junio) {
                                              return (
                                                parseFloat(sum) +
                                                parseFloat(item.junio)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      )
                                  ).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('07')">
                                {{
                                  parseFloat(
                                    parseFloat(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.julio) {
                                            return (
                                              parseFloat(sum) +
                                              parseFloat(item.julio)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    ) -
                                      parseFloat(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.julio) {
                                              return (
                                                parseFloat(sum) +
                                                parseFloat(item.julio)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      )
                                  ).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('08')">
                                {{
                                  parseFloat(
                                    parseFloat(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.agosto) {
                                            return (
                                              parseFloat(sum) +
                                              parseFloat(item.agosto)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    ) -
                                      parseFloat(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.agosto) {
                                              return (
                                                parseFloat(sum) +
                                                parseFloat(item.agosto)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      )
                                  ).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('09')">
                                {{
                                  parseFloat(
                                    parseFloat(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.septiembre) {
                                            return (
                                              parseFloat(sum) +
                                              parseFloat(item.septiembre)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    ) -
                                      parseFloat(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.septiembre) {
                                              return (
                                                parseFloat(sum) +
                                                parseFloat(item.septiembre)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      )
                                  ).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('10')">
                                {{
                                  parseFloat(
                                    parseFloat(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.octubre) {
                                            return (
                                              parseFloat(sum) +
                                              parseFloat(item.octubre)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    ) -
                                      parseFloat(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.octubre) {
                                              return (
                                                parseFloat(sum) +
                                                parseFloat(item.octubre)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      )
                                  ).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('11')">
                                {{
                                  parseFloat(
                                    parseFloat(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.noviembre) {
                                            return (
                                              parseFloat(sum) +
                                              parseFloat(item.noviembre)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    ) -
                                      parseFloat(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.noviembre) {
                                              return (
                                                parseFloat(sum) +
                                                parseFloat(item.noviembre)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      )
                                  ).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('12')">
                                {{
                                  parseFloat(
                                    parseFloat(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.diciembre) {
                                            return (
                                              parseFloat(sum) +
                                              parseFloat(item.diciembre)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    ) -
                                      parseFloat(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.diciembre) {
                                              return (
                                                parseFloat(sum) +
                                                parseFloat(item.diciembre)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      )
                                  ).toFixed(2)
                                }}
                              </td>
                            </tr>
                            <tr
                              v-for="element in itemsResumenGananciaxTipoIngreso.filter(
                                (v) => !v.aplica
                              )"
                              :key="element"
                              class="colorIngreso"
                            >
                              <td>{{ element.tipo_ingreso }}</td>
                              <td v-if="month.includes('01')">
                                {{ element.enero ? element.enero : 0 }}
                              </td>
                              <td v-if="month.includes('02')">
                                {{ element.febrero ? element.febrero : 0 }}
                              </td>
                              <td v-if="month.includes('03')">
                                {{ element.marzo ? element.marzo : 0 }}
                              </td>
                              <td v-if="month.includes('04')">
                                {{ element.abril ? element.abril : 0 }}
                              </td>
                              <td v-if="month.includes('05')">
                                {{ element.mayo ? element.mayo : 0 }}
                              </td>
                              <td v-if="month.includes('06')">
                                {{ element.junio ? element.junio : 0 }}
                              </td>
                              <td v-if="month.includes('07')">
                                {{ element.julio ? element.julio : 0 }}
                              </td>
                              <td v-if="month.includes('08')">
                                {{ element.agosto ? element.agosto : 0 }}
                              </td>
                              <td v-if="month.includes('09')">
                                {{
                                  element.septiembre ? element.septiembre : 0
                                }}
                              </td>
                              <td v-if="month.includes('10')">
                                {{ element.octubre ? element.octubre : 0 }}
                              </td>
                              <td v-if="month.includes('11')">
                                {{ element.noviembre ? element.noviembre : 0 }}
                              </td>
                              <td v-if="month.includes('12')">
                                {{ element.diciembre ? element.diciembre : 0 }}
                              </td>
                            </tr>

                            <tr
                              v-for="element in itemsResumenGastoxTipoGasto.filter(
                                (v) => !v.aplica
                              )"
                              :key="element"
                              class="colorEgreso"
                            >
                              <td>{{ element.gasto_description }}</td>
                              <td v-if="month.includes('01')">
                                {{ element.enero ? element.enero : 0 }}
                              </td>
                              <td v-if="month.includes('02')">
                                {{ element.febrero ? element.febrero : 0 }}
                              </td>
                              <td v-if="month.includes('03')">
                                {{ element.marzo ? element.marzo : 0 }}
                              </td>
                              <td v-if="month.includes('04')">
                                {{ element.abril ? element.abril : 0 }}
                              </td>
                              <td v-if="month.includes('05')">
                                {{ element.mayo ? element.mayo : 0 }}
                              </td>
                              <td v-if="month.includes('06')">
                                {{ element.junio ? element.junio : 0 }}
                              </td>
                              <td v-if="month.includes('07')">
                                {{ element.julio ? element.julio : 0 }}
                              </td>
                              <td v-if="month.includes('08')">
                                {{ element.agosto ? element.agosto : 0 }}
                              </td>
                              <td v-if="month.includes('09')">
                                {{
                                  element.septiembre ? element.septiembre : 0
                                }}
                              </td>
                              <td v-if="month.includes('10')">
                                {{ element.octubre ? element.octubre : 0 }}
                              </td>
                              <td v-if="month.includes('11')">
                                {{ element.noviembre ? element.noviembre : 0 }}
                              </td>
                              <td v-if="month.includes('12')">
                                {{ element.diciembre ? element.diciembre : 0 }}
                              </td>
                            </tr>
                          </tbody>
                        </v-table>
                      </v-expansion-panel-text>
                    </v-expansion-panel></v-expansion-panels
                  >
                </v-col>
                <v-col cols="12">
                  <v-expansion-panels variant="popout">
                    <v-expansion-panel>
                      <v-expansion-panel-title class="t-info">
                        <h2>Resumen Detallado</h2>
                        <template v-slot:actions>
                          <v-icon color="#000000"> mdi-alert-circle </v-icon>
                        </template>
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <v-data-table
                          :headers="headersDetailsGanancia"
                          :items="itemsGanancia"
                          width="100%"
                          sticky-header
                        >
                        </v-data-table>

                        <v-data-table
                          :headers="headersDetailsGastos"
                          :items="itemsGastos"
                          width="100%"
                        >
                        </v-data-table>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </v-col>

                <!--  -->
              </v-row>
            </v-card>
          </v-tabs-window-item>
          <v-tabs-window-item
            value="filtro"
            v-if="
              itemsGananciaFiltro.length > 0 || itemsGastosFiltro.length > 0
            "
          >
            <v-card flat>
              <center>
                <h3>
                  RESUMEN DETALLADO {{ tipofiltro == 1 ? "INGRESO" : "EGRESO" }}
                </h3>
              </center>
              <v-card-text>
                <v-data-table
                  v-if="tipofiltro == 1"
                  :headers="headersDetailsGananciaFiltro"
                  :items="itemsGananciaFiltro"
                  width="100%"
                  sticky-header
                >
                  <template v-slot:[`item.editar`]="{ item }">
                    <v-icon
                      v-if="
                        item.isoperativo ||
                        (!item.isoperativo && item.editarflag)
                      "
                      color="orange-darken-2"
                      class="mr-2"
                      @click="redirectEditarGanancia(item.id, item.isoperativo)"
                    >
                      mdi-pencil
                    </v-icon>
                    <v-icon
                      v-if="!item.isoperativo && !item.editarflag"
                      color="blue-grey-darken-2"
                      class="mr-2"
                      @click="redirectViewGanancia(item.id, item.isoperativo)"
                    >
                      mdi-eye
                    </v-icon>
                  </template>
                </v-data-table>

                <v-data-table
                  v-if="tipofiltro == 2"
                  :headers="headersDetailsGastosFiltro"
                  :items="itemsGastosFiltro"
                  width="100%"
                >
                  <template v-slot:[`item.editar`]="{ item }">
                    <v-icon
                      color="blue-grey-darken-2"
                      class="mr-2"
                      @click="redirectGasto(item.id)"
                    >
                      mdi-eye
                    </v-icon>
                    <v-icon
                      v-if="item.editarflag"
                      color="orange-darken-2"
                      class="mr-2"
                      @click="redirectGasto(item.id)"
                    >
                      mdi-pencil
                    </v-icon>
                  </template>
                </v-data-table>
              </v-card-text>
            </v-card>
          </v-tabs-window-item>
          <v-tabs-window-item
            value="compare"
            v-if="$store.state.balances.comparativo.length > 0"
          >
            <TableDinamica
              :items="$store.state.balances.comparativo"
              :mes="
                id_month
                  ? months.filter((v) => v.value == id_month)[0].text
                  : ''
              "
            />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
import ProgressBar from "@/components/comun/ProgressBar.vue";
import TableDinamica from "@/components/comun/tableDinamica.vue";
import FlujoPrePostComponet from "@/components/comun/tablaDinamicaFlujoPrePostMes.vue";
import moment from "moment";
import { mapActions, mapState } from "vuex";
import entities from "../../store/modules/entitie";
export default {
  components: {
    ProgressBar,
    TableDinamica,
    FlujoPrePostComponet,
  },
  data() {
    return {
      flujopreproflag: false,
      tab: "",
      filtar: false,
      dialogComparar: false,
      id_month: moment().format("MM"),
      tipofiltro: null,
      tipoingreso: "",
      tiposubingreso: "",
      nro_expediente: "",
      tipogastos: "",
      tiposubgastos: "",
      cliente: "",
      proveedor: "",
      monto: "",
      tiposubingresoFilter: [],
      tiposubgastosFilter: [],
      dialog: false,
      progress: 0,
      years: [],
      siAplicaFlag: false,
      noAplicaFlag: false,
      months: [
        { text: "ENERO", value: "01" },
        { text: "FEBRERO", value: "02" },
        { text: "MARZO", value: "03" },
        { text: "ABRIL", value: "04" },
        { text: "MAYO", value: "05" },
        { text: "JUNIO", value: "06" },
        { text: "JULIO", value: "07" },
        { text: "AGOSTO", value: "08" },
        { text: "SEPTIEMBRE", value: "09" },
        { text: "OCTUBRE", value: "10" },
        { text: "NOVIEMBRE", value: "11" },
        { text: "DICIEMBRE", value: "12" },
      ],
      year: new Date().getFullYear(),
      month: [],
      itemsGanancia: [],
      itemsGastos: [],
      itemsResumen: [],
      itemsResumenGastoxTipoGasto: [],
      itemsResumenGananciaxTipoIngreso: [],
      itemsGananciaFiltro: [],
      itemsGastosFiltro: [],
      headersDetailsGanancia: [
        { title: "Expediente", key: "exp", headerProps: { class: "header" }, sortable: false },
        {
          title: "Cliente / Cant. House",
          key: "cliente",
          headerProps: { class: "header" },
          sortable: false,
        },
      ],
      headersDetailsGastos: [
        {
          title: "Gastos",
          key: "gasto_description",
          headerProps: { class: "header" },
          sortable: false,
        },
        {
          title: "SubGasto",
          key: "subgasto_description",
          headerProps: { class: "header" },
          sortable: false,
        },
        {
          title: "Proveedor",
          key: "proveedor",
          headerProps: { class: "header" },
          sortable: false,
        },
        {
          title: "Concepto",
          key: "concepto",
          headerProps: { class: "header" },
          sortable: false,
        },
      ],
    };
  },
  computed: {
    ...mapState(["listaGanancia"]),
  },
  async mounted() {
    this.$store.state.spiner = true;
    await Promise.all([
      this.cargarProveedores(),
      this.getCargarTipoIngreso(),
      this.getCargarTipoGastos(),
      this.getCargarTipoSubIngreso(),
      this.getCargarTipoSubGastos(),
      this.getProyeccionAprobada(),
      this.CargarPersona(),
    ]);
    this.tiposubingresoFilter = this.$store.state.balances.tiposubingreso;
    this.tiposubgastosFilter = this.$store.state.balances.tiposubgastos;
    this.obtenerAnios();
    this.$store.state.spiner = false;
  },
  methods: {
    ...mapActions([
      "getListBalanaceGanancia",
      "getResumenBalanaceGanancia",
      "getListBalanaceGastos",
      "getResumenBalanaceGastos",
      "exportarBalanceGanancia",
      "getResumenGastosxTipoGasto",
      "resumenIngresoTipoIngreso",
      "cargarClientes",
      "cargarProveedores",
      "getCargarTipoIngreso",
      "getCargarTipoSubIngreso",
      "getCargarTipoGastos",
      "getCargarTipoSubGastos",
      "getListBalanaceGastosFiltro",
      "getListBalanaceGananciaFiltro",
      "getComparativo",
      "getProyeccionAprobada",
      "getFlujoPrePostMes",
      "CargarPersona",
    ]),

    toggleExpand(tipo) {
      switch (tipo) {
        case 1:
          this.siAplicaFlag = !this.siAplicaFlag;
          break;

        default:
          break;
      }
    },
    obtenerAnios() {
      const currentYear = new Date().getFullYear();
      for (let i = currentYear; i >= 2010; i--) {
        this.years.push(i);
      }
    },
    async ListBalanaceGanancia() {
      if (this.month.length == 0) {
        this.month = [
          "01",
          "02",
          "03",
          "04",
          "05",
          "06",
          "07",
          "08",
          "09",
          "10",
          "11",
          "12",
        ];
      }
      let meses = this.month.join();
      let vm = this;
      let data = {
        year: vm.year,
        month: meses,
        tipoingreso: "",
        tiposubingreso: "",
        nro_expediente: "",
        monto: "",
        tipogastos: "",
        tiposubgastos: "",
        proveedor: "",
        monto: "",
      };

      vm.dialog = true;
      vm.itemsGanancia = [];
      vm.itemsResumen = [];
      vm.itemsGastos = [];
      vm.headersDetailsGanancia = [
        { title: "Expediente", key: "exp", headerProps: { class: "header" }, sortable: false },
        {
          title: "Cliente / Cant. House",
          key: "cliente",
          headerProps: { class: "header" },
          sortable: false,
        },
      ];
      vm.headersDetailsGastos = [
        {
          title: "Gastos",
          key: "gasto_description",
          headerProps: { class: "header" },
          sortable: false,
        },
        {
          title: "SubGasto",
          key: "subgasto_description",
          headerProps: { class: "header" },
          sortable: false,
        },
        {
          title: "Proveedor",
          key: "proveedor",
          headerProps: { class: "header" },
          sortable: false,
        },
        {
          title: "Concepto",
          key: "concepto",
          headerProps: { class: "header" },
          sortable: false,
        },
      ];
      //
      vm.generarCabeceras();
      await vm.getResumenBalanaceGanancia(data);
      vm.progress = 15;
      await vm.getListBalanaceGanancia(data);
      vm.progress = 30;
      await vm.getListBalanaceGastos(data);
      vm.progress = 45;
      await vm.getResumenBalanaceGastos(data);
      vm.progress = 60;
      await vm.resumenIngresoTipoIngreso(data);
      vm.progress = 75;
      await vm.getResumenGastosxTipoGasto(data);
      vm.progress = 90;

      await vm.getFlujoPrePostMes(data);

      // vm.flujopreproflag = true;

      vm.progress = 100;
      vm.generarGananciaDetalles();
      vm.generarGastosDetalles();
      vm.generarBalanceGanancia();
      vm.generarBalanceGastos();
      vm.generarBalanceTotales();
      vm.geneararGastosTipoGasto();
      vm.geneararGastosTipoIngreso();
      vm.tab = "resumen";
      setTimeout(() => {
        vm.dialog = false;
        vm.progress = 0;
      }, 1000);
    },
    generarBalanceGanancia() {
      let resumen = {};
      resumen.description = " Ganancia Operativa + Capacitaciones";
      this.$store.state.balances.resumenGanancia.forEach((element) => {
        switch (element.mes) {
          case "01":
            resumen.enero = element.monto;
            break;
          case "02":
            resumen.febrero = element.monto;
            break;
          case "03":
            resumen.marzo = element.monto;
            break;
          case "04":
            resumen.abril = element.monto;
            break;
          case "05":
            resumen.mayo = element.monto;
            break;
          case "06":
            resumen.junio = element.monto;
            break;
          case "07":
            resumen.julio = element.monto;
            break;
          case "08":
            resumen.agosto = element.monto;
            break;
          case "09":
            resumen.septiembre = element.monto;
            break;
          case "10":
            resumen.octubre = element.monto;
            break;
          case "11":
            resumen.noviembre = element.monto;
            break;
          case "12":
            resumen.diciembre = element.monto;
            break;

          default:
            break;
        }
      });

      this.itemsResumen.push(resumen);
    },
    generarBalanceGastos() {
      let resumen = {};
      resumen.description = "Gastos Administrativos";
      this.$store.state.balances.resumenGastos.forEach((element) => {
        switch (element.mes) {
          case "01":
            resumen.enero = element.monto;
            break;
          case "02":
            resumen.febrero = element.monto;
            break;
          case "03":
            resumen.marzo = element.monto;
            break;
          case "04":
            resumen.abril = element.monto;
            break;
          case "05":
            resumen.mayo = element.monto;
            break;
          case "06":
            resumen.junio = element.monto;
            break;
          case "07":
            resumen.julio = element.monto;
            break;
          case "08":
            resumen.agosto = element.monto;
            break;
          case "09":
            resumen.septiembre = element.monto;
            break;
          case "10":
            resumen.octubre = element.monto;
            break;
          case "11":
            resumen.noviembre = element.monto;
            break;
          case "12":
            resumen.diciembre = element.monto;
            break;

          default:
            break;
        }
      });

      this.itemsResumen.push(resumen);
    },
    generarBalanceTotales() {
      let ganancias = this.itemsResumen[0];
      let perdidas = this.itemsResumen[1];
      let totalPorMes = {};

      for (let mes in ganancias) {
        if (ganancias.hasOwnProperty(mes)) {
          // Verificar que el mes también esté en el objeto de pérdidas
          if (!perdidas.hasOwnProperty(mes)) {
            throw new Error(`No se encontró el mes '${mes}' en las pérdidas`);
          }

          // Convertir los valores de ganancia y pérdida a números
          let ganancia = parseFloat(ganancias[mes]);
          let perdida = parseFloat(perdidas[mes]);

          // Calcular el total por mes restando la pérdida de la ganancia
          let total = ganancia - perdida;

          // Almacenar el total en el objeto totalPorMes
          totalPorMes[mes] = parseFloat(total).toFixed(2);
        }
      }
      totalPorMes.description = "Utilidad";
      this.itemsResumen.push(totalPorMes);
    },

    generarGananciaDetalles() {
      var montosPorMes = {};
      let mes;
      montosPorMes.exp = "TOTALES";

      for (
        let i = 0;
        i < this.$store.state.balances.listaGanancia.length;
        i++
      ) {
        const elemento = this.$store.state.balances.listaGanancia[i];

        switch (elemento.mes) {
          case "01":
            mes = "enero";
            break;
          case "02":
            mes = "febrero";
            break;
          case "03":
            mes = "marzo";
            break;
          case "04":
            mes = "abril";
            break;
          case "05":
            mes = "mayo";
            break;
          case "06":
            mes = "junio";
            break;
          case "07":
            mes = "julio";
            break;
          case "08":
            mes = "agosto";
            break;
          case "09":
            mes = "septiembre";
            break;
          case "10":
            mes = "octubre";
            break;
          case "11":
            mes = "noviembre";
            break;
          case "12":
            mes = "diciembre";
            break;

          default:
            break;
        }
        const ganancia = parseFloat(elemento.ganancia).toFixed(2);
        if (montosPorMes.hasOwnProperty(mes)) {
          montosPorMes[mes] = parseFloat(
            parseFloat(
              parseFloat(montosPorMes[mes] ? montosPorMes[mes] : 0) +
                parseFloat(ganancia)
            )
          ).toFixed(2);
        } else {
          montosPorMes[mes] = parseFloat(
            parseFloat(ganancia).toFixed(2)
          ).toFixed(2);
        }
      }

      this.itemsGanancia.push(montosPorMes);

      //   -------------------------------
      this.$store.state.balances.listaGanancia.forEach((element) => {
        switch (element.mes) {
          case "01":
            this.itemsGanancia.push({
              exp: element.nro_master,
              cliente: element.cliente,
              enero: element.ganancia ? element.ganancia : 0.0,
              febrero: 0.0,
              marzo: 0.0,
              abril: 0.0,
              mayo: 0.0,
              junio: 0.0,
              julio: 0.0,
              agosto: 0.0,
              septiembre: 0.0,
              octubre: 0.0,
              noviembre: 0.0,
              diciembre: 0.0,
            });
            break;
          case "02":
            this.itemsGanancia.push({
              exp: element.nro_master,
              cliente: element.cliente,
              febrero: element.ganancia ? element.ganancia : 0.0,
              enero: 0.0,
              marzo: 0.0,
              abril: 0.0,
              mayo: 0.0,
              junio: 0.0,
              julio: 0.0,
              agosto: 0.0,
              septiembre: 0.0,
              octubre: 0.0,
              noviembre: 0.0,
              diciembre: 0.0,
            });
            break;
          case "03":
            this.itemsGanancia.push({
              exp: element.nro_master,
              cliente: element.cliente,
              marzo: element.ganancia ? element.ganancia : 0.0,
              enero: 0.0,
              febrero: 0.0,
              abril: 0.0,
              mayo: 0.0,
              junio: 0.0,
              julio: 0.0,
              agosto: 0.0,
              septiembre: 0.0,
              octubre: 0.0,
              noviembre: 0.0,
              diciembre: 0.0,
            });
            break;
          case "04":
            this.itemsGanancia.push({
              exp: element.nro_master,
              cliente: element.cliente,
              abril: element.ganancia ? element.ganancia : 0.0,
              enero: 0.0,
              febrero: 0.0,
              marzo: 0.0,
              mayo: 0.0,
              junio: 0.0,
              julio: 0.0,
              agosto: 0.0,
              septiembre: 0.0,
              octubre: 0.0,
              noviembre: 0.0,
              diciembre: 0.0,
            });
            break;
          case "05":
            this.itemsGanancia.push({
              exp: element.nro_master,
              cliente: element.cliente,
              mayo: element.ganancia ? element.ganancia : 0.0,
              enero: 0.0,
              febrero: 0.0,
              marzo: 0.0,
              abril: 0.0,
              junio: 0.0,
              julio: 0.0,
              agosto: 0.0,
              septiembre: 0.0,
              octubre: 0.0,
              noviembre: 0.0,
              diciembre: 0.0,
            });
            break;
          case "06":
            this.itemsGanancia.push({
              exp: element.nro_master,
              cliente: element.cliente,
              junio: element.ganancia ? element.ganancia : 0.0,
              enero: 0.0,
              febrero: 0.0,
              marzo: 0.0,
              abril: 0.0,
              mayo: 0.0,
              julio: 0.0,
              agosto: 0.0,
              septiembre: 0.0,
              octubre: 0.0,
              noviembre: 0.0,
              diciembre: 0.0,
            });
            break;
          case "07":
            this.itemsGanancia.push({
              exp: element.nro_master,
              cliente: element.cliente,
              julio: element.ganancia ? element.ganancia : 0.0,
              enero: 0.0,
              febrero: 0.0,
              marzo: 0.0,
              abril: 0.0,
              mayo: 0.0,
              junio: 0.0,
              agosto: 0.0,
              septiembre: 0.0,
              octubre: 0.0,
              noviembre: 0.0,
              diciembre: 0.0,
            });
            break;
          case "08":
            this.itemsGanancia.push({
              exp: element.nro_master,
              cliente: element.cliente,
              agosto: element.ganancia ? element.ganancia : 0.0,
              enero: 0.0,
              febrero: 0.0,
              marzo: 0.0,
              abril: 0.0,
              mayo: 0.0,
              junio: 0.0,
              julio: 0.0,

              septiembre: 0.0,
              octubre: 0.0,
              noviembre: 0.0,
              diciembre: 0.0,
            });
            break;
          case "09":
            this.itemsGanancia.push({
              exp: element.nro_master,
              cliente: element.cliente,
              septiembre: element.ganancia ? element.ganancia : 0.0,
              enero: 0.0,
              febrero: 0.0,
              marzo: 0.0,
              abril: 0.0,
              mayo: 0.0,
              junio: 0.0,
              julio: 0.0,
              agosto: 0.0,

              octubre: 0.0,
              noviembre: 0.0,
              diciembre: 0.0,
            });
            break;
          case "10":
            this.itemsGanancia.push({
              exp: element.nro_master,
              cliente: element.cliente,
              octubre: element.ganancia ? element.ganancia : 0.0,
              enero: 0.0,
              febrero: 0.0,
              marzo: 0.0,
              abril: 0.0,
              mayo: 0.0,
              junio: 0.0,
              julio: 0.0,
              agosto: 0.0,
              septiembre: 0.0,

              noviembre: 0.0,
              diciembre: 0.0,
            });
            break;
          case "11":
            this.itemsGanancia.push({
              exp: element.nro_master,
              cliente: element.cliente,
              noviembre: element.ganancia ? element.ganancia : 0.0,
              enero: 0.0,
              febrero: 0.0,
              marzo: 0.0,
              abril: 0.0,
              mayo: 0.0,
              junio: 0.0,
              julio: 0.0,
              agosto: 0.0,
              septiembre: 0.0,
              octubre: 0.0,

              diciembre: 0.0,
            });
            break;
          case "12":
            this.itemsGanancia.push({
              exp: element.nro_master,
              cliente: element.cliente,
              diciembre: element.ganancia ? element.ganancia : 0.0,
              enero: 0.0,
              febrero: 0.0,
              marzo: 0.0,
              abril: 0.0,
              mayo: 0.0,
              junio: 0.0,
              julio: 0.0,
              agosto: 0.0,
              septiembre: 0.0,
              octubre: 0.0,
              noviembre: 0.0,
            });
            break;

          default:
            break;
        }
      });
    },
    generarGastosDetalles() {
      var montosPorMes = {};
      montosPorMes.exp = "DETALLE DE GASTOS OPERATIVA";
      let mes = "";
      for (let i = 0; i < this.$store.state.balances.listaGastos.length; i++) {
        const elemento = this.$store.state.balances.listaGastos[i];

        switch (elemento.mes) {
          case "01":
            mes = "enero";
            break;
          case "02":
            mes = "febrero";
            break;
          case "03":
            mes = "marzo";
            break;
          case "04":
            mes = "abril";
            break;
          case "05":
            mes = "mayo";
            break;
          case "06":
            mes = "junio";
            break;
          case "07":
            mes = "julio";
            break;
          case "08":
            mes = "agosto";
            break;
          case "09":
            mes = "septiembre";
            break;
          case "10":
            mes = "octubre";
            break;
          case "11":
            mes = "noviembre";
            break;
          case "12":
            mes = "diciembre";
            break;

          default:
            break;
        }
        const monto = parseFloat(elemento.monto).toFixed(2);
        if (montosPorMes.hasOwnProperty(mes)) {
          montosPorMes[mes] = parseFloat(
            parseFloat(
              parseFloat(montosPorMes[mes] ? montosPorMes[mes] : 0) +
                parseFloat(monto)
            ).toFixed(2)
          );
        } else {
          montosPorMes[mes] = parseFloat(monto).toFixed(2);
        }
      }
      montosPorMes.gasto_description = "TOTALES";

      this.itemsGastos.push(montosPorMes);

      //   -------------------------------
      this.$store.state.balances.listaGastos.forEach((element) => {
        switch (element.mes) {
          case "01":
            this.itemsGastos.push({
              proveedor: element.proveedor,
              concepto: element.concepto,
              enero: element.monto ? element.monto : 0,
              gasto_description: element.gasto_description,
              subgasto_description: element.subgasto_description,
              diciembre: 0.0,
              febrero: 0.0,
              marzo: 0.0,
              abril: 0.0,
              mayo: 0.0,
              junio: 0.0,
              julio: 0.0,
              agosto: 0.0,
              septiembre: 0.0,
              octubre: 0.0,
              noviembre: 0.0,
            });
            break;
          case "02":
            this.itemsGastos.push({
              proveedor: element.proveedor,
              concepto: element.concepto,
              gasto_description: element.gasto_description,
              subgasto_description: element.subgasto_description,
              febrero: element.monto,
              enero: 0.0,
              diciembre: 0.0,
              marzo: 0.0,
              abril: 0.0,
              mayo: 0.0,
              junio: 0.0,
              julio: 0.0,
              agosto: 0.0,
              septiembre: 0.0,
              octubre: 0.0,
              noviembre: 0.0,
            });
            break;
          case "03":
            this.itemsGastos.push({
              proveedor: element.proveedor,
              concepto: element.concepto,
              gasto_description: element.gasto_description,
              subgasto_description: element.subgasto_description,
              marzo: element.monto ? element.monto : 0,
              enero: 0.0,
              febrero: 0.0,
              diciembre: 0.0,
              abril: 0.0,
              mayo: 0.0,
              junio: 0.0,
              julio: 0.0,
              agosto: 0.0,
              septiembre: 0.0,
              octubre: 0.0,
              noviembre: 0.0,
            });
            break;
          case "04":
            this.itemsGastos.push({
              proveedor: element.proveedor,
              concepto: element.concepto,
              gasto_description: element.gasto_description,
              subgasto_description: element.subgasto_description,
              abril: element.monto ? element.monto : 0,
              enero: 0.0,
              febrero: 0.0,
              marzo: 0.0,
              diciembre: 0.0,
              mayo: 0.0,
              junio: 0.0,
              julio: 0.0,
              agosto: 0.0,
              septiembre: 0.0,
              octubre: 0.0,
              noviembre: 0.0,
            });
            break;
          case "05":
            this.itemsGastos.push({
              proveedor: element.proveedor,
              concepto: element.concepto,
              gasto_description: element.gasto_description,
              subgasto_description: element.subgasto_description,
              mayo: element.monto ? element.monto : 0,
              enero: 0.0,
              febrero: 0.0,
              marzo: 0.0,
              abril: 0.0,
              diciembre: 0.0,
              junio: 0.0,
              julio: 0.0,
              agosto: 0.0,
              septiembre: 0.0,
              octubre: 0.0,
              noviembre: 0.0,
            });
            break;
          case "06":
            this.itemsGastos.push({
              proveedor: element.proveedor,
              concepto: element.concepto,
              gasto_description: element.gasto_description,
              subgasto_description: element.subgasto_description,
              junio: element.monto ? element.monto : 0,
              enero: 0.0,
              febrero: 0.0,
              marzo: 0.0,
              abril: 0.0,
              mayo: 0.0,
              diciembre: 0.0,
              julio: 0.0,
              agosto: 0.0,
              septiembre: 0.0,
              octubre: 0.0,
              noviembre: 0.0,
            });
            break;
          case "07":
            this.itemsGastos.push({
              proveedor: element.proveedor,
              concepto: element.concepto,
              gasto_description: element.gasto_description,
              subgasto_description: element.subgasto_description,
              julio: element.monto ? element.monto : 0,
              enero: 0.0,
              febrero: 0.0,
              marzo: 0.0,
              abril: 0.0,
              mayo: 0.0,
              diciembre: 0.0,

              agosto: 0.0,
              septiembre: 0.0,
              octubre: 0.0,
              noviembre: 0.0,
            });
            break;
          case "08":
            this.itemsGastos.push({
              proveedor: element.proveedor,
              concepto: element.concepto,
              gasto_description: element.gasto_description,
              subgasto_description: element.subgasto_description,
              agosto: element.monto ? element.monto : 0,
              enero: 0.0,
              febrero: 0.0,
              marzo: 0.0,
              abril: 0.0,
              mayo: 0.0,
              junio: 0.0,
              julio: 0.0,
              diciembre: 0.0,
              septiembre: 0.0,
              octubre: 0.0,
              noviembre: 0.0,
            });
            break;
          case "09":
            this.itemsGastos.push({
              proveedor: element.proveedor,
              concepto: element.concepto,
              gasto_description: element.gasto_description,
              subgasto_description: element.subgasto_description,
              septiembre: element.monto ? element.monto : 0,
              enero: 0.0,
              febrero: 0.0,
              marzo: 0.0,
              abril: 0.0,
              mayo: 0.0,
              junio: 0.0,
              julio: 0.0,
              agosto: 0.0,
              diciembre: 0.0,
              octubre: 0.0,
              noviembre: 0.0,
            });
            break;
          case "10":
            this.itemsGastos.push({
              proveedor: element.proveedor,
              concepto: element.concepto,
              gasto_description: element.gasto_description,
              subgasto_description: element.subgasto_description,
              octubre: element.monto ? element.monto : 0,
              enero: 0.0,
              febrero: 0.0,
              marzo: 0.0,
              abril: 0.0,
              mayo: 0.0,
              junio: 0.0,
              julio: 0.0,
              agosto: 0.0,
              septiembre: 0.0,
              diciembre: 0.0,
              noviembre: 0.0,
            });
            break;
          case "11":
            this.itemsGastos.push({
              proveedor: element.proveedor,
              concepto: element.concepto,
              gasto_description: element.gasto_description,
              subgasto_description: element.subgasto_description,
              noviembre: element.monto ? element.monto : 0,
              enero: 0.0,
              febrero: 0.0,
              marzo: 0.0,
              abril: 0.0,
              mayo: 0.0,
              junio: 0.0,
              julio: 0.0,
              agosto: 0.0,
              septiembre: 0.0,
              octubre: 0.0,
              diciembre: 0.0,
            });
            break;
          case "12":
            this.itemsGastos.push({
              proveedor: element.proveedor,
              concepto: element.concepto,
              gasto_description: element.gasto_description,
              subgasto_description: element.subgasto_description,
              diciembre: element.monto ? element.monto : 0,
              enero: 0.0,
              febrero: 0.0,
              marzo: 0.0,
              abril: 0.0,
              mayo: 0.0,
              junio: 0.0,
              julio: 0.0,
              agosto: 0.0,
              septiembre: 0.0,
              octubre: 0.0,
              noviembre: 0.0,
            });
            break;

          default:
            break;
        }
      });
    },
    geneararGastosTipoIngreso() {
      let ingreso = this.$store.state.balances.resumenTipoIngreso;

      let ingresoDetalle = [];
      let data = {
        tipo_ingreso: null,
        enero: 0,
        febrero: 0,
        marzo: 0,
        abril: 0,
        mayo: 0,
        junio: 0,
        julio: 0,
        agosto: 0,
        septiembre: 0,
        octubre: 0,
        noviembre: 0,
        diciembre: 0,
      };

      ingreso.forEach((element) => {
        data = ingresoDetalle.filter(
          (v) =>
            v.tipo_ingreso == element.tipo_ingreso && v.aplica == element.aplica
        );

        if (data.length > 0) {
          switch (element.mes) {
            case "01":
              data[0].enero = element.monto;
              break;
            case "02":
              data[0].febrero = element.monto;
              break;
            case "03":
              data[0].marzo = element.monto;
              break;
            case "04":
              data[0].abril = element.monto;
              break;
            case "05":
              data[0].mayo = element.monto;
              break;
            case "06":
              data[0].junio = element.monto;
              break;
            case "07":
              data[0].julio = element.monto;
              break;
            case "08":
              data[0].agosto = element.monto;
              break;
            case "09":
              data[0].septiembre = element.monto;
              break;
            case "10":
              data[0].octubre = element.monto;
              break;
            case "11":
              data[0].noviembre = element.monto;
              break;
            case "12":
              data[0].diciembre = element.monto;
              break;

            default:
              break;
          }
        } else {
          data.tipo_ingreso = element.tipo_ingreso;
          data.aplica = element.aplica;
          switch (element.mes) {
            case "01":
              data.enero = element.monto;
              break;
            case "02":
              data.febrero = element.monto;
              break;
            case "03":
              data.marzo = element.monto;
              break;
            case "04":
              data.abril = element.monto;
              break;
            case "05":
              data.mayo = element.monto;
              break;
            case "06":
              data.junio = element.monto;
              break;
            case "07":
              data.julio = element.monto;
              break;
            case "08":
              data.agosto = element.monto;
              break;
            case "09":
              data.septiembre = element.monto;
              break;
            case "10":
              data.octubre = element.monto;
              break;
            case "11":
              data.noviembre = element.monto;
              break;
            case "12":
              data.diciembre = element.monto;
              break;

            default:
              break;
          }

          ingresoDetalle.push(data);
        }
      });

      this.itemsResumenGananciaxTipoIngreso = ingresoDetalle;
    },
    geneararGastosTipoGasto() {
      let gastosDetalle = [];
      let data = {
        gasto_code: null,
        gasto_description: null,
        enero: 0,
        febrero: 0,
        marzo: 0,
        abril: 0,
        mayo: 0,
        junio: 0,
        julio: 0,
        agosto: 0,
        septiembre: 0,
        octubre: 0,
        noviembre: 0,
        diciembre: 0,
      };
      let gastos = this.$store.state.balances.resumenTipoGasto;

      gastos.forEach((element) => {
        data = gastosDetalle.filter(
          (v) =>
            v.gasto_code == element.gasto_code && v.aplica == element.aplica
        );
        if (data.length > 0) {
          switch (element.mes) {
            case "01":
              data[0].enero = element.monto;
              break;
            case "02":
              data[0].febrero = element.monto;
              break;
            case "03":
              data[0].marzo = element.monto;
              break;
            case "04":
              data[0].abril = element.monto;
              break;
            case "05":
              data[0].mayo = element.monto;
              break;
            case "06":
              data[0].junio = element.monto;
              break;
            case "07":
              data[0].julio = element.monto;
              break;
            case "08":
              data[0].agosto = element.monto;
              break;
            case "09":
              data[0].septiembre = element.monto;
              break;
            case "10":
              data[0].octubre = element.monto;
              break;
            case "11":
              data[0].noviembre = element.monto;
              break;
            case "12":
              data[0].diciembre = element.monto;
              break;

            default:
              break;
          }
        } else {
          data.gasto_code = element.gasto_code;
          data.gasto_description = element.gasto_description;
          data.aplica = element.aplica;
          switch (element.mes) {
            case "01":
              data.enero = element.monto;
              break;
            case "02":
              data.febrero = element.monto;
              break;
            case "03":
              data.marzo = element.monto;
              break;
            case "04":
              data.abril = element.monto;
              break;
            case "05":
              data.mayo = element.monto;
              break;
            case "06":
              data.junio = element.monto;
              break;
            case "07":
              data.julio = element.monto;
              break;
            case "08":
              data.agosto = element.monto;
              break;
            case "09":
              data.septiembre = element.monto;
              break;
            case "10":
              data.octubre = element.monto;
              break;
            case "11":
              data.noviembre = element.monto;
              break;
            case "12":
              data.diciembre = element.monto;
              break;

            default:
              break;
          }
          gastosDetalle.push(data);
        }
      });
      this.itemsResumenGastoxTipoGasto = gastosDetalle;
    },
    generarCabeceras() {
      if (this.month.includes("01")) {
        this.headersDetailsGanancia.push({
          title: "Enero",
          key: "enero",
          sortable: false,
        });
        this.headersDetailsGastos.push({
          title: "Enero",
          key: "enero",
          sortable: false,
        });
      }
      if (this.month.includes("02")) {
        this.headersDetailsGanancia.push({
          title: "Febrero",
          key: "febrero",
          sortable: false,
        });
        this.headersDetailsGastos.push({
          title: "Febrero",
          key: "febrero",
          sortable: false,
        });
      }
      if (this.month.includes("03")) {
        this.headersDetailsGanancia.push({
          title: "Marzo",
          key: "marzo",
          sortable: false,
        });
        this.headersDetailsGastos.push({
          title: "Marzo",
          key: "marzo",
          sortable: false,
        });
      }
      if (this.month.includes("04")) {
        this.headersDetailsGanancia.push({
          title: "Abril",
          key: "abril",
          sortable: false,
        });
        this.headersDetailsGastos.push({
          title: "Abril",
          key: "abril",
          sortable: false,
        });
      }
      if (this.month.includes("05")) {
        this.headersDetailsGanancia.push({
          title: "Mayo",
          key: "mayo",
          sortable: false,
        });
        this.headersDetailsGastos.push({
          title: "Mayo",
          key: "mayo",
          sortable: false,
        });
      }
      if (this.month.includes("06")) {
        this.headersDetailsGanancia.push({
          title: "Junio",
          key: "junio",
          sortable: false,
        });
        this.headersDetailsGastos.push({
          title: "Junio",
          key: "junio",
          sortable: false,
        });
      }
      if (this.month.includes("07")) {
        this.headersDetailsGanancia.push({
          title: "Julio",
          key: "julio",
          sortable: false,
        });
        this.headersDetailsGastos.push({
          title: "Julio",
          key: "julio",
          sortable: false,
        });
      }
      if (this.month.includes("08")) {
        this.headersDetailsGanancia.push({
          title: "Agosto",
          key: "agosto",
          sortable: false,
        });
        this.headersDetailsGastos.push({
          title: "Agosto",
          key: "agosto",
          sortable: false,
        });
      }
      if (this.month.includes("09")) {
        this.headersDetailsGanancia.push({
          title: "Septiembre",
          key: "septiembre",
          sortable: false,
        });
        this.headersDetailsGastos.push({
          title: "Septiembre",
          key: "septiembre",
          sortable: false,
        });
      }
      if (this.month.includes("10")) {
        this.headersDetailsGanancia.push({
          title: "Octubre",
          key: "octubre",
          sortable: false,
        });
        this.headersDetailsGastos.push({
          title: "Octubre",
          key: "octubre",
          sortable: false,
        });
      }
      if (this.month.includes("11")) {
        this.headersDetailsGanancia.push({
          title: "Noviembre",
          key: "noviembre",
          sortable: false,
        });
        this.headersDetailsGastos.push({
          title: "Noviembre",
          key: "noviembre",
          sortable: false,
        });
      }
      if (this.month.includes("12")) {
        this.headersDetailsGanancia.push({
          title: "Diciembre",
          key: "diciembre",
          sortable: false,
        });
        this.headersDetailsGastos.push({
          title: "Diciembre",
          key: "diciembre",
          sortable: false,
        });
      }
    },
    generarCabecerasFiltro() {
      if (this.month.includes("01")) {
        this.headersDetailsGananciaFiltro.push({
          title: "Enero",
          key: "enero",
        });
        this.headersDetailsGastosFiltro.push({
          title: "Enero",
          key: "enero",
        });
      }
      if (this.month.includes("02")) {
        this.headersDetailsGananciaFiltro.push({
          title: "Febrero",
          key: "febrero",
        });
        this.headersDetailsGastosFiltro.push({
          title: "Febrero",
          key: "febrero",
        });
      }
      if (this.month.includes("03")) {
        this.headersDetailsGananciaFiltro.push({
          title: "Marzo",
          key: "marzo",
        });
        this.headersDetailsGastosFiltro.push({
          title: "Marzo",
          key: "marzo",
        });
      }
      if (this.month.includes("04")) {
        this.headersDetailsGananciaFiltro.push({
          title: "Abril",
          key: "abril",
        });
        this.headersDetailsGastosFiltro.push({
          title: "Abril",
          key: "abril",
        });
      }
      if (this.month.includes("05")) {
        this.headersDetailsGananciaFiltro.push({
          title: "Mayo",
          key: "mayo",
        });
        this.headersDetailsGastosFiltro.push({
          title: "Mayo",
          key: "mayo",
        });
      }
      if (this.month.includes("06")) {
        this.headersDetailsGananciaFiltro.push({
          title: "Junio",
          key: "junio",
        });
        this.headersDetailsGastosFiltro.push({
          title: "Junio",
          key: "junio",
        });
      }
      if (this.month.includes("07")) {
        this.headersDetailsGananciaFiltro.push({
          title: "Julio",
          key: "julio",
        });
        this.headersDetailsGastosFiltro.push({
          title: "Julio",
          key: "julio",
        });
      }
      if (this.month.includes("08")) {
        this.headersDetailsGananciaFiltro.push({
          title: "Agosto",
          key: "agosto",
        });
        this.headersDetailsGastosFiltro.push({
          title: "Agosto",
          key: "agosto",
        });
      }
      if (this.month.includes("09")) {
        this.headersDetailsGananciaFiltro.push({
          title: "Septiembre",
          key: "septiembre",
        });
        this.headersDetailsGastosFiltro.push({
          title: "Septiembre",
          key: "septiembre",
        });
      }
      if (this.month.includes("10")) {
        this.headersDetailsGananciaFiltro.push({
          title: "Octubre",
          key: "octubre",
        });
        this.headersDetailsGastosFiltro.push({
          title: "Octubre",
          key: "octubre",
        });
      }
      if (this.month.includes("11")) {
        this.headersDetailsGananciaFiltro.push({
          title: "Noviembre",
          key: "noviembre",
        });
        this.headersDetailsGastosFiltro.push({
          title: "Noviembre",
          key: "noviembre",
        });
      }
      if (this.month.includes("12")) {
        this.headersDetailsGananciaFiltro.push({
          title: "Diciembre",
          key: "diciembre",
        });
        this.headersDetailsGastosFiltro.push({
          title: "Diciembre",
          key: "diciembre",
        });
      }
    },
    async exportar() {
      let vm = this;
      vm.$store.state.spiner = true;
      await vm.exportarBalanceGanancia({ year: this.year, month: this.month });
      vm.$store.state.spiner = false;
    },
    filtarSubIngreso() {
      if (!!this.tipoingreso) {
        this.tiposubingresoFilter =
          this.$store.state.balances.tiposubingreso.filter(
            (v) => v.id_ingreso == this.tipoingreso
          );
      } else {
        this.tiposubingresoFilter = this.$store.state.balances.tiposubingreso;
      }
    },
    filtarSubGasto() {
      if (!!this.tipogastos) {
        this.tiposubgastosFilter =
          this.$store.state.balances.tiposubgastos.filter(
            (v) => v.id_gasto == this.tipogastos
          );
      } else {
        this.tiposubgastosFilter = this.$store.state.balances.tiposubgastos;
      }
    },
    async filtrar() {
      this.dialog = true;
      if (this.month.length == 0) {
        this.month = [
          "01",
          "02",
          "03",
          "04",
          "05",
          "06",
          "07",
          "08",
          "09",
          "10",
          "11",
          "12",
        ];
      }
      let data = {};
      let vm = this;
      let meses = this.month.join();
      this.headersDetailsGananciaFiltro = [
        { title: "Editar", key: "editar", headerProps: { class: "header" } },
        { title: "Expediente", key: "exp", headerProps: { class: "header" } },
        {
          title: "Cliente / Cant. House",
          key: "cliente",
          headerProps: { class: "header" },
        },
      ];
      vm.progress = 10;
      this.headersDetailsGastosFiltro = [
        { title: "Editar", key: "editar", headerProps: { class: "header" } },
        {
          title: "Gastos",
          key: "gasto_description",
          headerProps: { class: "header" },
        },
        {
          title: "SubGasto",
          key: "subgasto_description",
          headerProps: { class: "header" },
        },
        {
          title: "Proveedor",
          key: "proveedor",
          headerProps: { class: "header" },
        },
        {
          title: "Concepto",
          key: "concepto",
          headerProps: { class: "header" },
        },
      ];
      vm.progress = 20;
      this.generarCabecerasFiltro();
      vm.progress = 30;
      switch (vm.tipofiltro) {
        case 1:
          data = {
            year: vm.year,
            month: meses,
            tipoingreso: this.tipoingreso === 0 ? "0" : this.tipoingreso || "",
            tiposubingreso:
              this.tiposubingreso === 0 ? "0" : this.tiposubingreso || "",
            nro_expediente:
              this.nro_expediente === 0 ? "0" : this.nro_expediente || "",
            monto: this.monto === 0 ? "0" : this.monto || "",
          };

          vm.progress = 40;
          await vm.getListBalanaceGananciaFiltro(data);
          vm.progress = 70;
          this.generarGananciaDetallesFiltro();

          break;
        case 2:
          data = {
            year: vm.year,
            month: meses,
            tipogastos: vm.tipogastos === 0 ? "0" : vm.tipogastos || "",
            tiposubgastos:
              vm.tiposubgastos === 0 ? "0" : vm.tiposubgastos || "",
            proveedor: vm.proveedor === 0 ? "0" : vm.proveedor || "",
            monto: vm.monto === 0 ? "0" : vm.monto || "",
          };
          vm.progress = 40;
          await vm.getListBalanaceGastosFiltro(data);
          vm.progress = 70;
          this.generarGastosDetallesFiltro();

          break;

        default:
          break;
      }
      this.filtar = false;
      vm.progress = 100;
      setTimeout(() => {
        this.tab = "filtro";
        this.dialog = false;
      }, 1000);
    },
    generarGananciaDetallesFiltro() {
      this.itemsGananciaFiltro = [];
      //   -------------------------------
      this.$store.state.balances.listaGananciaFiltro.forEach((element) => {
        switch (element.mes) {
          case "01":
            this.itemsGananciaFiltro.push({
              exp: element.nro_master,
              editarflag: element.editarflag,
              isoperativo: element.isoperativo,
              id: element.id,
              cliente: element.cliente,
              enero: element.ganancia ? element.ganancia : 0.0,
              febrero: 0.0,
              marzo: 0.0,
              abril: 0.0,
              mayo: 0.0,
              junio: 0.0,
              julio: 0.0,
              agosto: 0.0,
              septiembre: 0.0,
              octubre: 0.0,
              noviembre: 0.0,
              diciembre: 0.0,
            });
            break;
          case "02":
            this.itemsGananciaFiltro.push({
              exp: element.nro_master,
              isoperativo: element.isoperativo,
              editarflag: element.editarflag,
              id: element.id,
              cliente: element.cliente,
              febrero: element.ganancia ? element.ganancia : 0.0,
              enero: 0.0,
              marzo: 0.0,
              abril: 0.0,
              mayo: 0.0,
              junio: 0.0,
              julio: 0.0,
              agosto: 0.0,
              septiembre: 0.0,
              octubre: 0.0,
              noviembre: 0.0,
              diciembre: 0.0,
            });
            break;
          case "03":
            this.itemsGananciaFiltro.push({
              exp: element.nro_master,
              isoperativo: element.isoperativo,
              editarflag: element.editarflag,
              id: element.id,
              cliente: element.cliente,
              marzo: element.ganancia ? element.ganancia : 0.0,
              enero: 0.0,
              febrero: 0.0,
              abril: 0.0,
              mayo: 0.0,
              junio: 0.0,
              julio: 0.0,
              agosto: 0.0,
              septiembre: 0.0,
              octubre: 0.0,
              noviembre: 0.0,
              diciembre: 0.0,
            });
            break;
          case "04":
            this.itemsGananciaFiltro.push({
              exp: element.nro_master,
              isoperativo: element.isoperativo,
              editarflag: element.editarflag,
              id: element.id,
              cliente: element.cliente,
              abril: element.ganancia ? element.ganancia : 0.0,
              enero: 0.0,
              febrero: 0.0,
              marzo: 0.0,
              mayo: 0.0,
              junio: 0.0,
              julio: 0.0,
              agosto: 0.0,
              septiembre: 0.0,
              octubre: 0.0,
              noviembre: 0.0,
              diciembre: 0.0,
            });
            break;
          case "05":
            this.itemsGananciaFiltro.push({
              exp: element.nro_master,
              isoperativo: element.isoperativo,
              editarflag: element.editarflag,
              id: element.id,
              cliente: element.cliente,
              mayo: element.ganancia ? element.ganancia : 0.0,
              enero: 0.0,
              febrero: 0.0,
              marzo: 0.0,
              abril: 0.0,
              junio: 0.0,
              julio: 0.0,
              agosto: 0.0,
              septiembre: 0.0,
              octubre: 0.0,
              noviembre: 0.0,
              diciembre: 0.0,
            });
            break;
          case "06":
            this.itemsGananciaFiltro.push({
              exp: element.nro_master,
              isoperativo: element.isoperativo,
              editarflag: element.editarflag,
              id: element.id,
              cliente: element.cliente,
              junio: element.ganancia ? element.ganancia : 0.0,
              enero: 0.0,
              febrero: 0.0,
              marzo: 0.0,
              abril: 0.0,
              mayo: 0.0,
              julio: 0.0,
              agosto: 0.0,
              septiembre: 0.0,
              octubre: 0.0,
              noviembre: 0.0,
              diciembre: 0.0,
            });
            break;
          case "07":
            this.itemsGananciaFiltro.push({
              exp: element.nro_master,
              isoperativo: element.isoperativo,
              editarflag: element.editarflag,
              id: element.id,
              cliente: element.cliente,
              julio: element.ganancia ? element.ganancia : 0.0,
              enero: 0.0,
              febrero: 0.0,
              marzo: 0.0,
              abril: 0.0,
              mayo: 0.0,
              junio: 0.0,
              agosto: 0.0,
              septiembre: 0.0,
              octubre: 0.0,
              noviembre: 0.0,
              diciembre: 0.0,
            });
            break;
          case "08":
            this.itemsGananciaFiltro.push({
              exp: element.nro_master,
              isoperativo: element.isoperativo,
              editarflag: element.editarflag,
              id: element.id,
              cliente: element.cliente,
              agosto: element.ganancia ? element.ganancia : 0.0,
              enero: 0.0,
              febrero: 0.0,
              marzo: 0.0,
              abril: 0.0,
              mayo: 0.0,
              junio: 0.0,
              julio: 0.0,

              septiembre: 0.0,
              octubre: 0.0,
              noviembre: 0.0,
              diciembre: 0.0,
            });
            break;
          case "09":
            this.itemsGananciaFiltro.push({
              exp: element.nro_master,
              isoperativo: element.isoperativo,
              editarflag: element.editarflag,
              id: element.id,
              cliente: element.cliente,
              septiembre: element.ganancia ? element.ganancia : 0.0,
              enero: 0.0,
              febrero: 0.0,
              marzo: 0.0,
              abril: 0.0,
              mayo: 0.0,
              junio: 0.0,
              julio: 0.0,
              agosto: 0.0,

              octubre: 0.0,
              noviembre: 0.0,
              diciembre: 0.0,
            });
            break;
          case "10":
            this.itemsGananciaFiltro.push({
              exp: element.nro_master,
              isoperativo: element.isoperativo,
              editarflag: element.editarflag,
              id: element.id,
              cliente: element.cliente,
              octubre: element.ganancia ? element.ganancia : 0.0,
              enero: 0.0,
              febrero: 0.0,
              marzo: 0.0,
              abril: 0.0,
              mayo: 0.0,
              junio: 0.0,
              julio: 0.0,
              agosto: 0.0,
              septiembre: 0.0,

              noviembre: 0.0,
              diciembre: 0.0,
            });
            break;
          case "11":
            this.itemsGananciaFiltro.push({
              exp: element.nro_master,
              isoperativo: element.isoperativo,
              editarflag: element.editarflag,
              id: element.id,
              cliente: element.cliente,
              noviembre: element.ganancia ? element.ganancia : 0.0,
              enero: 0.0,
              febrero: 0.0,
              marzo: 0.0,
              abril: 0.0,
              mayo: 0.0,
              junio: 0.0,
              julio: 0.0,
              agosto: 0.0,
              septiembre: 0.0,
              octubre: 0.0,

              diciembre: 0.0,
            });
            break;
          case "12":
            this.itemsGananciaFiltro.push({
              exp: element.nro_master,
              isoperativo: element.isoperativo,
              editarflag: element.editarflag,
              id: element.id,
              cliente: element.cliente,
              diciembre: element.ganancia ? element.ganancia : 0.0,
              enero: 0.0,
              febrero: 0.0,
              marzo: 0.0,
              abril: 0.0,
              mayo: 0.0,
              junio: 0.0,
              julio: 0.0,
              agosto: 0.0,
              septiembre: 0.0,
              octubre: 0.0,
              noviembre: 0.0,
            });
            break;

          default:
            break;
        }
      });
    },
    generarGastosDetallesFiltro() {
      this.itemsGastosFiltro = [];
      this.$store.state.balances.listaGastosFiltro.forEach((element) => {
        switch (element.mes) {
          case "01":
            this.itemsGastosFiltro.push({
              proveedor: element.proveedor,
              id: element.id,
              concepto: element.concepto,
              editarflag: element.editarflag,
              enero: element.monto ? element.monto : 0,
              gasto_description: element.gasto_description,
              subgasto_description: element.subgasto_description,
              diciembre: 0.0,
              febrero: 0.0,
              marzo: 0.0,
              abril: 0.0,
              mayo: 0.0,
              junio: 0.0,
              julio: 0.0,
              agosto: 0.0,
              septiembre: 0.0,
              octubre: 0.0,
              noviembre: 0.0,
            });
            break;
          case "02":
            this.itemsGastosFiltro.push({
              proveedor: element.proveedor,
              id: element.id,
              concepto: element.concepto,
              gasto_description: element.gasto_description,
              subgasto_description: element.subgasto_description,
              editarflag: element.editarflag,
              febrero: element.monto,
              enero: 0.0,
              diciembre: 0.0,
              marzo: 0.0,
              abril: 0.0,
              mayo: 0.0,
              junio: 0.0,
              julio: 0.0,
              agosto: 0.0,
              septiembre: 0.0,
              octubre: 0.0,
              noviembre: 0.0,
            });
            break;
          case "03":
            this.itemsGastosFiltro.push({
              proveedor: element.proveedor,
              id: element.id,
              concepto: element.concepto,
              gasto_description: element.gasto_description,
              subgasto_description: element.subgasto_description,
              editarflag: element.editarflag,
              marzo: element.monto ? element.monto : 0,
              enero: 0.0,
              febrero: 0.0,
              diciembre: 0.0,
              abril: 0.0,
              mayo: 0.0,
              junio: 0.0,
              julio: 0.0,
              agosto: 0.0,
              septiembre: 0.0,
              octubre: 0.0,
              noviembre: 0.0,
            });
            break;
          case "04":
            this.itemsGastosFiltro.push({
              proveedor: element.proveedor,
              id: element.id,
              concepto: element.concepto,
              gasto_description: element.gasto_description,
              subgasto_description: element.subgasto_description,
              editarflag: element.editarflag,
              abril: element.monto ? element.monto : 0,
              enero: 0.0,
              febrero: 0.0,
              marzo: 0.0,
              diciembre: 0.0,
              mayo: 0.0,
              junio: 0.0,
              julio: 0.0,
              agosto: 0.0,
              septiembre: 0.0,
              octubre: 0.0,
              noviembre: 0.0,
            });
            break;
          case "05":
            this.itemsGastosFiltro.push({
              proveedor: element.proveedor,
              id: element.id,
              concepto: element.concepto,
              gasto_description: element.gasto_description,
              subgasto_description: element.subgasto_description,
              editarflag: element.editarflag,
              mayo: element.monto ? element.monto : 0,
              enero: 0.0,
              febrero: 0.0,
              marzo: 0.0,
              abril: 0.0,
              diciembre: 0.0,
              junio: 0.0,
              julio: 0.0,
              agosto: 0.0,
              septiembre: 0.0,
              octubre: 0.0,
              noviembre: 0.0,
            });
            break;
          case "06":
            this.itemsGastosFiltro.push({
              proveedor: element.proveedor,
              id: element.id,
              concepto: element.concepto,
              gasto_description: element.gasto_description,
              subgasto_description: element.subgasto_description,
              editarflag: element.editarflag,
              junio: element.monto ? element.monto : 0,
              enero: 0.0,
              febrero: 0.0,
              marzo: 0.0,
              abril: 0.0,
              mayo: 0.0,
              diciembre: 0.0,
              julio: 0.0,
              agosto: 0.0,
              septiembre: 0.0,
              octubre: 0.0,
              noviembre: 0.0,
            });
            break;
          case "07":
            this.itemsGastosFiltro.push({
              proveedor: element.proveedor,
              id: element.id,
              concepto: element.concepto,
              gasto_description: element.gasto_description,
              subgasto_description: element.subgasto_description,
              editarflag: element.editarflag,
              julio: element.monto ? element.monto : 0,
              enero: 0.0,
              febrero: 0.0,
              marzo: 0.0,
              abril: 0.0,
              mayo: 0.0,
              diciembre: 0.0,

              agosto: 0.0,
              septiembre: 0.0,
              octubre: 0.0,
              noviembre: 0.0,
            });
            break;
          case "08":
            this.itemsGastosFiltro.push({
              proveedor: element.proveedor,
              id: element.id,
              concepto: element.concepto,
              gasto_description: element.gasto_description,
              subgasto_description: element.subgasto_description,
              editarflag: element.editarflag,
              agosto: element.monto ? element.monto : 0,
              enero: 0.0,
              febrero: 0.0,
              marzo: 0.0,
              abril: 0.0,
              mayo: 0.0,
              junio: 0.0,
              julio: 0.0,
              diciembre: 0.0,
              septiembre: 0.0,
              octubre: 0.0,
              noviembre: 0.0,
            });
            break;
          case "09":
            this.itemsGastosFiltro.push({
              proveedor: element.proveedor,
              id: element.id,
              concepto: element.concepto,
              gasto_description: element.gasto_description,
              subgasto_description: element.subgasto_description,
              editarflag: element.editarflag,
              septiembre: element.monto ? element.monto : 0,
              enero: 0.0,
              febrero: 0.0,
              marzo: 0.0,
              abril: 0.0,
              mayo: 0.0,
              junio: 0.0,
              julio: 0.0,
              agosto: 0.0,
              diciembre: 0.0,
              octubre: 0.0,
              noviembre: 0.0,
            });
            break;
          case "10":
            this.itemsGastosFiltro.push({
              proveedor: element.proveedor,
              id: element.id,
              concepto: element.concepto,
              gasto_description: element.gasto_description,
              subgasto_description: element.subgasto_description,
              editarflag: element.editarflag,
              octubre: element.monto ? element.monto : 0,
              enero: 0.0,
              febrero: 0.0,
              marzo: 0.0,
              abril: 0.0,
              mayo: 0.0,
              junio: 0.0,
              julio: 0.0,
              agosto: 0.0,
              septiembre: 0.0,
              diciembre: 0.0,
              noviembre: 0.0,
            });
            break;
          case "11":
            this.itemsGastosFiltro.push({
              proveedor: element.proveedor,
              id: element.id,
              concepto: element.concepto,
              gasto_description: element.gasto_description,
              subgasto_description: element.subgasto_description,
              editarflag: element.editarflag,
              noviembre: element.monto ? element.monto : 0,
              enero: 0.0,
              febrero: 0.0,
              marzo: 0.0,
              abril: 0.0,
              mayo: 0.0,
              junio: 0.0,
              julio: 0.0,
              agosto: 0.0,
              septiembre: 0.0,
              octubre: 0.0,
              diciembre: 0.0,
            });
            break;
          case "12":
            this.itemsGastosFiltro.push({
              proveedor: element.proveedor,
              id: element.id,
              concepto: element.concepto,
              gasto_description: element.gasto_description,
              subgasto_description: element.subgasto_description,
              editarflag: element.editarflag,
              diciembre: element.monto ? element.monto : 0,
              enero: 0.0,
              febrero: 0.0,
              marzo: 0.0,
              abril: 0.0,
              mayo: 0.0,
              junio: 0.0,
              julio: 0.0,
              agosto: 0.0,
              septiembre: 0.0,
              octubre: 0.0,
              noviembre: 0.0,
            });
            break;

          default:
            break;
        }
      });
    },
    redirectEditarGanancia(id, isoperativo) {
      if (isoperativo) {
        let ruta = this.$router.resolve({
          name: "editControlGasto",
          params: {
            code_master: id,
            id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0]
              .id_branch,
          },
        });

        window.open(ruta.href, "_blank");
      } else {
        let ruta = this.$router.resolve({
          name: "EditAccountPaysCxC",
          params: { id: id },
        });

        window.open(ruta.href, "_blank");
      }
    },
    redirectViewGanancia(id, isoperativo) {
      if (isoperativo) {
        let ruta = this.$router.resolve({
          name: "editControlGasto",
          params: {
            code_master: id,
            id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0]
              .id_branch,
          },
        });

        window.open(ruta.href, "_blank");
      } else {
        let ruta = this.$router.resolve({
          name: "viewAccountPaysCxC",
          params: { id: id },
        });

        window.open(ruta.href, "_blank");
      }
    },
    redirectGasto(id) {
      let ruta = this.$router.resolve({
        name: "viewAccountPays",
        params: { id: id },
      });

      window.open(ruta.href, "_blank");
    },
    async comparar() {
      if ((await this.$refs.frmCompare.validate()).valid) {
        await this.getComparativo({
          month: this.id_month,
          year: this.year,
        });
      }
      this.dialogComparar = false;
      this.tab = "compare";
    },
  },
  watch: {
    tipoingreso() {
      this.filtarSubIngreso();
    },
    tipogastos() {
      this.filtarSubGasto();
    },
    month() {
      const { length } = this.month;
      length == 1
        ? (this.id_month = this.month[0])
        : (this.id_month = moment().format("MM"));
    },
  },
};
</script>

<style scoped>
.header {
  font-weight: bold;
}
/* .headerTable {
  color: #fff !important;
  background-color: #900c3f;
} */
.colorIngreso {
  background-color: #c5ec92;
}
.colorEgreso {
  background-color: #a7d2f9;
}
.totalStyle {
  background-color: #000;
  color: #fff !important;
}
.myTable tbody tr:hover {
  background-color: inherit !important;
  color: #000 !important;
}
.myTable .headerTable {
  color: #fff !important;
  background-color: #900c3f !important;
}
.t-siaplican {
  color: #000 !important;
  background-color: #9effa3;
}
.t-noaplican {
  color: #ffffff !important;
  background-color: #ff9797;
}
.t-info {
  color: #000 !important;
  background-color: #b1b1b1;
}
.t-flujoprepost {
  color: #fff !important;
  background-color: #0d47a1;
}
</style>
