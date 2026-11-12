import { faro, getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk';
import { version } from '../../package.json';

/**
 * Grafana Faro frontend observability. Off unless VITE_FARO_URL is set, so
 * unit and e2e tests never report. The collector URL is public by design:
 * Grafana only accepts data from the origins allowed in the Faro app settings.
 */
export function initTelemetry() {
  const url = import.meta.env.VITE_FARO_URL;
  if (!url) return;
  initializeFaro({
    url,
    app: { name: 'listapp', version, environment: import.meta.env.MODE },
    instrumentations: getWebInstrumentations(),
  });
}

// faro.api only exists after initializeFaro, so these are no-ops when telemetry is off.
// Faro requires string values for event attributes and error context.

export function trackEvent(name, attributes = {}) {
  faro.api?.pushEvent(name, attributes);
}

export function trackError(error, context = {}) {
  faro.api?.pushError(error instanceof Error ? error : new Error(String(error)), { context });
}
