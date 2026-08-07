import type { ResourceSkillSummary } from '@/domains/Resource';
import type { ChatAgentOption } from '../entity/agent';

export interface SkillScopeTreeGroup {
  key: string;
  label: string;
  skills: ResourceSkillSummary[];
}

const isSkillInAgentScope = (
  skill: ResourceSkillSummary,
  agent: ChatAgentOption | null | undefined
): boolean => {
  // Agent 有明确 Skill 列表时，按 skillId 精确匹配
  if (agent?.defaultSkillIds && agent.defaultSkillIds.length > 0) {
    return agent.defaultSkillIds.includes(skill.skillId);
  }
  if (!agent || agent.agentType === 'PERSONAL') {
    return skill.scopeType !== 'GROUP';
  }
  return skill.scopeType === 'GROUP' && skill.groupId === agent.groupId;
};

export const getPrimarySkillsForAgent = (
  skills: ResourceSkillSummary[],
  agent: ChatAgentOption | null | undefined
): ResourceSkillSummary[] => skills.filter((skill) => isSkillInAgentScope(skill, agent));
