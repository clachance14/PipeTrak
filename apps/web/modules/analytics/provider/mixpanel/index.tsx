"use client";

// @ts-expect-error package is not installed per default
import mixpanel from "mixpanel-browser";
import { useEffect } from "react";

const mixpanelToken = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN!;

export function AnalyticsScript() {
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    mixpanel.init(mixpanelToken, {
      debug: true,
      track_pageview: true,
      persistence: "localStorage",
    });
  }, []);

  return null;
}

export function useAnalytics() {
  const trackEvent = (event: string, data?: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    mixpanel.track(event, data);
  };

  return {
    trackEvent,
  };
}
