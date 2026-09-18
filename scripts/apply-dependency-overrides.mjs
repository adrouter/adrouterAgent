import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyExtractZipPatch } from './extract-zip-patch.mjs';

applyExtractZipPatch();

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const crossZipRoot = resolve(root, 'node_modules', 'cross-zip');
const crossZipPackage = JSON.parse(readFileSync(resolve(crossZipRoot, 'package.json'), 'utf8'));
assert.equal(crossZipPackage.version, '4.0.1', 'cross-zip compatibility patch version changed');
const crossZipPath = resolve(crossZipRoot, 'index.js');
let crossZipSource = readFileSync(crossZipPath, 'utf8');
for (const [before, after] of [
  [
    'fs.rmdir(outPath, { recursive: true, maxRetries: 3 }, doZip2)',
    'fs.rm(outPath, { recursive: true, force: true, maxRetries: 3 }, doZip2)',
  ],
  [
    'fs.rmdirSync(outPath, { recursive: true, maxRetries: 3 })',
    'fs.rmSync(outPath, { recursive: true, force: true, maxRetries: 3 })',
  ],
]) {
  assert.ok(
    crossZipSource.includes(before) || crossZipSource.includes(after),
    `cross-zip source no longer contains the reviewed compatibility target: ${before}`
  );
  crossZipSource = crossZipSource.replace(before, after);
}
writeFileSync(crossZipPath, crossZipSource);

console.log(
  'Applied the reviewed cross-zip compatibility and extract-zip security patches; npm overrides own the Pi 0.85.1 graph.'
);
