import type { AxiosRequestConfig } from 'axios';

import { apiGet, apiPost, apiPut } from '@/apis/request';

import type {
  AddFeedbackApiRequest,
  ChangeUserInfoApiRequest,
  ChangeUserProfileApiRequest,
  CheckEmailVerifyApiRequest,
  GetUserInfoApiResponse,
  InitiateEmailVerifyApiRequest,
  InitiateFudanUISVerifyApiRequest,
  ListAdminMessagesApiRequest,
  ListAdminMessagesApiResponse,
  ListTransactionsApiRequest,
  ListTransactionsApiResponse,
  ListUserSearchSuggestionsApiRequest,
  PublishMessageApiRequest,
  RedeemVoucherApiRequest,
  SearchUserApiRequest,
  TransferTokenBetweenGroupAndUserApiRequest,
  UserSearchUserApiResponse,
} from './UserApi.type';

/** User API: /user/* */

function getUserInfo(config?: AxiosRequestConfig): Promise<GetUserInfoApiResponse> {
  return apiGet('/user/getUserInfo', config);
}

function searchUser(req: SearchUserApiRequest): Promise<UserSearchUserApiResponse[]> {
  return apiGet('/user/searchUser', { params: req });
}

function listUserSearchSuggestions(
  req: ListUserSearchSuggestionsApiRequest
): Promise<UserSearchUserApiResponse[]> {
  return apiGet('/user/listUserSearchSuggestions', { params: req });
}

function initiateEmailVerify(req: InitiateEmailVerifyApiRequest): Promise<void> {
  return apiPost('/user/verify/initiateEmailVerify', null, { params: req });
}

function initiateFudanUISVerify(req: InitiateFudanUISVerifyApiRequest): Promise<void> {
  return apiPost('/user/verify/initiateFudanUISVerify', null, { params: req });
}

function checkFudanUISVerify(): Promise<unknown> {
  return apiGet('/user/verify/checkFudanUISVerify');
}

function checkEmailVerify(req: CheckEmailVerifyApiRequest): Promise<void> {
  return apiGet('/user/verify/checkEmailVerify', { params: req });
}

function changeUserInfo(req: ChangeUserInfoApiRequest): Promise<void> {
  return apiPut('/user/changeUserInfo', req);
}

function changeUserProfile(req: ChangeUserProfileApiRequest): Promise<void> {
  return apiPut('/user/changeUserProfile', req);
}

function listAdminMessages(
  req: ListAdminMessagesApiRequest
): Promise<ListAdminMessagesApiResponse> {
  return apiGet('/admin/message/listMessages', { params: req });
}

function publishMessage(req: PublishMessageApiRequest): Promise<void> {
  return apiPost('/admin/message/publishMessage', req);
}

function addFeedback(req: AddFeedbackApiRequest): Promise<void> {
  return apiPost('/system/feedback/addFeedback', req);
}

export const UserApi = {
  getUserInfo,
  searchUser,
  listUserSearchSuggestions,
  initiateEmailVerify,
  initiateFudanUISVerify,
  checkFudanUISVerify,
  checkEmailVerify,
  changeUserInfo,
  changeUserProfile,
  listAdminMessages,
  publishMessage,
  addFeedback,
};

/** User Wallet API: /user/wallet/* */

const serializeWalletTransactionsQuery = (params: ListTransactionsApiRequest): string => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && String(item) !== '') {
          searchParams.append(key, String(item));
        }
      });
      return;
    }
    searchParams.append(key, String(value));
  });
  return searchParams.toString();
};

function getUserWalletInfo(): Promise<Record<string, unknown>> {
  return apiGet('/user/wallet/getUserWalletInfo');
}

function redeemVoucher(req: RedeemVoucherApiRequest): Promise<void> {
  return apiPost('/user/wallet/redeemVoucher', req);
}

function listTransactions(req: ListTransactionsApiRequest): Promise<ListTransactionsApiResponse> {
  return apiGet('/user/wallet/listTransactions', {
    params: req,
    paramsSerializer: serializeWalletTransactionsQuery,
  });
}

function transferTokenBetweenGroupAndUser(
  req: TransferTokenBetweenGroupAndUserApiRequest
): Promise<void> {
  return apiPost('/user/wallet/transferTokenBetweenGroupAndUser', req);
}

export const UserWalletApi = {
  getUserWalletInfo,
  redeemVoucher,
  listTransactions,
  transferTokenBetweenGroupAndUser,
};
