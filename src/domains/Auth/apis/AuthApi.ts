import { apiPost } from '@/apis/request';

import type {
  ChangePasswordApiRequest,
  ChangePasswordApiResponse,
  LoginApiRequest,
  LoginApiResponse,
  LogoutApiResponse,
  NewPasswordApiRequest,
  NewPasswordApiResponse,
  RegisterApiRequest,
  RegisterApiResponse,
  ResetPasswordApiRequest,
  ResetPasswordApiResponse,
} from './AuthApi.type';

function login(req: LoginApiRequest): Promise<LoginApiResponse> {
  return apiPost('/auth/login', req, { skipUnauthorizedHandling: true });
}

function logout(): Promise<LogoutApiResponse> {
  return apiPost('/auth/logout');
}

function register(req: RegisterApiRequest): Promise<RegisterApiResponse> {
  return apiPost('/auth/register', req);
}

function forgotPasswordEmail(req: ResetPasswordApiRequest): Promise<ResetPasswordApiResponse> {
  return apiPost('/auth/sendResetMail', req);
}

function forgotPasswordReset(req: NewPasswordApiRequest): Promise<NewPasswordApiResponse> {
  return apiPost('/auth/resetPassword', req);
}

function changePassword(req: ChangePasswordApiRequest): Promise<ChangePasswordApiResponse> {
  return apiPost('/auth/changePassword', req);
}

export const AuthApi = {
  login,
  logout,
  register,
  forgotPasswordEmail,
  forgotPasswordReset,
  changePassword,
};
