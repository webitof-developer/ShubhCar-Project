'use client';
// src/components/layout/GlobalLoggerInit.jsx
/**
 * GlobalLoggerInit — mounts once in the root layout (client-side).
 * Installs the production console override so ALL existing console.log /
 * console.warn calls across services, context, and components are silenced
 * in production without any per-file changes.
 */

import { useEffect } from 'react';
import { installGlobalConsole } from '@/utils/logger';


export function GlobalLoggerInit() {
  useEffect(() => {
    installGlobalConsole();
  }, []);

  return null; // renders nothing
}
