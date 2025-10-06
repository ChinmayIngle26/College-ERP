
"use client";

import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 768; // Tailwind's `md` breakpoint

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    const onChange = () => {
      setIsMobile(mql.matches);
    };

    mql.addEventListener("change", onChange);
    
    // Set initial state
    setIsMobile(mql.matches);

    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
