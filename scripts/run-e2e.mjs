import { spawn } from "node:child_process";

const host = "127.0.0.1";
const port = "3020";
const baseUrl = `http://${host}:${port}`;

function spawnProcess(command, args, options = {}) {
  return spawn(command, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
    windowsHide: true,
    ...options,
  });
}

async function waitForServer() {
  const startedAt = Date.now();
  const timeoutMs = 120_000;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) {
        return;
      }
    } catch {
      // Next dev 首次启动和编译时端口可能还没监听；短暂等待后继续探测。
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`等待开发服务器超时：${baseUrl}`);
}

async function stopServer(server) {
  if (server.exitCode !== null || server.killed) {
    return;
  }

  server.kill("SIGTERM");

  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      if (server.exitCode === null && !server.killed) {
        server.kill("SIGKILL");
      }
      resolve();
    }, 5_000);

    server.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

async function run() {
  const server = spawnProcess(process.execPath, [
    "node_modules/next/dist/bin/next",
    "dev",
    "--hostname",
    host,
    "--port",
    port,
  ], {
    env: {
      ...process.env,
      AI_PROVIDER: "mock",
      NEXT_DIST_DIR: ".next-e2e",
    },
  });

  try {
    await waitForServer();

    const testProcess = spawnProcess(
      process.execPath,
      ["node_modules/@playwright/test/cli.js", "test"],
      {
        env: {
          ...process.env,
          AI_PROVIDER: "mock",
          PLAYWRIGHT_MANAGED_SERVER: "0",
        },
      },
    );

    const exitCode = await new Promise((resolve) => {
      testProcess.once("exit", (code) => resolve(code ?? 1));
    });

    process.exitCode = exitCode;
  } finally {
    await stopServer(server);
  }
}

run().catch(async (error) => {
  console.error(error);
  process.exitCode = 1;
});
