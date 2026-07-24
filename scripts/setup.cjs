const { copyFileSync, existsSync, readFileSync } = require("node:fs");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const backendDir = path.join(rootDir, "backend");
const envPath = path.join(backendDir, ".env");
const exampleEnvPath = path.join(backendDir, ".env.example");
const xamppPhp = "C:\\xampp\\php\\php.exe";
const composerPhar = "C:\\ProgramData\\ComposerSetup\\bin\\composer.phar";

function canRun(command) {
  const result = spawnSync(command, ["-r", "echo PHP_VERSION;"], {
    encoding: "utf8",
    windowsHide: true,
  });

  return result.status === 0;
}

// Prefer a compatible PHP already on PATH over XAMPP's bundled PHP.
const php = process.env.WAREHOUSEIQ_PHP_PATH || (canRun("php") ? "php" : xamppPhp);

function run(command, args, cwd = backendDir) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    windowsHide: true,
    shell: process.platform === "win32" && !path.isAbsolute(command),
  });

  if (result.error) {
    console.error(`Unable to run "${command}": ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const phpVersion = spawnSync(php, ["-r", "echo PHP_VERSION;"], {
  encoding: "utf8",
  windowsHide: true,
});

const [major, minor] = (phpVersion.stdout || "").trim().split(".").map(Number);
if (phpVersion.status !== 0 || major < 8 || (major === 8 && minor < 2)) {
  console.error(`PHP 8.2+ is required. "${php}" resolved to ${phpVersion.stdout?.trim() || "an unavailable executable"}.`);
  console.error("Set WAREHOUSEIQ_PHP_PATH to a compatible PHP executable and run setup again.");
  process.exit(1);
}

if (!existsSync(envPath)) {
  copyFileSync(exampleEnvPath, envPath);
  console.log("Created backend/.env from backend/.env.example.");
}

if (!existsSync(path.join(backendDir, "vendor", "autoload.php"))) {
  if (existsSync(composerPhar)) {
    run(php, [composerPhar, "install", "--no-interaction", "--prefer-dist"]);
  } else {
    run(process.platform === "win32" ? "composer.bat" : "composer", [
      "install",
      "--no-interaction",
      "--prefer-dist",
    ]);
  }
}

const env = readFileSync(envPath, "utf8");
if (!/^APP_KEY=base64:.+$/m.test(env)) {
  run(php, ["artisan", "key:generate", "--force"]);
}

run(php, ["artisan", "optimize:clear"]);
run(php, ["artisan", "migrate", "--force"]);

console.log("\nSetup complete. Start the application with: npm run dev");
