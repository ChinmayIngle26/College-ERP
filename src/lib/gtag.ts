
// src/lib/gtag.ts

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

/**
 * Sends a pageview event to Google Analytics.
 * @param path - The path of the page to track (e.g., '/profile?id=123').
 */
export const pageview = (path: string): void => {
  if (!GA_TRACKING_ID) {
    // console.warn("GA_TRACKING_ID not set. Pageview not sent.");
    return;
  }
  if (typeof window.gtag !== 'function') {
    // console.warn("window.gtag is not a function. Pageview not sent.");
    return;
  }
  window.gtag('config', GA_TRACKING_ID, {
    page_path: path,
  });
};

/**
 * Sends a custom event to Google Analytics.
 */
type GTagEvent = {
  action: string;
  category: string;
  label: string;
  value?: number; // value must be a non-negative integer.
};

export const event = ({ action, category, label, value }: GTagEvent): void => {
  if (!GA_TRACKING_ID) {
    // console.warn("GA_TRACKING_ID not set. Event not sent.");
    return;
  }
  if (typeof window.gtag !== 'function') {
    // console.warn("window.gtag is not a function. Event not sent.");
    return;
  }
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};
