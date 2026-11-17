// Lanza Vitest con la letra de unidad en mayúscula (Windows). Si la carpeta se abre como "c:\..."
// (VS Code, Git Bash), Node carga Vitest dos veces ("c:" y "C:") y falla con
// "Vitest failed to find the runner" o los vi.mock no se aplican.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const cwd = process.cwd().replace(/^[a-z]:/, (unidad) => unidad.toUpperCase());
const vitest = fileURLToPath(new URL("../node_modules/vitest/vitest.mjs", import.meta.url))
  .replace(/^[a-z]:/, (unidad) => unidad.toUpperCase());
const { status } = spawnSync(process.execPath, [vitest, ...process.argv.slice(2)], { cwd, stdio: "inherit" });
process.exit(status ?? 1);
