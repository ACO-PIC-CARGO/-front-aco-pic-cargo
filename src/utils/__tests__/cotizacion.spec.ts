import { describe, expect, test } from "vitest";
import {
  calcularImpuestos,
  calcularValor,
  comienzaConCaracter,
  comienzaNoConCaracter,
  currencyFormat,
  formatImp,
  formatearContainer,
  formatearContainerEditar,
  formatearNotas,
  formatearServicios,
  numeroSeguro,
  obtenerAduanaFlag,
  obtenerAlmacenFlag,
  obtenerFlagOrigen,
  obtenerLocalFlag,
  obtenerPorcentaje,
  obtenerStatus,
  probarFunction,
  validateCost,
  validateLength,
} from "@/utils/cotizacion";

describe("numeroSeguro", () => {
  test.each([
    [null, 0],
    [undefined, 0],
    ["", 0],
    ["   ", 0],
    [" 1,234.5 ", 1234.5],
    ["-5", -5],
    ["abc", 0],
    [7, 7],
    [-3.5, -3.5],
    [0, 0],
    [Infinity, 0],
    [NaN, 0],
    [true, 1],
    [{}, 0],
  ])("%j gives %j", (value, expected) => {
    expect(numeroSeguro(value)).toBe(expected);
  });
});

describe("calcularValor", () => {
  test("multiplier 5 charges the percentage of CIF with a floor of 60", () => {
    expect(calcularValor(100, 20, 5, 10)).toBe(60);
    expect(calcularValor(100, 20, 5, 100)).toBe(120);
    expect(calcularValor(100, 20, 5, 50)).toBe(60);
    expect(calcularValor(100, 20, 5, 0)).toBe(0);
    expect(calcularValor(100, 20, 5, "0")).toBe(0);
    expect(calcularValor(100, 20, 5)).toBe(0);
  });

  test("multiplier 13 charges the percentage of CIF with the given minimum", () => {
    expect(calcularValor(100, 20, 13, 10)).toBe(118);
    expect(calcularValor(100, 20, 13, 10, 5)).toBe(12);
    expect(calcularValor(100, 20, 13, 100)).toBe(120);
    expect(calcularValor(100, 20, 13, 0)).toBe(0);
  });

  test.each([14, 15])(
    "multiplier %i charges the percentage of CIF plus insurance",
    (multiplicador) => {
      expect(calcularValor(100, 20, multiplicador, 100)).toBeCloseTo(121.8, 10);
      expect(calcularValor(100, 20, multiplicador, 10)).toBe(118);
      expect(calcularValor(100, 20, multiplicador, 10, 5)).toBeCloseTo(
        12.18,
        10,
      );
      expect(calcularValor(100, 20, multiplicador, 0)).toBe(0);
    },
  );

  test("any other multiplier returns 1", () => {
    expect(calcularValor(100, 20, 1, 10)).toBe(1);
    expect(calcularValor(100, 20, "5", 10)).toBe(1);
    expect(calcularValor(100, 20, undefined, 10)).toBe(1);
  });

  test("falsy freight counts as 0 and numeric strings are parsed", () => {
    expect(calcularValor("100", null, 13, 200)).toBe(200);
    expect(calcularValor("100", undefined, 13, 200)).toBe(200);
    expect(calcularValor("100", "", 13, 200)).toBe(200);
    expect(calcularValor("100", "50", 13, "100")).toBe(150);
  });

  test("an unparseable price falls back to the floor or minimum", () => {
    expect(calcularValor("abc", 0, 5, 10)).toBe(60);
    expect(calcularValor("abc", 0, 13, 10, 30)).toBe(30);
    expect(calcularValor(-200, 0, 5, 10)).toBe(60);
  });
});

describe("currencyFormat", () => {
  test.each([
    [1234.5, "US$1,234.50"],
    [0, "US$0.00"],
    [-5, "-US$5.00"],
    ["1234.5", "US$1,234.50"],
    [null, "US$0.00"],
    [NaN, "US$NaN"],
    [undefined, "US$NaN"],
  ])("%j formats as %s", (value, expected) => {
    expect(currencyFormat(value as number)).toBe(expected);
  });
});

describe("comienzaConCaracter and comienzaNoConCaracter", () => {
  test("compare the first character ignoring case", () => {
    expect(comienzaConCaracter("%CIF", "%")).toBe(true);
    expect(comienzaConCaracter("abc", "A")).toBe(true);
    expect(comienzaConCaracter("abc", "b")).toBe(false);
    expect(comienzaConCaracter("", "%")).toBe(false);
    expect(comienzaNoConCaracter("%CIF", "%")).toBe(false);
    expect(comienzaNoConCaracter("abc", "%")).toBe(true);
    expect(comienzaNoConCaracter("a", "A")).toBe(false);
    expect(comienzaNoConCaracter("", "%")).toBe(true);
  });
});

describe("validateCost", () => {
  const multiplicador = [
    { id: 1, text: "Por M3" },
    { id: 2, text: "% CIF" },
  ];
  const services = [
    { status: 1, id_groupservices: 10 },
    { status: 0, id_groupservices: 11 },
  ];

  test("fails when an active non-percentage cost is zero", () => {
    const result = validateCost({
      multiplicador,
      services,
      costo: [{ id_multiplicador: 1, id_groupservices: 10, costounitario: 0 }],
    });
    expect(result.estado).toBe(false);
    expect(result.mensaje).toBe(
      "Existe un costo que tiene un valor 0.00. Verifique",
    );
  });

  test("treats numeric zero strings as zero", () => {
    const result = validateCost({
      multiplicador,
      services,
      costo: [
        { id_multiplicador: 1, id_groupservices: 10, costounitario: "0.00" },
      ],
    });
    expect(result.estado).toBe(false);
  });

  test("passes when costs are non-zero, percentage-based or of inactive services", () => {
    const base = { multiplicador, services };
    expect(
      validateCost({
        ...base,
        costo: [
          { id_multiplicador: 1, id_groupservices: 10, costounitario: 5 },
        ],
      }).estado,
    ).toBe(true);
    expect(
      validateCost({
        ...base,
        costo: [
          { id_multiplicador: 2, id_groupservices: 10, costounitario: 0 },
        ],
      }).estado,
    ).toBe(true);
    expect(
      validateCost({
        ...base,
        costo: [
          { id_multiplicador: 1, id_groupservices: 11, costounitario: 0 },
        ],
      }).estado,
    ).toBe(true);
  });

  test("passes with no data", () => {
    expect(validateCost({}).estado).toBe(true);
  });
});

describe("formatearServicios", () => {
  test("maps services and defaults a missing id to an empty string", () => {
    expect(
      formatearServicios({
        services: [
          {
            id: 4,
            id_begend: 2,
            service: "Flete",
            code_service: "FL",
            status: 1,
          },
          { id_begend: 3, service: "Seguro", code_service: "SG", status: 0 },
        ],
      }),
    ).toEqual([
      {
        id: 4,
        idBegEnd: 2,
        nameservice: "Flete",
        codegroupservices: "FL",
        status: 1,
      },
      {
        id: "",
        idBegEnd: 3,
        nameservice: "Seguro",
        codegroupservices: "SG",
        status: 0,
      },
    ]);
  });

  test("returns an empty list for no services", () => {
    expect(formatearServicios({})).toEqual([]);
    expect(formatearServicios({ services: [] })).toEqual([]);
  });
});

describe("formatearNotas", () => {
  test("maps notes keeping their flags and status", () => {
    expect(
      formatearNotas({
        notas: [
          {
            id: 7,
            descripcion: "Incluye",
            statusincluye: 1,
            statusnoincluye: 0,
            state: 2,
            nro_propuesta: 3,
          },
        ],
      }),
    ).toEqual([
      {
        id: 7,
        descripcion: "Incluye",
        esprincipalflag: 1,
        esincluyeflag: 1,
        esnoincluyeflag: 0,
        status: 2,
        nro_propuesta: 3,
      },
    ]);
  });

  test("defaults missing values", () => {
    expect(formatearNotas({ notas: [{ descripcion: "x" }] })).toEqual([
      {
        id: null,
        descripcion: "x",
        esprincipalflag: 1,
        esincluyeflag: 0,
        esnoincluyeflag: 0,
        status: 1,
        nro_propuesta: undefined,
      },
    ]);
  });

  test("passes truthy include flags through unchanged", () => {
    const [note] = formatearNotas({
      notas: [{ descripcion: "x", statusincluye: "0", statusnoincluye: true }],
    });
    expect(note!.esincluyeflag).toBe("0");
    expect(note!.esnoincluyeflag).toBe(true);
  });

  test("returns an empty list for no notes", () => {
    expect(formatearNotas({})).toEqual([]);
  });
});

describe("formatearContainer", () => {
  test("maps containers and defaults a missing id to an empty string", () => {
    expect(
      formatearContainer({
        containers: [
          { id: 1, id_containers: 20, cantidad: 2 },
          { id_containers: 40, cantidad: 1 },
        ],
      }),
    ).toEqual([
      { id: 1, id_contenedor: 20, cantidad: 2, status: true },
      { id: "", id_contenedor: 40, cantidad: 1, status: true },
    ]);
  });

  test("returns an empty list for no containers", () => {
    expect(formatearContainer({})).toEqual([]);
  });
});

describe("formatearContainerEditar", () => {
  test("uses the container id as id_contenedor and a null id when missing", () => {
    expect(
      formatearContainerEditar({
        containers: [{ id: 5, cantidad: 3 }, { cantidad: 1 }],
      }),
    ).toEqual([
      { id: 5, id_contenedor: 5, quantity: 3, status: true },
      { id: null, id_contenedor: undefined, quantity: 1, status: true },
    ]);
  });

  test("returns an empty list for no containers", () => {
    expect(formatearContainerEditar({})).toEqual([]);
  });
});

describe("obtenerPorcentaje", () => {
  const listImpuestos = [
    { codigo: "09", codigo01: "10" },
    { codigo: 1, codigo01: "1,5" },
  ];

  test("returns codigo01 of the matching tax as a number", () => {
    expect(obtenerPorcentaje({ listImpuestos, code: "09" })).toBe(10);
    expect(obtenerPorcentaje({ listImpuestos, code: "1" })).toBe(15);
    expect(obtenerPorcentaje({ listImpuestos, code: 1 })).toBe(15);
  });

  test("returns 0 when the code is missing, mismatched or the list is empty", () => {
    expect(obtenerPorcentaje({ listImpuestos, code: "01" })).toBe(0);
    expect(obtenerPorcentaje({ listImpuestos, code: 9 })).toBe(0);
    expect(obtenerPorcentaje({ listImpuestos: null, code: "09" })).toBe(0);
    expect(obtenerPorcentaje({ listImpuestos: [], code: "09" })).toBe(0);
    expect(obtenerPorcentaje({ code: "09" })).toBe(0);
  });

  test("returns 0 when the matching tax has no usable percentage", () => {
    expect(
      obtenerPorcentaje({ listImpuestos: [{ codigo: "09" }], code: "09" }),
    ).toBe(0);
    expect(
      obtenerPorcentaje({
        listImpuestos: [{ codigo: "09", codigo01: "abc" }],
        code: "09",
      }),
    ).toBe(0);
  });

  test("skips empty entries in the list", () => {
    expect(
      obtenerPorcentaje({
        listImpuestos: [null, { codigo: "09", codigo01: "4" }],
        code: "09",
      }),
    ).toBe(4);
  });
});

describe("calcularImpuestos", () => {
  const impuestos = [
    { codigo: "03", codigo01: "1" },
    { codigo: "05", codigo01: "10" },
    { codigo: "06", codigo01: "5" },
    { codigo: "07", codigo01: "2" },
    { codigo: "08", codigo01: "16" },
    { codigo: "09", codigo01: "3" },
  ];
  const datosPrincipales = { amount: 1000 };
  const run = (codigo: string | number, codigo01: string | number = 0) =>
    calcularImpuestos({
      impuestos,
      item: { codigo, codigo01 },
      totalFlete: 200,
      datosPrincipales,
    });

  test.each([
    ["01", 0, "1000.00"],
    ["02", 0, "200.00"],
    ["03", 0, "12.00"],
    ["04", 0, "1212.00"],
    ["05", 10, "121.20"],
    ["06", 5, "66.66"],
    ["07", 2, "28.00"],
    ["08", 16, "223.98"],
    ["09", 3, "49.56"],
    ["10", 0, "100.00"],
    ["11", 0, "7.00"],
    ["12", 0, "3.00"],
  ])("code %s with rate %s gives %s", (codigo, rate, expected) => {
    expect(run(codigo, rate)).toBe(expected);
  });

  test("returns 0.00 for unknown codes and for codes given as numbers", () => {
    expect(run("13")).toBe("0.00");
    expect(run(3)).toBe("0.00");
  });

  test("returns 0.00 without an item", () => {
    expect(calcularImpuestos({ impuestos, totalFlete: 200 })).toBe("0.00");
    expect(calcularImpuestos({ impuestos, item: null })).toBe("0.00");
    expect(calcularImpuestos()).toBe("0.00");
  });

  test("works without the other taxes, with comma strings and missing amounts", () => {
    expect(
      calcularImpuestos({
        impuestos: null,
        item: { codigo: "04" },
        totalFlete: "200",
        datosPrincipales: { amount: "1,000" },
      }),
    ).toBe("1200.00");
    expect(
      calcularImpuestos({ item: { codigo: "02" }, totalFlete: undefined }),
    ).toBe("0.00");
    expect(
      calcularImpuestos({
        item: { codigo: "01" },
        datosPrincipales: { amount: null },
      }),
    ).toBe("0.00");
  });

  test("ignores empty entries in the tax list and bad rates", () => {
    expect(
      calcularImpuestos({
        impuestos: [null, { codigo: "03", codigo01: "1" }],
        item: { codigo: "03", codigo01: "abc" },
        totalFlete: 0,
        datosPrincipales: { amount: 100 },
      }),
    ).toBe("1.00");
    expect(run("05", "abc")).toBe("0.00");
  });

  test("keeps negative amounts", () => {
    expect(
      calcularImpuestos({
        item: { codigo: "01" },
        datosPrincipales: { amount: -50 },
      }),
    ).toBe("-50.00");
  });
});

describe("formatImp", () => {
  const impuestos = [
    {
      id: 1,
      codigo: "03",
      descripcion: "Seguro",
      codigo01: "1",
      nro_propuesta: 9,
    },
    { codigo: "04", descripcion: "CIF", codigo01: "" },
    { codigo: "abc", descripcion: "Raro", codigo01: "x" },
  ];

  test("maps each tax with its computed value", () => {
    expect(
      formatImp({
        impuestos,
        totalFlete: 200,
        datosPrincipales: { amount: 1000 },
      }),
    ).toEqual([
      {
        id: 1,
        type: 3,
        name: "Seguro",
        percentage: 1,
        valor: "12.00",
        orden: 3,
        nro_propuesta: 9,
      },
      {
        id: "",
        type: 4,
        name: "CIF",
        percentage: 0,
        valor: "1212.00",
        orden: 4,
        nro_propuesta: undefined,
      },
      {
        id: "",
        type: NaN,
        name: "Raro",
        percentage: 0,
        valor: "0.00",
        orden: NaN,
        nro_propuesta: undefined,
      },
    ]);
  });

  test("returns an empty list and tolerates missing options", () => {
    expect(formatImp({})).toEqual([]);
    expect(formatImp({ impuestos: [{ codigo: "10" }] })[0]!.valor).toBe(
      "100.00",
    );
  });
});

describe("validateLength", () => {
  test("accepts empty values and values within the limit", () => {
    expect(validateLength("", 5)).toBe(true);
    expect(validateLength(null, 5)).toBe(true);
    expect(validateLength(undefined, 5)).toBe(true);
    expect(validateLength("abc", 5)).toBe(true);
    expect(validateLength("abcde", 5)).toBe(true);
    expect(validateLength([1, 2, 3], 3)).toBe(true);
  });

  test("returns the error message when the value is too long", () => {
    expect(validateLength("abcdef", 5)).toBe("Hasta 5 caracteres permitidoss");
    expect(validateLength([1, 2], 1)).toBe("Hasta 1 caracteres permitidoss");
  });
});

describe("origin, local, customs and warehouse flags", () => {
  test("obtenerFlagOrigen is 1 for OR and FL only", () => {
    expect(obtenerFlagOrigen({ codebegend: "OR" })).toBe(1);
    expect(obtenerFlagOrigen({ codebegend: "FL" })).toBe(1);
    expect(obtenerFlagOrigen({ codebegend: "DE" })).toBe(0);
    expect(obtenerFlagOrigen({})).toBe(0);
  });

  test("obtenerLocalFlag is 1 for destination items outside AD, TR and AL", () => {
    expect(obtenerLocalFlag({ codebegend: "DE" })).toBe(1);
    expect(obtenerLocalFlag({ codebegend: "DE", categoria_role: "XX" })).toBe(
      1,
    );
    expect(obtenerLocalFlag({ codebegend: "DE", categoria_role: "AD" })).toBe(
      0,
    );
    expect(obtenerLocalFlag({ codebegend: "DE", categoria_role: "TR" })).toBe(
      0,
    );
    expect(obtenerLocalFlag({ codebegend: "DE", categoria_role: "AL" })).toBe(
      0,
    );
    expect(obtenerLocalFlag({ codebegend: "OR" })).toBe(0);
  });

  test("obtenerAduanaFlag is 1 for destination items with role AD or TR", () => {
    expect(obtenerAduanaFlag({ codebegend: "DE", categoria_role: "AD" })).toBe(
      1,
    );
    expect(obtenerAduanaFlag({ codebegend: "DE", categoria_role: "TR" })).toBe(
      1,
    );
    expect(obtenerAduanaFlag({ codebegend: "DE", categoria_role: "AL" })).toBe(
      0,
    );
    expect(obtenerAduanaFlag({ codebegend: "DE" })).toBe(0);
    expect(obtenerAduanaFlag({ codebegend: "OR", categoria_role: "AD" })).toBe(
      0,
    );
  });

  test("obtenerAlmacenFlag is 1 for destination items with role AL", () => {
    expect(obtenerAlmacenFlag({ codebegend: "DE", categoria_role: "AL" })).toBe(
      1,
    );
    expect(obtenerAlmacenFlag({ codebegend: "DE", categoria_role: "AD" })).toBe(
      0,
    );
    expect(obtenerAlmacenFlag({ codebegend: "OR", categoria_role: "AL" })).toBe(
      0,
    );
  });
});

describe("obtenerStatus", () => {
  test("returns the id of the first status with code 3", () => {
    expect(
      obtenerStatus({
        lstStatus: [
          { code: "1", id: 10 },
          { code: "3", id: 30 },
          { code: "3", id: 31 },
        ],
      }),
    ).toBe(30);
    expect(obtenerStatus({ lstStatus: [{ code: 3, id: 5 }] })).toBe(5);
  });

  test("returns an empty string when no status has code 3", () => {
    expect(obtenerStatus({ lstStatus: [{ code: "1", id: 10 }] })).toBe("");
    expect(obtenerStatus({ lstStatus: [] })).toBe("");
  });
});

describe("probarFunction", () => {
  test("returns 1", () => {
    expect(probarFunction()).toBe(1);
  });
});
