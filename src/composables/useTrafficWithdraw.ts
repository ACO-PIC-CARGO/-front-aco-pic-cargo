import Swal from "sweetalert2";
import { useTrafficStore } from "@/stores/traffic";
import { askAdminCredentials } from "@/utils/adminCredentials";
import { generateIdempotencyKey } from "@/utils/idempotencia";
import { notifySuccess } from "@/utils/request";

export function useTrafficWithdraw() {
  const trafficStore = useTrafficStore();

  return async function withdraw(file: { id_traffic: number; code_traffic: string }): Promise<boolean> {
    const admin = await askAdminCredentials(
      `Retirar ${file.code_traffic} de Operaciones le quita el master y lo regresa a Tráfico. ` +
        "Lo que Operaciones cambió en el house se conserva.",
    );
    if (!admin) return false;
    const answer = await trafficStore.withdrawFromOperations(file.id_traffic, admin, generateIdempotencyKey());
    if (!answer.estadoflag) {
      await Swal.fire({ icon: "warning", title: "No se pudo retirar", text: answer.mensaje });
      return false;
    }
    notifySuccess(answer.mensaje);
    return true;
  };
}
