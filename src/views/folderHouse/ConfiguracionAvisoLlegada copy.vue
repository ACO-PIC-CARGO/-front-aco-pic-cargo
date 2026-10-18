<template>
  <v-container fluid>
    <v-card>
      <v-row>
        <v-col cols="6" class="px-5 py-5">
          <div style="float: right">
            <p style="text-align: right">[FECHA_ENVIO]</p>
          </div>
          <div style="clear: both"></div>

          <p>
            <v-text-field
              type="text"
              v-model="descripcionSaludo"
              class="my-2"
              hide-details
              solo
              dense
              style="display: inline-block; width: auto; max-width: 200px"
            />
            <b>[NOMBRE_CLIENTE]</b>
          </p>
          <p>Asunto: <b>[AVISO_LLEGADA]</b></p>
          <p>
            <v-text-field
              style="display: inline-block; width: auto; max-width: 200px"
              v-model="descripcionDatosCarga"
              solo
              dense
              hide-details
              class="my-2"
            ></v-text-field>
          </p>

          <table border="1" cellspacing="0" style="width: 600px; margin: auto">
            <thead>
              <tr>
                <th
                  colspan="2"
                  style="text-align: center; padding: 0.25rem 0.5rem"
                >
                  Datos de la Carga
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="width: 50%; padding: 0.25rem 0.5rem"><b>Peso</b></td>
                <td style="width: 50%; padding: 0.25rem 0.5rem">[PESO]</td>
              </tr>
              <tr>
                <td style="width: 50%; padding: 0.25rem 0.5rem">
                  <b>Volumen</b>
                </td>
                <td style="width: 50%; padding: 0.25rem 0.5rem">[VOLUMEN]</td>
              </tr>
              <tr>
                <td style="width: 50%; padding: 0.25rem 0.5rem">
                  <b>Nro. Bultos</b>
                </td>
                <td style="width: 50%; padding: 0.25rem 0.5rem">
                  [NRO_BULTOS]
                </td>
              </tr>
              <tr>
                <td style="width: 50%; padding: 0.25rem 0.5rem">
                  <b>Origen</b>
                </td>
                <td style="width: 50%; padding: 0.25rem 0.5rem">
                  [PUERTO_ORIGIEN]
                </td>
              </tr>
              <tr>
                <td style="width: 50%; padding: 0.25rem 0.5rem">
                  <b>Destino</b>
                </td>
                <td style="width: 50%; padding: 0.25rem 0.5rem">
                  [PUERTO_DESTINO]
                </td>
              </tr>
              <tr>
                <td style="width: 50%; padding: 0.25rem 0.5rem">
                  <b>Proveedor</b>
                </td>
                <td style="width: 50%; padding: 0.25rem 0.5rem">
                  [NOMBRE_PROVEEDOR]
                </td>
              </tr>
              <tr>
                <td style="width: 50%; padding: 0.25rem 0.5rem">
                  <b>Nro. BL / Nro. Guía Aérea</b>
                </td>
                <td style="width: 50%; padding: 0.25rem 0.5rem">[NRO_BL]</td>
              </tr>
              <tr>
                <td style="width: 50%; padding: 0.25rem 0.5rem">
                  <b>Monto Servicio Logístico Cotizado</b>
                </td>
                <td style="width: 50%; padding: 0.25rem 0.5rem">USD [MONTO]</td>
              </tr>
            </tbody>
          </table>
          <p>Por medio del presente, te notificamos que tu carga ya llegó.</p>

          <br />

          <p>
            Le recordamos que el servicio logístico que le fue cotizado es un
            monto de USD [MONTO], y lo puede pagar a través de cualquiera de las
            cuentas bancarias:
          </p>

          <p>[NRO_CUENTAS]</p>

          <p>Atte.: [OPERADOR]</p>
          <p>[RAZON_SOCIAL]</p>

          <div style="text-align: center; padding: 10px">
            <img
              :src="`${process.env.VITE_URL_MAIN}uploads/logo-aco.png`"
              alt="Logo ACO"
              style="width: 100%; max-width: 300px; height: auto"
            />
          </div>
        </v-col>
        <v-col cols="6" class="px-5 py-5 clsPreview">
          <div style="float: right">
            <p style="text-align: right">[FECHA_ENVIO]</p>
          </div>
          <div style="clear: both"></div>

          <p>{{ descripcionSaludo }} <b>[NOMBRE_CLIENTE]</b></p>
          <p>Asunto: <b>[AVISO_LLEGADA]</b></p>
          <p>{{ descripcionDatosCarga }}:</p>

          <table border="1" cellspacing="0" style="width: 600px; margin: auto">
            <thead>
              <tr>
                <th
                  colspan="2"
                  style="text-align: center; padding: 0.25rem 0.5rem"
                >
                  Datos de la Carga
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="width: 50%; padding: 0.25rem 0.5rem"><b>Peso</b></td>
                <td style="width: 50%; padding: 0.25rem 0.5rem">[PESO]</td>
              </tr>
              <tr>
                <td style="width: 50%; padding: 0.25rem 0.5rem">
                  <b>Volumen</b>
                </td>
                <td style="width: 50%; padding: 0.25rem 0.5rem">[VOLUMEN]</td>
              </tr>
              <tr>
                <td style="width: 50%; padding: 0.25rem 0.5rem">
                  <b>Nro. Bultos</b>
                </td>
                <td style="width: 50%; padding: 0.25rem 0.5rem">
                  [NRO_BULTOS]
                </td>
              </tr>
              <tr>
                <td style="width: 50%; padding: 0.25rem 0.5rem">
                  <b>Origen</b>
                </td>
                <td style="width: 50%; padding: 0.25rem 0.5rem">
                  [PUERTO_ORIGIEN]
                </td>
              </tr>
              <tr>
                <td style="width: 50%; padding: 0.25rem 0.5rem">
                  <b>Destino</b>
                </td>
                <td style="width: 50%; padding: 0.25rem 0.5rem">
                  [PUERTO_DESTINO]
                </td>
              </tr>
              <tr>
                <td style="width: 50%; padding: 0.25rem 0.5rem">
                  <b>Proveedor</b>
                </td>
                <td style="width: 50%; padding: 0.25rem 0.5rem">
                  [NOMBRE_PROVEEDOR]
                </td>
              </tr>
              <tr>
                <td style="width: 50%; padding: 0.25rem 0.5rem">
                  <b>Nro. BL / Nro. Guía Aérea</b>
                </td>
                <td style="width: 50%; padding: 0.25rem 0.5rem">[NRO_BL]</td>
              </tr>
              <tr>
                <td style="width: 50%; padding: 0.25rem 0.5rem">
                  <b>Monto Servicio Logístico Cotizado</b>
                </td>
                <td style="width: 50%; padding: 0.25rem 0.5rem">USD [MONTO]</td>
              </tr>
            </tbody>
          </table>
          <p>Por medio del presente, te notificamos que tu carga ya llegó.</p>

          <br />

          <p>
            Le recordamos que el servicio logístico que le fue cotizado es un
            monto de USD [MONTO], y lo puede pagar a través de cualquiera de las
            cuentas bancarias:
          </p>

          <p>[NRO_CUENTAS]</p>

          <p>Atte.: [OPERADOR]</p>
          <p>[RAZON_SOCIAL]</p>

          <div style="text-align: center; padding: 10px">
            <img
              :src="`${process.env.VITE_URL_MAIN}uploads/logo-aco.png`"
              alt="Logo ACO"
              style="width: 100%; max-width: 300px; height: auto"
            />
          </div>
        </v-col>
      </v-row>
    </v-card>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      descripcionSaludo: "Estimado sr(es):",
      descripcionDatosCarga: "Datos de la Carga:",
    };
  },
};
</script>

<style>
.clsPreview {
  border-left: 1px solid #000000;
}
</style>
