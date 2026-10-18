import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { credentials, SESSION_FILE } from "./support/env.mjs";
import { loginThroughUi } from "./support/login.mjs";
import { reportAppVersionAsServerVersion } from "./support/server-version.mjs";

export default async function globalSetup(config) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL: config.projects[0].use.baseURL });
  await reportAppVersionAsServerVersion(page);
  await loginThroughUi(page, credentials());
  const storage = await page.evaluate(() => ({
    local: { ...window.localStorage },
    session: { ...window.sessionStorage },
  }));
  await mkdir(new URL(".", SESSION_FILE), { recursive: true });
  await writeFile(SESSION_FILE, JSON.stringify(storage));
  await browser.close();
}
