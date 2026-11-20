import { reactive } from "vue";

// Visor de soportes (voucher, soporte de pago / confirmación, facturas) para celular y tablet:
// en vez de abrir el archivo en otra pestaña (confunde al usuario) se abre en un modal dentro de la
// página: la imagen se ve ahí mismo y el PDF en el visor. En la web (escritorio) sigue igual: otra pestaña.
// El modal es único y vive en App.vue (VisorArchivoDialog).

// mismo corte que smAndDown de Vuetify (md empieza en 960px)
const CONSULTA_MOVIL = "(max-width: 959.98px)";

export type TipoArchivo = "pdf" | "imagen" | "otro";

export const visorArchivo = reactive({
  abierto: false,
  url: "",
  nombre: "",
});

export function tipoDeArchivo(url: string, nombre = ""): TipoArchivo {
  // sin query ni hash: "…/voucher.JPG?v=2" → "voucher.jpg"
  const texto = `${nombre} ${url.split(/[?#]/)[0]}`.toLowerCase();
  if (/\.pdf\b|application\/pdf/.test(texto)) return "pdf";
  if (/\.(png|jpe?g|gif|webp|bmp|heic|heif|svg)\b|image\//.test(texto)) return "imagen";
  return "otro";
}

function esMovil() {
  return typeof window !== "undefined" && !!window.matchMedia?.(CONSULTA_MOVIL).matches;
}

export function abrirArchivo(url: string | null | undefined, nombre?: string | null) {
  if (!url) return;
  if (!esMovil()) {
    window.open(url, "_blank");
    return;
  }
  visorArchivo.url = url;
  visorArchivo.nombre = nombre ?? "";
  visorArchivo.abierto = true;
}
