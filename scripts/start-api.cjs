const { existsSync } = require("node:fs");
const { spawn } = require("node:child_process");

const configuredPhp = process.env.WAREHOUSEIQ_PHP_PATH;
const xamppPhp = "C:\\xampp\\php\\php.exe";
const php = configuredPhp || (existsSync(xamppPhp) ? xamppPhp : "php");

const server = spawn(
  php,
  ["backend/artisan", "serve", "--host=127.0.0.1", "--port=8000"],
  { stdio: "inherit", windowsHide: true },
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
