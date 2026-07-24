const { existsSync, readFileSync } = require("node:fs");
const { spawn, spawnSync } = require("node:child_process");
const path = require("node:path");

const configuredPhp = process.env.WAREHOUSEIQ_PHP_PATH;
const xamppPhp = "C:\\xampp\\php\\php.exe";
const backendDir = path.resolve(__dirname, "..", "backend");
const envPath = path.join(backendDir, ".env");
const autoloadPath = path.join(backendDir, "vendor", "autoload.php");
const host = process.env.WAREHOUSEIQ_HOST || "127.0.0.1";
const port = process.env.WAREHOUSEIQ_PORT || "8001";

function canRun(command) {
  const result = spawnSync(command, ["-r", "echo PHP_VERSION;"], {
    encoding: "utf8",
    windowsHide: true,
  });

  return result.status === 0;
}

// Prefer PHP on PATH: it is commonly a newer standalone PHP installation.
// XAMPP is only a fallback because bundled versions can lag behind Laravel.
const php = configuredPhp || (canRun("php") ? "php" : xamppPhp);

function fail(message) {
  console.error(`\nStartup stopped: ${message}`);
  console.error('Run "npm run setup" from the workspace root, then try again.\n');
  process.exit(1);
}

const phpVersion = spawnSync(php, ["-r", "echo PHP_VERSION;"], {
  encoding: "utf8",
  windowsHide: true,
});

if (phpVersion.status !== 0) {
  fail(`PHP could not be run from "${php}". Set WAREHOUSEIQ_PHP_PATH to PHP 8.2+.`);
}

const [major, minor] = phpVersion.stdout.trim().split(".").map(Number);
if (major < 8 || (major === 8 && minor < 2)) {
  fail(`PHP ${phpVersion.stdout.trim()} was found, but Laravel requires PHP 8.2+. Set WAREHOUSEIQ_PHP_PATH to a compatible executable.`);
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

console.log(`Laravel API: http://127.0.0.1:${port}`);

const server = spawn(
  php,
  ["-S", `${host}:${port}`, "-t", "public", "public/index.php"],
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
