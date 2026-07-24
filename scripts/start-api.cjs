const { existsSync, readFileSync } = require("node:fs");
const { spawn } = require("node:child_process");
const { networkInterfaces } = require("node:os");
const path = require("node:path");

const configuredPhp = process.env.WAREHOUSEIQ_PHP_PATH;
const xamppPhp = "C:\\xampp\\php\\php.exe";
const php = configuredPhp || (existsSync(xamppPhp) ? xamppPhp : "php");
const backendDir = path.resolve(__dirname, "..", "backend");
const envPath = path.join(backendDir, ".env");
const autoloadPath = path.join(backendDir, "vendor", "autoload.php");
const host = process.env.WAREHOUSEIQ_HOST || "0.0.0.0";
const port = process.env.WAREHOUSEIQ_PORT || "8000";

function fail(message) {
  console.error(`\nStartup stopped: ${message}`);
  console.error('Run "npm run setup" from the workspace root, then try again.\n');
  process.exit(1);
}

if (!existsSync(envPath)) {
  fail("backend/.env is missing.");
}

if (!existsSync(autoloadPath)) {
  fail("Laravel dependencies are missing (backend/vendor/autoload.php was not found).");
}

const env = readFileSync(envPath, "utf8");
if (!/^APP_KEY=base64:.+$/m.test(env)) {
  fail("backend/.env does not contain a generated APP_KEY.");
}

const lanAddresses = Object.values(networkInterfaces())
  .flat()
  .filter((entry) => entry && entry.family === "IPv4" && !entry.internal)
  .map((entry) => entry.address);

console.log(`Laravel API: http://127.0.0.1:${port}`);
for (const address of lanAddresses) {
  console.log(`Laravel LAN: http://${address}:${port}`);
}

const server = spawn(
  php,
  ["artisan", "serve", `--host=${host}`, `--port=${port}`],
  { cwd: backendDir, stdio: "inherit", windowsHide: true },
);

server.on("error", (error) => {
  console.error(
    `Unable to start Laravel with "${php}". Set WAREHOUSEIQ_PHP_PATH to a PHP 8.2+ executable.`,
  );
  console.error(error.message);
  process.exit(1);
});

server.on("exit", (code) => {
  process.exit(code ?? 0);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    if (!server.killed) server.kill(signal);
  });
}
