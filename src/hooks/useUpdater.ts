import { useState, useCallback, useEffect } from 'react';
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { loggers } from '../lib/logger';

const log = loggers.hooks.updater;

export interface UpdateState {
  checking: boolean;
  available: boolean;
  downloading: boolean;
  downloaded: boolean;
  progress: number;
  version: string | null;
  error: string | null;
}

const initialState: UpdateState = {
  checking: false,
  available: false,
  downloading: false,
  downloaded: false,
  progress: 0,
  version: null,
  error: null,
};

/**
 * Hook for managing application updates
 *
 * Usage:
 * ```tsx
 * const { state, checkForUpdates, downloadAndInstall } = useUpdater();
 *
 * // Check for updates
 * await checkForUpdates();
 *
 * // If update available, download and install
 * if (state.available) {
 *   await downloadAndInstall();
 * }
 * ```
 */
export function useUpdater() {
  const [state, setState] = useState<UpdateState>(initialState);
  const [update, setUpdate] = useState<Update | null>(null);

  const checkForUpdates = useCallback(async (): Promise<boolean> => {
    log.debug('Checking for updates...');
    setState(prev => ({ ...prev, checking: true, error: null }));

    try {
      const updateResult = await check();

      if (updateResult) {
        log.info('Update available:', updateResult.version);
        setUpdate(updateResult);
        setState(prev => ({
          ...prev,
          checking: false,
          available: true,
          version: updateResult.version,
        }));
        return true;
      } else {
        log.debug('No updates available');
        setState(prev => ({
          ...prev,
          checking: false,
          available: false,
          version: null,
        }));
        return false;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to check for updates';
      log.error('Update check failed:', message);
      setState(prev => ({
        ...prev,
        checking: false,
        error: message,
      }));
      return false;
    }
  }, []);

  const downloadAndInstall = useCallback(async (): Promise<void> => {
    if (!update) {
      log.warn('No update to download');
      return;
    }

    log.info('Starting update download...');
    setState(prev => ({ ...prev, downloading: true, progress: 0, error: null }));

    try {
      // Download with progress tracking
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            log.debug('Download started, total size:', event.data.contentLength);
            break;
          case 'Progress':
            const progress = event.data.chunkLength;
            setState(prev => ({ ...prev, progress }));
            break;
          case 'Finished':
            log.info('Download finished');
            setState(prev => ({ ...prev, downloading: false, downloaded: true, progress: 100 }));
            break;
        }
      });

      // Relaunch the app to apply the update
      log.info('Update installed, relaunching...');
      await relaunch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to install update';
      log.error('Update installation failed:', message);
      setState(prev => ({
        ...prev,
        downloading: false,
        error: message,
      }));
    }
  }, [update]);

  const reset = useCallback(() => {
    setState(initialState);
    setUpdate(null);
  }, []);

  // Check for updates on mount (optional - can be disabled for manual checking only)
  useEffect(() => {
    // Uncomment to auto-check on startup:
    // checkForUpdates();
  }, [checkForUpdates]);

  return {
    state,
    checkForUpdates,
    downloadAndInstall,
    reset,
  };
}
