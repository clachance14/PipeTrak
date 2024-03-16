"use client";

import Script from "next/script";

const plausibleUrl = process.env.NEXT_PUBLIC_PLAUSIBLE_URL!;

export function AnalyticsScript() {
  return (
    <Script
      defer
      type="text/javascript"
      data-domain={plausibleUrl}
      src="https://plausible.io/js/script.js"
    />
  );
}

export function useAnalytics() {
  const trackEvent = (event: string, data?: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    if (typeof window === "undefined" || !(window as any).plausible) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (window as any).plausible(event, {
      props: data,
    });
  };

  return {
    trackEvent,
  };
}
