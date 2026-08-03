/**
 * Mock 服务注册表：仅绑定 *Services.mock.ts
 */
import { AdminServicesMock } from '@/domains/Admin/mock/AdminServices.mock';
import { AgentServicesMock } from '@/domains/Agent/mock/AgentServices.mock';
import { AuthServicesMock } from '@/domains/Auth/mock/AuthServices.mock';
import { createChatServicesMock } from '@/domains/Chat/mock/ChatServices.mock';
import { createCourseServicesMock } from '@/domains/Course/mock/CourseServices.mock';
import { DocumentServicesMock } from '@/domains/Document/mock/DocumentServices.mock';
import { DriveServicesMock } from '@/domains/Drive/mock/DriveServices.mock';
import { GroupServicesMock } from '@/domains/Group/mock/GroupServices.mock';
import { ImageServicesMock } from '@/domains/Image/mock/ImageServices.mock';
import { InlineCommentServicesMock } from '@/domains/InlineComment/mock/InlineCommentServices.mock';
import { InteractServicesMock } from '@/domains/Interact/mock/InteractServices.mock';
import { MessageServicesMock } from '@/domains/Message/mock/MessageServices.mock';
import { NoteServicesMock } from '@/domains/Note/mock/NoteServices.mock';
import { QuotaServicesMock } from '@/domains/Quota/mock/QuotaServices.mock';
import { ResourceServicesMock } from '@/domains/Resource/mock/ResourceServices.mock';
import { SkillServicesMock } from '@/domains/Skill/mock/SkillServices.mock';
import { SpeechServicesMock } from '@/domains/Speech/mock/SpeechServices.mock';
import { TagServicesMock } from '@/domains/Tag/mock/TagServices.mock';
import { UserServicesMock } from '@/domains/User/mock/UserServices.mock';
import { WalletServicesMock } from '@/domains/Wallet/mock/WalletServices.mock';

import type { ServicesContextValue } from './registry.types';

const chatService = createChatServicesMock();
const courseService = createCourseServicesMock();

const mockServicesValue: ServicesContextValue = {
  adminService: AdminServicesMock,
  agentService: AgentServicesMock,
  authService: AuthServicesMock,
  chatService: chatService,
  courseService: courseService,
  documentService: DocumentServicesMock,
  driveService: DriveServicesMock,
  groupService: GroupServicesMock,
  imageService: ImageServicesMock,
  inlineCommentService: InlineCommentServicesMock,
  interactService: InteractServicesMock,
  messageService: MessageServicesMock,
  noteService: NoteServicesMock,
  quotaService: QuotaServicesMock,
  resourceService: ResourceServicesMock,
  skillService: SkillServicesMock,
  speechService: SpeechServicesMock,
  tagService: TagServicesMock,
  userService: UserServicesMock,
  walletService: WalletServicesMock,
};

export function getContextValue(): ServicesContextValue {
  return mockServicesValue;
}
