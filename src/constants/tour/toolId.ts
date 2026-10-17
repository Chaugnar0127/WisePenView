/**
 * 新手指引的高亮目标。
 * 每个字段只对应一个 GuideAnchor。锚点包住目标，步骤只引用字段名。
 * 新增一步时在这里加字段，再用 GuideAnchor 包住那一块，查找逻辑不用改。
 */
export const GUIDE_TOOL_ID = {
  /** 侧栏 HeaderNav：新建对话 */
  sidebarNewChat: 'sidebar-new-chat',
  /** 侧栏 HeaderNav：新建笔记 */
  sidebarNewNote: 'sidebar-new-note',
  /** 侧栏 HeaderNav：我的云盘 */
  sidebarDrive: 'sidebar-drive',
  /** 侧栏 HeaderNav：我的小组 */
  sidebarGroups: 'sidebar-groups',
  /** 侧栏 HeaderNav：消息 */
  sidebarNotifications: 'sidebar-notifications',
  /** 侧栏最近内容的标签栏 */
  sidebarLibrary: 'sidebar-library',
  /** 侧栏收起按钮 */
  sidebarCollapse: 'sidebar-collapse',
  /** 侧栏账号按钮。收起和展开共用，同一时间只有一个挂载。 */
  sidebarAccount: 'sidebar-account',
  /** 已打开的账号菜单 */
  sidebarAccountOpen: 'sidebar-account-open',
  /** 对话输入框。对话页和笔记侧栏共用这一块。 */
  chatComposer: 'chat-composer',
  /** 附件按钮 */
  chatUpload: 'chat-upload',
  /** 已打开的附件菜单 */
  chatUploadOpen: 'chat-upload-open',
  /** Agent 按钮 */
  chatAgent: 'chat-agent',
  /** 已打开的 Agent 菜单 */
  chatAgentOpen: 'chat-agent-open',
  /** Skill 按钮 */
  chatSkill: 'chat-skill',
  /** 已打开的 Skill 菜单 */
  chatSkillOpen: 'chat-skill-open',
  /** 模型按钮 */
  chatModel: 'chat-model',
  /** 已打开的模型菜单 */
  chatModelOpen: 'chat-model-open',
  /** 语音按钮 */
  chatVoice: 'chat-voice',
  /** 发送按钮。发送和停止是同一颗按钮。 */
  chatSend: 'chat-send',
  /** 笔记标题 */
  noteTitle: 'note-title',
  /** 笔记作者与编辑时间 */
  noteInfo: 'note-info',
  /** 笔记正文 */
  noteBody: 'note-body',
  /** 目录开关。展开和收起共用，同一时间只有一个挂载。 */
  noteOutline: 'note-outline',
  /** 已展开的目录列表 */
  noteOutlineOpen: 'note-outline-open',
  /** 笔记更多按钮 */
  noteMore: 'note-more',
  /** 已打开的更多菜单 */
  noteMoreOpen: 'note-more-open',
  /** 笔记右侧对话开关 */
  noteChat: 'note-chat',
  /** 笔记对话里的新建对话 */
  noteNewChat: 'note-new-chat',
  /** 笔记对话里的历史 */
  noteHistory: 'note-history',
  /** 云盘视图标签 */
  driveViews: 'drive-views',
  /** 云盘路径 */
  drivePath: 'drive-path',
  /** 云盘新建按钮 */
  driveCreate: 'drive-create',
  /** 已打开的新建菜单 */
  driveCreateOpen: 'drive-create-open',
  /** 云盘文件表 */
  driveFiles: 'drive-files',
  /** 文件详情开关。展开和收起是同一颗按钮。 */
  driveDetails: 'drive-details',
  /** 已展开的文件详情栏 */
  driveDetailsOpen: 'drive-details-open',
} as const;

export type GuideToolId = (typeof GUIDE_TOOL_ID)[keyof typeof GUIDE_TOOL_ID];
