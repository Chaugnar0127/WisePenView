export const STORAGE_KEYS = {
  language: 'wisepen:language',
  anonymousAuthCheckNotified: 'wisepen:anonymous-auth-check-notified',
  authSessionEvent: 'wisepen:auth-session-event',
  authContinuationActive: 'wisepen:auth-continuation:active',
  readingMode: 'wisepen-reading-mode',
  colorScheme: 'heroui-color-scheme',
  themeRadius: 'heroui-theme-radius',
  themeFormRadius: 'heroui-theme-form-radius',
} as const;

export const STORAGE_PREFIXES = {
  authContinuation: 'wisepen:auth-continuation:',
  storeSession: 'wisepen:store:session:',
  storeTab: 'wisepen:store:tab:',
  noteYjsIdbRoom: 'wisepen-note:',
} as const;

export const INDEXED_DB_NAMES = {
  skillDraftCache: 'wisepen-skill-draft-cache',
} as const;
