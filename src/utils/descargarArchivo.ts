// Descarga un archivo (soporte / voucher) con su nombre. Si el servidor no permite leerlo
// desde el navegador (CORS), se abre en una pestaña nueva para guardarlo desde ahí.
export async function descargarArchivo(url: string | null | undefined, nombre?: string | null) {
  if (!url) return;
  const nombreArchivo = nombre || decodeURIComponent(url.split("?")[0]?.split("/").pop() || "archivo");
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(String(response.status));
    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(await response.blob());
    enlace.download = nombreArchivo;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
  } catch {
    window.open(url, "_blank");
  }
}
