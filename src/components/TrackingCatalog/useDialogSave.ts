import { ref } from "vue";
import type { Ref } from "vue";

interface ValidatableForm {
  validate(): Promise<{ valid: boolean }>;
}

export function useDialogSave(
  open: Ref<boolean>,
  form: Readonly<Ref<ValidatableForm | null>>,
  persist: () => Promise<string | null>,
) {
  const saving = ref(false);
  const serverError = ref("");

  async function save() {
    if (saving.value) return;
    saving.value = true;
    if ((await form.value!.validate()).valid) {
      serverError.value = (await persist()) ?? "";
      if (!serverError.value) open.value = false;
    }
    saving.value = false;
  }

  return { saving, serverError, save };
}
