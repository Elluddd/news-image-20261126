// news-image-20261126 — entry runner.
//
// The finished front page sits next to this file as entry.png. It was
// drawn entirely in code by build_image.py (a seeded Pillow program in
// the work directory): no AI imagery, no network, no clock, no
// unseeded randomness. This runner only checks that the image is a
// valid 1024x1024 PNG under 1 MiB and copies it into the output
// directory the platform expects.
//
// Node standard library only. Written as plain JavaScript so it runs
// on any Node 22 as-is.

import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(HERE, "entry.png");
const OUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const TARGET = join(OUT_DIR, "entry.png");

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const ONE_MIB = 1024 * 1024;

function fail(message) {
  console.error(`entry check failed: ${message}`);
  process.exit(1);
}

// Check the PNG header: magic bytes, size limit, and the 1024x1024
// dimensions stored in the IHDR chunk (width at offset 16, height at
// offset 20, both big-endian 32-bit).
function checkPng(bytes) {
  if (bytes.length > ONE_MIB) {
    fail(`entry.png is ${bytes.length} bytes, over the 1 MiB limit`);
  }
  if (!bytes.subarray(0, 8).equals(PNG_MAGIC)) {
    fail("entry.png does not start with the PNG magic bytes");
  }
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width !== 1024 || height !== 1024) {
    fail(`entry.png is ${width}x${height}, expected 1024x1024`);
  }
  return { width, height };
}

const bytes = readFileSync(SOURCE);
const { width, height } = checkPng(bytes);
const sha256 = createHash("sha256").update(bytes).digest("hex");

mkdirSync(OUT_DIR, { recursive: true });
copyFileSync(SOURCE, TARGET);

const written = statSync(TARGET).size;
console.log(`wrote ${TARGET} (${written} bytes, ${width}x${height} PNG)`);
console.log(`sha256 ${sha256}`);
