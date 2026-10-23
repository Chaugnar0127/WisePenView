import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

for (const [script, valid, invalid] of [
  ['check-radius-tokens.mjs', 'border-radius: var(--app-radius-button);', 'border-radius: 8px;'],
  ['check-z-index-tokens.mjs', 'z-index: var(--app-z-index-popover);', 'z-index: 400;'],
]) {
  test(`${script} 接受合法 SCSS，并拒绝违规 SCSS`, async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'wisepen-style-guard-'));

    try {
      const scriptPath = join(workspace, 'scripts', script);
      const stylePath = join(workspace, 'src/components/Fixture/style.module.scss');
      await mkdir(dirname(scriptPath), { recursive: true });
      await mkdir(dirname(stylePath), { recursive: true });
      await writeFile(scriptPath, await readFile(join(root, 'scripts', script)));

      for (const [declaration, status] of [
        [valid, 0],
        [invalid, 1],
      ]) {
        await writeFile(stylePath, `.control { ${declaration} }`);
        const result = spawnSync(process.execPath, [scriptPath], {
          cwd: workspace,
          encoding: 'utf8',
        });

        assert.equal(result.status, status, result.stdout + result.stderr);
        if (status === 1) assert.match(result.stderr, /Fixture\/style\.module\.scss:1/);
      }
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  });
}
