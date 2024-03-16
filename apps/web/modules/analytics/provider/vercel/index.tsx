"use client";

// @ts-expect-error package is not installed per default
import { Analytics } from "@vercel/analytics/react";
// @ts-expect-error package is not installed per default
import { track } from "@vercel/analytics";

export function AnalyticsScript() {
  return <Analytics />;
}

export function useAnalytics() {
  const trackEvent = (event: string, data?: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    track(event, data);
  };

  return {
    trackEvent,
  };
}
