import { setupSettings } from "./setup-settings.js";
import { ensureBundledAgents } from "../src/ensureAgent.js";

setupSettings();
const r = ensureBundledAgents();
if (r.ok) console.log(`[agy-auto] bundled agent → ${r.path}`);
else console.warn(`[agy-auto] agent install skipped: ${r.error}`);
