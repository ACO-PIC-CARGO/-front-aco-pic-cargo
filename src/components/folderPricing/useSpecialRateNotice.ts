import { onMounted, ref } from "vue";
import { getSpecialRateNotice } from "@/views/Configuracion/Pricing/specialRateNoticeApi";
import type { SpecialRateNotice } from "./specialRateNotice";

export const useSpecialRateNotice = () => {
  const notice = ref<SpecialRateNotice | null>(null);
  onMounted(async () => {
    notice.value = await getSpecialRateNotice();
  });
  return { notice };
};
