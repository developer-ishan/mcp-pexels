#!/usr/bin/env node
import { execSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
  readFileSync,
} from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";

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

// The MCPB manifest schema (v0.3/v0.4) declares `additionalProperties: false`
// on tool entries, so Anthropic's packer rejects per-tool `inputSchema`.
// Smithery's registry, however, validates each tool against the MCP `Tool`
// schema and *requires* `inputSchema`. We satisfy both by packing with a
// stripped manifest (name + description only) and then patching the full
// manifest back into the .mcpb zip after pack succeeds.
console.log("• writing pack-time manifest (inputSchema stripped)...");
const stripped = JSON.parse(JSON.stringify(manifest));
if (Array.isArray(stripped.tools)) {
  stripped.tools = stripped.tools.map(({ name, description }) => ({
    name,
    description,
  }));
}
writeFileSync(
  join(staging, "manifest.json"),
  JSON.stringify(stripped, null, 2) + "\n",
);

console.log("• installing production dependencies inside staging...");
run("npm install --omit=dev --no-package-lock --silent", { cwd: staging });

console.log("• packing .mcpb...");
run(`npx -y @anthropic-ai/mcpb@latest pack "${staging}" "${output}"`);

console.log("• injecting full manifest (with inputSchema) into .mcpb...");
const patchDir = mkdtempSync(join(tmpdir(), "mcpb-patch-"));
try {
  writeFileSync(
    join(patchDir, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  // `zip <zipfile> manifest.json` from patchDir replaces the entry at the
  // archive root in-place, preserving every other file in the bundle.
  run(`zip -q "${output}" manifest.json`, { cwd: patchDir });
} finally {
  rmSync(patchDir, { recursive: true, force: true });
}

console.log("• cleaning staging...");
rmSync(staging, { recursive: true, force: true });

console.log(`\nbundle ready: ${output}`);
