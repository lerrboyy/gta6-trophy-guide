// Leonida Trophy Guide — packaging entrypoint.
//
// Takes the finished static guide (app/) and its screenshots, copies them
// into the grader's output directory, and writes dossier.json there using
// the vendored make.fun library. Node 22, standard library only.

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

// Scorer caps, as fixed for this competition.
const TEXT_BUDGET_BYTES = 163840;
const MAX_SCREENSHOTS = 4;
const MAX_SCREENSHOT_BYTES = 262144;
const MAX_GUIDE_ENTRIES = 993;
const MAX_GUIDE_BYTES = 50331648;

const here = dirname(fileURLToPath(import.meta.url));
const guideSource = join(here, "app");
const shotsSource = join(here, "screenshots");
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";

function fail(message) {
  console.error(`trophy-guide: ${message}`);
  process.exit(1);
}

if (!existsSync(guideSource)) {
  fail(`guide folder not found beside main.ts: ${guideSource}`);
}

// Make sure the destination exists, parents included.
mkdirSync(outDir, { recursive: true });

// Copy the whole guide folder into the output directory.
cpSync(guideSource, join(outDir, "app"), { recursive: true });

// Screenshots are optional: only copy them when the folder is present.
const shotsDest = join(outDir, "screenshots");
mkdirSync(shotsDest, { recursive: true });
if (existsSync(shotsSource)) {
  cpSync(shotsSource, shotsDest, { recursive: true });
}

// Build the dossier with the scorer's caps and write it out.
const dossier = buildDossier(outDir, {
  text_max_bytes: TEXT_BUDGET_BYTES,
  screenshots: {
    max: MAX_SCREENSHOTS,
    max_bytes: MAX_SCREENSHOT_BYTES,
  },
  app_max_files: MAX_GUIDE_ENTRIES,
  app_max_bytes: MAX_GUIDE_BYTES,
});
writeFileSync(join(outDir, "dossier.json"), dossier);

console.log(`trophy-guide: packaged guide into ${outDir}`);
