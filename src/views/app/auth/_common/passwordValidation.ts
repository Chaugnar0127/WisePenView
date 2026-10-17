import { runFieldValidation } from '@/utils/validation/formValidation';

type PasswordValidationMessages = {
  required: string;
  minLength: string;
  containsLetter: string;
  containsNumber: string;
};

type ConfirmPasswordValidationMessages = {
  required: string;
  mismatch: string;
};

type ValidationOptions = {
  withRequired?: boolean;
};

/** 认证页面共用密码输入规则，空值在提交时显示必填提示。 */
export function validatePasswordField(
  password: string,
  messages: PasswordValidationMessages,
  options: ValidationOptions = {}
): string | undefined {
  if (!options.withRequired && password.length === 0) return undefined;

  return runFieldValidation([
    { test: () => password.length > 0, message: messages.required },
    { test: () => password.length >= 9, message: messages.minLength },
    { test: () => /[a-zA-Z]/.test(password), message: messages.containsLetter },
    { test: () => /[0-9]/.test(password), message: messages.containsNumber },
  ]);
}

/** 认证页面共用第二次密码输入规则，密码变更时立即重新计算匹配状态。 */
export function validateConfirmPasswordField(
  confirmPassword: string,
  password: string,
  messages: ConfirmPasswordValidationMessages,
  options: ValidationOptions = {}
): string | undefined {
  if (!options.withRequired && confirmPassword.length === 0) return undefined;

  return runFieldValidation([
    { test: () => confirmPassword.length > 0, message: messages.required },
    { test: () => confirmPassword === password, message: messages.mismatch },
  ]);
}
