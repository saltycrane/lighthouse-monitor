"use client";
import { useEffect, useState } from "react";

import { localDateTime } from "@/lib/dates";

/**
 * From Github Copilot Claude 3.7 Thinking:
 *
 * Understanding the "use client" Directive in Next.js
 *
 * Even with the "use client" directive, your component is still being rendered
 * on the server during the initial server-side rendering (SSR) phase. This is
 * how Next.js's App Router works:
 *
 * 1. During SSR, Next.js renders all components (client and server) on the
 *    server to generate the initial HTML
 * 2. After loading in the browser, client components are hydrated, making them
 *    interactive
 * 3. The hydration mismatch occurs because:
 *    - Server: The component renders using server timezone settings
 *    - Client: The component re-renders using client browser's timezone settings
 *
 * The "use client" directive doesn't mean "only run on client" - it means:
 *
 * - This component uses client features (hooks, browser APIs)
 * - Bundle this component with client-side JavaScript
 * - But still pre-render it on the server for the initial HTML
 *
 * Our solution works by ensuring the initial render is identical on both server
 * and client (showing the raw date string), then only applying the time zone
 * conversion after hydration is complete via useEffect. The useEffect hook only
 * runs on the client after hydration, so there's no mismatch.
 */
type TProps = {
  format?: string;
  utcDateTimeStr: string;
};

export function LocalDateTime({ format, utcDateTimeStr }: TProps) {
  // Initially use the raw string to avoid hydration mismatch
  const [formattedDate, setFormattedDate] = useState<string>(utcDateTimeStr);

  useEffect(() => {
    // Only run the conversion on the client side after hydration is complete
    setFormattedDate(localDateTime(utcDateTimeStr, format));
  }, [format, utcDateTimeStr]);

  return <span>{formattedDate}</span>;
}
