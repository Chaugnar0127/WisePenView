import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';

const root = fileURLToPath(new URL('..', import.meta.url));

async function bundleModule(contents) {
  const result = await build({
    absWorkingDir: root,
    stdin: {
      contents,
      resolveDir: root,
    },
    bundle: true,
    format: 'esm',
    platform: 'node',
    write: false,
    alias: { '@': join(root, 'src') },
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].contents).toString('base64')}`
  );
}

const resourceModule = await bundleModule(`
  export {
    isResourceViewerCompatible,
    normalizeResourceKind,
    normalizeResourceViewer,
    resolveResourceViewer,
  } from '@/domains/Resource/model/resourceTarget';
  export {
    getSupportedResourcePermissionActions,
    RESOURCE_ACTION,
  } from '@/domains/Resource/enum';
  export { resolveEditorKind } from '@/components/editors/editorKind';
  export { buildHtmlDocument, HTML_PAGE_CSP } from '@/components/editors/html/htmlDocument';
  export { isHtmlPageReady } from '@/domains/HtmlPage/service/index.type';
`);

const driveModule = await bundleModule(`
  export {
    buildDriveNodeScope,
    mapTagToFolderNode,
    orderDriveFolderNodes,
  } from '@/domains/Drive/model/driveNode';
  export { createDriveServices } from '@/domains/Drive/service/DriveServices.impl';
`);

test('SINGLE_HTML_PAGE 与 html 扩展名统一归一化到 HTML 资源、查看器和编辑器', () => {
  for (const token of ['SINGLE_HTML_PAGE', 'single_html_page', 'html', ' Html ']) {
    assert.equal(resourceModule.normalizeResourceKind(token), 'html');
    assert.equal(resourceModule.normalizeResourceViewer(token), 'html');
    assert.equal(
      resourceModule.resolveResourceViewer({ resourceType: token }),
      'html',
      `${token} 应推导出 HTML 查看器`
    );
    assert.equal(resourceModule.isResourceViewerCompatible('html', 'html'), true);
    assert.equal(
      resourceModule.resolveEditorKind({
        resourceId: 'html-1',
        resourceType: 'html',
        viewer: 'html',
      }),
      'html'
    );
  }

  assert.equal(resourceModule.resolveResourceViewer({ viewer: 'SINGLE_HTML_PAGE' }), 'html');
  assert.equal(resourceModule.isResourceViewerCompatible('html', 'pdfPreview'), false);
});

test('.Note、.Page 映射为系统目录，并按 .Shared、.Note、.Page、普通目录排序', () => {
  const scope = driveModule.buildDriveNodeScope();
  const mapFolder = (tagId, tagName) =>
    driveModule.mapTagToFolderNode(
      { tagId, tagName, parentId: '', children: [] },
      scope.rootId,
      scope
    );
  const shared = mapFolder('shared', '.Shared');
  const note = mapFolder('note', '.Note');
  const page = mapFolder('page', '.Page');
  const normal = mapFolder('normal', '工作');

  assert.equal(note.systemType, 'note');
  assert.equal(page.systemType, 'page');
  assert.deepEqual(
    driveModule.orderDriveFolderNodes([normal, page, note, shared]).map((node) => node.tagId),
    ['shared', 'note', 'page', 'normal']
  );
});

test('个人云盘根目录展示 .Shared、.Note、.Page，同时隐藏 .Trash 与其他点号目录', async () => {
  const rootTag = {
    tagId: 'root',
    tagName: '/',
    parentId: '0',
    children: [{ tagId: 'work', tagName: '工作', parentId: '', children: [] }],
  };
  const roots = [
    rootTag,
    { tagId: 'trash', tagName: '.Trash', parentId: '0', children: [] },
    { tagId: 'note', tagName: '.Note', parentId: '0', children: [] },
    { tagId: 'shared', tagName: '.Shared', parentId: '0', children: [] },
    { tagId: 'page', tagName: '.Page', parentId: '0', children: [] },
    { tagId: 'hidden', tagName: '.Hidden', parentId: '0', children: [] },
  ];
  const tagById = new Map(roots.map((tag) => [tag.tagId, tag]));
  const tagService = {
    getRawTagTree: async () => roots,
    getRawTagById: (tagId) => tagById.get(tagId),
  };
  const driveService = driveModule.createDriveServices({
    tagService,
    resourceService: {},
  });
  const rootNode = await driveService.getRoot();
  const page = await driveService.loadNodeChildren({
    parent: rootNode,
    kinds: ['folder'],
  });

  assert.deepEqual(
    page.folderNodes.map((node) => ({ tagId: node.tagId, systemType: node.systemType })),
    [
      { tagId: 'shared', systemType: 'shared' },
      { tagId: 'note', systemType: 'note' },
      { tagId: 'page', systemType: 'page' },
      { tagId: 'work', systemType: undefined },
    ]
  );
});

test('HTML 权限只暴露 DISCOVER、VIEW、EDIT', () => {
  for (const token of ['SINGLE_HTML_PAGE', 'single_html_page', 'html']) {
    assert.deepEqual(
      resourceModule
        .getSupportedResourcePermissionActions(token)
        .map((action) => resourceModule.RESOURCE_ACTION.getKey(action)),
      ['DISCOVER', 'VIEW', 'EDIT']
    );
  }
});

test('仅当前版本大于 0 且对应版本 READY 时请求正文', () => {
  const info = (currentVersion, status, version = currentVersion) => ({
    resourceInfo: {},
    currentVersion,
    versionInfo: status == null ? undefined : { version, status, lastEditedAtText: '' },
  });

  assert.equal(resourceModule.isHtmlPageReady(undefined), false);
  assert.equal(resourceModule.isHtmlPageReady(info(0, null)), false);
  assert.equal(resourceModule.isHtmlPageReady(info(1, 'FAILED')), false);
  assert.equal(resourceModule.isHtmlPageReady(info(1, 'READY', 2)), false);
  assert.equal(resourceModule.isHtmlPageReady(info(1, 'READY')), true);
});

test('CSP 文档包装保留原内容，并覆盖 head、html 和 fragment 三种输入', () => {
  const cspMeta = `<meta http-equiv="Content-Security-Policy" content="${resourceModule.HTML_PAGE_CSP}">`;
  const withHead = resourceModule.buildHtmlDocument(
    '<!doctype html><html><head><title>已有页面</title></head><body><h1>正文</h1></body></html>'
  );
  const withHtml = resourceModule.buildHtmlDocument('<html><body><p>无 head</p></body></html>');
  const fragment = resourceModule.buildHtmlDocument('<section>片段内容</section>');

  for (const document of [withHead, withHtml, fragment]) {
    assert.equal(document.match(/http-equiv="Content-Security-Policy"/g)?.length, 1);
    assert(document.includes(cspMeta));
    assert(document.includes('<meta charset="utf-8">'));
  }
  assert(withHead.includes('<title>已有页面</title>'));
  assert(withHead.includes('<h1>正文</h1>'));
  assert(withHtml.includes('<head>'));
  assert(withHtml.includes('<p>无 head</p>'));
  assert(fragment.startsWith('<!doctype html><html><head>'));
  assert(fragment.includes('<body><section>片段内容</section></body>'));
});

test('HTML iframe 只授予脚本权限，不使用 allow-same-origin', async () => {
  const source = await readFile(join(root, 'src/components/editors/html/index.tsx'), 'utf8');
  assert.match(source, /sandbox="allow-scripts"/);
  assert.doesNotMatch(source, /allow-same-origin/);
});
