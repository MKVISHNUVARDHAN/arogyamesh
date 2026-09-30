import { spawn } from "node:child_process";
const child = spawn(process.execPath, [".next/standalone/server.js"], {
  stdio: "inherit",
  env: {
    ...process.env,
    PORT: "3100",
    HOSTNAME: process.env.HOSTNAME || "127.0.0.1",
  },
});
child.on("exit", (code) => process.exit(code || 0));
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
