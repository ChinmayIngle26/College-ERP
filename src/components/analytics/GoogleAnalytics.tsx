
// src/components/analytics/GoogleAnalytics.tsx
'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { useEffect } from 'react';
import { pageview, GA_TRACKING_ID } from '@/lib/gtag';

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_TRACKING_ID || typeof window.gtag !== 'function') {
      return;
    }

    const pathWithSearch = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    pageview(pathWithSearch);

  }, [pathname, searchParams]);

  if (!GA_TRACKING_ID) {
    // Optionally log that GA is not configured, or just render nothing.
    // console.warn("Google Analytics Measurement ID (NEXT_PUBLIC_GA_MEASUREMENT_ID) is not set. Tracking is disabled.");
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}', {
              page_path: window.location.pathname + window.location.search,
            });
          `,
        }}
      />
    </>
  );
}
