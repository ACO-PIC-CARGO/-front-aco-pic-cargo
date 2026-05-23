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
    calcularFac(code = null, metroscc, kg, containers = null, amount) {
      // console.log(code);
      let fac = 0;
      switch (code) {
        // 1	EMBARQUE
        case 1:
          fac = 1;
          break;
        // 2	M3
        case 2:
          fac = metroscc;
          break;
        // 3 TO/M3
        case 3:
          fac = kg / 1000 > metroscc ? kg / 1000 : metroscc;
          break;
        // 4	TONELADA
        case 4:
          fac = kg / 1000;
          break;
        // 5	% SOBRE EL VALOR CIF DE LA MERCANCIA
        case 15:
          fac = amount / 100;
          break;
        // 6	PESO CARGABLE
        case 6:
          fac = metroscc * 166.66 > kg ? metroscc * 166.66 : kg;
          break;
        // 7 "20 ST CONTENEDOR"
        case 7:
          fac = containers.some((v) => v.code == "20S")
            ? containers.filter((v) => v.code == "20S")[0].cantidad
            : 0;

          break;
        // 8 "40 NOR CONTENEDOR "
        case 8:
          fac = containers.some((v) => v.code == "40NOR")
            ? containers.filter((v) => v.code == "40NOR")[0].cantidad
            : 0;
          break;
        // 9  "40 HC CONTENEDOR "
        case 9:
          fac = containers.some((v) => v.code == "40HC")
            ? containers.filter((v) => v.code == "40HC")[0].cantidad
            : 0;
          break;
        // 10 "40 ST CONTENEDOR "
        case 10:
          fac = containers.some((v) => v.code == "40S")
            ? containers.filter((v) => v.code == "40S")[0].cantidad
            : 0;
          break;
        // 10  "% SEGURO SOBRE EL VALOR DE LA MERCANCIA",
        case 18:
          fac = kg;
          break;
        case 14:
          fac = 1;
          break;
        case 15:
          fac = 1;
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
      let cost = [];
      costos
        .filter(
          (v) =>
            (v.esorigenflag == true ||
              v.esfleteflag == true ||
              v.eslocalflag == true ||
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

          if (codemultiplicador.length > 0) {
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
            !(
              codemultiplicador.code == 5 &&
              codemultiplicador.code == 13 &&
              codemultiplicador.code == 14 &&
              costo.esorigenflag
            )
          ) {
            cost.push({
              code_service: costo.code_service ? costo.code_service : "",
              code_cost: costo.code_cost ? costo.code_cost : "",
              id: costo.id ? costo.id : "",
              id_proveedor: costo.id_proveedor,
              id_multiplicador: costo.id_multiplicador,
              concepto: costo.nameservice,
              costounitario: costo.costounitario,
              minimo: costo.minimo ? costo.minimo : 0,
              esfleteflag: costo.esfleteflag,
              esorigenflag: costo.esorigenflag,
              eslocalflag: costo.eslocalflag,
              esaduanaflag: costo.esaduanaflag,
              esalmacenflag: costo.esalmacenflag,
              esgastostercerosflag: costo.esgastostercerosflag,
              status: costo.status,
              esopcionflag: costo.esventaflag == 1 ? 0 : 1,
              esventaflag: costo.esventaflag,
              cif: costo.cif,
              seguro: costo.seguro,
              subtotal: subTotal,
              nro_propuesta: costo.nro_propuesta,
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

          if (codemultiplicador.length > 0) {
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
            !(
              codemultiplicador.code == 5 &&
              codemultiplicador.code == 13 &&
              codemultiplicador.code == 14 &&
              costo.esorigenflag
            )
          ) {
            cost.push({
              code_cost: costo.code_cost ? costo.code_cost : null,
              id: costo.id ? costo.id : null,
              id_proveedor: costo.id_proveedor,
              id_multiplicador: costo.id_multiplicador,
              concepto: costo.nameservice,
              costounitario: costo.costounitario,
              minimo: costo.minimo ? costo.minimo : 0,
              esorigenflag: costo.esorigenflag,
              esfleteflag: costo.esfleteflag,
              eslocalflag: costo.eslocalflag,
              esaduanaflag: costo.esaduanaflag,
              esalmacenflag: costo.esalmacenflag,
              esgastostercerosflag: costo.esgastostercerosflag,
              status: costo.status,
              esopcionflag: costo.esventaflag == 1 ? 0 : 1,
              esventaflag: costo.esventaflag,
              cif: costo.cif,
              seguro: costo.seguro,
              subtotal: subTotal,
              nro_propuesta: costo.nro_propuesta,
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
          percentage: parseFloat(impuesto.codigo01 ? impuesto.codigo01 : 0),
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
    calcularImpuestos({
      impuestos = [],
      item = null,
      totalFlete = 0,
      datosPrincipales = {},
    }) {
      let monto = 0;
      let codeImp = [
        "01",
        "02",
        "03",
        "05",
        "06",
        "07",
        "08",
        "09",
        "10",
        "11",
        "12",
      ];
      if (item.codigo === "01") {
        monto = parseFloat(datosPrincipales.amount).toFixed(2);
      }
      if (item.codigo === "02") {
        monto = parseFloat(totalFlete).toFixed(2);
      }
      if (item.codigo === "03") {
        monto = parseFloat(
          ((parseFloat(totalFlete) + parseFloat(datosPrincipales.amount)) *
            parseFloat(
              this.obtenerPorcentaje({ listImpuestos: impuestos, code: "03" }),
            )) /
            100,
        ).toFixed(2);
      }
      if (item.codigo === "04") {
        let fob = parseFloat(datosPrincipales.amount);
        let flet = parseFloat(totalFlete);
        let seguro = parseFloat(
          ((parseFloat(totalFlete) + parseFloat(datosPrincipales.amount)) *
            parseFloat(
              this.obtenerPorcentaje({ listImpuestos: impuestos, code: "03" }),
            )) /
            100,
        );
        monto = parseFloat(fob) + parseFloat(flet) + parseFloat(seguro);
      }
      if (item.codigo === "05") {
        let fob = parseFloat(datosPrincipales.amount);
        let flet = parseFloat(totalFlete);
        let seguro = parseFloat(
          ((parseFloat(totalFlete) + parseFloat(datosPrincipales.amount)) *
            parseFloat(
              this.obtenerPorcentaje({ listImpuestos: impuestos, code: "03" }),
            )) /
            100,
        );
        let cif = parseFloat(fob) + parseFloat(flet) + parseFloat(seguro);

        monto = (cif * item.codigo01) / 100;
      }
      if (item.codigo === "06") {
        let fob = parseFloat(datosPrincipales.amount);
        let flet = parseFloat(totalFlete);

        let seguro = parseFloat(
          ((parseFloat(totalFlete) + parseFloat(datosPrincipales.amount)) *
            this.obtenerPorcentaje({ listImpuestos: impuestos, code: "03" })) /
            100,
        );
        let cif = parseFloat(fob) + parseFloat(flet) + parseFloat(seguro);
        let adv =
          (cif *
            this.obtenerPorcentaje({ listImpuestos: impuestos, code: "05" })) /
          100;
        monto = ((cif + adv) * item.codigo01) / 100;
      }
      if (item.codigo === "07") {
        let fob = parseFloat(datosPrincipales.amount);
        let flet = parseFloat(totalFlete);

        let seguro = parseFloat(
          ((parseFloat(totalFlete) + parseFloat(datosPrincipales.amount)) *
            parseFloat(
              this.obtenerPorcentaje({ listImpuestos: impuestos, code: "03" }),
            )) /
            100,
        );
        let cif = parseFloat(fob) + parseFloat(flet) + parseFloat(seguro);
        let adv =
          (cif *
            this.obtenerPorcentaje({ listImpuestos: impuestos, code: "05" })) /
          100;
        let isc =
          ((cif + adv) *
            this.obtenerPorcentaje({ listImpuestos: impuestos, code: "06" })) /
          100;

        monto = ((cif + adv + isc) * item.codigo01) / 100;
      }
      if (item.codigo === "08") {
        let fob = parseFloat(datosPrincipales.amount);
        let flet = parseFloat(totalFlete);

        let seguro = parseFloat(
          ((parseFloat(totalFlete) + parseFloat(datosPrincipales.amount)) *
            parseFloat(
              this.obtenerPorcentaje({ listImpuestos: impuestos, code: "03" }),
            )) /
            100,
        );
        let cif = parseFloat(fob) + parseFloat(flet) + parseFloat(seguro);
        let adv =
          (cif *
            this.obtenerPorcentaje({ listImpuestos: impuestos, code: "05" })) /
          100;
        let isc =
          ((cif + adv) *
            this.obtenerPorcentaje({ listImpuestos: impuestos, code: "06" })) /
          100;
        monto = ((cif + adv + isc) * item.codigo01) / 100;
      }
      if (item.codigo === "09") {
        let fob = parseFloat(datosPrincipales.amount);
        let flet = parseFloat(totalFlete);

        let seguro = parseFloat(
          ((parseFloat(totalFlete) + parseFloat(datosPrincipales.amount)) *
            parseFloat(
              this.obtenerPorcentaje({ listImpuestos: impuestos, code: "03" }),
            )) /
            100,
        );
        let cif = parseFloat(fob) + parseFloat(flet) + parseFloat(seguro);
        let adv =
          (cif *
            this.obtenerPorcentaje({ listImpuestos: impuestos, code: "05" })) /
          100;
        let isc =
          ((cif + adv) *
            this.obtenerPorcentaje({ listImpuestos: impuestos, code: "06" })) /
          100;
        let ipm =
          ((cif + adv + isc) *
            this.obtenerPorcentaje({ listImpuestos: impuestos, code: "07" })) /
          100;
        let igv =
          ((cif + adv + isc) *
            this.obtenerPorcentaje({ listImpuestos: impuestos, code: "08" })) /
          100;

        monto = ((cif + adv + isc + igv + ipm) * item.codigo01) / 100;
      }
      if (item.codigo === "10") {
        monto = 100;
      }
      if (item.codigo === "11") {
        monto = 7;
      }
      if (item.codigo === "12") {
        monto = 3;
      }

      if (!codeImp.includes(item.codigo)) {
        parseFloat(
          ((parseFloat(totalFlete) + parseFloat(datosPrincipales.amount)) *
            parseFloat(
              this.obtenerPorcentaje({
                listImpuestos: impuestos,
                code: item.codigo,
              }),
            )) /
            100,
        ).toFixed(2);
      }
      return parseFloat(monto).toFixed(2);
    },
    obtenerPorcentaje({ listImpuestos = [], code = "" }) {
      let porcentaje =
        listImpuestos.filter((v) => v.codigo == code).length > 0
          ? listImpuestos.filter((v) => v.codigo == code)[0].codigo01
          : 0;
      return porcentaje ? porcentaje : 0;
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
