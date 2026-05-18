#!/usr/bin/env node
import { execSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const staging = join(root, ".mcpb-staging");
const output = join(root, "mcp-pexels.mcpb");

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

const run = (cmd, opts = {}) => {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: root, ...opts });
};

console.log("• building dist/...");
run("npm run build");

console.log("• syncing manifest version with package.json...");
const manifestPath = join(root, "manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
if (manifest.version !== pkg.version) {
  manifest.version = pkg.version;
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`  manifest.json version → ${pkg.version}`);
}

console.log("• staging bundle contents...");
rmSync(staging, { recursive: true, force: true });
rmSync(output, { force: true });
mkdirSync(staging, { recursive: true });

cpSync(manifestPath, join(staging, "manifest.json"));
cpSync(join(root, "package.json"), join(staging, "package.json"));
cpSync(join(root, "dist"), join(staging, "dist"), { recursive: true });
cpSync(join(root, "LICENSE"), join(staging, "LICENSE"));
cpSync(join(root, "README.md"), join(staging, "README.md"));

console.log("• installing production dependencies inside staging...");
run("npm install --omit=dev --no-package-lock --silent", { cwd: staging });

console.log("• packing .mcpb...");
run(`npx -y @anthropic-ai/mcpb@latest pack "${staging}" "${output}"`);

console.log("• cleaning staging...");
rmSync(staging, { recursive: true, force: true });

console.log(`\nbundle ready: ${output}`);
