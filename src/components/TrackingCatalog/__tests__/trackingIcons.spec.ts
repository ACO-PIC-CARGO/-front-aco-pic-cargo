import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { expect, test } from "vitest";
import { TRACKING_ICONS } from "@/components/TrackingCatalog/trackingIcons";

const mdiStylesheet = readFileSync(
  createRequire(import.meta.url).resolve("@mdi/font/css/materialdesignicons.css"),
  "utf8",
);

test("every gallery icon exists in the installed Material Design Icons font", () => {
  const missing = TRACKING_ICONS.map(({ icon }) => icon).filter((icon) => !mdiStylesheet.includes(`.${icon}::before`));
  expect(missing).toEqual([]);
});
