import { isRouteErrorResponse, useRouteError } from 'react-router-dom';

import { ErrorPage, ErrorPageShell } from '@/components/business/ErrorPage';

import ResourceNotFound from '../ResourceNotFound';

function AppError() {
  const error = useRouteError();

  // 路由未命中抛出的 404 走专用 ResourceNotFound 页，避免通用错误壳与业务 404 语义混淆
  if (isRouteErrorResponse(error) && error.status === 404) {
    return <ResourceNotFound />;
  }

  return (
    <ErrorPageShell size="md">
      <ErrorPage error={error} showDetail actionSize="lg" />
    </ErrorPageShell>
  );
}

export default AppError;
