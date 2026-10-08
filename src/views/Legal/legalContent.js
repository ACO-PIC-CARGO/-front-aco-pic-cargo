const PADDLE_NOTICE =
  "Nuestro proceso de pedidos lo realiza nuestro revendedor en línea Paddle.com. Paddle.com es el comerciante registrado (Merchant of Record) de todos nuestros pedidos. Paddle atiende las consultas de servicio al cliente relacionadas con pagos y gestiona las devoluciones.";

const LAST_UPDATE = {
  heading: "Última actualización",
  paragraphs: ["Última actualización: [Fecha de actualización]"],
};

export const LEGAL_PAGES = {
  terminos: {
    title: "Términos y condiciones",
    sections: [
      LAST_UPDATE,
      {
        heading: "Quiénes somos",
        paragraphs: [
          "ACO es una plataforma web para agencias de carga. El proveedor del servicio es [Razón social].",
        ],
      },
      {
        heading: "Aceptación",
        paragraphs: [
          "Al crear una cuenta o usar ACO, aceptas estos términos. Si no estás de acuerdo con ellos, no uses la plataforma.",
        ],
      },
      {
        heading: "Cuentas y usuarios",
        paragraphs: [
          "El plan se contrata por empresa. Cada plan tiene un límite de usuarios.",
          "Tú cuidas tus credenciales de acceso y eres responsable de la actividad que ocurra con tu cuenta.",
        ],
      },
      {
        heading: "Planes, pagos y renovación",
        paragraphs: [
          "Puedes contratar un plan de forma mensual o anual. El plan se renueva automáticamente hasta que lo canceles.",
          "Cuando cambias de plan, el cobro se prorratea según el tiempo que resta de tu periodo.",
          PADDLE_NOTICE,
        ],
      },
      {
        heading: "Periodo de prueba",
        paragraphs: [
          "Si tu plan incluye un periodo de prueba, no se te cobra durante ese tiempo. Al terminar, se cobra el plan, salvo que canceles antes.",
        ],
      },
      {
        heading: "Cancelación",
        paragraphs: [
          "Puedes cancelar tu plan desde Mi plan. Mantienes el acceso hasta el final del periodo que ya pagaste.",
        ],
      },
      {
        heading: "Uso aceptable",
        paragraphs: [
          "Usa ACO solo para fines legales y relacionados con tu operación de carga. No intentes acceder a cuentas de otras empresas ni alterar el funcionamiento de la plataforma.",
        ],
      },
      {
        heading: "Datos",
        paragraphs: [
          "Tratamos tus datos como describe nuestra Política de privacidad.",
        ],
      },
      {
        heading: "Limitación de responsabilidad",
        paragraphs: [
          "Hacemos lo posible por mantener ACO disponible y seguro, pero no podemos garantizar que funcione sin interrupciones. En la medida que permita la ley, [Razón social] no responde por pérdidas indirectas derivadas del uso del servicio.",
        ],
      },
      {
        heading: "Cambios a estos términos",
        paragraphs: [
          "Podemos actualizar estos términos. Publicaremos la versión vigente en esta página, con su fecha de actualización.",
        ],
      },
      {
        heading: "Ley aplicable",
        paragraphs: ["Estos términos se rigen por las leyes de [País]."],
      },
      {
        heading: "Contacto",
        paragraphs: ["Si tienes dudas, escríbenos a [Correo de soporte]."],
      },
    ],
  },
  privacidad: {
    title: "Política de privacidad",
    sections: [
      LAST_UPDATE,
      {
        heading: "Responsable",
        paragraphs: [
          "[Razón social] es el proveedor de ACO y responsable del tratamiento de tus datos.",
        ],
      },
      {
        heading: "Datos que recopilamos",
        paragraphs: [
          "Datos de tu cuenta, como tu nombre y tu correo.",
          "Datos de tu empresa.",
          "La información que registras en la plataforma.",
          "Los pagos los procesa Paddle. ACO no guarda datos de tarjetas.",
        ],
      },
      {
        heading: "Para qué los usamos",
        paragraphs: [
          "Usamos tus datos para darte acceso a ACO, operar el servicio, gestionar tu plan y atender tus consultas.",
        ],
      },
      {
        heading: "Con quién los compartimos",
        paragraphs: [
          "Compartimos datos con Paddle para procesar los pagos, y con los proveedores de infraestructura necesarios para operar el servicio.",
        ],
      },
      {
        heading: "Cuánto tiempo los conservamos",
        paragraphs: [
          "Conservamos tus datos mientras tu cuenta esté activa y el tiempo que la ley exija después.",
        ],
      },
      {
        heading: "Tus derechos",
        paragraphs: [
          "Puedes acceder a tus datos, corregirlos, eliminarlos u oponerte a su tratamiento. Escríbenos a [Correo de soporte] y te ayudamos.",
        ],
      },
      {
        heading: "Seguridad",
        paragraphs: [
          "Aplicamos medidas técnicas y organizativas para proteger tus datos. Aun así, ningún sistema es completamente invulnerable.",
        ],
      },
      {
        heading: "Cambios a esta política",
        paragraphs: [
          "Podemos actualizar esta política. Publicaremos la versión vigente en esta página, con su fecha de actualización.",
        ],
      },
    ],
  },
  reembolsos: {
    title: "Política de reembolsos",
    sections: [
      LAST_UPDATE,
      {
        heading: "Quién procesa los pagos",
        paragraphs: ["ACO es un servicio de [Razón social].", PADDLE_NOTICE],
      },
      {
        heading: "Cancelar tu plan",
        paragraphs: [
          "Puedes cancelar tu plan desde Mi plan. No se te harán más cobros y conservas el acceso hasta el final del periodo que ya pagaste.",
        ],
      },
      {
        heading: "Reembolsos",
        paragraphs: [
          "Puedes pedir un reembolso dentro de [Plazo de reembolso] desde la compra o renovación. Escríbenos a [Correo de soporte] o solicítalo desde el recibo de Paddle.",
        ],
      },
      {
        heading: "Cambios de plan",
        paragraphs: [
          "Si bajas de plan, la diferencia queda como crédito para tus siguientes pagos.",
        ],
      },
      {
        heading: "Periodo de prueba",
        paragraphs: ["No se te cobra durante el periodo de prueba."],
      },
      {
        heading: "Cobros indebidos",
        paragraphs: [
          "Si ves un cobro que no reconoces, escríbenos a [Correo de soporte] y lo revisamos.",
        ],
      },
    ],
  },
};
