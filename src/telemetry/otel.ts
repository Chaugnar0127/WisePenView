import { trace } from '@opentelemetry/api';
import { logs } from '@opentelemetry/api-logs';
import { startBrowserSdk } from '@opentelemetry/browser-sdk';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';

import { publicAppConfig } from '@/config/runtimeConfig';

const SERVICE_NAME = 'wisepen-web';
const OTEL_SESSION_KEY = 'wisepen.otel.session';

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildTelemetryUrlPattern = (value: string): RegExp => {
  const path = value.startsWith('/') ? value : new URL(value).pathname;
  const normalizedPath = path === '/' ? '' : path.replace(/\/+$/, '');
  return new RegExp(`${escapeRegExp(normalizedPath)}/v1/(traces|logs)$`);
};

const readSessionId = (): string => {
  try {
    const current = sessionStorage.getItem(OTEL_SESSION_KEY);
    if (current) return current;
    const next = crypto.randomUUID();
    sessionStorage.setItem(OTEL_SESSION_KEY, next);
    return next;
  } catch {
    return crypto.randomUUID();
  }
};

const endpoint = publicAppConfig.observability.otelEndpoint;
export const isTelemetryEnabled = Boolean(endpoint) && publicAppConfig.mode !== 'mock';

const toAbsoluteEndpoint = (value: string): string => {
  const absolute = value.startsWith('/')
    ? new URL(value, window.location.origin).toString()
    : value;
  return absolute.replace(/\/+$/, '');
};

if (isTelemetryEnabled && endpoint) {
  const exportBaseUrl = toAbsoluteEndpoint(endpoint);
  const apiBaseUrls = [publicAppConfig.api.baseUrl, publicAppConfig.api.intranetBaseUrl].filter(
    (value): value is string => Boolean(value)
  );
  const telemetryUrlPattern = buildTelemetryUrlPattern(exportBaseUrl);

  try {
    const sdk = startBrowserSdk({
      serviceName: SERVICE_NAME,
      serviceVersion: __APP_VERSION__,
      resourceAttributes: {
        'deployment.environment.name': publicAppConfig.mode,
        'session.id': readSessionId(),
      },
      logs: {
        exportConfig: { url: `${exportBaseUrl}/v1/logs` },
        batchProcessorConfig: { maxQueueSize: 2048, scheduledDelayMillis: 1_000 },
      },
      traces: {
        contextManager: new ZoneContextManager(),
        exportConfig: { url: `${exportBaseUrl}/v1/traces` },
        batchProcessorConfig: { maxQueueSize: 2048, scheduledDelayMillis: 5_000 },
      },
      instrumentations: [
        new FetchInstrumentation({
          ignoreUrls: [telemetryUrlPattern],
          propagateTraceHeaderCorsUrls: apiBaseUrls,
        }),
        new XMLHttpRequestInstrumentation({
          ignoreUrls: [telemetryUrlPattern],
          propagateTraceHeaderCorsUrls: apiBaseUrls,
        }),
      ],
    });
    if (sdk.invalidConfig) {
      console.warn('[otel] 配置无效，前端遥测未启动。');
    }
  } catch {
    // 可观测性初始化失败不得阻断应用启动。
  }
}

export const tracer = trace.getTracer(SERVICE_NAME);
export const logger = logs.getLogger(SERVICE_NAME);
