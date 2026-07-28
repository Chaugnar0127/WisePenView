import type { AgentDetail, AgentSpec } from '@/domains/Agent';
import type { ChatAgentOption } from '@/domains/Chat';
import type { TFunction } from 'i18next';

export interface AgentDraft {
  name: string;
  description: string;
  spec: AgentSpec;
}

export interface AgentVersionItem {
  key: string;
  version: number;
  current: boolean;
}

export function snapshotAgentDraft(draft: AgentDraft): string {
  return JSON.stringify(draft);
}

export function buildAgentDraft(agent: AgentDetail): AgentDraft {
  return {
    name: agent.name,
    description: agent.description,
    spec: structuredClone(agent.spec),
  };
}

export function getAgentVersionItems(
  agent: AgentDetail | undefined,
  viewingVersion: number | null
): AgentVersionItem[] {
  if (!agent) return [];

  const items: AgentVersionItem[] = [
    {
      key: `v${agent.draftVersion}`,
      version: agent.draftVersion,
      current: viewingVersion === null,
    },
  ];
  for (let version = agent.publishedVersion; version >= 1; version -= 1) {
    if (version === agent.draftVersion) continue;
    items.push({ key: `v${version}`, version, current: viewingVersion === version });
  }
  return items;
}

export function buildCurrentDraftAgent(
  agent: AgentDetail | undefined,
  draft: AgentDraft | null,
  t: TFunction<'agent'>
): ChatAgentOption | null {
  if (!agent || !draft) return null;
  const skillPolicy = draft.spec.toolAndSkillPolicy;
  const defaultSkillIds = Array.from(
    new Set([...(skillPolicy.onDemandSkillIds ?? []), ...(skillPolicy.forceEnabledSkillIds ?? [])])
  );
  return {
    agentId: `current-agent-draft-${agent.resourceId}`,
    agentType: 'PERSONAL',
    source: 'CURRENT_DRAFT',
    resourceId: agent.resourceId,
    agentVersion: agent.draftVersion,
    label: agent.title || draft.name || t('page.currentAgent'),
    defaultSkillIds,
  };
}
