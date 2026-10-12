export const SESSION_FILE = new URL("../.auth/session.json", import.meta.url);

export function credentials() {
  const missing = ["E2E_USER", "E2E_PASSWORD", "E2E_BRANCH"].filter((name) => !process.env[name]);
  if (missing.length) throw new Error(`Set ${missing.join(", ")} before running the e2e suite`);
  return {
    user: process.env.E2E_USER,
    password: process.env.E2E_PASSWORD,
    branch: process.env.E2E_BRANCH,
  };
}
