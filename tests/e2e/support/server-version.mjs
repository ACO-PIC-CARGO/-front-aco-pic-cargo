import { readFileSync } from "node:fs";

const ENV_FILE = new URL("../../../.env.development", import.meta.url);

function appVersion() {
  const match = readFileSync(ENV_FILE, "utf8").match(/^VUE_APP_VERSION=(.+)$/m);
  if (!match) throw new Error("VUE_APP_VERSION is missing from .env.development");
  return match[1].trim();
}

// The local database holds its own version row; when it differs from the app's, a blocking
// "update available" dialog covers every page.
export async function reportAppVersionAsServerVersion(pageOrContext) {
  await pageOrContext.route("**/getVersion", async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    body.data[0].version = appVersion();
    await route.fulfill({ response, json: body });
  });
}
