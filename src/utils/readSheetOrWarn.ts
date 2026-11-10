import { readSheet } from "read-excel-file/browser";
import type { Row } from "read-excel-file/browser";
import Swal from "sweetalert2";

export const UNREADABLE_SHEET_MESSAGE =
  "Ciérralo en Excel (o descárgalo si está en OneDrive) y vuelve a seleccionarlo.";

export async function readSheetOrWarn(file: File): Promise<Row[] | null> {
  try {
    return await readSheet(file);
  } catch {
    Swal.fire({ icon: "warning", title: "No pudimos leer el archivo", text: UNREADABLE_SHEET_MESSAGE });
    return null;
  }
}
