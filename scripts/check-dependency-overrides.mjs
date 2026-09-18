import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { verifyInstalledExtractZipPatch } from './extract-zip-patch.mjs';

verifyInstalledExtractZipPatch();

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
const securityPins = new Map([
  ['fast-uri', '3.1.6'],
  ['@xmldom/xmldom', '0.9.12'],
  ['tar', '7.5.22'],
  ['tmp', '0.2.7'],
]);

for (const [name, version] of securityPins) {
  assert.equal(packageJson.overrides[name], version, `${name} override must remain exact`);
  const locked = Object.entries(lock.packages).filter(
    ([key]) => key === `node_modules/${name}` || key.endsWith(`/node_modules/${name}`)
  );
  assert.ok(locked.length > 0, `${name} must exist in the lockfile`);
  for (const [key, entry] of locked) {
    assert.equal(entry.version, version, `${key} must resolve to ${version}`);
  }
  const physical = JSON.parse(readFileSync(resolve('node_modules', name, 'package.json'), 'utf8'));
  assert.equal(physical.version, version, `${name} physical resolution must be ${version}`);
}

for (const name of [
  '@earendil-works/pi-agent-core',
  '@earendil-works/pi-ai',
  '@earendil-works/pi-coding-agent',
]) {
  assert.equal(packageJson.dependencies[name], '0.85.1', `${name} must remain pinned`);
  assert.equal(
    lock.packages[`node_modules/${name}`].version,
    '0.85.1',
    `${name} root lock resolution must remain exact`
  );
  const physical = JSON.parse(readFileSync(resolve('node_modules', name, 'package.json'), 'utf8'));
  assert.equal(physical.version, '0.85.1', `${name} physical resolution must remain exact`);
}

for (const name of ['@earendil-works/pi-client', '@earendil-works/pi-protocol']) {
  assert.equal(
    packageJson.dependencies[name],
    undefined,
    `${name} must remain transitive-only and cannot gain direct product authority`
  );
  assert.equal(
    Object.keys(lock.packages).some((key) => key.endsWith(`/node_modules/${name}`)),
    false,
    `${name} was removed from the supported Pi 0.85.1 distribution`
  );
}

const piNestedRoot = resolve('node_modules', '@earendil-works', 'pi-coding-agent', 'node_modules');
for (const [name, version, relativePath] of [
  ['brace-expansion', '5.0.9', 'brace-expansion'],
  ['protobufjs', '7.6.5', 'protobufjs'],
  ['undici', '8.9.0', 'undici'],
]) {
  const physical = JSON.parse(
    readFileSync(resolve(piNestedRoot, relativePath, 'package.json'), 'utf8')
  );
  assert.equal(physical.version, version, `${name} Pi resolution must remain ${version}`);
}

const agentSessionSource = readFileSync(resolve('src', 'runtime', 'agent-session.ts'), 'utf8');
for (const boundary of [
  'noExtensions: true',
  'noSkills: true',
  'noPromptTemplates: true',
  'baseToolsOverride:',
  'allowedToolNames:',
]) {
  assert.ok(agentSessionSource.includes(boundary), `Pi resource boundary is missing ${boundary}`);
}
for (const optionalPackage of ['@earendil-works/pi-client', '@earendil-works/pi-protocol']) {
  assert.ok(
    !agentSessionSource.includes(optionalPackage),
    `${optionalPackage} must not be imported by the desktop runtime`
  );
}
const cacheOptimizerSource = readFileSync(resolve('src', 'runtime', 'cache-optimizer.ts'), 'utf8');
for (const forbidden of [
  'models.json',
  'registerProvider(',
  'promptCacheKey',
  'fetch(',
  'writeFile',
]) {
  assert.ok(
    !cacheOptimizerSource.includes(forbidden),
    `desktop cache optimization gained forbidden authority: ${forbidden}`
  );
}

const crossZipPackage = JSON.parse(
  readFileSync(resolve('node_modules', 'cross-zip', 'package.json'), 'utf8')
);
assert.equal(crossZipPackage.version, '4.0.1', 'cross-zip must remain at the reviewed version');
const crossZipSource = readFileSync(resolve('node_modules', 'cross-zip', 'index.js'), 'utf8');
for (const expected of [
  'fs.rm(outPath, { recursive: true, force: true, maxRetries: 3 }, doZip2)',
  'fs.rmSync(outPath, { recursive: true, force: true, maxRetries: 3 })',
]) {
  assert.ok(crossZipSource.includes(expected), 'cross-zip Node 25 compatibility patch is missing');
}
assert.ok(
  !crossZipSource.includes('fs.rmdir(outPath, { recursive: true'),
  'cross-zip still uses removed recursive fs.rmdir'
);
assert.ok(
  !crossZipSource.includes('fs.rmdirSync(outPath, { recursive: true'),
  'cross-zip still uses removed recursive fs.rmdirSync'
);

console.log(
  'Security pins, dependency override policy, compatibility patch, and physical install passed.'
);
