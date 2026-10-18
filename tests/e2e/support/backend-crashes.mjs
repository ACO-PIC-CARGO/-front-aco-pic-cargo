export const BACKEND_CRASHES = [
  {
    endpoint: "calc/multiplicador",
    reason:
      "pre-existing backend bug: getCalcMultiplicador (calculadoraFletes) reads rows[0].mensaje on an empty result (branch 1 has no multiplicador for Areo/FCL in Peru) and crashes the process",
  },
];

const NOT_FOUND = { estadoflag: false, mensaje: "No se encontraron registros", tipomensaje: "TMSGINF" };

export async function stubRequestsThatCrashTheBackend(pageOrContext) {
  for (const { endpoint } of BACKEND_CRASHES) {
    await pageOrContext.route(new RegExp(`/${endpoint}(\\?|/|$)`), (route) =>
      route.fulfill({ json: { status: 200, ...NOT_FOUND, data: [NOT_FOUND] } })
    );
  }
}
