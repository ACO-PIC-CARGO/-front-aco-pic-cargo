<template>
  <v-container fluid>
    <div class="">
      <span class="title">
        Costos {{ currencyFormat($store.state.pricing.totalCosto) }}</span
      >
    </div>
    <v-expansion-panels class="condensed my-1" v-if="isFlete() && isImport()">
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
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-simple-table dense>
            <thead>
              <tr>
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
                <td>
                  <v-autocomplete
                    class="widthTD"
                    dense
                    item-text="namelong"
                    item-value="id"
                    :items="$store.state.provedores"
                    v-model="valor.id_proveedor"
                    hide-details
                  ></v-autocomplete>
                </td>
                <td>
                  <v-text-field
                    readonly
                    class="widthTD"
                    dense
                    hide-details
                    v-model="valor.nameservice"
                  ></v-text-field>
                </td>
                <td>
                  <v-select
                    readonly
                    class="widthTD"
                    :items="$store.state.pricing.listMultiplicador"
                    v-model="valor.id_multiplicador"
                    placeholder="Multiplicador"
                    hide-details
                    dense
                    @change="calcTotales"
                  ></v-select>
                </td>

                <td>
                  <v-text-field
                    readonly
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
                    readonly
                    class="derecha tdMontos"
                    v-if="
                      $store.state.pricing.listMultiplicador.some(
                        (v) =>
                          v.id == valor.id_multiplicador &&
                          (v.code == 13 || v.code == 14),
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
                    readonly
                    max-width="50%"
                    suffix="%"
                    class="derecha tdMontos"
                    v-if="
                      $store.state.pricing.listMultiplicador.some(
                        (v) => v.id == valor.id_multiplicador && v.code == 5,
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
                    readonly
                    v-if="isITBM(valor.code_cost)"
                    dense
                    v-model="valor.costounitario"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>

                  <v-text-field
                    readonly
                    v-if="isConfeccion(valor.code_cost)"
                    dense
                    v-model="valor.costounitario"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>
                  <v-text-field
                    readonly
                    v-if="isNotaCredito(valor.code_cost)"
                    dense
                    v-model="valor.costounitario"
                    prefix="$"
                  ></v-text-field>
                </td>

                <td
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
                  v-if="
                    !isNotPorcentaje(valor, valor.id_multiplicador) &&
                    !isITBM(valor.code_cost) &&
                    !isConfeccion(valor.code_cost) &&
                    !isNotaCredito(valor.code_cost)
                  "
                >
                  {{ formatearValorCalculado(valor) }}
                </td>
                <td v-if="isConfeccion(valor.code_cost)">
                  {{ montoConfeccion(valor) }}
                </td>
                <td v-if="isITBM(valor.code_cost)">
                  {{ montoITBM(valor) }}
                </td>

                <td v-if="isNotaCredito(valor.code_cost)">
                  {{ montoNotaCredito(valor) }}
                </td>
              </tr>
            </tbody>
          </v-simple-table>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
    <v-expansion-panels class="condensed my-1" v-if="isOrigen()">
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
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-simple-table dense>
            <thead>
              <tr>
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
                <td>
                  <v-autocomplete
                    class="widthTD"
                    dense
                    item-text="namelong"
                    item-value="id"
                    :items="$store.state.provedores"
                    v-model="valor.id_proveedor"
                    hide-details
                  ></v-autocomplete>
                </td>
                <td>
                  <v-text-field
                    readonly
                    class="widthTD"
                    dense
                    hide-details
                    v-model="valor.nameservice"
                  ></v-text-field>
                </td>
                <td>
                  <v-select
                    readonly
                    class="widthTD"
                    :items="$store.state.pricing.listMultiplicador"
                    v-model="valor.id_multiplicador"
                    placeholder="Multiplicador"
                    hide-details
                    dense
                    @change="calcTotales"
                  ></v-select>
                </td>

                <td>
                  <v-text-field
                    readonly
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
                    readonly
                    class="derecha tdMontos"
                    v-if="
                      $store.state.pricing.listMultiplicador.some(
                        (v) =>
                          v.id == valor.id_multiplicador &&
                          (v.code == 13 || v.code == 14),
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
                    readonly
                    max-width="50%"
                    suffix="%"
                    class="derecha tdMontos"
                    v-if="
                      $store.state.pricing.listMultiplicador.some(
                        (v) => v.id == valor.id_multiplicador && v.code == 5,
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
                    readonly
                    v-if="isITBM(valor.code_cost)"
                    dense
                    v-model="valor.costounitario"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>

                  <v-text-field
                    readonly
                    v-if="isConfeccion(valor.code_cost)"
                    dense
                    v-model="valor.costounitario"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>
                  <v-text-field
                    readonly
                    v-if="isNotaCredito(valor.code_cost)"
                    dense
                    v-model="valor.costounitario"
                    prefix="$"
                  ></v-text-field>
                </td>

                <td
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
                  v-if="
                    !isNotPorcentaje(valor, valor.id_multiplicador) &&
                    !isITBM(valor.code_cost) &&
                    !isConfeccion(valor.code_cost) &&
                    !isNotaCredito(valor.code_cost)
                  "
                >
                  {{ formatearValorCalculado(valor) }}
                </td>
                <td v-if="isConfeccion(valor.code_cost)">
                  {{ montoConfeccion(valor) }}
                </td>
                <td v-if="isITBM(valor.code_cost)">
                  {{ montoITBM(valor) }}
                </td>

                <td v-if="isNotaCredito(valor.code_cost)">
                  {{ montoNotaCredito(valor) }}
                </td>
              </tr>
            </tbody>
          </v-simple-table>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
    <!-- LOCAL -->
    <v-expansion-panels class="condensed my-1" v-if="isLocal()">
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
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-simple-table dense>
            <thead>
              <tr>
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
                <td>
                  <v-autocomplete
                    class="widthTD"
                    dense
                    item-text="namelong"
                    item-value="id"
                    :items="$store.state.provedores"
                    v-model="valor.id_proveedor"
                    hide-details
                  ></v-autocomplete>
                </td>
                <td>
                  <v-text-field
                    readonly
                    class="widthTD"
                    dense
                    hide-details
                    v-model="valor.nameservice"
                  ></v-text-field>
                </td>
                <td>
                  <v-select
                    readonly
                    class="widthTD"
                    :items="$store.state.pricing.listMultiplicador"
                    v-model="valor.id_multiplicador"
                    placeholder="Multiplicador"
                    hide-details
                    dense
                    @change="calcTotales"
                  ></v-select>
                </td>

                <td>
                  <v-text-field
                    readonly
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
                    readonly
                    class="derecha tdMontos"
                    v-if="
                      $store.state.pricing.listMultiplicador.some(
                        (v) =>
                          v.id == valor.id_multiplicador &&
                          (v.code == 13 || v.code == 14),
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
                    readonly
                    max-width="50%"
                    suffix="%"
                    class="derecha tdMontos"
                    v-if="
                      $store.state.pricing.listMultiplicador.some(
                        (v) => v.id == valor.id_multiplicador && v.code == 5,
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
                    readonly
                    v-if="isITBM(valor.code_cost)"
                    dense
                    v-model="valor.costounitario"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>

                  <v-text-field
                    readonly
                    v-if="isConfeccion(valor.code_cost)"
                    dense
                    v-model="valor.costounitario"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>
                  <v-text-field
                    readonly
                    v-if="isNotaCredito(valor.code_cost)"
                    dense
                    v-model="valor.costounitario"
                    prefix="$"
                  ></v-text-field>
                </td>

                <td
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
                  v-if="
                    !isNotPorcentaje(valor, valor.id_multiplicador) &&
                    !isITBM(valor.code_cost) &&
                    !isConfeccion(valor.code_cost) &&
                    !isNotaCredito(valor.code_cost)
                  "
                >
                  {{ formatearValorCalculado(valor) }}
                </td>
                <td v-if="isConfeccion(valor.code_cost)">
                  {{ montoConfeccion(valor) }}
                </td>
                <td v-if="isITBM(valor.code_cost)">
                  {{ montoITBM(valor) }}
                </td>

                <td v-if="isNotaCredito(valor.code_cost)">
                  {{ montoNotaCredito(valor) }}
                </td>
              </tr>
            </tbody>
          </v-simple-table>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
    <!-- ADUANA -->
    <v-expansion-panels class="condensed my-1" v-if="isAduana()">
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
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-simple-table dense>
            <thead>
              <tr>
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
                <td>
                  <v-autocomplete
                    class="widthTD"
                    dense
                    item-text="namelong"
                    item-value="id"
                    :items="$store.state.provedores"
                    v-model="valor.id_proveedor"
                    hide-details
                  ></v-autocomplete>
                </td>
                <td>
                  <v-text-field
                    readonly
                    class="widthTD"
                    dense
                    hide-details
                    v-model="valor.nameservice"
                  ></v-text-field>
                </td>
                <td>
                  <v-select
                    readonly
                    class="widthTD"
                    :items="$store.state.pricing.listMultiplicador"
                    v-model="valor.id_multiplicador"
                    placeholder="Multiplicador"
                    hide-details
                    dense
                    @change="calcTotales"
                  ></v-select>
                </td>

                <td>
                  <v-text-field
                    readonly
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
                    readonly
                    class="derecha tdMontos"
                    v-if="
                      $store.state.pricing.listMultiplicador.some(
                        (v) =>
                          v.id == valor.id_multiplicador &&
                          (v.code == 13 || v.code == 14),
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
                    readonly
                    max-width="50%"
                    suffix="%"
                    class="derecha tdMontos"
                    v-if="
                      $store.state.pricing.listMultiplicador.some(
                        (v) => v.id == valor.id_multiplicador && v.code == 5,
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
                    readonly
                    v-if="isITBM(valor.code_cost)"
                    dense
                    v-model="valor.costounitario"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>

                  <v-text-field
                    readonly
                    v-if="isConfeccion(valor.code_cost)"
                    dense
                    v-model="valor.costounitario"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>
                  <v-text-field
                    readonly
                    v-if="isNotaCredito(valor.code_cost)"
                    dense
                    v-model="valor.costounitario"
                    prefix="$"
                  ></v-text-field>
                </td>

                <td
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
                  v-if="
                    !isNotPorcentaje(valor, valor.id_multiplicador) &&
                    !isITBM(valor.code_cost) &&
                    !isConfeccion(valor.code_cost) &&
                    !isNotaCredito(valor.code_cost)
                  "
                >
                  {{ formatearValorCalculado(valor) }}
                </td>
                <td v-if="isConfeccion(valor.code_cost)">
                  {{ montoConfeccion(valor) }}
                </td>
                <td v-if="isITBM(valor.code_cost)">
                  {{ montoITBM(valor) }}
                </td>

                <td v-if="isNotaCredito(valor.code_cost)">
                  {{ montoNotaCredito(valor) }}
                </td>
              </tr>
            </tbody>
          </v-simple-table>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
    <v-expansion-panels class="condensed my-1" v-if="isFlete() && !isImport()">
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
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-simple-table dense>
            <thead>
              <tr>
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
                <td>
                  <v-autocomplete
                    class="widthTD"
                    dense
                    item-text="namelong"
                    item-value="id"
                    :items="$store.state.provedores"
                    v-model="valor.id_proveedor"
                    hide-details
                  ></v-autocomplete>
                </td>
                <td>
                  <v-text-field
                    readonly
                    class="widthTD"
                    dense
                    hide-details
                    v-model="valor.nameservice"
                  ></v-text-field>
                </td>
                <td>
                  <v-select
                    readonly
                    class="widthTD"
                    :items="$store.state.pricing.listMultiplicador"
                    v-model="valor.id_multiplicador"
                    placeholder="Multiplicador"
                    hide-details
                    dense
                    @change="calcTotales"
                  ></v-select>
                </td>

                <td>
                  <v-text-field
                    readonly
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
                    readonly
                    class="derecha tdMontos"
                    v-if="
                      $store.state.pricing.listMultiplicador.some(
                        (v) =>
                          v.id == valor.id_multiplicador &&
                          (v.code == 13 || v.code == 14),
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
                    readonly
                    max-width="50%"
                    suffix="%"
                    class="derecha tdMontos"
                    v-if="
                      $store.state.pricing.listMultiplicador.some(
                        (v) => v.id == valor.id_multiplicador && v.code == 5,
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
                    readonly
                    v-if="isITBM(valor.code_cost)"
                    reaonly
                    dense
                    v-model="valor.costounitario"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>

                  <v-text-field
                    readonly
                    v-if="isConfeccion(valor.code_cost)"
                    dense
                    v-model="valor.costounitario"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>
                  <v-text-field
                    readonly
                    v-if="isNotaCredito(valor.code_cost)"
                    dense
                    v-model="valor.costounitario"
                    prefix="$"
                  ></v-text-field>
                </td>

                <td
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
                  v-if="
                    !isNotPorcentaje(valor, valor.id_multiplicador) &&
                    !isITBM(valor.code_cost) &&
                    !isConfeccion(valor.code_cost) &&
                    !isNotaCredito(valor.code_cost)
                  "
                >
                  {{ formatearValorCalculado(valor) }}
                </td>
                <td v-if="isConfeccion(valor.code_cost)">
                  {{ montoConfeccion(valor) }}
                </td>
                <td v-if="isITBM(valor.code_cost)">
                  {{ montoITBM(valor) }}
                </td>

                <td v-if="isNotaCredito(valor.code_cost)">
                  {{ montoNotaCredito(valor) }}
                </td>
              </tr>
            </tbody>
          </v-simple-table>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
    <!-- ALMACEN -->
    <v-expansion-panels class="condensed my-1" v-if="isAlmacen()">
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
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-simple-table dense>
            <thead>
              <tr>
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
                <td>
                  <v-autocomplete
                    class="widthTD"
                    dense
                    item-text="namelong"
                    item-value="id"
                    :items="$store.state.provedores"
                    v-model="valor.id_proveedor"
                    hide-details
                  ></v-autocomplete>
                </td>
                <td>
                  <v-text-field
                    readonly
                    class="widthTD"
                    dense
                    hide-details
                    v-model="valor.nameservice"
                  ></v-text-field>
                </td>
                <td>
                  <v-select
                    readonly
                    class="widthTD"
                    :items="$store.state.pricing.listMultiplicador"
                    v-model="valor.id_multiplicador"
                    placeholder="Multiplicador"
                    hide-details
                    dense
                    @change="calcTotales"
                  ></v-select>
                </td>

                <td>
                  <v-text-field
                    readonly
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
                    readonly
                    class="derecha tdMontos"
                    v-if="
                      $store.state.pricing.listMultiplicador.some(
                        (v) =>
                          v.id == valor.id_multiplicador &&
                          (v.code == 13 || v.code == 14),
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
                    readonly
                    max-width="50%"
                    suffix="%"
                    class="derecha tdMontos"
                    v-if="
                      $store.state.pricing.listMultiplicador.some(
                        (v) => v.id == valor.id_multiplicador && v.code == 5,
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
                    readonly
                    v-if="isITBM(valor.code_cost)"
                    dense
                    v-model="valor.costounitario"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>

                  <v-text-field
                    readonly
                    v-if="isConfeccion(valor.code_cost)"
                    dense
                    v-model="valor.costounitario"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>
                  <v-text-field
                    readonly
                    v-if="isNotaCredito(valor.code_cost)"
                    dense
                    v-model="valor.costounitario"
                    prefix="$"
                  ></v-text-field>
                </td>

                <td
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
                  v-if="
                    !isNotPorcentaje(valor, valor.id_multiplicador) &&
                    !isITBM(valor.code_cost) &&
                    !isConfeccion(valor.code_cost) &&
                    !isNotaCredito(valor.code_cost)
                  "
                >
                  {{ formatearValorCalculado(valor) }}
                </td>
                <td v-if="isConfeccion(valor.code_cost)">
                  {{ montoConfeccion(valor) }}
                </td>
                <td v-if="isITBM(valor.code_cost)">
                  {{ montoITBM(valor) }}
                </td>

                <td v-if="isNotaCredito(valor.code_cost)">
                  {{ montoNotaCredito(valor) }}
                </td>
              </tr>
            </tbody>
          </v-simple-table>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
    <!-- GASTOS DE TERCEROS -->
    <v-expansion-panels class="condensed my-1" v-if="isGastosTercero()">
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
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-simple-table dense>
            <thead>
              <tr>
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
                <td>
                  <v-autocomplete
                    class="widthTD"
                    dense
                    item-text="namelong"
                    item-value="id"
                    :items="$store.state.provedores"
                    v-model="valor.id_proveedor"
                    hide-details
                  ></v-autocomplete>
                </td>
                <td>
                  <v-text-field
                    readonly
                    class="widthTD"
                    dense
                    hide-details
                    v-model="valor.nameservice"
                  ></v-text-field>
                </td>
                <td>
                  <v-select
                    readonly
                    class="widthTD"
                    :items="$store.state.pricing.listMultiplicador"
                    v-model="valor.id_multiplicador"
                    placeholder="Multiplicador"
                    hide-details
                    dense
                    @change="calcTotales"
                  ></v-select>
                </td>

                <td>
                  <v-text-field
                    readonly
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
                    readonly
                    class="derecha tdMontos"
                    v-if="
                      $store.state.pricing.listMultiplicador.some(
                        (v) =>
                          v.id == valor.id_multiplicador &&
                          (v.code == 13 || v.code == 14),
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
                    readonly
                    max-width="50%"
                    suffix="%"
                    class="derecha tdMontos"
                    v-if="
                      $store.state.pricing.listMultiplicador.some(
                        (v) => v.id == valor.id_multiplicador && v.code == 5,
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
                    readonly
                    v-if="isITBM(valor.code_cost)"
                    dense
                    v-model="valor.costounitario"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>

                  <v-text-field
                    readonly
                    v-if="isConfeccion(valor.code_cost)"
                    dense
                    v-model="valor.costounitario"
                    :error-messages="valor.error"
                    prefix="$"
                  ></v-text-field>
                  <v-text-field
                    readonly
                    v-if="isNotaCredito(valor.code_cost)"
                    dense
                    v-model="valor.costounitario"
                    prefix="$"
                  ></v-text-field>
                </td>

                <td
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
                  v-if="
                    !isNotPorcentaje(valor, valor.id_multiplicador) &&
                    !isITBM(valor.code_cost) &&
                    !isConfeccion(valor.code_cost) &&
                    !isNotaCredito(valor.code_cost)
                  "
                >
                  {{ formatearValorCalculado(valor) }}
                </td>
                <td v-if="isConfeccion(valor.code_cost)">
                  {{ montoConfeccion(valor) }}
                </td>
                <td v-if="isITBM(valor.code_cost)">
                  {{ montoITBM(valor) }}
                </td>

                <td v-if="isNotaCredito(valor.code_cost)">
                  {{ montoNotaCredito(valor) }}
                </td>
              </tr>
            </tbody>
          </v-simple-table>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-container>
</template>

<script>
import mixins from "../../../mixins/funciones.js";
export default {
  mixins: [mixins],
  props: ["valores", "actualizarCostosFlag"],
  data() {
    return {
      totalOption: 0,
      resumenOpcion: {
        flete: 0,
        origen: 0,
        gasto: 0,
        aduana: 0,
        almacen: 0,
        gastostercero: 0,
      },
      dialog: false,

      fromDataService: {
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
      },
    };
  },
  mounted() {
    this.calcTotales();
  },
  methods: {
    eliminarCostos({ costo = null }) {
      costo.status = 0;
      this.$store.state.pricing.listCostos =
        this.$store.state.pricing.listCostos.filter((v) => v.status == 1);
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
    async calcTotales() {
      setTimeout(async () => {
        // this.$store.state.pricing.totalFlete = 0.0;
        await this.calcularTotalesFlete();
        await this.calcularTotalesNoFlete();
        await this.calcTotal();
      }, 100);
    },
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
      this.$store.state.pricing.totalFlete = this.resumenOpcion.flete;
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
      if (this.$refs.frmNuevoCosto.validate()) {
        if (this.fromDataService.idOpcion == "OR") {
          this.fromDataService.esorigenflag = 1;
        }
        if (this.fromDataService.idOpcion == "LO") {
          this.fromDataService.eslocalflag = 1;
        }
        if (this.fromDataService.idOpcion == "AD") {
          this.fromDataService.esaduanaflag = 1;
        }
        if (this.fromDataService.idOpcion == "AL") {
          this.fromDataService.esalmacenflag = 1;
        }
        if (this.fromDataService.idOpcion == "FL") {
          this.fromDataService.esfleteflag = 1;
        }
        this.$store.state.pricing.listCostos.push(this.fromDataService);
        this.dialog = !this.dialog;
        this.calcTotales();
        // this.$refs.frmNuevoCosto.reset();
        //
      }
    },
    isNotPorcentaje(element, id_multiplicador) {
      let code = [5, 13, 14];

      let mul = this.$store.state.pricing.listMultiplicador.some(
        (v) => v.id == id_multiplicador && code.includes(v.code),
      );

      return !mul;
    },
    abrirModal() {
      this.dialog = !this.dialog;
      this.limpiar();
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
    isAlmacen() {
      let val = this.valores.some(
        (v) => v.esalmacenflag == 1 && v.status == true,
      );
      return val;
    },

    isGastosTercero() {
      let val = this.valores.some(
        (v) => v.esgastostercerosflag == 1 && v.status == true,
      );
      return val;
    },
    isConfeccion(code) {
      return code == 33 ? true : false;
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
    isITBM(code) {
      return code == 38 ? true : false;
    },
    montoITBM(item) {
      let monto = 0;
      let code = [29, 36, 41, 68];
      if (item.code_cost == 38) {
        let val = this.valores.filter((v) => code.includes(v.code_cost));
        val.forEach((element) => {
          monto += parseFloat(
            (this.$store.state.pricing.listMultiplicador.some(
              (v) => v.id == element.id_multiplicador,
            )
              ? this.$store.state.pricing.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                )[0].valor
              : 0) *
              element.costounitario *
              this.calcularFac(
                this.$store.state.pricing.listMultiplicador.some(
                  (v) => v.id == element.id_multiplicador,
                )
                  ? this.$store.state.pricing.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0].code
                  : "N",
                this.$store.state.pricing.datosPrincipales.volumen,
                this.$store.state.pricing.datosPrincipales.peso,
                this.$store.state.pricing.datosPrincipales.containers,
                this.$store.state.pricing.datosPrincipales.amount,
              ),
          );
        });
      }
      item.costounitario = parseFloat(monto * 0.07).toFixed(2);
      return this.currencyFormat(parseFloat(monto * 0.07).toFixed(2));
    },
    isNotaCredito(code) {
      return code == 69 ? true : false;
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
    isImport() {
      return this.$store.state.pricing.listModality.some(
        (v) =>
          v.id == this.$store.state.pricing.datosPrincipales.idsentido &&
          v.code == "I",
      );
    },
    mostrarAdvertencia(data) {
      return data.some(
        (v) => v.status == 1 && v.error != null && v.error !== "",
      );
    },
  },
  watch: {
    valores() {
      this.calcTotales();
    },
    actualizarCostosFlag() {
      this.calcTotales();
    },
  },
  computed: {},
};
</script>

<style scoped>
.v-expansion-panels.condensed
  .v-expansion-panel-header
  .v-expansion-panel-content__wrap {
  /* padding-top: 2px;
  padding-bottom: 2px; */
  padding: 2px 8px 2px;
  min-height: auto;
}
.widthTD {
  width: 150px !important;
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
  padding: 0 8px 16px !important;
}

.v-expansion-panel-content >>> .v-expansion-panel-content__wrap {
  padding: 2px 0 2px !important;
}
</style>
