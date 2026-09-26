import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BUNDLED = path.join(ROOT, "agents", "agy-fast", "agent.md");
const GLOBAL_DIR = path.join(os.homedir(), ".gemini", "config", "agents", "agy-fast");
const GLOBAL_MD = path.join(GLOBAL_DIR, "agent.md");

export const DEFAULT_AGENT_ID = "agy-fast";

/**
 * Install / refresh the bundled parallel agent into the global Antigravity
 * agent discovery path so `agy --agent agy-fast` works in any cwd.
 */
export function ensureBundledAgents() {
  if (!fs.existsSync(BUNDLED)) {
    return { ok: false, error: `missing bundled agent: ${BUNDLED}` };
  }
  fs.mkdirSync(GLOBAL_DIR, { recursive: true });
  const src = fs.readFileSync(BUNDLED, "utf8");
  let prev = null;
  try {
    prev = fs.readFileSync(GLOBAL_MD, "utf8");
  } catch {
    prev = null;
  }
  if (prev !== src) {
    fs.writeFileSync(GLOBAL_MD, src, "utf8");
  }
  return { ok: true, path: GLOBAL_MD, updated: prev !== src };
}
