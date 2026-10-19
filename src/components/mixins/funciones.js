let storeInstance;

export function setStoreInstance(store) {
  storeInstance = store;
}

function getStoreInstance() {
  if (!storeInstance) {
    throw new Error("The Vuex store has not been initialized.");
  }

  return storeInstance;
}

function numeroSeguro(value) {
  if (value === null || value === undefined || value === "") return 0;
  const normalized =
    typeof value === "string" ? value.trim().replace(/,/g, "") : value;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

const miMixin = {
  methods: {
    probarFunction() {
      return 1;
    },
    obtenerFlagOrigen(item) {
      let value = 0;
      if (item.codebegend == "OR" || item.codebegend == "FL") {
        value = 1;
      }
      return value;
    },
    obtenerStatus({ lstStatus: lstStatus }) {
      let id_status =
        lstStatus.filter((v) => v.code == "3").length > 0
          ? lstStatus.filter((v) => v.code == "3")[0].id
          : "";
      return id_status;
    },
    obtenerLocalFlag(item) {
      let value = 0;

      if (
        item.codebegend == "DE" &&
        item.categoria_role != "AD" &&
        item.categoria_role != "TR" &&
        item.categoria_role != "AL"
      ) {
        value = 1;
      }

      return value;
    },
    obtenerAduanaFlag(item) {
      let value = 0;

      if (
        item.codebegend == "DE" &&
        (item.categoria_role == "AD" || item.categoria_role == "TR")
      ) {
        value = 1;
      }

      return value;
    },
    obtenerAlmacenFlag(item) {
      let value = 0;

      if (item.codebegend == "DE" && item.categoria_role == "AL") {
        value = 1;
      }

      return value;
    },
    calcularFac(
      code = null,
      metroscc = 0,
      kg = 0,
      containers = [],
      amount = 0,
    ) {
      const store = getStoreInstance();
      const listMultiplicador = store.state.pricing.listMultiplicador;
      const volumen = store.state.pricing.datosPrincipales.volumen;
      let fac = 0;

      const configMult = listMultiplicador.find((item) => item.code == code);

      const getContainerCount = (identificador) => {
        if (!Array.isArray(containers)) return 0;
        const found = containers.find((v) => v.id_containers == identificador);
        return found ? found.cantidad : 0;
      };

      if (configMult && configMult.id_container) {
        fac = getContainerCount(configMult.id_container);
        return fac;
      }

      switch (code) {
        case 1:
        case 14:
          fac =
            configMult && configMult.valor ? parseFloat(configMult.valor) : 1;
          break;
        case 2: // M3
          fac = metroscc;
          break;
        case 3: // TO/M3
          fac = kg / 1000 > metroscc ? kg / 1000 : metroscc;
          break;
        case 4:
          fac = kg / 1000;
          break;
        case 6:
          fac = metroscc * 166.66 > kg ? metroscc * 166.66 : kg;
          break;
        case 15:
          fac = amount / 100;
          break;
        case 18:
          fac = kg;
          break;
        case 24:
          if (metroscc < 15) {
            fac = kg / 1000;
          } else {
              let tonelada = kg/1000;
              let volumen = metroscc/3;
              let valorCalculado = Math.max(tonelada, volumen,1);
              fac = valorCalculado;
            
          }
          break;
        default:
          fac = 1;
          break;
      }

      return fac;
    },
    calcularValor(precio, flete, multiplicador, porcentaje = 0, minimo = 118) {
      // SETEANDO DATOS
      flete = flete ? flete : 0;
      let seguro = 0.015 * (parseFloat(precio) + parseFloat(flete));
      let cif = parseFloat(precio) + parseFloat(flete);
      let costo = 0;

      // CALCULAR LOS COSTOS
      switch (multiplicador) {
        case 5:
          if (porcentaje == 0) {
            costo = 0;
          } else if ((parseFloat(porcentaje) / 100) * parseFloat(cif) >= 60) {
            costo = (parseFloat(porcentaje) / 100) * parseFloat(cif);
          } else {
            costo = 60;
          }
          break;
        case 13:
          if (porcentaje == 0) {
            costo = 0;
          } else if (
            (parseFloat(porcentaje) / 100) * parseFloat(cif) >=
            minimo
          ) {
            costo = (parseFloat(porcentaje) / 100) * parseFloat(cif);
          } else {
            costo = minimo;
          }
          break;
        case 14:
          if (porcentaje == 0) {
            costo = 0;
          } else if (
            (parseFloat(porcentaje) / 100) *
              (parseFloat(cif) + parseFloat(seguro)) >=
            minimo
          ) {
            costo =
              (parseFloat(porcentaje) / 100) *
              (parseFloat(cif) + parseFloat(seguro));
          } else {
            costo = minimo;
          }
          break;
        case 15:
          if (porcentaje == 0) {
            costo = 0;
          } else if (
            (parseFloat(porcentaje) / 100) *
              (parseFloat(cif) + parseFloat(seguro)) >=
            minimo
          ) {
            costo =
              (parseFloat(porcentaje) / 100) *
              (parseFloat(cif) + parseFloat(seguro));
          } else {
            costo = minimo;
          }
          break;

        default:
          costo = 1;
          break;
      }
      return costo;
    },
    currencyFormat(number) {
      let money = new Intl.NumberFormat("en-ES", {
        style: "currency",
        currency: "USD",
      }).format(number);
      return money;
    },
    validateCost({ costo = [], multiplicador = [], services = [] }) {
      let service = services.filter((v) => v.status == 1);
      let listMultiplicador = multiplicador.filter((v) => {
        return this.comienzaNoConCaracter(v.text, "%");
      });

      let idMultiplicador = listMultiplicador.map((v) => v.id);
      let idServices = service.map((v) => v.id_groupservices);
      let listCostos = costo.filter(
        (v) =>
          idMultiplicador.includes(v.id_multiplicador) &&
          idServices.includes(v.id_groupservices),
      );
      let val = listCostos.filter((v) => v.costounitario == 0);
      return {
        estado: val.length > 0 ? false : true,
        mensaje: "Existe un costo que tiene un valor 0.00. Verifique",
      };
    },
    comienzaNoConCaracter(nombre, caracter) {
      return nombre.charAt(0).toUpperCase() !== caracter.toUpperCase();
    },
    comienzaConCaracter(nombre, caracter) {
      return nombre.charAt(0).toUpperCase() === caracter.toUpperCase();
    },
    formatearServicios({ services = [] }) {
      let serv = [];
      services.forEach((element) => {
        serv.push({
          id: element.id ? element.id : "",
          idBegEnd: element.id_begend,
          nameservice: element.service,
          codegroupservices: element.code_service,
          status: element.status,
        });
      });

      return serv;
    },
    formatearCostos({
      costos = [],
      services = [],
      multiplicadores = [],
      datosPrincipales = {},
      totalDeFlete = 0,
    }) {
      costos.filter((v) => {
        const flags = [
          v.esorigenflag,
          v.esfleteflag,
          v.eslocalflag,
          v.esaduanaflag,
          v.esgastostercerosflag,
          v.esalmacenflag,
        ];

        const tieneFlag = flags.some((f) => Number(f) === 1);
        const statusOk = Number(v.status) === 1;

        if (!tieneFlag || !statusOk) {
          console.log("Registro descartado:", v.nameservice, {
            flags,
            status: v.status,
          });
        }

        return tieneFlag && statusOk;
      });
      let cost = [];
      costos
        .filter(
          (v) =>
            (v.esorigenflag ||
              v.esfleteflag ||
              v.eslocalflag ||
              v.esaduanaflag ||
              v.esgastostercerosflag ||
              v.esalmacenflag) &&
            v.status == 1,
        )
        .forEach((costo) => {
          let codemultiplicador = costo.id_multiplicador
            ? multiplicadores.filter((v) => v.id == costo.id_multiplicador)
              ? multiplicadores.filter((v) => v.id == costo.id_multiplicador)[0]
              : []
            : [];
          let subTotal = 0;

          if (codemultiplicador && codemultiplicador.length > 0) {
            if (
              codemultiplicador.code != 5 &&
              codemultiplicador.code != 13 &&
              codemultiplicador.code != 14
            ) {
              subTotal =
                codemultiplicador.valor *
                costo.costounitario *
                this.calcularFac(
                  codemultiplicador.code,
                  datosPrincipales.metroscc,
                  datosPrincipales.kg,
                  datosPrincipales.containers,
                  datosPrincipales.amount,
                );
            } else if (
              codemultiplicador.code == 5 ||
              codemultiplicador.code == 13 ||
              codemultiplicador.code == 14
            ) {
              this.calcularValor(
                datosPrincipales.amount,
                totalDeFlete,
                codemultiplicador.code,
                codemultiplicador.code == 14 ? costo.cif : costo.seguro,
                costo.minimo ? costo.minimo : 118,
              );
            }
          } else {
            subTotal = 0;
          }
          if (
            codemultiplicador &&
            !(
              codemultiplicador.code == 5 &&
              codemultiplicador.code == 13 &&
              codemultiplicador.code == 14 &&
              costo.esorigenflag
            )
          ) {
            cost.push({
              ...costo,
              code_service: costo.code_service ? costo.code_service : "",
              code_cost: costo.code_cost ? costo.code_cost : "",
              id: costo.id ? costo.id : "",
              concepto: costo.nameservice,
              minimo: costo.minimo ? costo.minimo : 0,
              subtotal: subTotal,
            });
          }
        });
      // console.log("cost", cost);
      return cost;
    },
    formatearCostosEditar({
      costos = [],
      services = [],
      multiplicadores = [],
      datosPrincipales = {},
      totalDeFlete = 0,
    }) {
      let cost = [];
      costos
        .filter(
          (v) =>
            (v.esorigenflag == true ||
              v.eslocalflag == true ||
              v.esfleteflag == true ||
              v.esaduanaflag == true ||
              v.esgastostercerosflag == true ||
              v.esalmacenflag == true) &&
            v.status == 1,
        )
        .forEach((costo) => {
          let codemultiplicador = costo.id_multiplicador
            ? multiplicadores.filter((v) => v.id == costo.id_multiplicador)
              ? multiplicadores.filter((v) => v.id == costo.id_multiplicador)[0]
              : []
            : [];
          let subTotal = 0;

          if (codemultiplicador && codemultiplicador.length > 0) {
            if (
              codemultiplicador &&
              codemultiplicador.code != 5 &&
              codemultiplicador.code != 13 &&
              codemultiplicador.code != 14
            ) {
              subTotal =
                codemultiplicador.valor *
                costo.costounitario *
                this.calcularFac(
                  codemultiplicador.code,
                  datosPrincipales.metroscc,
                  datosPrincipales.kg,
                  datosPrincipales.containers,
                  datosPrincipales.amount,
                );
            } else if (
              (codemultiplicador && codemultiplicador.code == 5) ||
              codemultiplicador.code == 13 ||
              codemultiplicador.code == 14
            ) {
              this.calcularValor(
                datosPrincipales.amount,
                totalDeFlete,
                codemultiplicador.code,
                codemultiplicador.code == 14 ? costo.cif : costo.seguro,
                costo.minimo ? costo.minimo : 118,
              );
            }
          } else {
            subTotal = 0;
          }
          if (
            codemultiplicador &&
            !(
              codemultiplicador.code == 5 &&
              codemultiplicador.code == 13 &&
              codemultiplicador.code == 14 &&
              costo.esorigenflag
            )
          ) {
            cost.push({
              ...costo,
              code_cost: costo.code_cost ? costo.code_cost : null,
              id: costo.id ? costo.id : null,
              concepto: costo.nameservice,
              minimo: costo.minimo ? costo.minimo : 0,
              subtotal: subTotal,
            });
          }
        });

      return cost;
    },
    formatearNotas({ notas = [] }) {
      let notes = [];
      notas.forEach((nota) => {
        notes.push({
          id: nota.id ? nota.id : null,
          descripcion: nota.descripcion,
          esprincipalflag: 1,
          esincluyeflag: !!nota.statusincluye ? nota.statusincluye : 0,
          esnoincluyeflag: !!nota.statusnoincluye ? nota.statusnoincluye : 0,
          status: nota.state ? nota.state : 1,
          nro_propuesta: nota.nro_propuesta,
        });
      });
      return notes;
    },
    formatearContainer({ containers = [] }) {
      let conts = [];
      containers.forEach((element) => {
        conts.push({
          id: element.id ? element.id : "",
          id_contenedor: element.id_containers,
          cantidad: element.cantidad,
          status: true,
        });
      });
      return conts;
    },
    formatearContainerEditar({ containers = [] }) {
      let conts = [];
      containers.forEach((element) => {
        conts.push({
          id: element.id ? element.id : null,
          id_contenedor: element.id,
          quantity: element.cantidad,
          status: true,
        });
      });
      return conts;
    },
    formatImp({ impuestos = [], totalFlete = 0, datosPrincipales = {} }) {
      let imp = [];
      impuestos.forEach((impuesto) => {
        imp.push({
          id: impuesto.id ? impuesto.id : "",
          type: parseInt(impuesto.codigo),
          name: impuesto.descripcion,
          percentage: numeroSeguro(impuesto.codigo01),
          valor: this.calcularImpuestos({
            impuestos: impuestos,
            item: impuesto,
            totalFlete: totalFlete,
            datosPrincipales: datosPrincipales,
          }),
          orden: parseInt(impuesto.codigo),
          nro_propuesta: impuesto.nro_propuesta,
        });
      });
      return imp;
    },
    calcularTotalFleteVentaPorOpcion({ listCostos = [] } = {}) {
      const store = getStoreInstance();
      const pricing = store.state.pricing;
      const datosPrincipales = pricing.datosPrincipales || {};
      const costosFlete = (Array.isArray(listCostos) ? listCostos : []).filter(
        (costo) =>
          costo &&
          costo.esfleteflag == 1 &&
          costo.status == 1 &&
          costo.esventaflag == 1,
      );

      return costosFlete.reduce((total, costo) => {
        const multiplicador = (pricing.listMultiplicador || []).find(
          (item) => item.id == costo.id_multiplicador,
        );
        let factor = numeroSeguro(
          this.calcularFac(
            multiplicador ? multiplicador.code : "N",
            datosPrincipales.volumen,
            datosPrincipales.peso,
            datosPrincipales.containers,
            datosPrincipales.amount,
          ),
        );

        if (
          costo.code_cost == 4 &&
          numeroSeguro(datosPrincipales.volumen) < 1
        ) {
          factor = Math.max(factor, 1);
        }

        if ([5, 13, 14].includes(Number(multiplicador && multiplicador.code))) {
          return total;
        }

        return (
          total +
          numeroSeguro(multiplicador && multiplicador.valor) *
            numeroSeguro(costo.costounitario) *
            factor
        );
      }, 0);
    },
    calcularImpuestos({
      impuestos = [],
      item = null,
      totalFlete = 0,
      datosPrincipales = {},
    } = {}) {
      if (!item) return "0.00";

      const codigo = String(item.codigo);
      const fob = numeroSeguro(datosPrincipales.amount);
      const flete = numeroSeguro(totalFlete);
      const porcentaje = (code) => {
        const impuesto = (impuestos || []).find(
          (entry) => entry && String(entry.codigo) === code,
        );
        return numeroSeguro(impuesto && impuesto.codigo01);
      };
      const rate = numeroSeguro(item.codigo01);
      const seguro = ((flete + fob) * porcentaje("03")) / 100;
      const cif = fob + flete + seguro;
      const adv = (cif * porcentaje("05")) / 100;
      const isc = ((cif + adv) * porcentaje("06")) / 100;
      let monto = 0;

      switch (codigo) {
        case "01":
          monto = fob;
          break;
        case "02":
          monto = flete;
          break;
        case "03":
          monto = seguro;
          break;
        case "04":
          monto = cif;
          break;
        case "05":
          monto = (cif * rate) / 100;
          break;
        case "06":
          monto = ((cif + adv) * rate) / 100;
          break;
        case "07":
          monto = ((cif + adv + isc) * rate) / 100;
          break;
        case "08":
          monto = ((cif + adv + isc) * rate) / 100;
          break;
        case "09": {
          const ipm = ((cif + adv + isc) * porcentaje("07")) / 100;
          const igv = ((cif + adv + isc) * porcentaje("08")) / 100;
          monto = ((cif + adv + isc + igv + ipm) * rate) / 100;
          break;
        }
        case "10":
          monto = 100;
          break;
        case "11":
          monto = 7;
          break;
        case "12":
          monto = 3;
          break;
      }

      return numeroSeguro(monto).toFixed(2);
    },
    obtenerPorcentaje({ listImpuestos = [], code = "" }) {
      const impuesto = (listImpuestos || []).find(
        (entry) => entry && String(entry.codigo) === String(code),
      );
      return numeroSeguro(impuesto && impuesto.codigo01);
    },
    validateLength(value, maxLength) {
      if (!value) {
        return true;
      }
      return (
        value.length <= maxLength || `Hasta ${maxLength} caracteres permitidoss`
      );
    },
  },
};

export default miMixin; // Exporta el mixin
