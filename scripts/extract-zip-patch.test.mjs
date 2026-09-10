import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { crc32 } from 'node:zlib';
import extract from 'extract-zip';
import { evaluateBuildAudit } from './build-audit-policy.mjs';
import {
  assertExtractZipPatch,
  patchExtractZipSource,
  verifyInstalledExtractZipPatch,
} from './extract-zip-patch.mjs';

// Stored ZIP entries preserve duplicate names and Unix symlink modes for attack fixtures.
function zip(entries) {
  const local = [];
  const central = [];
  let offset = 0;
  for (const { name, content, link = false } of entries) {
    const filename = Buffer.from(name);
    const data = Buffer.from(content);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt32LE(crc32(data), 14);
    header.writeUInt32LE(data.length, 18);
    header.writeUInt32LE(data.length, 22);
    header.writeUInt16LE(filename.length, 26);
    const directory = Buffer.alloc(46);
    directory.writeUInt32LE(0x02014b50, 0);
    directory.writeUInt16LE(0x0314, 4);
    directory.writeUInt16LE(20, 6);
    directory.writeUInt32LE(crc32(data), 16);
    directory.writeUInt32LE(data.length, 20);
    directory.writeUInt32LE(data.length, 24);
    directory.writeUInt16LE(filename.length, 28);
    directory.writeUInt32LE(((link ? 0o120777 : 0o100644) << 16) >>> 0, 38);
    directory.writeUInt32LE(offset, 42);
    local.push(header, filename, data);
    central.push(directory, filename);
    offset += header.length + filename.length + data.length;
  }
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, directory, end]);
}

async function fixture(t, entries) {
  const root = await mkdtemp(join(tmpdir(), 'adrouter-extract-regression-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const dir = join(root, 'target');
  const outside = join(root, 'outside.txt');
  const archive = join(root, 'fixture.zip');
  await mkdir(dir);
  await writeFile(outside, 'unchanged');
  await writeFile(archive, zip(entries(outside)));
  return { dir, outside, archive };
}

for (const absolute of [true, false]) {
  test(`rejects ${absolute ? 'absolute' : 'relative'} external symlink and duplicate-name write`, async (t) => {
    const f = await fixture(t, (outside) => [
      { name: 'evil', content: absolute ? outside : '../outside.txt', link: true },
      { name: 'evil', content: 'overwrite' },
    ]);
    await assert.rejects(extract(f.archive, { dir: f.dir }), /Out of bound symlink target/);
    assert.equal(await readFile(f.outside, 'utf8'), 'unchanged');
  });
}

test('extracts normal files and permits overwriting regular files', async (t) => {
  const f = await fixture(t, () => [{ name: 'nested/file', content: 'safe' }]);
  await extract(f.archive, { dir: f.dir });
  await extract(f.archive, { dir: f.dir });
  assert.equal(await readFile(join(f.dir, 'nested/file'), 'utf8'), 'safe');
});

// Native symlink creation is restricted on Windows; the ZIP rejection tests above run there.
for (const scenario of ['final', 'parent', 'target-chain', 'internal', 'duplicate-internal']) {
  test(`handles ${scenario} symlinks without an external write`, {
    skip: process.platform === 'win32',
  }, async (t) => {
    const entries = {
      final: [{ name: 'evil', content: 'overwrite' }],
      parent: [{ name: 'evil/new/outside.txt', content: 'overwrite' }],
      'target-chain': [{ name: 'new-link', content: 'evil/outside.txt', link: true }],
      internal: [
        { name: 'file', content: 'safe' },
        { name: 'link', content: 'file', link: true },
      ],
      'duplicate-internal': [
        { name: 'file', content: 'safe' },
        { name: 'link', content: 'file', link: true },
        { name: 'link', content: 'overwrite' },
      ],
    }[scenario];
    const f = await fixture(t, () => entries);
    if (scenario === 'final') await symlink(f.outside, join(f.dir, 'evil'));
    if (scenario === 'parent' || scenario === 'target-chain')
      await symlink(join(f.dir, '..'), join(f.dir, 'evil'));
    if (scenario === 'internal') {
      await extract(f.archive, { dir: f.dir });
      assert.equal(await readFile(join(f.dir, 'link'), 'utf8'), 'safe');
    } else {
      await assert.rejects(
        extract(f.archive, { dir: f.dir }),
        /Symlink destination rejected|Out of bound/
      );
    }
    assert.equal(await readFile(f.outside, 'utf8'), 'unchanged');
  });
}

test('audit accepts extract-zip advisories only with exact patched dev-only source', async () => {
  const source = verifyInstalledExtractZipPatch();
  const lock = JSON.parse(await readFile('package-lock.json', 'utf8'));
  const report = {
    auditReportVersion: 2,
    vulnerabilities: {
      'extract-zip': {
        severity: 'high',
        nodes: ['node_modules/extract-zip'],
        via: [{ url: 'https://github.com/advisories/GHSA-jmr9-qjv8-65gv', severity: 'high' }],
      },
    },
  };
  assert.deepEqual(evaluateBuildAudit(report, lock, { extractZipSource: source }).checked, [
    'extract-zip',
  ]);
  assert.throws(() => evaluateBuildAudit(report, lock), /patch missing or changed/);
  assert.throws(
    () => evaluateBuildAudit(report, lock, { extractZipSource: `${source}\n` }),
    /patch missing or changed/
  );
  assert.equal(patchExtractZipSource(source), source);
  assert.throws(() => patchExtractZipSource(`${source}\n`), /Unexpected extract-zip source/);
  lock.packages['node_modules/extract-zip'].dev = false;
  assert.throws(() => assertExtractZipPatch(source, lock), /dev-only/);
});
