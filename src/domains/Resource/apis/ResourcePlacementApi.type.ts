export interface ResourcePlacementApiResponse {
  resourceCount: number;
}

export interface SetPersonalResourcesPathTagApiRequest {
  resourceIds: string[];
  targetPathTagId: string;
}

export interface MovePersonalResourcesToTrashApiRequest {
  resourceIds: string[];
}

export interface ReplacePersonalNormalTagsApiRequest {
  resourceIds: string[];
  normalTagIds: string[];
}

export interface MountResourcesToGroupApiRequest {
  resourceIds: string[];
  groupId: string;
  targetTagId: string;
}

export interface UnmountResourcesToGroupApiRequest {
  groupId: string;
  resourceSourceTagMap: Record<string, string>;
}

export interface MoveResourcesInGroupApiRequest extends UnmountResourcesToGroupApiRequest {
  targetTagId: string;
}
