import { type ChildProcess, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { E2E_BASE_URL, E2E_DATA_DIR } from "../../playwright.config";

let server: ChildProcess | null = null;

async function waitForServer(url: string, timeoutMs = 90_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: "manual" });
      if (res.status < 500) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`E2E server did not become ready at ${url}`);
}

export function getServerProcess(): ChildProcess | null {
  return server;
}

export default async function globalSetup() {
  if (!existsSync(E2E_DATA_DIR)) {
    console.log(`[e2e-setup] 初始化 E2E 数据库 ${E2E_DATA_DIR}`);
    for (const script of ["scripts/migrate-pglite.ts", "drizzle/seed/seed.ts"]) {
      await new Promise<void>((resolve, reject) => {
        const child = spawn("node", ["--import", "tsx", script], {
          env: { ...process.env, PGLITE_DATA_DIR: E2E_DATA_DIR },
          stdio: "inherit",
        });
        child.on("exit", (code) =>
          code === 0 ? resolve() : reject(new Error(`${script} exited ${code}`)),
        );
      });
    }
  }

  console.log("[e2e-setup] 启动 E2E dev server :3100");
  server = spawn("node", ["node_modules/next/dist/bin/next", "dev", "-p", "3100"], {
    env: {
      ...process.env,
      PGLITE_DATA_DIR: E2E_DATA_DIR,
      // 上传文件隔离到 E2E 数据目录内，随测试库一起擦除
      UPLOAD_DIR: `${E2E_DATA_DIR}/uploads`,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout?.on("data", () => {});
  server.stderr?.on("data", () => {});
  await waitForServer(`${E2E_BASE_URL}/zh/login`);
  console.log("[e2e-setup] server ready");
}
