import { context, SpanStatusCode, trace } from '@opentelemetry/api';
import { SeverityNumber } from '@opentelemetry/api-logs';

import { configureErrorReporter, type ErrorReport } from '@/utils/error';

import { isTelemetryEnabled, logger, tracer } from './otel';

const MAX_STACK_LENGTH = 32_000;

const buildFingerprint = (report: ErrorReport): string => {
  const topFrame = report.error.stack?.split('\n')[1]?.trim() ?? '';
  return `${report.error.name}:${report.error.message}:${topFrame}`.slice(0, 512);
};

/** 将现有 reportError 的上报出口接到 OTel；未启用时保持原有静默行为。 */
export const installOtelErrorReporter = (): (() => void) => {
  if (!isTelemetryEnabled) return () => undefined;

  return configureErrorReporter((report) => {
    const attributes = {
      'error.id': report.id,
      'error.fingerprint': buildFingerprint(report),
      'error.origin': report.origin,
      'page.path': report.pathname ?? window.location.pathname,
    };
    const span = tracer.startSpan('frontend.error', { attributes });

    if (report.error.code !== undefined) span.setAttribute('error.code', report.error.code);
    if (report.error.source) span.setAttribute('error.source', report.error.source);
    if (report.componentStack) {
      span.setAttribute('react.component_stack', report.componentStack.slice(0, MAX_STACK_LENGTH));
    }

    span.recordException({
      name: report.error.name,
      message: report.error.message,
      stack: report.error.stack?.slice(0, MAX_STACK_LENGTH),
    });
    span.setStatus({ code: SpanStatusCode.ERROR, message: report.error.message });

    logger.emit({
      severityNumber: SeverityNumber.ERROR,
      severityText: 'ERROR',
      body: report.error.message,
      context: trace.setSpan(context.active(), span),
      attributes: {
        ...attributes,
        'error.type': report.error.name,
        'error.message': report.error.message.slice(0, 512),
        'error.stack': report.error.stack?.slice(0, MAX_STACK_LENGTH) ?? '',
        'react.component_stack': report.componentStack?.slice(0, MAX_STACK_LENGTH) ?? '',
      },
    });

    span.end();
  });
};
