import { expect, test } from "vitest";
import { reactive } from "vue";
import { removeRow } from "@/components/folderEntities/removeRow";

test("removes the clicked row wherever the table shows it", () => {
  const rows = reactive([{ telefono: "1" }, { telefono: "2" }, { telefono: "3" }]);

  removeRow(rows, rows[2]!);

  expect(rows).toEqual([{ telefono: "1" }, { telefono: "2" }]);
});

test("leaves the list alone when the row is no longer in it", () => {
  const rows = reactive([{ telefono: "1" }, { telefono: "2" }]);

  removeRow(rows, { telefono: "2" });

  expect(rows).toEqual([{ telefono: "1" }, { telefono: "2" }]);
});
