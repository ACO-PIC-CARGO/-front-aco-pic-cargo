import Swal from "sweetalert2";

export const promptPlanUpgrade = async (router, notice) => {
  if (Swal.isVisible()) return;
  const { isConfirmed } = await Swal.fire({
    icon: "info",
    title: notice.title,
    text: notice.text,
    showCancelButton: true,
    confirmButtonText: "Ir a gestionar mi plan",
    cancelButtonText: "Ahora no",
    reverseButtons: true,
  });
  if (isConfirmed) router.push({ name: "miPlan" }).catch(() => {});
};
