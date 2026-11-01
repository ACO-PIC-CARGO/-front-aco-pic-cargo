import { beforeEach, expect, test } from "vitest";
import { usePermissions } from "@/composables/usePermissions";

const storePermissions = (value: unknown) => sessionStorage.setItem("permissions", JSON.stringify(value));

beforeEach(() => sessionStorage.clear());

test("a controlled screen allows only the actions the user holds", () => {
  storePermissions({ screens: [{ route: "listUser", actions: ["VER", "NUEVO"] }], controlled: ["listUser"] });
  const { can, canOpen } = usePermissions();

  expect(can("listUser", "NUEVO")).toBe(true);
  expect(can("listUser", "ELIMINAR")).toBe(false);
  expect(canOpen("listUser")).toBe(true);
});

test("a controlled screen the user holds nothing on cannot be opened", () => {
  storePermissions({ screens: [{ route: "lstPosition", actions: [] }], controlled: ["lstPosition", "listUser"] });
  const { can, canOpen } = usePermissions();

  expect(canOpen("lstPosition")).toBe(false);
  expect(canOpen("listUser")).toBe(false);
  expect(can("listUser", "NUEVO")).toBe(false);
});

test("a screen outside the permission catalog stays open", () => {
  storePermissions({ screens: [], controlled: ["listUser"] });

  expect(usePermissions().canOpen("Main")).toBe(true);
});

test("a session without permissions loaded, or with a corrupt entry, keeps today's access", () => {
  expect(usePermissions().can("listUser", "NUEVO")).toBe(true);

  sessionStorage.setItem("permissions", "{not json");
  expect(usePermissions().canOpen("listUser")).toBe(true);
});
