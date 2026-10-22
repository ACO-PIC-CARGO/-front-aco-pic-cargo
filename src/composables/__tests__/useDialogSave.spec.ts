import { expect, test, vi } from "vitest";
import { ref } from "vue";
import { useDialogSave } from "@/composables/useDialogSave";

const validForm = (valid = true) => ref({ validate: async () => ({ valid }) });

const flushPromises = async () => {
  for (let tick = 0; tick < 10; tick++) await Promise.resolve();
};

test("a second save while the first is running sends nothing", async () => {
  let finish!: (message: string | null) => void;
  const persist = vi.fn(() => new Promise<string | null>((resolve) => (finish = resolve)));
  const open = ref(true);
  const { save, saving } = useDialogSave(open, validForm(), persist);
  const first = save();
  await save();
  await flushPromises();
  finish(null);
  await first;
  expect(persist).toHaveBeenCalledTimes(1);
  expect(open.value).toBe(false);
  expect(saving.value).toBe(false);
});

test("a rejected save keeps the dialog open and shows the reason", async () => {
  const open = ref(true);
  const { save, serverError } = useDialogSave(open, validForm(), async () => "Ya existe una fase con ese nombre.");
  await save();
  expect(open.value).toBe(true);
  expect(serverError.value).toBe("Ya existe una fase con ese nombre.");
});

test("an invalid form is not sent", async () => {
  const persist = vi.fn(async () => null);
  const open = ref(true);
  const { save, saving } = useDialogSave(open, validForm(false), persist);
  await save();
  expect(persist).not.toHaveBeenCalled();
  expect(open.value).toBe(true);
  expect(saving.value).toBe(false);
});
