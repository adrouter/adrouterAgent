import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// extract-zip 2.0.1 has no patched npm release. Keep this dev-only backport bounded to
// exact upstream and patched bytes; remove it after adopting a verified upstream fix.
// https://github.com/advisories/GHSA-jmr9-qjv8-65gv
// https://github.com/advisories/GHSA-7pqw-9j4j-h8q3
const originalHash = '1073ca8196d3c9ae51b0de41df9d7c347957c8501d0749d852b4994789cddd78';
export const patchedExtractZipHash =
  'bd37567cc907db9988c85e678507a51d010eba992a0f115f10e8da5deb5a5134';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = resolve(root, 'node_modules/extract-zip/index.js');
const digest = (source) => createHash('sha256').update(source).digest('hex');
const replacements = [
  [
    "const { createWriteStream, promises: fs } = require('fs')",
    "const { createWriteStream, constants, promises: fs } = require('fs')",
  ],
  [
    "relativeDestDir.split(path.sep).includes('..')",
    "relativeDestDir.split(path.sep).includes('..') || path.isAbsolute(relativeDestDir)",
  ],
  [
    "      debug('creating symlink', link, dest)",
    "      const target = path.resolve(path.dirname(dest), link)\n      const relative = path.relative(this.opts.dir, target)\n      if (path.isAbsolute(link) || path.isAbsolute(relative) || relative.split(path.sep).includes('..')) {\n        throw new Error('Out of bound symlink target')\n      }\n      // Reject targets whose existing ancestor follows a link outside the extraction root.\n      let ancestor = target\n      while (true) {\n        try {\n          const canonical = await fs.realpath(ancestor)\n          const contained = path.relative(this.opts.dir, canonical)\n          if (path.isAbsolute(contained) || contained.split(path.sep).includes('..')) {\n            throw new Error('Out of bound symlink target')\n          }\n          break\n        } catch (error) {\n          if (error.code !== 'ENOENT') throw error\n          const parent = path.dirname(ancestor)\n          if (parent === ancestor) throw error\n          ancestor = parent\n        }\n      }\n      debug('creating symlink', link, dest)",
  ],
  [
    '      await pipeline(readStream, createWriteStream(dest, { mode: procMode }))',
    "      // A final-component symlink must never be followed, including a prior archive entry.\n      try {\n        if ((await fs.lstat(dest)).isSymbolicLink()) throw new Error('Symlink destination rejected')\n      } catch (error) {\n        if (error.code !== 'ENOENT') throw error\n      }\n      const flags = constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC | (constants.O_NOFOLLOW || 0)\n      await pipeline(readStream, createWriteStream(dest, { mode: procMode, flags }))",
  ],
  [
    '          await fs.mkdir(destDir, { recursive: true })',
    "          let existingParent = destDir\n          while (true) {\n            try {\n              const canonical = await fs.realpath(existingParent)\n              const relative = path.relative(this.opts.dir, canonical)\n              if (path.isAbsolute(relative) || relative.split(path.sep).includes('..')) {\n                throw new Error('Out of bound parent path')\n              }\n              break\n            } catch (error) {\n              if (error.code !== 'ENOENT') throw error\n              const parent = path.dirname(existingParent)\n              if (parent === existingParent) throw error\n              existingParent = parent\n            }\n          }\n          await fs.mkdir(destDir, { recursive: true })",
  ],
];

export function patchExtractZipSource(source) {
  if (digest(source) === patchedExtractZipHash) return source;
  assert.equal(
    digest(source),
    originalHash,
    'Unexpected extract-zip source; review before patching'
  );
  for (const [before, after] of replacements) {
    assert.equal(source.split(before).length, 2, 'Extract-zip patch target changed');
    source = source.replace(before, after);
  }
  assert.equal(digest(source), patchedExtractZipHash);
  return source;
}

export function assertExtractZipPatch(source, lock) {
  assert.equal(
    digest(source),
    patchedExtractZipHash,
    'Extract-zip security patch missing or changed'
  );
  const nodes = Object.entries(lock.packages).filter(([name]) =>
    /(?:^|\/)node_modules\/extract-zip$/.test(name)
  );
  assert.equal(nodes.length, 1, 'Unexpected additional extract-zip resolution');
  assert.equal(nodes[0][0], 'node_modules/extract-zip');
  assert.equal(nodes[0][1].version, '2.0.1');
  assert.equal(nodes[0][1].dev, true, 'Extract-zip must remain dev-only');
}

export function verifyInstalledExtractZipPatch() {
  const source = readFileSync(sourcePath, 'utf8');
  const lock = JSON.parse(readFileSync(resolve(root, 'package-lock.json'), 'utf8'));
  assertExtractZipPatch(source, lock);
  return source;
}

export function applyExtractZipPatch() {
  const metadata = JSON.parse(
    readFileSync(resolve(root, 'node_modules/extract-zip/package.json'), 'utf8')
  );
  assert.equal(metadata.version, '2.0.1');
  writeFileSync(sourcePath, patchExtractZipSource(readFileSync(sourcePath, 'utf8')));
  verifyInstalledExtractZipPatch();
}
