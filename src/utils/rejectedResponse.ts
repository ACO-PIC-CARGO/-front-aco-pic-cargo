import Swal from "sweetalert2";
import router from "@/router";
import type { ApiResponse } from "@/types/api";

export function showRejectedResponse(data: ApiResponse): void {
  Swal.fire({
    icon: data.status == "401" ? "error" : "info",
    text: data.mensaje,
    allowOutsideClick: false,
    allowEscapeKey: false,
    allowEnterKey: false,
  }).then((resSwal) => {
    if (resSwal.isConfirmed && data.status == "401") {
      router.push({ name: "Login" });
      setTimeout(() => {
        window.location.reload();
      }, 10);
    }
  });
}
