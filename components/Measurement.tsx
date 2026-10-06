'use client';

// LEGAL-01f: Web Analytics and Speed Insights receive redacted page URLs. The consent control
// is a later ticket (decision F); everything else behaves as before.
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { redactEvent } from '@/lib/analytics-redact';

export function Measurement() {
  return (
    <>
      <Analytics beforeSend={redactEvent} />
      <SpeedInsights beforeSend={redactEvent} />
    </>
  );
}
