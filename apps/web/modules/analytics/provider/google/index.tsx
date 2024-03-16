"use client";

import Script from "next/script";

const googleAnalyticsId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID!;

export function AnalyticsScript() {
  return (
    <Script
      async
      src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
      onLoad={() => {
        if (typeof window === "undefined") {
          return;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        (window as any).dataLayer = (window as any).dataLayer || [];

        function gtag() {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, prefer-rest-params, @typescript-eslint/no-explicit-any
          (window as any).dataLayer.push(arguments);
        }
        // @ts-expect-error gtag is only improted in the browser
        gtag("js", new Date());
        // @ts-expect-error gtag is only improted in the browser
        gtag("config", googleAnalyticsId);
      }}
    />
  );
}

export function useAnalytics() {
  const trackEvent = (event: string, data?: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    if (typeof window === "undefined" || !(window as any).gta) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (window as any).gta("event", event, data);
  };

  return {
    trackEvent,
  };
}
