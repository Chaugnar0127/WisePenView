export interface LoginApiRequest {
  account: string;
  password: string;
  code?: string;
  uuid?: string;
}

export interface RegisterApiRequest {
  username: string;
  password: string;
}

export interface ResetPasswordApiRequest {
  userName: string;
  code?: string;
  uuid?: string;
}

export interface NewPasswordApiRequest {
  token: string;
  newPassword: string;
}

export type LoginApiResponse = string | undefined;
export type LogoutApiResponse = void;
export type RegisterApiResponse = string | undefined;
export type ResetPasswordApiResponse = void;
export type NewPasswordApiResponse = void;
