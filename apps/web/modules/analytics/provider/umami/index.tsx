"use client";

import Script from "next/script";

const umamiTrackingId = process.env.NEXT_PUBLIC_UMAMI_TRACKING_ID!;

export function AnalyticsScript() {
  return (
    <Script
      async
      type="text/javascript"
      data-website-id={umamiTrackingId}
      src="https://analytics.eu.umami.is/script.js"
    />
  );
}

export function useAnalytics() {
  const trackEvent = (event: string, data?: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    if (typeof window === "undefined" || !(window as any).umami) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    (window as any).umami.track(event, {
      props: data,
    });
  };

  return {
    trackEvent,
  };
}
