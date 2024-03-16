"use client";

import Script from "next/script";

const pirschCode = process.env.NEXT_PUBLIC_PIRSCH_CODE!;

export function AnalyticsScript() {
  return (
    <Script
      defer
      type="text/javascript"
      src="https://api.pirsch.io/pirsch-extended.js"
      id="pirschextendedjs"
      data-code={pirschCode}
    />
  );
}

export function useAnalytics() {
  const trackEvent = (event: string, data?: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    if (typeof window === "undefined" || !(window as any).pirsch) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (window as any).pirsch(event, {
      meta: data,
    });
  };

  return {
    trackEvent,
  };
}
