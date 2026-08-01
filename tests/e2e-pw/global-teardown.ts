import { getServerProcess } from "./global-setup";

export default async function globalTeardown() {
  const server = getServerProcess();
  if (server && !server.killed) {
    server.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 1500));
    if (!server.killed) server.kill("SIGKILL");
  }
  console.log("[e2e-teardown] server stopped");
}
