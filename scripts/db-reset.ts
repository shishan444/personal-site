import { rmSync } from "node:fs";
import path from "node:path";

const dataDir = path.resolve(process.cwd(), process.env.PGLITE_DATA_DIR ?? ".pglite/atelier-dev");

console.log(`[reset] deleting ${dataDir}`);
rmSync(dataDir, { recursive: true, force: true });
console.log("[reset] ✓ wiped");
