import { ref } from "vue";

export const internalThreadVersion = ref(0);

export const internalThreadChanged = (): void => {
  internalThreadVersion.value++;
};
