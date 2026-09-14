import type {
  IAuthService,
  LoginRequest,
  NewPasswordRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from '@/domains/Auth';
import { authSessionCoordinator } from '@/utils/auth/authSessionCoordinator';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const login = async (_params: LoginRequest): Promise<void> => {
  await delay(300);
  authSessionCoordinator.publish('login');
};

const register = async (_params: RegisterRequest): Promise<void> => {
  await delay(300);
};

const resetPassword = async (_params: ResetPasswordRequest): Promise<void> => {
  await delay(300);
};

const newPassword = async (_params: NewPasswordRequest): Promise<void> => {
  await delay(300);
};

const logout = async (): Promise<void> => {
  await delay(100);
  authSessionCoordinator.publish('logout');
};

export const AuthServicesMock: IAuthService = {
  login,
  register,
  resetPassword,
  newPassword,
  logout,
};
