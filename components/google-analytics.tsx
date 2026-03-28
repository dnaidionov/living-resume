"use client";

import { useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

  useEffect(() => {
    if (!measurementId) {
      return;
    }

    function handleAnalytics(event: Event) {
      const detail = (event as CustomEvent<Record<string, string>>).detail;
      if (!detail?.event || typeof window.gtag !== "function") {
        return;
      }

      window.gtag("event", detail.event, detail);
    }

    window.addEventListener("living-resume:analytics", handleAnalytics);
    return () => {
      window.removeEventListener("living-resume:analytics", handleAnalytics);
    };
  }, [measurementId]);

  if (!measurementId) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  );
}
