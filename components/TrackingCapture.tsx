'use client';

import { useEffect } from 'react';
import { captureTracking } from '../lib/tracking';

// Mounted once in the root layout. Captures FB-ads / UTM params from the
// landing URL (first-touch) and persists them for the lead + purchase events.
export default function TrackingCapture() {
  useEffect(() => {
    captureTracking();
  }, []);
  return null;
}
