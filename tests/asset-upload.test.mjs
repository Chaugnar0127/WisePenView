import assert from 'node:assert/strict';
import { Blob, File } from 'node:buffer';
import { test } from 'node:test';

import { loadSourceModule } from './helpers/load-source.mjs';

const state = {
  canceled: [],
  deleted: [],
  failedBody: undefined,
  failCancel: false,
  flash: false,
  omitTicketField: undefined,
  putError: undefined,
  bodies: [],
};

function reset() {
  state.canceled.length = 0;
  state.deleted.length = 0;
  state.failedBody = undefined;
  state.failCancel = false;
  state.flash = false;
  state.omitTicketField = undefined;
  state.putError = undefined;
  state.bodies.length = 0;
}

const api = {
  async initUploadSkillAssets({ assets }) {
    return {
      assetUploadTickets: assets.map((asset, index) => {
        const ticket = {
          assetId: `existing-${index}`,
          objectKey: `candidate-${index}`,
          name: asset.name,
          path: asset.path,
          ...(!state.flash && { putUrl: `candidate-${index}`, callbackHeader: 'test' }),
          flashUploaded: state.flash,
        };
        delete ticket[state.omitTicketField];
        return ticket;
      }),
    };
  },
  async cancelUploadSkillAssets(request) {
    state.canceled.push(request);
    if (state.failCancel) throw new Error('cancel failed');
  },
  async deleteSkillAssets(request) {
    state.deleted.push(request);
  },
};

globalThis.__assetUploadTest = {
  api,
  agentApi: {
    initUploadAgentAssets: api.initUploadSkillAssets,
    cancelUploadAgentAssets: api.cancelUploadSkillAssets,
    deleteAgentAssets: api.deleteSkillAssets,
  },
  async put({ body }) {
    const content = await body.text();
    if (content === state.failedBody) throw state.putError;
    state.bodies.push(content);
  },
};

const { createSkillServices, createAgentServices } = await loadSourceModule(
  `
  export { createSkillServices } from './src/domains/Skill/service/SkillServices.impl.ts';
  export { createAgentServices } from './src/domains/Agent/service/AgentServices.impl.ts';
`,
  {
    '@domain-apis': `export const SkillApi = globalThis.__assetUploadTest.api;
    export const AgentApi = globalThis.__assetUploadTest.agentApi;
    export const putOssPresignedUrl = globalThis.__assetUploadTest.put;`,
    '@/domains/_shared/ossStsClient': 'export const createOssStsClientManager = () => ({});',
    '@/domains/Resource':
      'export const RESOURCE_SORT_BY = {}; export const RESOURCE_SORT_DIR = {};',
    '@/utils/error': `export const FRONTEND_CLIENT_ERROR = {};
      export const createClientError = () => new Error('client error');`,
    '@/utils/file/computeFileMd5': 'export const computeFileMd5 = async () => "md5";',
    '@/utils/type/typeGuards':
      'export const isRecord = (value) => typeof value === "object" && value !== null;',
    '../mapper/SkillServices.map':
      'export const SkillServicesMap = {resolveAssetResourceType: () => "MD"};',
    '../mapper/AgentServices.map':
      'export const AgentServicesMap = {resolveAssetResourceType: () => "MD"};',
  }
);

const skill = createSkillServices({ resourceService: {} });
const agent = createAgentServices();

test('Skill PUT failure cancels only the candidate and keeps the original error', async () => {
  for (const failCancel of [false, true]) {
    reset();
    const putError = new Error('PUT failed');
    state.failedBody = '# new body';
    state.failCancel = failCancel;
    state.putError = putError;

    const [result] = await skill.uploadAssets('skill-1', 2, [
      { clientId: 'editor', name: 'SKILL.md', path: '/', content: state.failedBody },
    ]);

    assert.equal(result.clientId, 'editor');
    assert.equal(result.error, putError);
    assert.deepEqual(state.canceled, [
      {
        resourceId: 'skill-1',
        draftVersion: 2,
        uploads: [{ assetId: 'existing-0', objectKey: 'candidate-0' }],
      },
    ]);
    assert.deepEqual(state.deleted, []);
  }
});

test('Skill successful retry and flash upload do not cancel or delete assets', async () => {
  reset();
  const [retry] = await skill.uploadAssets('skill-1', 2, [
    { clientId: 'editor', name: 'SKILL.md', path: '/', content: '# new body' },
  ]);
  assert.equal(retry.error, undefined);
  assert.equal(retry.objectKey, 'candidate-0');
  assert.deepEqual(state.bodies, ['# new body']);
  assert.deepEqual(state.canceled, []);
  assert.deepEqual(state.deleted, []);

  reset();
  state.flash = true;
  const [flash] = await skill.uploadAssets('skill-1', 2, [
    { clientId: 'editor', name: 'SKILL.md', path: '/', content: '# existing body' },
  ]);
  assert.equal(flash.error, undefined);
  assert.equal(flash.objectKey, 'candidate-0');
  assert.deepEqual(state.bodies, []);
  assert.deepEqual(state.canceled, []);
  assert.deepEqual(state.deleted, []);
});

test('partial Skill move failure does not delete source files or successful targets', async () => {
  reset();
  const putError = new Error('second PUT failed');
  state.failedBody = 'failed content';
  state.putError = putError;

  await assert.rejects(
    skill.moveAssets('skill-1', 2, [
      { assetId: 'source-1', name: 'one.md', path: '/target', content: 'successful content' },
      { assetId: 'source-2', name: 'two.md', path: '/target', content: state.failedBody },
    ]),
    (error) => error === putError
  );

  assert.deepEqual(state.canceled, [
    {
      resourceId: 'skill-1',
      draftVersion: 2,
      uploads: [{ assetId: 'existing-1', objectKey: 'candidate-1' }],
    },
  ]);
  assert.deepEqual(state.deleted, []);
});

test('Agent PUT failure cancels the candidate without deleting the existing asset', async () => {
  for (const failCancel of [false, true]) {
    reset();
    const putError = new Error('PUT failed');
    state.failedBody = 'new agent body';
    state.failCancel = failCancel;
    state.putError = putError;

    await assert.rejects(
      agent.uploadAsset('agent-1', 3, {
        file: new File([state.failedBody], 'AGENTS.md'),
      }),
      (error) => error === putError
    );

    assert.deepEqual(state.canceled, [
      {
        resourceId: 'agent-1',
        draftVersion: 3,
        uploads: [{ assetId: 'existing-0', objectKey: 'candidate-0' }],
      },
    ]);
    assert.deepEqual(state.deleted, []);
  }
});

test('Agent successful and flash uploads do not cancel or delete assets', async () => {
  for (const flash of [false, true]) {
    reset();
    state.flash = flash;
    await agent.uploadAsset('agent-1', 3, { file: new File(['new body'], 'AGENTS.md') });
    assert.deepEqual(state.bodies, flash ? [] : ['new body']);
    assert.deepEqual(state.canceled, []);
    assert.deepEqual(state.deleted, []);
  }
});

test('incomplete tickets never send a cancellation without both upload identifiers', async () => {
  for (const omitTicketField of ['assetId', 'objectKey']) {
    reset();
    state.omitTicketField = omitTicketField;
    state.failedBody = 'new body';
    state.putError = new Error('PUT failed');
    const [result] = await skill.uploadAssets('skill-1', 2, [
      { name: 'SKILL.md', path: '/', content: state.failedBody },
    ]);
    assert.ok(result.error);
    await assert.rejects(
      agent.uploadAsset('agent-1', 3, { file: new File([state.failedBody], 'AGENTS.md') })
    );
    assert.deepEqual(state.canceled, []);
    assert.deepEqual(state.deleted, []);
  }
});

const mock = await loadSourceModule(
  `
  export { assertMockVersionUploadsComplete, cancelMockVersionUploads, deleteMockVersionAssets, initMockVersionAssets } from './src/domains/_shared/mock/versionAssets.mock.ts';
  export { mockObjects, mockUploadCallbacks, putOssPresignedUrl } from './src/domains/_shared/mock/ossClient.mock.ts';
  export { SkillApi } from './src/domains/Skill/mock/SkillApi.mock.ts';
  export { AgentApi } from './src/domains/Agent/mock/AgentApi.mock.ts';
`,
  {
    '@/utils/error': `export class WisePenError extends Error {
        constructor(options) { super(options.serverMsg); }
      }
      export const FRONTEND_CLIENT_ERROR = {};
      export const createClientError = () => new Error('client error');`,
  }
);

function existingBundle() {
  return {
    status: 'DRAFT',
    assets: [
      {
        id: 'existing',
        path: '/',
        name: 'SKILL.md',
        objectKey: 'old',
        assetResourceType: 'MD',
        size: '8',
        uploadStatus: 'AVAILABLE',
      },
    ],
  };
}

const requests = [{ path: '/', name: 'SKILL.md', assetResourceType: 'TEXT', expectedSize: 1 }];
const uploadRef = (ticket) => ({ assetId: ticket.assetId, objectKey: ticket.objectKey });

test('mock overwrite preserves the old body on cancel and commits only a successful retry', async () => {
  const target = existingBundle();
  mock.mockObjects.set('old', new Blob(['old body']));

  const [failed] = mock.initMockVersionAssets(target, requests, 'skill');
  assert.equal(failed.assetId, 'existing');
  assert.equal(target.assets[0].objectKey, 'old');
  assert.equal(target.assets[0].assetResourceType, 'MD');
  assert.equal(target.assets[0].size, '8');
  assert.equal(target.assets[0].uploadStatus, 'UPLOADING');
  assert.equal(target.assets[0].pendingUpload.objectKey, failed.objectKey);
  assert.equal(target.assets[0].pendingUpload.assetResourceType, 'TEXT');
  assert.equal(target.assets[0].pendingUpload.expectedSize, '1');
  assert.equal(typeof target.assets[0].pendingUpload.createTime, 'number');
  assert.throws(() => mock.assertMockVersionUploadsComplete(target));
  mock.cancelMockVersionUploads(target, [uploadRef(failed)]);
  mock.cancelMockVersionUploads(target, [uploadRef(failed)]);
  assert.deepEqual(target, existingBundle());
  assert.equal(await mock.mockObjects.get('old').text(), 'old body');
  mock.assertMockVersionUploadsComplete(target);

  const [retry] = mock.initMockVersionAssets(target, requests, 'skill');
  await mock.putOssPresignedUrl({ putUrl: retry.putUrl, body: new Blob(['new body']) });
  mock.cancelMockVersionUploads(target, [uploadRef(retry)]);
  assert.equal(target.assets.length, 1);
  assert.equal(target.assets[0].id, 'existing');
  assert.equal(target.assets[0].objectKey, retry.objectKey);
  assert.equal(target.assets[0].assetResourceType, 'TEXT');
  assert.equal(target.assets[0].size, '8');
  assert.equal(target.assets[0].uploadStatus, 'AVAILABLE');
  assert.equal(target.assets[0].pendingUpload, undefined);
  assert.equal(await mock.mockObjects.get(target.assets[0].objectKey).text(), 'new body');
  mock.assertMockVersionUploadsComplete(target);
});

test('mock cancellation requires matching asset ID, candidate key and version bundle', () => {
  const target = existingBundle();
  const [ticket] = mock.initMockVersionAssets(target, requests, 'skill');
  const before = globalThis.structuredClone(target);
  mock.cancelMockVersionUploads(target, [
    { assetId: 'another-asset', objectKey: ticket.objectKey },
  ]);
  mock.cancelMockVersionUploads(target, [{ assetId: ticket.assetId, objectKey: 'another-key' }]);
  mock.cancelMockVersionUploads(existingBundle(), [uploadRef(ticket)]);
  assert.deepEqual(target, before);
  assert.throws(() => mock.assertMockVersionUploadsComplete(target));
  mock.cancelMockVersionUploads(target, [uploadRef(ticket)]);
  mock.assertMockVersionUploadsComplete(target);
});

test('a new mock upload is a visible placeholder and cancel prevents a late callback revival', async () => {
  const target = { status: 'DRAFT', assets: [] };
  const [ticket] = mock.initMockVersionAssets(target, requests, 'skill');
  assert.equal(target.assets.length, 1);
  assert.equal(target.assets[0].id, ticket.assetId);
  assert.equal(target.assets[0].objectKey, undefined);
  assert.equal(target.assets[0].uploadStatus, 'UPLOADING');
  assert.equal(target.assets[0].pendingUpload.objectKey, ticket.objectKey);
  const callback = mock.mockUploadCallbacks.get(ticket.objectKey);
  mock.cancelMockVersionUploads(target, [uploadRef(ticket)]);
  assert.deepEqual(target.assets, []);
  assert.equal(mock.mockUploadCallbacks.has(ticket.objectKey), false);
  await mock.putOssPresignedUrl({ putUrl: ticket.putUrl, body: new Blob(['late body']) });
  callback();
  assert.deepEqual(target.assets, []);
  mock.assertMockVersionUploadsComplete(target);
});

test('a stale mock cancellation or callback cannot replace a newer retry', async () => {
  const target = existingBundle();
  const [first] = mock.initMockVersionAssets(target, requests, 'skill');
  const firstCallback = mock.mockUploadCallbacks.get(first.objectKey);
  const [retry] = mock.initMockVersionAssets(target, requests, 'skill');
  assert.equal(retry.assetId, first.assetId);
  assert.notEqual(retry.objectKey, first.objectKey);
  mock.cancelMockVersionUploads(target, [uploadRef(first)]);
  await mock.putOssPresignedUrl({ putUrl: first.putUrl, body: new Blob(['stale body']) });
  firstCallback();
  assert.equal(target.assets[0].objectKey, 'old');
  assert.equal(target.assets[0].pendingUpload.objectKey, retry.objectKey);
  assert.throws(() => mock.assertMockVersionUploadsComplete(target));
  await mock.putOssPresignedUrl({ putUrl: retry.putUrl, body: new Blob(['retry body']) });
  firstCallback();
  mock.cancelMockVersionUploads(target, [uploadRef(first), uploadRef(retry)]);
  assert.equal(target.assets[0].objectKey, retry.objectKey);
  assert.equal(await mock.mockObjects.get(retry.objectKey).text(), 'retry body');
  mock.assertMockVersionUploadsComplete(target);
});

test('mock completion and cancellation affect only the matching file in a batch', async () => {
  const target = existingBundle();
  const [first, second] = mock.initMockVersionAssets(
    target,
    [...requests, { ...requests[0], name: 'second.txt' }],
    'skill'
  );
  await mock.putOssPresignedUrl({ putUrl: first.putUrl, body: new Blob(['first body']) });
  assert.throws(() => mock.assertMockVersionUploadsComplete(target));
  mock.cancelMockVersionUploads(target, [uploadRef(second)]);
  assert.equal(target.assets.length, 1);
  assert.equal(target.assets[0].objectKey, first.objectKey);
  mock.assertMockVersionUploadsComplete(target);
});

test('deleting a mock asset also removes its pending upload without late revival', async () => {
  const target = existingBundle();
  const [ticket] = mock.initMockVersionAssets(target, requests, 'skill');
  const callback = mock.mockUploadCallbacks.get(ticket.objectKey);
  mock.deleteMockVersionAssets(target, [ticket.assetId]);
  assert.deepEqual(target.assets, []);
  assert.equal(mock.mockUploadCallbacks.has(ticket.objectKey), false);
  await mock.putOssPresignedUrl({ putUrl: ticket.putUrl, body: new Blob(['late body']) });
  callback();
  assert.deepEqual(target.assets, []);
  mock.assertMockVersionUploadsComplete(target);
});

for (const domain of ['Skill', 'Agent']) {
  test(`${domain} mock API accepts the landed cancellation payload`, async () => {
    const api = mock[`${domain}Api`];
    const resourceId = await api[`create${domain}`]({ title: 'Upload contract test' });
    const [ticket] = (
      await api[`initUpload${domain}Assets`]({
        resourceId,
        draftVersion: 1,
        assets: [{ ...requests[0], name: 'new.txt' }],
      })
    ).assetUploadTickets;
    await api[`cancelUpload${domain}Assets`]({
      resourceId,
      draftVersion: 1,
      uploads: [uploadRef(ticket)],
    });
    const bundle =
      domain === 'Skill'
        ? await api.getSkillVersionBundleInfo({ resourceId, version: 1 })
        : await api.getAgentVersionBundleInfo(resourceId, 1);
    assert.equal(
      bundle.assets.some((asset) => asset.id === ticket.assetId),
      false
    );
  });
}
