import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveTrashViewState } from '../../../../src/components/Drive/TableDrive/trashViewModel.ts';

test('回收站根目录同时标记为回收站视图和根目录视图', () => {
  assert.deepEqual(
    resolveTrashViewState({
      canOpenTrash: true,
      currentNodeId: 'trash',
      pathNodeIds: ['drive', 'trash'],
      trashFolderNodeId: 'trash',
    }),
    { isTrashView: true, isTrashRootView: true }
  );
});

test('回收站内文件夹仅标记为回收站视图', () => {
  assert.deepEqual(
    resolveTrashViewState({
      canOpenTrash: true,
      currentNodeId: 'folder-in-trash',
      pathNodeIds: ['drive', 'trash', 'folder-in-trash'],
      trashFolderNodeId: 'trash',
    }),
    { isTrashView: true, isTrashRootView: false }
  );
});

test('普通目录不标记为回收站视图', () => {
  assert.deepEqual(
    resolveTrashViewState({
      canOpenTrash: true,
      currentNodeId: 'documents',
      pathNodeIds: ['drive', 'documents'],
      trashFolderNodeId: 'trash',
    }),
    { isTrashView: false, isTrashRootView: false }
  );
});
