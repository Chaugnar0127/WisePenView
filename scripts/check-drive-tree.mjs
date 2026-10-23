import assert from 'node:assert/strict';
import { test } from 'node:test';

import { build } from 'esbuild';

const bundled = await build({
  entryPoints: ['src/components/business/Drive/common/buildDriveTreeData.tsx'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
});
const { buildDriveTreeData } = await import(
  `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].contents).toString('base64')}`
);

test('选文件时目录不可选但可展开，显式禁用的目录仍不可操作', () => {
  const nodes = [
    { id: 'root', type: 'root' },
    { id: 'folder', type: 'folder' },
    { id: 'file', type: 'resource' },
    { id: 'link', type: 'link' },
    { id: 'filtered', type: 'resource' },
    { id: 'blocked', type: 'folder' },
    { id: 'restricted', type: 'folder' },
  ];
  const tree = buildDriveTreeData(
    nodes,
    {
      renderableTypes: new Set(['root', 'folder', 'resource', 'link']),
      selectableTypes: new Set(['resource', 'link']),
      disabledNodeIds: new Set(['blocked']),
      isNodeSelectable: (node) => node.id !== 'filtered',
      isNodeDisabled: (node) => node.id === 'restricted',
      getTreeKey: (node) => node.id,
      renderTitle: (node) => node.id,
    },
    new Map()
  );
  assert.deepEqual(
    tree.map(({ key, disabled, selectable }) => ({ key, disabled, selectable })),
    [
      { key: 'root', disabled: false, selectable: false },
      { key: 'folder', disabled: false, selectable: false },
      { key: 'file', disabled: false, selectable: true },
      { key: 'link', disabled: false, selectable: true },
      { key: 'filtered', disabled: true, selectable: false },
      { key: 'blocked', disabled: true, selectable: false },
      { key: 'restricted', disabled: true, selectable: false },
    ]
  );
});
