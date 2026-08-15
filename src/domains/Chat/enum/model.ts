export const MODEL_PROVIDER_ID = {
  ZHIZENGZENG: 1,
  APIYI: 2,
  MODELSCOPE: 3,
} as const;

export type ModelProviderId = (typeof MODEL_PROVIDER_ID)[keyof typeof MODEL_PROVIDER_ID];
