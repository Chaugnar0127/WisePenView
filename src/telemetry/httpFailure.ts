import { type Attributes, context, SpanStatusCode, trace } from '@opentelemetry/api';
import { SeverityNumber } from '@opentelemetry/api-logs';
import type { AxiosError } from 'axios';

import { parseApiErrorBody } from '@/apis/apiError';

import { isTelemetryEnabled, logger, tracer } from './otel';

const MAX_MESSAGE_LENGTH = 512;

const readRequestTarget = (error: AxiosError): { path: string; host?: string; port?: number } => {
  try {
    const url = new URL(error.config?.url ?? '/', error.config?.baseURL ?? window.location.origin);
    return {
      path: url.pathname,
      host: url.hostname,
      port: url.port ? Number(url.port) : undefined,
    };
  } catch {
    return { path: '' };
  }
};

/** 只在 axios 最终失败时调用；禁止把每次 5xx 重试都记成一条错误。 */
export const reportHttpFailure = (error: AxiosError): void => {
  try {
    if (!isTelemetryEnabled) return;

    const status = error.response?.status;
    if (!status || status < 500) return;

    const body = parseApiErrorBody(error.response?.data);
    const target = readRequestTarget(error);
    const requestId = error.response?.headers['x-request-id'];
    const retryCount =
      (error.config as { __wisePenRetryCount?: number } | undefined)?.__wisePenRetryCount ?? 0;

    const attributes: Attributes = {
      'error.type': `HTTP_${status}`,
      'error.source': 'http',
      'http.request.method': error.config?.method?.toUpperCase() ?? 'GET',
      'http.request.resend_count': retryCount,
      'http.response.status_code': status,
      'page.path': window.location.pathname,
      'url.path': target.path,
    };
    if (target.host) attributes['server.address'] = target.host;
    if (target.port) attributes['server.port'] = target.port;
    if (typeof requestId === 'string') attributes['wisepen.request_id'] = requestId;
    if (body?.code !== undefined) attributes['api.business_code'] = body.code;

    const activeSpan = trace.getActiveSpan();
    const span = activeSpan ?? tracer.startSpan('frontend.http_failure');
    span.setAttributes(attributes);
    span.setStatus({ code: SpanStatusCode.ERROR, message: `HTTP ${status}` });
    span.addEvent('server_error', attributes);

    logger.emit({
      severityNumber: SeverityNumber.ERROR,
      severityText: 'ERROR',
      body: `API ${status}`,
      context: activeSpan ? context.active() : trace.setSpan(context.active(), span),
      attributes: {
        ...attributes,
        'api.server_message': (body?.message ?? '').slice(0, MAX_MESSAGE_LENGTH),
      },
    });

    if (!activeSpan) span.end();
  } catch {
    // 观测链路失败时保持静默，避免影响原始 HTTP 错误处理。
  }
};
