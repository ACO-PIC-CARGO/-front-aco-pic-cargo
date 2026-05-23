<template>
  <v-container fluid>
    <div class="">
      <v-row>
        <v-col cols="12" lg="4" xl="4" class="my-1 py-2">
          <span class="title">
            Costos {{ currencyFormat($store.state.pricing.totalCosto) }}
            <v-btn icon color="primary" @click="abrirModal">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </span>
        </v-col>
      </v-row>
    </div>
    <!-- ss{{ this.valores }} -->
    <div id="FleteImport" v-if="mostrarFleteImport" class="my-0 py-0">
      <v-row>
        <v-col cols="12" class="my-1 py-1">
          <v-expansion-panels class="condensed" v-model="valueFleteImport">
            <v-expansion-panel>
              <v-expansion-panel-header>
                {{
                  $store.state.pricing.listTipoCostos.length > 0
                    ? $store.state.pricing.listTipoCostos.filter(
                        (v) => v.codigo == "FL",
                      )[0].name
                    : ""
                }}:

                <span>{{ currencyFormat(resumenOpcion.flete) }} </span>

                <v-icon
                  color="red"
                  v-if="
                    mostrarAdvertencia(
                      valores.filter((v) => v.esfleteflag == 1),
                    )
                  "
                >
                  mdi-alert-circle
                </v-icon>
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-simple-table dense>
                  <thead>
                    <tr>
                      <th></th>
                      <th style="">Proveedor</th>
                      <th style="">Conceptos</th>
                      <th style="">Multipicador</th>
                      <th class="derecha" style="">Costo Unitario</th>
                      <th style="">Sub Total</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr
                      v-for="(valor, i) in valores.filter(
                        (v) => v.esfleteflag == 1 && v.status == 1,
                      )"
                      :key="i"
                    >
                      <td class="btnAccion">
                        <v-btn
                          icon
                          color="red"
                          x-small
                          @click="eliminarCostos({ costo: valor })"
                        >
                          <v-icon>mdi-delete</v-icon>
                        </v-btn>
                      </td>
                      <td class="colProveedorMultiplicador">
                        <v-autocomplete
                          dense
                          item-text="namelong"
                          item-value="id"
                          :items="$store.state.proveedor.lstProveedores"
                          @update:search-input="recargarProveedores"
                          v-model="valor.id_proveedor"
                          hide-details
                          append-icon="mdi-plus"
                          @click:append="abrirModalRegistroProveedor(valor)"
                        ></v-autocomplete>
                      </td>
                      <td class="colConcepto">
                        <v-text-field
                          dense
                          hide-details
                          v-model="valor.nameservice"
                        ></v-text-field>
                      </td>
                      <td class="colProveedorMultiplicador">
                        <v-select
                          class="widthTD"
                          :items="$store.state.pricing.listMultiplicador"
                          v-model="valor.id_multiplicador"
                          placeholder="Multiplicador"
                          hide-details
                          dense
                          @change="calcTotales"
                          :readonly="
                            isITBM(valor.code_cost) ||
                            isConfeccion(valor.code_cost) ||
                            isNotaCredito(valor.code_cost)
                          "
                        ></v-select>
                      </td>

                      <td class="colCostos">
                        <v-text-field
                          class="derecha tdMontos"
                          v-if="
                            isNotPorcentaje(valor, valor.id_multiplicador) &&
                            !isConfeccion(valor.code_cost) &&
                            !isITBM(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                          "
                          dense
                          max-width="50%"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          :rules="[
                            (v) => {
                              if (v > 0) {
                                valor.error = ''; // Borra el mensaje de error si el valor es válido
                                return true; // La regla se cumple
                              }
                              valor.error = 'El costo que tiene un valor 0.00.';
                              return false; // La regla no se cumple
                            },
                          ]"
                          prefix="$"
                          type="number"
                          step="0.01"
                          :min="valor.minimo"
                          v-on:blur="calcTotales"
                        ></v-text-field>
                        <v-text-field
                          class="derecha tdMontos"
                          v-if="
                            $store.state.pricing.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador &&
                                (v.code == 13 || v.code == 14 || v.code == 15),
                            ) &&
                            !isITBM(valor.code_cost) &&
                            !isConfeccion(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                          "
                          hide-details
                          max-width="50%"
                          suffix="%"
                          dense
                          max="100"
                          v-model="valor.cif"
                          type="number"
                          :min="valor.minimo"
                          step="0.01"
                          v-on:blur="calcTotales"
                        ></v-text-field>
                        <v-text-field
                          max-width="50%"
                          suffix="%"
                          class="derecha tdMontos"
                          v-if="
                            $store.state.pricing.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador && v.code == 5,
                            ) &&
                            !isITBM(valor.code_cost) &&
                            !isConfeccion(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                          "
                          hide-details
                          dense
                          max="100"
                          v-model="valor.seguro"
                          type="number"
                          :min="valor.minimo"
                          step="0.01"
                          v-on:blur="calcTotales"
                        ></v-text-field>

                        <v-text-field
                          v-if="isITBM(valor.code_cost)"
                          readonly
                          dense
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        ></v-text-field>

                        <v-text-field
                          v-if="isConfeccion(valor.code_cost)"
                          readonly
                          dense
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        ></v-text-field>
                        <v-text-field
                          v-if="isNotaCredito(valor.code_cost)"
                          readonly
                          dense
                          v-model="valor.costounitario"
                          prefix="$"
                        ></v-text-field>
                      </td>

                      <td
                        class="colCostos"
                        v-if="
                          isNotPorcentaje(valor, valor.id_multiplicador) &&
                          !isConfeccion(valor.code_cost) &&
                          !isITBM(valor.code_cost) &&
                          !isNotaCredito(valor.code_cost)
                        "
                      >
                        {{ formatearCostoTotal(valor) }}
                      </td>

                      <td
                        class="colCostos"
                        v-if="
                          !isNotPorcentaje(valor, valor.id_multiplicador) &&
                          !isITBM(valor.code_cost) &&
                          !isConfeccion(valor.code_cost) &&
                          !isNotaCredito(valor.code_cost)
                        "
                      >
                        {{ formatearValorCalculado(valor) }}
                      </td>
                      <td
                        class="colCostos"
                        v-if="isConfeccion(valor.code_cost)"
                      >
                        {{ montoConfeccion(valor) }}
                      </td>
                      <td class="colCostos" v-if="isITBM(valor.code_cost)">
                        {{ montoITBM(valor) }}
                      </td>

                      <td
                        class="colCostos"
                        v-if="isNotaCredito(valor.code_cost)"
                      >
                        {{ montoNotaCredito(valor) }}
                      </td>
                    </tr>
                  </tbody>
                </v-simple-table>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
        <v-col class="derecha" v-if="mostrarBtnFleteImportFlag">
          <v-btn color="success" @click="comprobarFleteImport()"
            >Ver siguientes costos</v-btn
          >
        </v-col>
      </v-row>
    </div>
    <div id="Origen" v-if="mostrarOrigen" class="my-0 py-0">
      <v-row>
        <v-col cols="12" class="my-1 py-1">
          <v-expansion-panels class="condensed" v-model="valueOrigen">
            <v-expansion-panel>
              <v-expansion-panel-header>
                {{
                  $store.state.pricing.listTipoCostos.length > 0
                    ? $store.state.pricing.listTipoCostos.filter(
                        (v) => v.codigo == "OR",
                      )[0].name
                    : ""
                }}:
                <span>{{ currencyFormat(resumenOpcion.origen) }}</span>

                <v-icon
                  color="red"
                  v-if="
                    mostrarAdvertencia(
                      valores.filter((v) => v.esorigenflag == 1),
                    )
                  "
                >
                  mdi-alert-circle
                </v-icon>
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-simple-table dense>
                  <thead>
                    <tr>
                      <th></th>
                      <th style="">Proveedor</th>
                      <th style="">Conceptos</th>
                      <th style="">Multipicador</th>
                      <th class="derecha" style="">Costo Unitario</th>
                      <th style="">Sub Total</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr
                      v-for="(valor, i) in valores.filter(
                        (v) => v.esorigenflag == 1 && v.status == 1,
                      )"
                      :key="i"
                    >
                      <td class="btnAccion">
                        <v-btn
                          icon
                          color="red"
                          x-small
                          @click="eliminarCostos({ costo: valor })"
                        >
                          <v-icon>mdi-delete</v-icon>
                        </v-btn>
                      </td>
                      <td class="colProveedorMultiplicador">
                        <v-autocomplete
                          dense
                          item-text="namelong"
                          item-value="id"
                          :items="$store.state.proveedor.lstProveedores"
                          @update:search-input="recargarProveedores"
                          v-model="valor.id_proveedor"
                          append-icon="mdi-plus"
                          @click:append="abrirModalRegistroProveedor(valor)"
                          hide-details
                        ></v-autocomplete>
                      </td>
                      <td class="colConcepto">
                        <v-text-field
                          dense
                          hide-details
                          v-model="valor.nameservice"
                        ></v-text-field>
                      </td>
                      <td class="colProveedorMultiplicador">
                        <v-select
                          class="widthTD"
                          :items="$store.state.pricing.listMultiplicador"
                          v-model="valor.id_multiplicador"
                          placeholder="Multiplicador"
                          hide-details
                          dense
                          @change="calcTotales"
                          :readonly="
                            isITBM(valor.code_cost) ||
                            isConfeccion(valor.code_cost) ||
                            isNotaCredito(valor.code_cost)
                          "
                        ></v-select>
                      </td>

                      <td class="colCostos">
                        <v-text-field
                          class="derecha tdMontos"
                          v-if="
                            isNotPorcentaje(valor, valor.id_multiplicador) &&
                            !isConfeccion(valor.code_cost) &&
                            !isITBM(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                          "
                          dense
                          max-width="50%"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          :rules="[
                            (v) => {
                              if (v > 0) {
                                valor.error = ''; // Borra el mensaje de error si el valor es válido
                                return true; // La regla se cumple
                              }
                              valor.error = 'El costo que tiene un valor 0.00.';
                              return false; // La regla no se cumple
                            },
                          ]"
                          prefix="$"
                          type="number"
                          step="0.01"
                          :min="valor.minimo"
                          v-on:blur="calcTotales"
                        ></v-text-field>
                        <v-text-field
                          class="derecha tdMontos"
                          v-if="
                            $store.state.pricing.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador &&
                                (v.code == 13 || v.code == 14 || v.code == 15),
                            ) &&
                            !isITBM(valor.code_cost) &&
                            !isConfeccion(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                          "
                          hide-details
                          max-width="50%"
                          suffix="%"
                          dense
                          max="100"
                          v-model="valor.cif"
                          type="number"
                          :min="valor.minimo"
                          step="0.01"
                          v-on:blur="calcTotales"
                        ></v-text-field>
                        <v-text-field
                          max-width="50%"
                          suffix="%"
                          class="derecha tdMontos"
                          v-if="
                            $store.state.pricing.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador && v.code == 5,
                            ) &&
                            !isITBM(valor.code_cost) &&
                            !isConfeccion(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                          "
                          hide-details
                          dense
                          max="100"
                          v-model="valor.seguro"
                          type="number"
                          :min="valor.minimo"
                          step="0.01"
                          v-on:blur="calcTotales"
                        ></v-text-field>

                        <v-text-field
                          v-if="isITBM(valor.code_cost)"
                          readonly
                          dense
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        ></v-text-field>

                        <v-text-field
                          v-if="isConfeccion(valor.code_cost)"
                          readonly
                          dense
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        ></v-text-field>
                        <v-text-field
                          v-if="isNotaCredito(valor.code_cost)"
                          readonly
                          dense
                          v-model="valor.costounitario"
                          prefix="$"
                        ></v-text-field>
                      </td>

                      <td
                        class="colCostos"
                        v-if="
                          isNotPorcentaje(valor, valor.id_multiplicador) &&
                          !isConfeccion(valor.code_cost) &&
                          !isITBM(valor.code_cost) &&
                          !isNotaCredito(valor.code_cost)
                        "
                      >
                        {{ formatearCostoTotal(valor) }}
                      </td>

                      <td
                        class="colCostos"
                        v-if="
                          !isNotPorcentaje(valor, valor.id_multiplicador) &&
                          !isITBM(valor.code_cost) &&
                          !isConfeccion(valor.code_cost) &&
                          !isNotaCredito(valor.code_cost)
                        "
                      >
                        {{ formatearValorCalculado(valor) }}
                      </td>
                      <td
                        class="colCostos"
                        v-if="isConfeccion(valor.code_cost)"
                      >
                        {{ montoConfeccion(valor) }}
                      </td>
                      <td class="colCostos" v-if="isITBM(valor.code_cost)">
                        {{ montoITBM(valor) }}
                      </td>

                      <td
                        class="colCostos"
                        v-if="isNotaCredito(valor.code_cost)"
                      >
                        {{ montoNotaCredito(valor) }}
                      </td>
                    </tr>
                  </tbody>
                </v-simple-table>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
        <v-col class="derecha" v-if="mostrarBtnOrigenFlag">
          <v-btn color="success" @click="comprobarOrigen()"
            >Ver siguientes costos</v-btn
          >
        </v-col>
      </v-row>
    </div>

    <div id="Local" v-if="mostrarLocal" class="my-0 py-0">
      <v-row>
        <v-col cols="12" class="my-1 py-1">
          <v-expansion-panels class="condensed" v-model="valueLocal">
            <v-expansion-panel>
              <v-expansion-panel-header>
                {{
                  $store.state.pricing.listTipoCostos.length > 0
                    ? $store.state.pricing.listTipoCostos.filter(
                        (v) => v.codigo == "LO",
                      )[0].name
                    : ""
                }}:
                <span>{{ currencyFormat(resumenOpcion.gasto) }}</span>
                <v-icon
                  color="red"
                  v-if="
                    mostrarAdvertencia(
                      valores.filter((v) => v.eslocalflag == 1),
                    )
                  "
                >
                  mdi-alert-circle
                </v-icon>
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-simple-table dense>
                  <thead>
                    <tr>
                      <th></th>
                      <th style="">Proveedor</th>
                      <th style="">Conceptos</th>
                      <th style="">Multipicador</th>
                      <th class="derecha" style="">Costo Unitario</th>
                      <th style="">Sub Total</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr
                      v-for="(valor, i) in valores.filter(
                        (v) => v.eslocalflag == 1 && v.status == 1,
                      )"
                      :key="i"
                    >
                      <td class="btnAccion">
                        <v-btn
                          icon
                          color="red"
                          x-small
                          @click="eliminarCostos({ costo: valor })"
                        >
                          <v-icon>mdi-delete</v-icon>
                        </v-btn>
                      </td>
                      <td class="colProveedorMultiplicador">
                        <v-autocomplete
                          dense
                          item-text="namelong"
                          item-value="id"
                          :items="$store.state.proveedor.lstProveedores"
                          @update:search-input="recargarProveedores"
                          v-model="valor.id_proveedor"
                          hide-details
                          append-icon="mdi-plus"
                          @click:append="abrirModalRegistroProveedor(valor)"
                        ></v-autocomplete>
                      </td>
                      <td class="colConcepto">
                        <v-text-field
                          dense
                          hide-details
                          v-model="valor.nameservice"
                        ></v-text-field>
                      </td>
                      <td class="colProveedorMultiplicador">
                        <v-select
                          class="widthTD"
                          :items="$store.state.pricing.listMultiplicador"
                          v-model="valor.id_multiplicador"
                          placeholder="Multiplicador"
                          hide-details
                          dense
                          @change="calcTotales"
                          :readonly="
                            isITBM(valor.code_cost) ||
                            isConfeccion(valor.code_cost) ||
                            isNotaCredito(valor.code_cost)
                          "
                        ></v-select>
                      </td>

                      <td class="colCostos">
                        <v-text-field
                          class="derecha tdMontos"
                          v-if="
                            isNotPorcentaje(valor, valor.id_multiplicador) &&
                            !isConfeccion(valor.code_cost) &&
                            !isITBM(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                          "
                          dense
                          max-width="50%"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          :rules="[
                            (v) => {
                              if (v > 0) {
                                valor.error = ''; // Borra el mensaje de error si el valor es válido
                                return true; // La regla se cumple
                              }
                              valor.error = 'El costo que tiene un valor 0.00.';
                              return false; // La regla no se cumple
                            },
                          ]"
                          prefix="$"
                          type="number"
                          step="0.01"
                          :min="valor.minimo"
                          v-on:blur="calcTotales"
                        ></v-text-field>
                        <v-text-field
                          class="derecha tdMontos"
                          v-if="
                            $store.state.pricing.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador &&
                                (v.code == 13 || v.code == 14 || v.code == 15),
                            ) &&
                            !isITBM(valor.code_cost) &&
                            !isConfeccion(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                          "
                          hide-details
                          max-width="50%"
                          suffix="%"
                          dense
                          max="100"
                          v-model="valor.cif"
                          type="number"
                          :min="valor.minimo"
                          step="0.01"
                          v-on:blur="calcTotales"
                        ></v-text-field>
                        <v-text-field
                          max-width="50%"
                          suffix="%"
                          class="derecha tdMontos"
                          v-if="
                            $store.state.pricing.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador && v.code == 5,
                            ) &&
                            !isITBM(valor.code_cost) &&
                            !isConfeccion(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                          "
                          hide-details
                          dense
                          max="100"
                          v-model="valor.seguro"
                          type="number"
                          :min="valor.minimo"
                          step="0.01"
                          v-on:blur="calcTotales"
                        ></v-text-field>

                        <v-text-field
                          v-if="isITBM(valor.code_cost)"
                          readonly
                          dense
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        ></v-text-field>

                        <v-text-field
                          v-if="isConfeccion(valor.code_cost)"
                          readonly
                          dense
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        ></v-text-field>
                        <v-text-field
                          v-if="isNotaCredito(valor.code_cost)"
                          readonly
                          dense
                          v-model="valor.costounitario"
                          prefix="$"
                        ></v-text-field>
                      </td>

                      <td
                        class="colCostos"
                        v-if="
                          isNotPorcentaje(valor, valor.id_multiplicador) &&
                          !isConfeccion(valor.code_cost) &&
                          !isITBM(valor.code_cost) &&
                          !isNotaCredito(valor.code_cost)
                        "
                      >
                        {{ formatearCostoTotal(valor) }}
                      </td>

                      <td
                        class="colCostos"
                        v-if="
                          !isNotPorcentaje(valor, valor.id_multiplicador) &&
                          !isITBM(valor.code_cost) &&
                          !isConfeccion(valor.code_cost) &&
                          !isNotaCredito(valor.code_cost)
                        "
                      >
                        {{ formatearValorCalculado(valor) }}
                      </td>
                      <td
                        class="colCostos"
                        v-if="isConfeccion(valor.code_cost)"
                      >
                        {{ montoConfeccion(valor) }}
                      </td>
                      <td class="colCostos" v-if="isITBM(valor.code_cost)">
                        {{ montoITBM(valor) }}
                      </td>

                      <td
                        class="colCostos"
                        v-if="isNotaCredito(valor.code_cost)"
                      >
                        {{ montoNotaCredito(valor) }}
                      </td>
                    </tr>
                  </tbody>
                </v-simple-table>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
        <v-col class="derecha" v-if="mostrarBtnLocalFlag">
          <v-btn color="success" @click="comprobarLocal()"
            >Ver siguientes costos</v-btn
          >
        </v-col>
      </v-row>
    </div>
    <div id="Aduana" v-if="mostrarAduana" class="my-0 py-0">
      <v-row>
        <v-col cols="12" class="my-1 py-1">
          <v-expansion-panels class="condensed" v-model="valueAduana">
            <v-expansion-panel>
              <v-expansion-panel-header>
                {{
                  $store.state.pricing.listTipoCostos.length > 0
                    ? $store.state.pricing.listTipoCostos.filter(
                        (v) => v.codigo == "AD",
                      )[0].name
                    : ""
                }}:
                <span>{{ currencyFormat(resumenOpcion.aduana) }}</span>

                <v-icon
                  color="red"
                  v-if="
                    mostrarAdvertencia(
                      valores.filter((v) => v.esaduanaflag == 1),
                    )
                  "
                >
                  mdi-alert-circle
                </v-icon>
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-simple-table dense>
                  <thead>
                    <tr>
                      <th></th>
                      <th style="">Proveedor</th>
                      <th style="">Conceptos</th>
                      <th style="">Multipicador</th>
                      <th class="derecha" style="">Costo Unitario</th>
                      <th style="">Sub Total</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr
                      v-for="(valor, i) in valores.filter(
                        (v) => v.esaduanaflag == 1 && v.status == 1,
                      )"
                      :key="i"
                    >
                      <td class="btnAccion">
                        <v-btn
                          icon
                          color="red"
                          x-small
                          @click="eliminarCostos({ costo: valor })"
                        >
                          <v-icon>mdi-delete</v-icon>
                        </v-btn>
                      </td>
                      <td class="colProveedorMultiplicador">
                        <v-autocomplete
                          dense
                          item-text="namelong"
                          item-value="id"
                          :items="$store.state.proveedor.lstProveedores"
                          @update:search-input="recargarProveedores"
                          v-model="valor.id_proveedor"
                          hide-details
                          append-icon="mdi-plus"
                          @click:append="abrirModalRegistroProveedor(valor)"
                        ></v-autocomplete>
                      </td>
                      <td class="colConcepto">
                        <v-text-field
                          dense
                          hide-details
                          v-model="valor.nameservice"
                        ></v-text-field>
                      </td>
                      <td class="colProveedorMultiplicador">
                        <v-select
                          class="widthTD"
                          :items="$store.state.pricing.listMultiplicador"
                          v-model="valor.id_multiplicador"
                          placeholder="Multiplicador"
                          hide-details
                          dense
                          @change="calcTotales"
                          :readonly="
                            isITBM(valor.code_cost) ||
                            isConfeccion(valor.code_cost) ||
                            isNotaCredito(valor.code_cost)
                          "
                        ></v-select>
                      </td>

                      <td class="colCostos">
                        <v-text-field
                          class="derecha tdMontos"
                          v-if="
                            isNotPorcentaje(valor, valor.id_multiplicador) &&
                            !isITBM(valor.code_cost) &&
                            !isConfeccion(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                          "
                          dense
                          max-width="50%"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          :rules="[
                            (v) => {
                              if (v > 0) {
                                valor.error = ''; // Borra el mensaje de error si el valor es válido
                                return true; // La regla se cumple
                              }
                              valor.error = 'El costo que tiene un valor 0.00.';
                              return false; // La regla no se cumple
                            },
                          ]"
                          prefix="$"
                          type="number"
                          step="0.01"
                          :min="valor.minimo"
                          v-on:blur="calcTotales"
                        ></v-text-field>
                        <v-text-field
                          class="derecha tdMontos"
                          v-if="
                            $store.state.pricing.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador &&
                                (v.code == 13 || v.code == 14 || v.code == 15),
                            ) &&
                            !isITBM(valor.code_cost) &&
                            !isConfeccion(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                          "
                          hide-details
                          max-width="50%"
                          suffix="%"
                          dense
                          max="100"
                          v-model="valor.cif"
                          type="number"
                          :min="valor.minimo"
                          step="0.01"
                          v-on:blur="calcTotales"
                        ></v-text-field>
                        <v-text-field
                          max-width="50%"
                          suffix="%"
                          class="derecha tdMontos"
                          v-if="
                            $store.state.pricing.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador && v.code == 5,
                            ) &&
                            !isITBM(valor.code_cost) &&
                            !isConfeccion(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                          "
                          hide-details
                          dense
                          max="100"
                          v-model="valor.seguro"
                          type="number"
                          :min="valor.minimo"
                          step="0.01"
                          v-on:blur="calcTotales"
                        ></v-text-field>

                        <v-text-field
                          v-if="isITBM(valor.code_cost)"
                          readonly
                          dense
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        ></v-text-field>

                        <v-text-field
                          v-if="isConfeccion(valor.code_cost)"
                          readonly
                          dense
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        ></v-text-field>
                        <v-text-field
                          v-if="isNotaCredito(valor.code_cost)"
                          readonly
                          dense
                          v-model="valor.costounitario"
                          prefix="$"
                        ></v-text-field>
                      </td>

                      <td
                        class="colCostos"
                        v-if="
                          isNotPorcentaje(valor, valor.id_multiplicador) &&
                          !isITBM(valor.code_cost) &&
                          !isConfeccion(valor.code_cost) &&
                          !isNotaCredito(valor.code_cost)
                        "
                      >
                        {{ formatearCostoTotal(valor) }}
                      </td>

                      <td
                        class="colCostos"
                        v-if="
                          !isNotPorcentaje(valor, valor.id_multiplicador) &&
                          !isITBM(valor.code_cost) &&
                          !isConfeccion(valor.code_cost) &&
                          !isNotaCredito(valor.code_cost)
                        "
                      >
                        {{ formatearValorCalculado(valor) }}
                      </td>
                      <td
                        class="colCostos"
                        v-if="isConfeccion(valor.code_cost)"
                      >
                        {{ montoConfeccion(valor) }}
                      </td>
                      <td class="colCostos" v-if="isITBM(valor.code_cost)">
                        {{ montoITBM(valor) }}
                      </td>

                      <td
                        class="colCostos"
                        v-if="isNotaCredito(valor.code_cost)"
                      >
                        {{ montoNotaCredito(valor) }}
                      </td>
                    </tr>
                  </tbody>
                </v-simple-table>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
        <v-col class="derecha" v-if="mostrarBtnAduanaFlag">
          <v-btn color="success" @click="comprobarAduana()"
            >Ver siguientes costos</v-btn
          >
        </v-col>
      </v-row>
    </div>
    <div id="FleteExport" v-if="mostrarFleteExport" class="my-0 py-0">
      <v-row>
        <v-col cols="12" class="my-1 py-1">
          <v-expansion-panels class="condensed" v-model="valueFleteExport">
            <v-expansion-panel>
              <v-expansion-panel-header>
                {{
                  $store.state.pricing.listTipoCostos.length > 0
                    ? $store.state.pricing.listTipoCostos.filter(
                        (v) => v.codigo == "FL",
                      )[0].name
                    : ""
                }}:

                <span>{{ currencyFormat(resumenOpcion.flete) }} </span>

                <v-icon
                  color="red"
                  v-if="
                    mostrarAdvertencia(
                      valores.filter((v) => v.esfleteflag == 1),
                    )
                  "
                >
                  mdi-alert-circle
                </v-icon>
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-simple-table dense>
                  <thead>
                    <tr>
                      <th></th>
                      <th style="">Proveedor</th>
                      <th style="">Conceptos</th>
                      <th style="">Multipicador</th>
                      <th class="derecha" style="">Costo Unitario</th>
                      <th style="">Sub Total</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr
                      v-for="(valor, i) in valores.filter(
                        (v) => v.esfleteflag == 1 && v.status == 1,
                      )"
                      :key="i"
                    >
                      <td class="btnAccion">
                        <v-btn
                          icon
                          color="red"
                          x-small
                          @click="eliminarCostos({ costo: valor })"
                        >
                          <v-icon>mdi-delete</v-icon>
                        </v-btn>
                      </td>
                      <td class="colProveedorMultiplicador">
                        <v-autocomplete
                          dense
                          item-text="namelong"
                          item-value="id"
                          :items="$store.state.proveedor.lstProveedores"
                          @update:search-input="recargarProveedores"
                          v-model="valor.id_proveedor"
                          hide-details
                          append-icon="mdi-plus"
                          @click:append="abrirModalRegistroProveedor(valor)"
                        ></v-autocomplete>
                      </td>
                      <td class="colConcepto">
                        <v-text-field
                          dense
                          hide-details
                          v-model="valor.nameservice"
                        ></v-text-field>
                      </td>
                      <td class="colProveedorMultiplicador">
                        <v-select
                          class="widthTD"
                          :items="$store.state.pricing.listMultiplicador"
                          v-model="valor.id_multiplicador"
                          placeholder="Multiplicador"
                          hide-details
                          dense
                          @change="calcTotales"
                          :readonly="
                            isITBM(valor.code_cost) ||
                            isConfeccion(valor.code_cost) ||
                            isNotaCredito(valor.code_cost)
                          "
                        ></v-select>
                      </td>

                      <td class="colCostos">
                        <v-text-field
                          class="derecha tdMontos"
                          v-if="
                            isNotPorcentaje(valor, valor.id_multiplicador) &&
                            !isConfeccion(valor.code_cost) &&
                            !isITBM(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                          "
                          dense
                          max-width="50%"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          :rules="[
                            (v) => {
                              if (v > 0) {
                                valor.error = ''; // Borra el mensaje de error si el valor es válido
                                return true; // La regla se cumple
                              }
                              valor.error = 'El costo que tiene un valor 0.00.';
                              return false; // La regla no se cumple
                            },
                          ]"
                          prefix="$"
                          type="number"
                          step="0.01"
                          :min="valor.minimo"
                          v-on:blur="calcTotales"
                        ></v-text-field>
                        <v-text-field
                          class="derecha tdMontos"
                          v-if="
                            $store.state.pricing.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador &&
                                (v.code == 13 || v.code == 14 || v.code == 15),
                            ) &&
                            !isITBM(valor.code_cost) &&
                            !isConfeccion(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                          "
                          hide-details
                          max-width="50%"
                          suffix="%"
                          dense
                          max="100"
                          v-model="valor.cif"
                          type="number"
                          :min="valor.minimo"
                          step="0.01"
                          v-on:blur="calcTotales"
                        ></v-text-field>
                        <v-text-field
                          max-width="50%"
                          suffix="%"
                          class="derecha tdMontos"
                          v-if="
                            $store.state.pricing.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador && v.code == 5,
                            ) &&
                            !isITBM(valor.code_cost) &&
                            !isConfeccion(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                          "
                          hide-details
                          dense
                          max="100"
                          v-model="valor.seguro"
                          type="number"
                          :min="valor.minimo"
                          step="0.01"
                          v-on:blur="calcTotales"
                        ></v-text-field>

                        <v-text-field
                          v-if="isITBM(valor.code_cost)"
                          readonly
                          dense
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        ></v-text-field>

                        <v-text-field
                          v-if="isConfeccion(valor.code_cost)"
                          readonly
                          dense
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        ></v-text-field>
                        <v-text-field
                          v-if="isNotaCredito(valor.code_cost)"
                          readonly
                          dense
                          v-model="valor.costounitario"
                          prefix="$"
                        ></v-text-field>
                      </td>

                      <td
                        class="colCostos"
                        v-if="
                          isNotPorcentaje(valor, valor.id_multiplicador) &&
                          !isConfeccion(valor.code_cost) &&
                          !isITBM(valor.code_cost) &&
                          !isNotaCredito(valor.code_cost)
                        "
                      >
                        {{ formatearCostoTotal(valor) }}
                      </td>

                      <td
                        class="colCostos"
                        v-if="
                          !isNotPorcentaje(valor, valor.id_multiplicador) &&
                          !isITBM(valor.code_cost) &&
                          !isConfeccion(valor.code_cost) &&
                          !isNotaCredito(valor.code_cost)
                        "
                      >
                        {{ formatearValorCalculado(valor) }}
                      </td>
                      <td
                        class="colCostos"
                        v-if="isConfeccion(valor.code_cost)"
                      >
                        {{ montoConfeccion(valor) }}
                      </td>
                      <td class="colCostos" v-if="isITBM(valor.code_cost)">
                        {{ montoITBM(valor) }}
                      </td>

                      <td
                        class="colCostos"
                        v-if="isNotaCredito(valor.code_cost)"
                      >
                        {{ montoNotaCredito(valor) }}
                      </td>
                    </tr>
                  </tbody>
                </v-simple-table>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
        <v-col class="derecha" v-if="mostrarBtnFleteExportFlag">
          <v-btn color="success" @click="comprobarFleteExport()"
            >Ver siguientes costos</v-btn
          >
        </v-col>
      </v-row>
    </div>
    <div id="Almacen" v-if="mostrarAlmacen" class="my-0 py-0">
      <v-row>
        <v-col cols="12" class="my-1 py-1">
          <v-expansion-panels class="condensed" v-model="valueAlmacen">
            <v-expansion-panel>
              <v-expansion-panel-header>
                {{
                  $store.state.pricing.listTipoCostos.length > 0
                    ? $store.state.pricing.listTipoCostos.filter(
                        (v) => v.codigo == "AL",
                      )[0].name
                    : ""
                }}:
                <span>{{ currencyFormat(resumenOpcion.almacen) }}</span>
                <v-icon
                  color="red"
                  v-if="
                    mostrarAdvertencia(
                      valores.filter((v) => v.esalmacenflag == 1),
                    )
                  "
                >
                  mdi-alert-circle
                </v-icon>
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-simple-table dense>
                  <thead>
                    <tr>
                      <th style=""></th>
                      <th style="">Proveedor</th>
                      <th style="">Conceptos</th>
                      <th style="">Multipicador</th>
                      <th class="derecha" style="">Costo Unitario</th>
                      <th style="">Sub Total</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr
                      v-for="(valor, i) in valores.filter(
                        (v) => v.esalmacenflag == 1 && v.status == 1,
                      )"
                      :key="i"
                    >
                      <td class="btnAccion">
                        <v-btn
                          icon
                          color="red"
                          x-small
                          @click="eliminarCostos({ costo: valor })"
                        >
                          <v-icon>mdi-delete</v-icon>
                        </v-btn>
                      </td>
                      <td class="colProveedorMultiplicador">
                        <v-autocomplete
                          dense
                          item-text="namelong"
                          item-value="id"
                          :items="$store.state.proveedor.lstProveedores"
                          @update:search-input="recargarProveedores"
                          v-model="valor.id_proveedor"
                          hide-details
                          append-icon="mdi-plus"
                          @click:append="abrirModalRegistroProveedor(valor)"
                        ></v-autocomplete>
                      </td>
                      <td class="colConcepto">
                        <v-text-field
                          dense
                          hide-details
                          v-model="valor.nameservice"
                        ></v-text-field>
                      </td>
                      <td class="colProveedorMultiplicador">
                        <v-select
                          class="widthTD"
                          :items="$store.state.pricing.listMultiplicador"
                          v-model="valor.id_multiplicador"
                          placeholder="Multiplicador"
                          hide-details
                          dense
                          @change="calcTotales"
                          :readonly="
                            isITBM(valor.code_cost) ||
                            isConfeccion(valor.code_cost) ||
                            isNotaCredito(valor.code_cost)
                          "
                        ></v-select>
                      </td>

                      <td class="colCostos">
                        <v-text-field
                          class="derecha tdMontos"
                          v-if="
                            isNotPorcentaje(valor, valor.id_multiplicador) &&
                            !isITBM(valor.code_cost) &&
                            !isConfeccion(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                          "
                          dense
                          max-width="50%"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          :rules="[
                            (v) => {
                              if (v > 0) {
                                valor.error = ''; // Borra el mensaje de error si el valor es válido
                                return true; // La regla se cumple
                              }
                              valor.error = 'El costo que tiene un valor 0.00.';
                              return false; // La regla no se cumple
                            },
                          ]"
                          prefix="$"
                          type="number"
                          step="0.01"
                          :min="valor.minimo"
                          v-on:blur="calcTotales"
                        ></v-text-field>
                        <v-text-field
                          class="derecha tdMontos"
                          v-if="
                            $store.state.pricing.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador &&
                                (v.code == 13 || v.code == 14 || v.code == 15),
                            ) &&
                            !isITBM(valor.code_cost) &&
                            !isConfeccion(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                          "
                          hide-details
                          max-width="50%"
                          suffix="%"
                          dense
                          max="100"
                          v-model="valor.cif"
                          type="number"
                          :min="valor.minimo"
                          step="0.01"
                          v-on:blur="calcTotales"
                        ></v-text-field>
                        <v-text-field
                          max-width="50%"
                          suffix="%"
                          class="derecha tdMontos"
                          v-if="
                            ($store.state.pricing.listMultiplicador.filter(
                              (v) => v.id == valor.id_multiplicador,
                            )[0].code == 14 ||
                              $store.state.pricing.listMultiplicador.filter(
                                (v) => v.id == valor.id_multiplicador,
                              )[0].code == 5) &&
                            !isITBM(valor.code_cost) &&
                            !isConfeccion(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                          "
                          hide-details
                          dense
                          max="100"
                          v-model="valor.seguro"
                          type="number"
                          :min="valor.minimo"
                          step="0.01"
                          v-on:blur="calcTotales"
                        ></v-text-field>

                        <v-text-field
                          v-if="isITBM(valor.code_cost)"
                          readonly
                          dense
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        ></v-text-field>

                        <v-text-field
                          v-if="isConfeccion(valor.code_cost)"
                          readonly
                          dense
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        ></v-text-field>
                        <v-text-field
                          v-if="isNotaCredito(valor.code_cost)"
                          readonly
                          dense
                          v-model="valor.costounitario"
                          prefix="$"
                        ></v-text-field>
                      </td>

                      <td
                        class="colCostos"
                        v-if="
                          isNotPorcentaje(valor, valor.id_multiplicador) &&
                          !isITBM(valor.code_cost) &&
                          !isConfeccion(valor.code_cost) &&
                          !isNotaCredito(valor.code_cost)
                        "
                      >
                        {{ formatearCostoTotal(valor) }}
                      </td>

                      <td
                        class="colCostos"
                        v-if="
                          !isNotPorcentaje(valor, valor.id_multiplicador) &&
                          !isITBM(valor.code_cost) &&
                          !isConfeccion(valor.code_cost) &&
                          !isNotaCredito(valor.code_cost)
                        "
                      >
                        {{ formatearValorCalculado(valor) }}
                      </td>
                      <td
                        class="colCostos"
                        v-if="isConfeccion(valor.code_cost)"
                      >
                        {{ montoConfeccion(valor) }}
                      </td>
                      <td class="colCostos" v-if="isITBM(valor.code_cost)">
                        {{ montoITBM(valor) }}
                      </td>

                      <td
                        class="colCostos"
                        v-if="isNotaCredito(valor.code_cost)"
                      >
                        {{ montoNotaCredito(valor) }}
                      </td>
                    </tr>
                  </tbody>
                </v-simple-table>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
        <v-col class="derecha" v-if="mostrarBtnAlmacenFlag">
          <v-btn color="success" @click="comprobarAlmacen()"
            >Ver siguientes costos</v-btn
          >
        </v-col>
      </v-row>
    </div>
    <div id="gastosTerceros" v-if="mostrarGastosTerceros" class="my-0 py-0">
      <v-row>
        <v-col cols="12" class="my-1 py-1">
          <v-expansion-panels class="condensed" v-model="valueGastosTerceros">
            <v-expansion-panel>
              <v-expansion-panel-header>
                {{
                  $store.state.pricing.listTipoCostos.length > 0
                    ? $store.state.pricing.listTipoCostos.filter(
                        (v) => v.codigo == "GT",
                      )[0].name
                    : ""
                }}:
                <span>{{ currencyFormat(resumenOpcion.gastostercero) }}</span>
                <v-icon
                  color="red"
                  v-if="
                    mostrarAdvertencia(
                      valores.filter((v) => v.esgastostercerosflag == 1),
                    )
                  "
                >
                  mdi-alert-circle
                </v-icon>
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-simple-table dense>
                  <thead>
                    <tr>
                      <th style=""></th>
                      <th style="">Proveedor</th>
                      <th style="">Conceptos</th>
                      <th style="">Multipicador</th>
                      <th class="derecha" style="">Costo Unitario</th>
                      <th style="">Sub Total</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr
                      v-for="(valor, i) in valores.filter(
                        (v) => v.esgastostercerosflag == 1 && v.status == 1,
                      )"
                      :key="i"
                    >
                      <td class="btnAccion">
                        <v-btn
                          icon
                          color="red"
                          x-small
                          @click="eliminarCostos({ costo: valor })"
                        >
                          <v-icon>mdi-delete</v-icon>
                        </v-btn>
                      </td>
                      <td class="colProveedorMultiplicador">
                        <v-autocomplete
                          dense
                          item-text="namelong"
                          item-value="id"
                          :items="$store.state.proveedor.lstProveedores"
                          @update:search-input="recargarProveedores"
                          v-model="valor.id_proveedor"
                          hide-details
                          append-icon="mdi-plus"
                          @click:append="abrirModalRegistroProveedor(valor)"
                        ></v-autocomplete>
                      </td>
                      <td class="colConcepto">
                        <v-text-field
                          dense
                          hide-details
                          v-model="valor.nameservice"
                        ></v-text-field>
                      </td>
                      <td class="colProveedorMultiplicador">
                        <v-select
                          class="widthTD"
                          :items="$store.state.pricing.listMultiplicador"
                          v-model="valor.id_multiplicador"
                          placeholder="Multiplicador"
                          hide-details
                          dense
                          @change="calcTotales"
                          :readonly="
                            isITBM(valor.code_cost) ||
                            isConfeccion(valor.code_cost) ||
                            isNotaCredito(valor.code_cost)
                          "
                        ></v-select>
                      </td>

                      <td class="colCostos">
                        <v-text-field
                          class="derecha tdMontos"
                          v-if="
                            isNotPorcentaje(valor, valor.id_multiplicador) &&
                            !isITBM(valor.code_cost) &&
                            !isConfeccion(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                          "
                          dense
                          max-width="50%"
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          :rules="[
                            (v) => {
                              if (v > 0) {
                                valor.error = ''; // Borra el mensaje de error si el valor es válido
                                return true; // La regla se cumple
                              }
                              valor.error = 'El costo que tiene un valor 0.00.';
                              return false; // La regla no se cumple
                            },
                          ]"
                          prefix="$"
                          type="number"
                          step="0.01"
                          :min="valor.minimo"
                          v-on:blur="calcTotales"
                        ></v-text-field>
                        <v-text-field
                          class="derecha tdMontos"
                          v-if="
                            $store.state.pricing.listMultiplicador.some(
                              (v) =>
                                v.id == valor.id_multiplicador &&
                                (v.code == 13 || v.code == 14 || v.code == 15),
                            ) &&
                            !isITBM(valor.code_cost) &&
                            !isConfeccion(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                          "
                          hide-details
                          max-width="50%"
                          suffix="%"
                          dense
                          max="100"
                          v-model="valor.cif"
                          type="number"
                          :min="valor.minimo"
                          step="0.01"
                          v-on:blur="calcTotales"
                        ></v-text-field>
                        <v-text-field
                          max-width="50%"
                          suffix="%"
                          class="derecha tdMontos"
                          v-if="
                            ($store.state.pricing.listMultiplicador.filter(
                              (v) => v.id == valor.id_multiplicador,
                            )[0].code == 14 ||
                              $store.state.pricing.listMultiplicador.filter(
                                (v) => v.id == valor.id_multiplicador,
                              )[0].code == 5) &&
                            !isITBM(valor.code_cost) &&
                            !isConfeccion(valor.code_cost) &&
                            !isNotaCredito(valor.code_cost)
                          "
                          hide-details
                          dense
                          max="100"
                          v-model="valor.seguro"
                          type="number"
                          :min="valor.minimo"
                          step="0.01"
                          v-on:blur="calcTotales"
                        ></v-text-field>

                        <v-text-field
                          v-if="isITBM(valor.code_cost)"
                          readonly
                          dense
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        ></v-text-field>

                        <v-text-field
                          v-if="isConfeccion(valor.code_cost)"
                          readonly
                          dense
                          v-model="valor.costounitario"
                          :error-messages="valor.error"
                          prefix="$"
                        ></v-text-field>
                        <v-text-field
                          v-if="isNotaCredito(valor.code_cost)"
                          readonly
                          dense
                          v-model="valor.costounitario"
                          prefix="$"
                        ></v-text-field>
                      </td>

                      <td
                        class="colCostos"
                        v-if="
                          isNotPorcentaje(valor, valor.id_multiplicador) &&
                          !isITBM(valor.code_cost) &&
                          !isConfeccion(valor.code_cost) &&
                          !isNotaCredito(valor.code_cost)
                        "
                      >
                        {{ formatearCostoTotal(valor) }}
                      </td>

                      <td
                        class="colCostos"
                        v-if="
                          !isNotPorcentaje(valor, valor.id_multiplicador) &&
                          !isITBM(valor.code_cost) &&
                          !isConfeccion(valor.code_cost) &&
                          !isNotaCredito(valor.code_cost)
                        "
                      >
                        {{ formatearValorCalculado(valor) }}
                      </td>
                      <td
                        class="colCostos"
                        v-if="isConfeccion(valor.code_cost)"
                      >
                        {{ montoConfeccion(valor) }}
                      </td>
                      <td class="colCostos" v-if="isITBM(valor.code_cost)">
                        {{ montoITBM(valor) }}
                      </td>

                      <td
                        class="colCostos"
                        v-if="isNotaCredito(valor.code_cost)"
                      >
                        {{ montoNotaCredito(valor) }}
                      </td>
                    </tr>
                  </tbody>
                </v-simple-table>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
        <v-col class="derecha" v-if="mostrarBtnGastosTercerosFlag">
          <v-btn color="success" @click="comprobarGastosTerceros()"
            >Ver siguientes costos</v-btn
          >
        </v-col>
      </v-row>
    </div>

    <v-dialog v-model="dialog" persistent max-width="30%">
      <v-form ref="frmNuevoCosto">
        <v-card>
          <v-card-title primary-title> Nuevo Costo </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" class="my-1 py-1">
                <v-autocomplete
                  dense
                  autocomplete="none"
                  :items="tipoOpcion"
                  label="Tipo"
                  item-value="codigo"
                  item-text="name"
                  v-model="fromDataService.idOpcion"
                  :rules="[(v) => !!v || 'Dato requerido']"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" class="my-1 py-1">
                <v-autocomplete
                  dense
                  label="Proveedor"
                  item-text="namelong"
                  item-value="id"
                  :items="$store.state.proveedor.lstProveedores"
                  @update:search-input="recargarProveedores"
                  v-model="fromDataService.id_proveedor"
                  :rules="[(v) => !!v || 'Dato requerido']"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" class="my-1 py-1">
                <v-autocomplete
                  dense
                  label="Multiplicador"
                  :items="$store.state.pricing.listMultiplicador"
                  v-model="fromDataService.id_multiplicador"
                  :rules="[(v) => !!v || 'Dato requerido']"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" class="my-1 py-1">
                <v-text-field
                  dense
                  label="Concepto"
                  :rules="[(v) => !!v || 'Dato requerido']"
                  v-model="fromDataService.nameservice"
                >
                </v-text-field>
              </v-col>
              <v-col cols="12" class="my-1 py-1">
                <v-text-field
                  dense
                  label="Precio"
                  type="number"
                  min="0"
                  :rules="[(v) => !!v || 'Dato requerido']"
                  v-model="fromDataService.costounitario"
                >
                </v-text-field>
              </v-col>
              <v-col cols="12" class="my-0 py-0">
                <v-alert
                  outlined
                  type="warning"
                  prominent
                  border="left"
                  class="px-5 mx-5"
                  dense
                >
                  El concepto se verá reflejado al abrir la sección
                  correspondiente.
                </v-alert>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions class="d-flex justify-end">
            <v-btn color="success" @click="guardarCosto()">Aceptar</v-btn>
            <v-btn color="red" @click="dialog = !dialog" dark>cancelar</v-btn>
          </v-card-actions>
        </v-card>
      </v-form>
    </v-dialog>

    <v-dialog v-model="dialogNuevoProveedor" persistent max-width="80%">
      <v-card>
        <v-card-title primary-title>
          Ficha de Proveedores <v-spacer></v-spacer>
          <v-btn
            icon
            color="red"
            @click="dialogNuevoProveedor = !dialogNuevoProveedor"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <NuevoProveedorComponentVue
            :isPricing="true"
            v-show="dialogNuevoProveedor"
            @GuardarProveedorExiste="guardarProveedorE"
          />
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="success"
            v-if="mostrarBtnRegistroProveedor()"
            @click="nuevoProveedor()"
            >Guardar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { mapActions } from "vuex";
import NuevoProveedorComponentVue from "@/components/folderEntities/Proveedor/NuevoProveedorComponent.vue";
import mixins from "@/components/mixins/funciones.js";
export default {
  mixins: [mixins],
  props: [
    "valores",
    "actualizarCostosFlag",
    "amount",
    "index",
    "recargarSegmentos",
  ],
  components: { NuevoProveedorComponentVue },
  data() {
    return {
      costo: {},
      dialogNuevoProveedor: false,
      totalOption: 0,
      valueFleteImport: 0,
      valueOrigen: 0,
      valueLocal: 0,
      valueAduana: 0,
      valueFleteExport: 0,
      valueAlmacen: 0,
      valueGastosTerceros: 0,
      resumenOpcion: {
        flete: 0,
        origen: 0,
        gasto: 0,
        aduana: 0,
        almacen: 0,
        gastostercero: 0,
      },
      dialog: false,
      // -----------------------------
      mostrarBtnFleteImportFlag: true,
      mostrarBtnOrigenFlag: true,
      mostrarBtnLocalFlag: true,
      mostrarBtnAduanaFlag: true,
      mostrarBtnFleteExportFlag: true,
      mostrarBtnAlmacenFlag: true,
      mostrarBtnGastosTercerosFlag: true,
      // -----------------------------

      // -----------------------------
      mostrarFleteImportFlag: false,
      mostrarOrigenFlag: false,
      mostrarLocalFlag: false,
      mostrarAduanaFlag: false,
      mostrarFleteExportFlag: false,
      mostrarAlmacenFlag: false,
      mostrarGastosTercerosFlag: false,
      // -----------------------------
      fromDataService: {
        ventaFlag: 0,
        esopcionflag: 1,
        id_begend: 0,
        costounitario: "",
        esorigenflag: 0,
        eslocalflag: 0,
        esaduanaflag: 0,
        esalmacenflag: 0,
        esgastostercerosflag: 0,
        seguro: 0,
        cif: 0,
        esventaflag: 0,
        status: 1,
        id_groupservices: 0,
        id_multiplicador: 0,
        id_proveedor: 0,
        id: 0,
      },
    };
  },
  async mounted() {
    this.calcTotales();
    this.$store.state.pricing.mostrarGuardarCostos = false;
    await this.habilidarPrimeraAccion();
    if (!!this.index) {
      this.habilidarCuandoYaHayOpciones();
    }
  },
  methods: {
    ...mapActions([
      "guardarProveedor",
      "cargarProveedores",
      "obtenerProveedorPricing",
    ]),
    async nuevoProveedor() {
      let res = await this.guardarProveedor();
      if (!!res.estadoflag) {
        await this.cargarProveedores();
        this.costo.id_proveedor = res.data[0].id_entitie;
        this.dialogNuevoProveedor = false;
      }
      let opciones = [...this.$store.state.pricing.opcionCostos];
      let IdProveedor = [];
      opciones.forEach((opcion) => {
        opcion.listCostos.forEach((costo) => {
          if (!IdProveedor.some((v) => v == costo.id_proveedor))
            IdProveedor.push(costo.id_proveedor);
        });
      });
      await this.obtenerProveedorPricing({
        id: IdProveedor.join(","),
        search: null,
      });
    },
    async recargarProveedores(e) {
      let opciones = [...this.$store.state.pricing.opcionCostos];
      let IdProveedor = [];
      opciones.forEach((opcion) => {
        opcion.listCostos.forEach((costo) => {
          if (!IdProveedor.some((v) => v == costo.id_proveedor))
            IdProveedor.push(costo.id_proveedor);
        });
      });
      await this.obtenerProveedorPricing({
        id: IdProveedor.join(","),
        search: e,
      });
    },
    isITBM(code) {
      return code == 38 ? true : false;
    },
    guardarProveedorE(val) {
      this.costo.id_proveedor = val;
      this.dialogNuevoProveedor = false;
    },
    abrirModalRegistroProveedor(item) {
      this.costo = item;
      this.dialogNuevoProveedor = true;
    },
    mostrarBtnRegistroProveedor() {
      if (!this.$store.state.entities.proveedor.nombrecompleto) {
        return false;
      }
      if (!this.$store.state.entities.proveedor.id_tipoproveedor) {
        return false;
      }
      if (!this.$store.state.entities.proveedor.id_tipotransaccion) {
        return false;
      }
      if (!this.$store.state.entities.proveedor.id_pais) {
        return false;
      }
      return true;
    },
    habilidarCuandoYaHayOpciones() {
      this.$nextTick(() => {
        if (this.isFlete && this.isImport) {
          this.mostrarFleteImportFlag = true;
        }
        if (this.isOrigen) {
          this.mostrarOrigenFlag = true;
        }
        if (this.isLocal) {
          this.mostrarLocalFlag = true;
        }

        if (this.isAduana) {
          this.mostrarAduanaFlag = true;
        }
        if (this.isFlete && !this.isImport) {
          this.mostrarFleteExportFlag = true;
        }
        if (this.isAlmacen) {
          this.mostrarAlmacenFlag = true;
        }
        if (this.isGastosTercero) {
          this.mostrarGastosTercerosFlag = true;
        }
        this.mostrarBtnFleteImportFlag = false;
        this.mostrarBtnOrigenFlag = false;
        this.mostrarBtnLocalFlag = false;
        this.mostrarBtnAduanaFlag = false;
        this.mostrarBtnFleteExportFlag = false;
        this.mostrarBtnAlmacenFlag = false;
        this.mostrarBtnGastosTercerosFlag = false;
        this.valueFleteImport = 1;
        this.valueOrigen = 1;
        this.valueLocal = 1;
        this.valueAduana = 1;
        this.valueFleteExport = 1;
        this.valueAlmacen = 1;
        this.valueGastosTerceros = 1;
        this.$forceUpdate();
      });
    },
    habilidarPrimeraAccion() {
      // 1. Agrupamos la lógica de Fletes
      if (this.isFlete) {
        if (this.isImport) {
          this.mostrarFleteImportFlag = true;
        } else {
          this.mostrarFleteExportFlag = true;
        }
        return true;
      }

      // 2. Evaluamos el resto de flags secuencialmente
      if (this.isOrigen) {
        this.mostrarOrigenFlag = true;
        return true;
      }
      if (this.isLocal) {
        this.mostrarLocalFlag = true;
        return true;
      }
      if (this.isAduana) {
        this.mostrarAduanaFlag = true;
        return true;
      }
      if (this.isAlmacen) {
        this.mostrarAlmacenFlag = true;
        return true;
      }
      if (this.isGastosTercero) {
        this.mostrarGastosTercerosFlag = true;
        return true;
      }

      return false; // Es una buena práctica retornar false si ninguna condición se cumplió
    },
    comprobarFleteImport() {
      let tieneErrores = false;

      // 1. Filtramos y evaluamos en un solo recorrido eficiente
      this.valores
        .filter((v) => v.esfleteflag == 1 && v.status === true)
        .forEach((element) => {
          const tieneErrorCosto = this.validateCost({ costo: element });

          if (tieneErrorCosto) {
            element.error = "El costo que tiene un valor 0.00.";
            tieneErrores = true; // Si encontramos al menos uno, activamos la bandera
          } else {
            element.error = "";
          }
        });

      // 2. Si no hubo errores, avanzamos a la siguiente acción
      if (!tieneErrores) {
        this.mostrarSiguienteFleteImport();
        this.valueFleteImport = 1;
        this.mostrarBtnFleteImportFlag = false;
      }
    },

    mostrarSiguienteFleteImport() {
      // Diccionario de condiciones para evitar los 'if' repetitivos
      const pasos = [
        { condicion: this.isOrigen, flag: "mostrarOrigenFlag" },
        { condicion: this.isLocal, flag: "mostrarLocalFlag" },
        { condicion: this.isAduana, flag: "mostrarAduanaFlag" },
        {
          condicion: this.isFlete && !this.isImport,
          flag: "mostrarFleteExportFlag",
        },
        { condicion: this.isAlmacen, flag: "mostrarAlmacenFlag" },
        { condicion: this.isGastosTercero, flag: "mostrarGastosTercerosFlag" },
      ];

      // Buscamos el primer paso que se cumpla
      const pasoSiguiente = pasos.find((p) => p.condicion);

      if (pasoSiguiente) {
        this[pasoSiguiente.flag] = true;
        return true;
      }

      // Si no se cumplió ninguna condición anterior, se habilita el botón de guardar
      this.$store.state.pricing.mostrarGuardarCostos = true;
    },
    avanzarFlujoFormulario() {
      // Lista única con el orden estricto de prioridad de tus pantallas
      const pasos = [
        { condicion: this.isOrigen, flag: "mostrarOrigenFlag" },
        { condicion: this.isLocal, flag: "mostrarLocalFlag" },
        { condicion: this.isAduana, flag: "mostrarAduanaFlag" },
        {
          condicion: this.isFlete && !this.isImport,
          flag: "mostrarFleteExportFlag",
        },
        { condicion: this.isAlmacen, flag: "mostrarAlmacenFlag" },
        { condicion: this.isGastosTercero, flag: "mostrarGastosTercerosFlag" },
      ];

      // Buscamos el PRIMER paso que esté activo en la cotización y que todavía esté oculto
      const proximoPaso = pasos.find((p) => p.condicion && !this[p.flag]);

      if (proximoPaso) {
        this[proximoPaso.flag] = true;
        return true; // Se abrió una nueva sección con éxito
      }

      // Si ya se recorrieron o mostraron todas las secciones activas, liberamos el botón final
      this.$store.state.pricing.mostrarGuardarCostos = true;
      return false;
    },

    // ========================================================
    // 2. VALIDADOR ÚNICO: Reutiliza la lógica de filtrado y errores
    // ========================================================
    procesarValidacionSeccion(flagFiltro, propiedadValor, flagBoton) {
      let tieneErrores = false;

      // Filtramos dinámicamente según la bandera de la fila (ej: 'esorigenflag')
      this.valores
        .filter((v) => v[flagFiltro] == 1 && v.status === true)
        .forEach((element) => {
          const tieneErrorCosto = this.validateCost({ costo: element });

          if (tieneErrorCosto) {
            element.error = "El costo que tiene un valor 0.00.";
            tieneErrores = true;
          } else {
            element.error = "";
          }
        });

      // Si no hay errores, cerramos el paso actual y disparamos el flujo al siguiente paso
      if (!tieneErrores) {
        this[propiedadValor] = 1; // Ej: this.valueOrigen = 1
        this[flagBoton] = false; // Ej: this.mostrarBtnOrigenFlag = false
        this.avanzarFlujoFormulario(); // Calcula automáticamente cuál sigue o si ya guarda
      }
    },

    // ========================================================
    // 3. TUS MÉTODOS (Ahora solo invocan al validador único)
    // ========================================================
    comprobarOrigen() {
      this.procesarValidacionSeccion(
        "esorigenflag",
        "valueOrigen",
        "mostrarBtnOrigenFlag",
      );
    },

    comprobarLocal() {
      this.procesarValidacionSeccion(
        "eslocalflag",
        "valueLocal",
        "mostrarBtnLocalFlag",
      );
    },

    comprobarAduana() {
      this.procesarValidacionSeccion(
        "esaduanaflag",
        "valueAduana",
        "mostrarBtnAduanaFlag",
      );
    },

    comprobarFleteExport() {
      this.procesarValidacionSeccion(
        "esfleteflag",
        "valueFleteExport",
        "mostrarBtnFleteExportFlag",
      );
    },

    comprobarAlmacen() {
      this.procesarValidacionSeccion(
        "esalmacenflag",
        "valueAlmacen",
        "mostrarBtnAlmacenFlag",
      );
    },

    comprobarGastosTerceros() {
      this.procesarValidacionSeccion(
        "esgastostercerosflag",
        "valueGastosTerceros",
        "mostrarBtnGastosTercerosFlag",
      );
    },

    validateCost({ costo }) {
      let service = this.$store.state.pricing.listServices.filter(
        (v) => v.status == 1,
      );
      let multiplocadores = this.$store.state.pricing.listMultiplicador.filter(
        (v) => {
          return this.comienzaNoConCaracter(v.text, "%");
        },
      );
      let idMultiplicador = multiplocadores.map((v) => v.id);
      let idServices = service.map((v) => v.id_groupservices);
      if (
        !!idMultiplicador.includes(costo.id_multiplicador) &&
        !!idServices.includes(costo.id_groupservices) &&
        !!(costo.costounitario == 0)
      ) {
        return true;
      } else {
        return false;
      }
    },
    eliminarCostos({ costo = null }) {
      costo.status = 0;
      this.$store.state.pricing.listCostos =
        this.$store.state.pricing.listCostos.filter((v) => v.status == 1);
      setTimeout(() => {
        this.calcTotales();
      }, 10);
    },

    async calcTotales() {
      setTimeout(async () => {
        // this.$store.state.pricing.totalFlete = 0.0;
        await this.calcularTotalesFlete();
        await this.calcularTotalesNoFlete();
        await this.calcTotal();
      }, 100);
    },
    obtenerCostoElemento(element) {
     
      const { listMultiplicador, datosPrincipales, totalFlete } =
        this.$store.state.pricing;
      const multiplicadores = listMultiplicador || [];

      // Buscamos el multiplicador una sola vez por elemento
      const multEncontrado = multiplicadores.find(
        (v) => v.id === element.id_multiplicador,
      );

      const valorMultiplicador = multEncontrado ? multEncontrado.valor : 0;
      const codigoMultiplicador = multEncontrado ? multEncontrado.code : "N";

      // CASO A: No es porcentaje (Cálculo basado en factor)
      if (this.isNotPorcentaje(element, element.id_multiplicador)) {
        const factorCalculado = this.calcularFac(
          codigoMultiplicador,
          datosPrincipales.volumen,
          datosPrincipales.peso,
          datosPrincipales.containers,
          datosPrincipales.amount,
        );
        return valorMultiplicador * element.costounitario * factorCalculado;
      }

      // CASO B: Sí es porcentaje (Cálculo basado en CIF / Seguro)
      const codigosEspeciales = [13, 14, 15, 5];
      const parametroEspecial = codigosEspeciales.includes(codigoMultiplicador)
        ? element.cif
        : element.seguro;

      return this.calcularValor(
        datosPrincipales.amount,
        totalFlete,
        multEncontrado ? codigoMultiplicador : "",
        parametroEspecial,
        element.minimo,
      );
    },

    // ==========================================
    // 2. MÉTODOS PRINCIPALES SIMPLIFICADOS
    // ==========================================
    calcularTotalesFlete() {
      this.totalOption = 0;
      this.resumenOpcion = {
        flete: 0,
        origen: 0,
        gasto: 0,
        aduana: 0,
        almacen: 0,
        gastostercero: 0,
      };

      if (!this.isFlete) return;

      this.valores
        .filter(
          (v) => v.esfleteflag == 1 && v.status == 1 && v.esopcionflag == 1,
        )
        .forEach((element) => {
          this.resumenOpcion.flete += this.obtenerCostoElemento(element);
        });
    },

    calcularTotalesNoFlete() {
      // Mantener el flete acumulado previamente
      this.resumenOpcion = {
        ...this.resumenOpcion,
        origen: 0,
        gasto: 0,
        aduana: 0,
        almacen: 0,
        gastostercero: 0,
      };

      this.valores
        .filter((v) => v.status == 1)
        .forEach((element) => {
          // Usamos el helper para obtener el costo procesado una sola vez
          const costo = this.obtenerCostoElemento(element);

          if (this.isOrigen && element.esorigenflag == 1) {
            this.resumenOpcion.origen += Number(costo);
          }
          if (this.isLocal && element.eslocalflag == 1) {
            this.resumenOpcion.gasto += Number(costo); // Mantenido como 'gasto' según tu lógica
          }
          if (this.isAduana && element.esaduanaflag == 1) {
            this.resumenOpcion.aduana += Number(costo);
          }
          if (this.isAlmacen && element.esalmacenflag == 1) {
            this.resumenOpcion.almacen += Number(costo);
          }
          if (this.isGastosTercero && element.esgastostercerosflag == 1) {
            this.resumenOpcion.gastostercero += Number(costo);
          }
        });
    },
    calcTotal() {
      this.totalOption = 0;
      this.totalOption =
        (Number(this.resumenOpcion.flete) || 0) +
        (Number(this.resumenOpcion.gasto) || 0) +
        (Number(this.resumenOpcion.aduana) || 0) +
        (Number(this.resumenOpcion.origen) || 0) +
        (Number(this.resumenOpcion.almacen) || 0) +
        (Number(this.resumenOpcion.gastostercero) || 0);

      this.$store.state.pricing.totalCosto = this.totalOption;
    },
    cerrarModalNuevoCosto() {
      // this.$refs.frmNuevoCosto.reset();
      this.dialog = !this.dialog;
    },
    guardarCosto() {
      switch (this.fromDataService.idOpcion) {
        case "GT":
          this.fromDataService.esgastostercerosflag = 1;
          break;
        case "FL":
          this.fromDataService.esfleteflag = 1;
          break;
        case "OR":
          this.fromDataService.esorigenflag = 1;
          break;
        case "LO":
          this.fromDataService.eslocalflag = 1;
          break;
        case "AD":
          this.fromDataService.esaduanaflag = 1;
          break;
        case "AL":
          this.fromDataService.esalmacenflag = 1;
          break;
      }

      this.$store.state.pricing.opcionCostos
        .filter((v) => v.nro_propuesta == this.valores[0].nro_propuesta)[0]
        .listCostos.push(this.fromDataService);

      this.dialog = !this.dialog;
      this.$forceUpdate();
      this.calcTotales();
    },
    isNotPorcentaje(element, id_multiplicador) {
      let code = [5, 13, 14, 15];

      let mul = this.$store.state.pricing.listMultiplicador.some(
        (v) => v.id == id_multiplicador && code.includes(v.code),
      );

      return !mul;
    },
    abrirModal() {
      this.dialog = !this.dialog;
      this.$nextTick(() => {
        this.$refs.frmNuevoCosto.resetValidation();
      });
      this.limpiar();
    },

    montoConfeccion(item) {
      let monto = 0;
      if (item.code_cost == 33) {
        let amount = this.$store.state.pricing.datosPrincipales.amount;
        let cif =
          parseFloat(amount) +
          parseFloat(this.$store.state.pricing.totalFlete) +
          (parseFloat(amount) +
            parseFloat(this.$store.state.pricing.totalFlete)) *
            0.01;

        if (cif < 5000) {
          monto = 50;
        }
        if (cif >= 5000 && cif < 10000) {
          monto = 80;
        }
        if (cif >= 10000) {
          monto = 80 + parseFloat(cif * 0.0025);
        }
      }

      item.costounitario = parseFloat(monto).toFixed(2);
      return this.currencyFormat(monto);
    },

    montoITBM(item) {
      let montoTotal = 0;
      const codigosFiltrar = [29, 36, 41, 68];

      if (item.code_cost === 38) {
        const { listMultiplicador, datosPrincipales } =
          this.$store.state.pricing;

        // 1. Filtramos los valores que necesitamos procesar
        const valoresFiltrados = this.valores.filter((v) =>
          codigosFiltrar.includes(v.code_cost),
        );

        valoresFiltrados.forEach((element) => {
          // 2. Buscamos el multiplicador UNA sola vez con .find()
          const multiplicador = listMultiplicador.find(
            (v) => v.id == element.id_multiplicador,
          );

          // Si existe extraemos sus datos, si no, valores por defecto
          const valorMultiplicador = multiplicador
            ? parseFloat(multiplicador.valor)
            : 0;
          const codigoMultiplicador = multiplicador ? multiplicador.code : "N";

          // 3. Calculamos el factor de forma limpia
          const factor = this.calcularFac(
            codigoMultiplicador,
            datosPrincipales.volumen,
            datosPrincipales.peso,
            datosPrincipales.containers,
            datosPrincipales.amount,
          );

          // 4. Sumamos al monto de forma legible
          const costoUnitario = parseFloat(element.costounitario || 0);
          montoTotal += valorMultiplicador * costoUnitario * factor;
        });
      }

      // 5. Calculamos el ITBMS (7%)
      const itbmCalculado = (montoTotal * 0.07).toFixed(2);

      // Guardamos el costo unitario en el item como lo hacías originalmente
      item.costounitario = parseFloat(itbmCalculado);

      // Retornamos el valor formateado
      return this.currencyFormat(itbmCalculado);
    },

    montoNotaCredito(item) {
      let monto = 0;
      let code = [33];
      if (item.code_cost == 69) {
        let val = this.valores.filter((v) => code.includes(v.code_cost));
        val.forEach((element) => {
          monto = element.costounitario;
        });
      }
      item.costounitario = -1 * parseFloat(monto * 0.5).toFixed(2);
      return this.currencyFormat(-1 * parseFloat(monto * 0.5).toFixed(2));
    },
    limpiar() {
      this.fromDataService = {
        ventaFlag: 0,
        esopcionflag: 1,
        id_begend: 0,
        costounitario: "",
        esorigenflag: 0,
        eslocalflag: 0,
        esaduanaflag: 0,
        esalmacenflag: 0,
        seguro: 0,
        cif: 0,
        esventaflag: 0,
        status: 1,
        id_groupservices: 0,
        id_multiplicador: 0,
        id_proveedor: 0,
      };
    },

    mostrarAdvertencia(data) {
      return data.some(
        (v) => v.status == 1 && v.error != null && v.error !== "",
      );
    },
    isConfeccion(code) {
      return code == 33 ? true : false;
    },
    isNotaCredito(code) {
      return code == 69 ? true : false;
    },
    formatearValorCalculado(valor) {
      
      const pricingState = this.$store.state.pricing;
      const multiplicadores = pricingState.listMultiplicador || [];

      const multiplicadorEncontrado = multiplicadores.find(
        (v) => v.id === valor.id_multiplicador,
      );

      const codigoMultiplicador = multiplicadorEncontrado
        ? multiplicadorEncontrado.code
        : "";

      let tercerParametro = 0;
      if (multiplicadorEncontrado) {
        const codigosEspeciales = [13, 14, 15, 5];
        tercerParametro = codigosEspeciales.includes(
          multiplicadorEncontrado.code,
        )
          ? valor.cif
          : valor.seguro;
      }

      const resultadoCalculado = this.calcularValor(
        pricingState.datosPrincipales.amount,
        pricingState.totalFlete,
        codigoMultiplicador,
        tercerParametro,
        valor.minimo,
      );

      return this.currencyFormat(resultadoCalculado);
    },
    formatearCostoTotal(valor) {
      // 1. Desestructuración de los estados del Vuex para escribir menos y más limpio
      const { listMultiplicador, datosPrincipales } = this.$store.state.pricing;
      const multiplicadores = listMultiplicador || [];

      // 2. Buscamos el multiplicador correspondiente UNA SOLA VEZ
      const multEncontrado = multiplicadores.find(
        (v) => v.id === valor.id_multiplicador,
      );

      // 3. Extraemos las variables con valores por defecto si no existe el multiplicador
      const valorMultiplicador = multEncontrado ? multEncontrado.valor : 0;
      const codigoMultiplicador = multEncontrado ? multEncontrado.code : "N";

      // 4. Ejecutamos la función calcularFac pasándole los datos de pricing
      const factorCalculado = this.calcularFac(
        codigoMultiplicador,
        datosPrincipales.volumen,
        datosPrincipales.peso,
        datosPrincipales.containers,
        datosPrincipales.amount,
      );

      // 5. Realizamos la operación matemática final
      const operacionFinal =
        valorMultiplicador * valor.costounitario * factorCalculado;

      // 6. Retornamos el valor con su respectivo formato de moneda
      return this.currencyFormat(operacionFinal);
    },
  },
  watch: {
    valores() {
      this.calcTotales();
    },
    actualizarCostosFlag() {
      this.calcTotales();
    },
    amount() {
      this.calcTotales();
    },
    cancelarLlenadoNuevaOpcion() {
      // this.habilidarPrimeraAccion();
      this.mostrarSiguienteFleteImport();
      this.mostrarSiguienteOrigen();
      this.mostrarSiguienteLocal();
      this.mostrarSiguienteAduana();
      this.mostrarSiguienteFleteExport();
      this.valueFleteImport = 1;
      this.valueOrigen = 1;
      this.valueLocal = 1;
      this.valueAduana = 1;
      this.valueAlmacen = 1;
      this.valueFleteExport = 1;
      this.mostrarBtnFleteImportFlag = false;
      this.mostrarBtnOrigenFlag = false;
      this.mostrarBtnLocalFlag = false;
      this.mostrarBtnAduanaFlag = false;
      this.mostrarBtnFleteExportFlag = false;
      this.mostrarBtnAlmacenFlag = false;
      this.$store.state.pricing.mostrarGuardarCostos = true;
    },
    totalFlete() {
      this.calcTotales();
    },
    idProveedor() {
      console.log("idProveedor", this.idProveedor);
    },
    recargarSegmentos() {
      this.habilidarCuandoYaHayOpciones();
    },
  },
  computed: {
    cancelarLlenadoNuevaOpcion: {
      get() {
        return this.$store.state.pricing.cancelarLlenadoNuevaOpcion;
      },
      set(val) {
        return (this.$store.state.pricing.cancelarLlenadoNuevaOpcion =
          cancelarLlenadoNuevaOpcion);
      },
    },
    totalFlete: {
      get() {
        return this.$store.state.pricing.totalFlete;
      },
      set(val) {
        return (this.$store.state.pricing.totalFlete = totalFlete);
      },
    },
    mostrarFleteImport() {
      return this.isImport && this.mostrarFleteImportFlag;
    },
    mostrarOrigen() {
      return this.mostrarOrigenFlag;
    },
    mostrarLocal() {
      return this.mostrarLocalFlag;
    },
    mostrarAduana() {
      return this.mostrarAduanaFlag;
    },
    mostrarFleteExport() {
      return !this.isImport && this.mostrarFleteExportFlag;
    },
    mostrarAlmacen() {
      return this.mostrarAlmacenFlag;
    },
    mostrarGastosTerceros() {
      return this.mostrarGastosTercerosFlag;
    },

    isFlete() {
      let val = this.valores.some(
        (v) => v.esfleteflag == 1 && v.status == true,
      );
      return val;
    },

    isOrigen() {
      let val = this.valores.some(
        (v) => v.esorigenflag == 1 && v.status == true,
      );

      return val;
    },

    isLocal() {
      let val = this.valores.some(
        (v) => v.eslocalflag == 1 && v.status == true,
      );
      return val;
    },

    isAduana() {
      let val = this.valores.some(
        (v) => v.esaduanaflag == 1 && v.status == true,
      );
      return val;
    },

    isGastosTercero() {
      let val = this.valores.some(
        (v) => v.esgastostercerosflag == 1 && v.status == true,
      );
      return val;
    },
    isAlmacen() {
      let val = this.valores.some(
        (v) => v.esalmacenflag == 1 && v.status == true,
      );
      return val;
    },

    isImport() {
      return this.$store.state.pricing.listModality.some(
        (v) =>
          v.id == this.$store.state.pricing.datosPrincipales.idsentido &&
          v.code == "I",
      );
    },
    tipoOpcion() {
      let tipoOpcion = [];
      this.$store.state.pricing.listTipoCostos.forEach((element) => {
        switch (element.codigo) {
          case "GT":
            if (this.mostrarGastosTerceros) {
              tipoOpcion.push(element);
            }
            break;
          case "FL":
            if (this.mostrarFleteImport || this.mostrarFleteExport) {
              tipoOpcion.push(element);
            }
            break;
          case "OR":
            if (this.mostrarOrigen) {
              tipoOpcion.push(element);
            }
            break;
          case "LO":
            if (this.mostrarLocal) {
              tipoOpcion.push(element);
            }
            break;
          case "AD":
            if (this.mostrarAduana) {
              tipoOpcion.push(element);
            }
            break;
          case "AL":
            if (this.mostrarAlmacen) {
              tipoOpcion.push(element);
            }
            break;

          default:
            break;
        }
      });
      return tipoOpcion;
    },
  },
};
</script>

<style scoped>
.v-expansion-panels.condensed
  .v-expansion-panel-header
  .v-expansion-panel-content__wrap {
  /* padding-top: 2px;
  padding-bottom: 2px; */
  /* padding: 2px 8px 2px; */
  min-height: auto;
}
.widthTD {
  max-width: 180px !important;
  padding: 0 18px !important;
}

.btnAccion {
  width: 5% !important;
  max-width: 5% !important;
}

.colProveedorMultiplicador {
  width: 20% !important;
  max-width: 20% !important;
}
.colConcepto {
  width: 35% !important;
  max-width: 35% !important;
  min-width: 35% !important;
}
.colCostos {
  width: 10% !important;
  max-width: 10% !important;
}

/* .tdMontos {
  width:  !important; 
} */

td {
  padding: 0 3px !important;
}
.derecha {
  text-align: right !important;
  align-content: right !important;
}
.v-text-field__slot {
  max-width: 5px !important;
}

table td:nth-child(5) {
  align-content: right !important;
  text-align: right !important;
  max-width: 90px !important;
  min-width: 90px !important;
}
table td:nth-child(6) {
  align-content: right !important;
  text-align: right !important;
  max-width: 90px !important;
  min-width: 90px !important;
}

.expansion {
  background: salmon !important;
  /* padding: 0 8px 16px !important; */
}

.v-expansion-panel-content >>> .v-expansion-panel-content__wrap {
  padding: 0px !important;
}
</style>
