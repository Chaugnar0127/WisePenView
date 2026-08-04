import type { UpdateUserInfoRequest, UserAccountProfile } from '@/domains/User';
import type { ProfileFieldConfig, ProfileFieldKey } from '@/views/app/profile/profile.config';

export type ProfileFormValues = UpdateUserInfoRequest;

export interface AccountFormProps {
  show: boolean;
  user: UserAccountProfile | null;
  fieldConfig: ProfileFieldConfig;
  readonlyFieldSet: ReadonlySet<ProfileFieldKey>;
  onUserInfoReload: () => Promise<unknown>;
}
