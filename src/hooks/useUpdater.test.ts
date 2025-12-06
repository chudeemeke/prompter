import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUpdater } from './useUpdater';

// Mock Tauri updater plugin
vi.mock('@tauri-apps/plugin-updater', () => ({
  check: vi.fn(),
}));

// Mock Tauri process plugin
vi.mock('@tauri-apps/plugin-process', () => ({
  relaunch: vi.fn(),
}));

import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

describe('useUpdater', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should have initial state with no update available', () => {
    const { result } = renderHook(() => useUpdater());

    expect(result.current.state).toEqual({
      checking: false,
      available: false,
      downloading: false,
      downloaded: false,
      progress: 0,
      version: null,
      error: null,
    });
  });

  it('should check for updates and report when no update is available', async () => {
    vi.mocked(check).mockResolvedValue(null);

    const { result } = renderHook(() => useUpdater());

    let updateAvailable: boolean;
    await act(async () => {
      updateAvailable = await result.current.checkForUpdates();
    });

    expect(updateAvailable!).toBe(false);
    expect(result.current.state.available).toBe(false);
    expect(result.current.state.checking).toBe(false);
    expect(check).toHaveBeenCalledTimes(1);
  });

  it('should check for updates and report when update is available', async () => {
    const mockUpdate = {
      version: '1.0.1',
      body: 'New release notes',
      date: '2025-01-15',
      downloadAndInstall: vi.fn(),
    } as unknown as Update;
    vi.mocked(check).mockResolvedValue(mockUpdate);

    const { result } = renderHook(() => useUpdater());

    let updateAvailable: boolean;
    await act(async () => {
      updateAvailable = await result.current.checkForUpdates();
    });

    expect(updateAvailable!).toBe(true);
    expect(result.current.state.available).toBe(true);
    expect(result.current.state.version).toBe('1.0.1');
    expect(result.current.state.checking).toBe(false);
  });

  it('should handle errors during update check', async () => {
    vi.mocked(check).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useUpdater());

    await act(async () => {
      await result.current.checkForUpdates();
    });

    expect(result.current.state.error).toBe('Network error');
    expect(result.current.state.available).toBe(false);
    expect(result.current.state.checking).toBe(false);
  });

  it('should download and install update', async () => {
    const mockDownloadAndInstall = vi.fn().mockImplementation(async (callback) => {
      callback({ event: 'Started', data: { contentLength: 1000 } });
      callback({ event: 'Progress', data: { chunkLength: 50 } });
      callback({ event: 'Finished' });
    });

    const mockUpdate = {
      version: '1.0.1',
      body: 'New release notes',
      date: '2025-01-15',
      downloadAndInstall: mockDownloadAndInstall,
    } as unknown as Update;
    vi.mocked(check).mockResolvedValue(mockUpdate);
    vi.mocked(relaunch).mockResolvedValue(undefined);

    const { result } = renderHook(() => useUpdater());

    // First check for updates
    await act(async () => {
      await result.current.checkForUpdates();
    });

    // Then download and install
    await act(async () => {
      await result.current.downloadAndInstall();
    });

    expect(mockDownloadAndInstall).toHaveBeenCalledTimes(1);
    expect(result.current.state.downloaded).toBe(true);
    expect(relaunch).toHaveBeenCalledTimes(1);
  });

  it('should not download if no update is available', async () => {
    vi.mocked(check).mockResolvedValue(null);

    const { result } = renderHook(() => useUpdater());

    await act(async () => {
      await result.current.downloadAndInstall();
    });

    // Should not throw, just do nothing
    expect(relaunch).not.toHaveBeenCalled();
  });

  it('should handle errors during download and install', async () => {
    const mockDownloadAndInstall = vi.fn().mockRejectedValue(new Error('Installation failed'));

    const mockUpdate = {
      version: '1.0.1',
      body: 'New release notes',
      date: '2025-01-15',
      downloadAndInstall: mockDownloadAndInstall,
    } as unknown as Update;
    vi.mocked(check).mockResolvedValue(mockUpdate);

    const { result } = renderHook(() => useUpdater());

    // First check for updates
    await act(async () => {
      await result.current.checkForUpdates();
    });

    expect(result.current.state.available).toBe(true);

    // Try to download and install (should fail)
    await act(async () => {
      await result.current.downloadAndInstall();
    });

    // Should have error and not be downloading
    expect(result.current.state.error).toBe('Installation failed');
    expect(result.current.state.downloading).toBe(false);
    expect(relaunch).not.toHaveBeenCalled();
  });

  it('should handle non-Error objects during download and install', async () => {
    const mockDownloadAndInstall = vi.fn().mockRejectedValue('string error');

    const mockUpdate = {
      version: '1.0.1',
      body: 'New release notes',
      date: '2025-01-15',
      downloadAndInstall: mockDownloadAndInstall,
    } as unknown as Update;
    vi.mocked(check).mockResolvedValue(mockUpdate);

    const { result } = renderHook(() => useUpdater());

    // First check for updates
    await act(async () => {
      await result.current.checkForUpdates();
    });

    // Try to download and install (should fail)
    await act(async () => {
      await result.current.downloadAndInstall();
    });

    // Should have fallback error message
    expect(result.current.state.error).toBe('Failed to install update');
    expect(result.current.state.downloading).toBe(false);
  });

  it('should reset state', async () => {
    const mockUpdate = {
      version: '1.0.1',
      body: 'New release notes',
      date: '2025-01-15',
      downloadAndInstall: vi.fn(),
    } as unknown as Update;
    vi.mocked(check).mockResolvedValue(mockUpdate);

    const { result } = renderHook(() => useUpdater());

    // First check for updates
    await act(async () => {
      await result.current.checkForUpdates();
    });

    expect(result.current.state.available).toBe(true);

    // Then reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.state.available).toBe(false);
    expect(result.current.state.version).toBeNull();
  });
});
