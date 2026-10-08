import Swal from "sweetalert2";
import {
  changeCompanyPlan,
  previewPlanChange,
  startCheckout,
} from "@/api/branchSubscription";
import { openPaddleCheckout } from "@/api/paddleCheckout";
import { changeSummary } from "./myPlanView";

const OPEN_FAILED_MESSAGE =
  "No pudimos abrir el pago. Intenta de nuevo en unos minutos.";
const CHANGE_FAILED_MESSAGE =
  "No pudimos cambiar tu plan. Intenta de nuevo en unos minutos.";

const transactionIdOf = (response) =>
  response.estadoflag &&
  response.data &&
  response.data[0] &&
  response.data[0].transaction_id;

export const openPlanCheckout = async (payload, onEvent) => {
  const response = await startCheckout(payload);
  const transactionId = transactionIdOf(response);
  if (!transactionId) return response.mensaje || OPEN_FAILED_MESSAGE;
  return (await openPaddleCheckout(transactionId, onEvent)) || null;
};

export const confirmPlanChange = async (packageName, payload, setBusy) => {
  setBusy(true);
  const preview = await previewPlanChange(payload);
  setBusy(false);
  if (!preview.estadoflag) {
    return { error: preview.mensaje || CHANGE_FAILED_MESSAGE };
  }

  const { isConfirmed } = await Swal.fire({
    icon: "question",
    title: `¿Cambiar a ACO ${packageName}?`,
    text: changeSummary(preview.data[0]),
    showCancelButton: true,
    confirmButtonText: "Sí, cambiar plan",
    cancelButtonText: "Volver",
    reverseButtons: true,
  });
  if (!isConfirmed) return {};

  setBusy(true);
  const response = await changeCompanyPlan(payload);
  setBusy(false);
  if (!response.estadoflag) {
    return { error: response.mensaje || CHANGE_FAILED_MESSAGE };
  }
  return { plan: response.data[0], message: response.mensaje };
};
