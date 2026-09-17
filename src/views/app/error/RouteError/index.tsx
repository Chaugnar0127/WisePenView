import { useRouteError } from 'react-router-dom';

import { ErrorPage, ErrorPageShell } from '@/components/business/ErrorPage';

function RouteError() {
  const error = useRouteError();

  return (
    <ErrorPageShell size="md">
      <ErrorPage error={error} showPathname />
    </ErrorPageShell>
  );
}

export default RouteError;
