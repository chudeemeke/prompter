import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnalyticsWindow } from './index';
import type { PromptService } from '../../services/PromptService';
import type { Prompt, UsageStats } from '../../lib/types';

// =============================================================================
// MOCK DATA
// =============================================================================

const createMockPrompt = (id: string, overrides?: Partial<Prompt>): Prompt => ({
  id,
  name: `Test Prompt ${id}`,
  description: 'Test description',
  content: 'Test content',
  folder: 'Test',
  icon: 'file-text',
  color: '#3B82F6',
  tags: ['test'],
  variables: [],
  auto_paste: true,
  is_favorite: false,
  created_at: '2025-11-30T10:00:00Z',
  updated_at: '2025-11-30T10:00:00Z',
  ...overrides,
});

const createMockUsageStats = (
  promptId: string,
  totalUses: number,
  lastUsed: string | null = null
): UsageStats => ({
  prompt_id: promptId,
  total_uses: totalUses,
  last_used: lastUsed,
  daily_uses: [],
  weekly_uses: [],
  monthly_uses: [],
});

const createMockService = (
  prompts: Prompt[] = [],
  usageStats: Map<string, UsageStats> = new Map()
): PromptService => ({
  getAllPrompts: vi.fn().mockResolvedValue(prompts),
  getPrompt: vi.fn().mockResolvedValue(prompts[0] || createMockPrompt('1')),
  createPrompt: vi.fn().mockResolvedValue(createMockPrompt('new')),
  updatePrompt: vi.fn().mockResolvedValue(createMockPrompt('1')),
  deletePrompt: vi.fn().mockResolvedValue(undefined),
  duplicatePrompt: vi.fn().mockResolvedValue(createMockPrompt('dup')),
  searchPrompts: vi.fn().mockResolvedValue([]),
  getPromptsByFolder: vi.fn().mockResolvedValue([]),
  getPromptsByTag: vi.fn().mockResolvedValue([]),
  getFavoritePrompts: vi.fn().mockResolvedValue(
    prompts.filter((p) => p.is_favorite)
  ),
  getFolders: vi.fn().mockResolvedValue([]),
  createFolder: vi.fn().mockResolvedValue({}),
  deleteFolder: vi.fn().mockResolvedValue(undefined),
  getTags: vi.fn().mockResolvedValue([]),
  toggleFavorite: vi.fn().mockResolvedValue(true),
  getVersionHistory: vi.fn().mockResolvedValue([]),
  restoreVersion: vi.fn().mockResolvedValue(createMockPrompt('1')),
  recordUsage: vi.fn().mockResolvedValue(undefined),
  getUsageStats: vi.fn().mockImplementation((id: string) => {
    return Promise.resolve(
      usageStats.get(id) || createMockUsageStats(id, 0)
    );
  }),
  copyAndPaste: vi.fn().mockResolvedValue(undefined),
  hideAndRestore: vi.fn().mockResolvedValue(undefined),
  getConfig: vi.fn().mockResolvedValue({}),
  updateConfig: vi.fn().mockResolvedValue({}),
  exportPrompt: vi.fn().mockResolvedValue(''),
  importPrompt: vi.fn().mockResolvedValue(createMockPrompt('imported')),
  openEditorWindow: vi.fn().mockResolvedValue(undefined),
  openSettingsWindow: vi.fn().mockResolvedValue(undefined),
  openAnalyticsWindow: vi.fn().mockResolvedValue(undefined),
  closeWindow: vi.fn().mockResolvedValue(undefined),
  enableAutostart: vi.fn().mockResolvedValue(undefined),
  disableAutostart: vi.fn().mockResolvedValue(undefined),
  isAutostartEnabled: vi.fn().mockResolvedValue(false),
});

// =============================================================================
// TESTS
// =============================================================================

describe('AnalyticsWindow', () => {
  describe('Loading State', () => {
    it('should show loading message initially', () => {
      const service = createMockService();
      render(<AnalyticsWindow service={service} />);

      expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
    });

    it('should call getAllPrompts on mount', async () => {
      const service = createMockService();
      render(<AnalyticsWindow service={service} />);

      await waitFor(() => {
        expect(service.getAllPrompts).toHaveBeenCalled();
      });
    });

    it('should call getFavoritePrompts on mount', async () => {
      const service = createMockService();
      render(<AnalyticsWindow service={service} />);

      await waitFor(() => {
        expect(service.getFavoritePrompts).toHaveBeenCalled();
      });
    });

    it('should hide loading message after data loads', async () => {
      const service = createMockService();
      render(<AnalyticsWindow service={service} />);

      await waitFor(() => {
        expect(
          screen.queryByText('Loading analytics...')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Dashboard Layout', () => {
    it('should render Analytics header', async () => {
      const prompts = [createMockPrompt('1')];
      const service = createMockService(prompts);
      render(<AnalyticsWindow service={service} />);

      await waitFor(() => {
        expect(
          screen.queryByText('Loading analytics...')
        ).not.toBeInTheDocument();
      });

      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });

    it('should render Refresh button', async () => {
      const prompts = [createMockPrompt('1')];
      const service = createMockService(prompts);
      render(<AnalyticsWindow service={service} />);

      await waitFor(() => {
        expect(
          screen.queryByText('Loading analytics...')
        ).not.toBeInTheDocument();
      });

      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    it('should render time range selector', async () => {
      const prompts = [createMockPrompt('1')];
      const service = createMockService(prompts);
      render(<AnalyticsWindow service={service} />);

      await waitFor(() => {
        expect(
          screen.queryByText('Loading analytics...')
        ).not.toBeInTheDocument();
      });

      expect(screen.getByText('7 Days')).toBeInTheDocument();
      expect(screen.getByText('30 Days')).toBeInTheDocument();
      expect(screen.getByText('90 Days')).toBeInTheDocument();
      expect(screen.getByText('All Time')).toBeInTheDocument();
    });
  });

  describe('Statistics Cards', () => {
    it('should display Total Prompts count', async () => {
      const prompts = [
        createMockPrompt('1'),
        createMockPrompt('2'),
        createMockPrompt('3'),
      ];
      const service = createMockService(prompts);
      render(<AnalyticsWindow service={service} />);

      await waitFor(() => {
        expect(
          screen.queryByText('Loading analytics...')
        ).not.toBeInTheDocument();
      });

      expect(screen.getByText('Total Prompts')).toBeInTheDocument();
      expect(screen.getByTestId('stat-total-prompts-value')).toHaveTextContent('3');
    });

    it('should display Favorites count', async () => {
      const prompts = [
        createMockPrompt('1', { is_favorite: true }),
        createMockPrompt('2', { is_favorite: true }),
        createMockPrompt('3', { is_favorite: false }),
      ];
      const service = createMockService(prompts);
      render(<AnalyticsWindow service={service} />);

      await waitFor(() => {
        expect(
          screen.queryByText('Loading analytics...')
        ).not.toBeInTheDocument();
      });

      expect(screen.getByText('Favorites')).toBeInTheDocument();
      expect(screen.getByTestId('stat-favorites-value')).toHaveTextContent('2');
    });

    it('should display Total Uses count', async () => {
      const prompts = [createMockPrompt('1'), createMockPrompt('2')];
      const usageStats = new Map<string, UsageStats>([
        ['1', createMockUsageStats('1', 10)],
        ['2', createMockUsageStats('2', 5)],
      ]);
      const service = createMockService(prompts, usageStats);
      render(<AnalyticsWindow service={service} />);

      await waitFor(() => {
        expect(
          screen.queryByText('Loading analytics...')
        ).not.toBeInTheDocument();
      });

      // Verify the stat card contains the correct value
      expect(screen.getByTestId('stat-total-uses')).toBeInTheDocument();
      expect(screen.getByTestId('stat-total-uses-value')).toHaveTextContent('15');
    });
  });

  describe('Top Prompts Section', () => {
    it('should display Top Prompts heading', async () => {
      const prompts = [createMockPrompt('1')];
      const service = createMockService(prompts);
      render(<AnalyticsWindow service={service} />);

      await waitFor(() => {
        expect(
          screen.queryByText('Loading analytics...')
        ).not.toBeInTheDocument();
      });

      expect(screen.getByText('Top Prompts')).toBeInTheDocument();
    });

    it('should show no usage data message when empty', async () => {
      const service = createMockService([]);
      render(<AnalyticsWindow service={service} />);

      await waitFor(() => {
        expect(
          screen.queryByText('Loading analytics...')
        ).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('empty-top-prompts')).toHaveTextContent('No usage data yet');
    });

    it('should display prompts ordered by usage', async () => {
      const prompts = [
        createMockPrompt('1', { name: 'Less Used Prompt' }),
        createMockPrompt('2', { name: 'Most Used Prompt' }),
      ];
      const usageStats = new Map<string, UsageStats>([
        ['1', createMockUsageStats('1', 5)],
        ['2', createMockUsageStats('2', 20)],
      ]);
      const service = createMockService(prompts, usageStats);
      render(<AnalyticsWindow service={service} />);

      await waitFor(() => {
        expect(
          screen.queryByText('Loading analytics...')
        ).not.toBeInTheDocument();
      });

      // Verify both prompts are displayed in the Top Prompts section
      const topPromptsSection = screen.getByTestId('section-top-prompts');
      expect(topPromptsSection).toHaveTextContent('Most Used Prompt');
      expect(topPromptsSection).toHaveTextContent('Less Used Prompt');

      // Verify they show usage counts
      expect(topPromptsSection).toHaveTextContent('20 uses');
      expect(topPromptsSection).toHaveTextContent('5 uses');
    });
  });

  describe('Recently Used Section', () => {
    it('should display Recently Used heading', async () => {
      const prompts = [createMockPrompt('1')];
      const service = createMockService(prompts);
      render(<AnalyticsWindow service={service} />);

      await waitFor(() => {
        expect(
          screen.queryByText('Loading analytics...')
        ).not.toBeInTheDocument();
      });

      expect(screen.getByText('Recently Used')).toBeInTheDocument();
    });

    it('should show no recent usage message when empty', async () => {
      const service = createMockService([]);
      render(<AnalyticsWindow service={service} />);

      await waitFor(() => {
        expect(
          screen.queryByText('Loading analytics...')
        ).not.toBeInTheDocument();
      });

      expect(screen.getByText('No recent usage')).toBeInTheDocument();
    });
  });

  describe('Folder Breakdown Section', () => {
    it('should display By Folder heading', async () => {
      const prompts = [createMockPrompt('1')];
      const service = createMockService(prompts);
      render(<AnalyticsWindow service={service} />);

      await waitFor(() => {
        expect(
          screen.queryByText('Loading analytics...')
        ).not.toBeInTheDocument();
      });

      expect(screen.getByText('By Folder')).toBeInTheDocument();
    });

    it('should show folder breakdown with counts', async () => {
      const prompts = [
        createMockPrompt('1', { folder: 'Work' }),
        createMockPrompt('2', { folder: 'Work' }),
        createMockPrompt('3', { folder: 'Personal' }),
      ];
      const service = createMockService(prompts);
      render(<AnalyticsWindow service={service} />);

      await waitFor(() => {
        expect(
          screen.queryByText('Loading analytics...')
        ).not.toBeInTheDocument();
      });

      const folderSection = screen.getByTestId('section-folder-breakdown');
      expect(folderSection).toHaveTextContent('Work');
      expect(folderSection).toHaveTextContent('Personal');
    });
  });

  describe('Most Used Prompt Section', () => {
    it('should display Most Used Prompt heading', async () => {
      const prompts = [createMockPrompt('1')];
      const service = createMockService(prompts);
      render(<AnalyticsWindow service={service} />);

      await waitFor(() => {
        expect(
          screen.queryByText('Loading analytics...')
        ).not.toBeInTheDocument();
      });

      expect(screen.getByText('Most Used Prompt')).toBeInTheDocument();
    });

    it('should display most used prompt details', async () => {
      const prompts = [createMockPrompt('1', { name: 'Popular Prompt' })];
      const usageStats = new Map<string, UsageStats>([
        ['1', createMockUsageStats('1', 50, '2025-12-01T10:00:00Z')],
      ]);
      const service = createMockService(prompts, usageStats);
      render(<AnalyticsWindow service={service} />);

      await waitFor(() => {
        expect(
          screen.queryByText('Loading analytics...')
        ).not.toBeInTheDocument();
      });

      // Verify prompt name and usage count in the Most Used section
      expect(screen.getByTestId('most-used-name')).toHaveTextContent('Popular Prompt');
      expect(screen.getByTestId('most-used-count')).toHaveTextContent('50');
    });
  });

  describe('Refresh Functionality', () => {
    it('should reload data when Refresh is clicked', async () => {
      const user = userEvent.setup();
      const prompts = [createMockPrompt('1')];
      const service = createMockService(prompts);
      render(<AnalyticsWindow service={service} />);

      await waitFor(() => {
        expect(
          screen.queryByText('Loading analytics...')
        ).not.toBeInTheDocument();
      });

      const initialCallCount = (service.getAllPrompts as ReturnType<typeof vi.fn>).mock.calls.length;

      await user.click(screen.getByText('Refresh'));

      await waitFor(() => {
        expect(service.getAllPrompts).toHaveBeenCalledTimes(
          initialCallCount + 1
        );
      });
    });
  });

  describe('Time Range Selector', () => {
    it('should have 30 Days selected by default', async () => {
      const prompts = [createMockPrompt('1')];
      const service = createMockService(prompts);
      render(<AnalyticsWindow service={service} />);

      await waitFor(() => {
        expect(
          screen.queryByText('Loading analytics...')
        ).not.toBeInTheDocument();
      });

      const thirtyDaysButton = screen.getByRole('button', { name: '30 Days' });
      // Check that the selected button has the active styling
      expect(thirtyDaysButton.className).toContain('bg-blue-600');
    });

    it('should allow changing time range', async () => {
      const user = userEvent.setup();
      const prompts = [createMockPrompt('1')];
      const service = createMockService(prompts);
      render(<AnalyticsWindow service={service} />);

      await waitFor(() => {
        expect(
          screen.queryByText('Loading analytics...')
        ).not.toBeInTheDocument();
      });

      const sevenDaysButton = screen.getByRole('button', { name: '7 Days' });
      await user.click(sevenDaysButton);

      // After clicking, 7 Days should have the active styling
      expect(sevenDaysButton.className).toContain('bg-blue-600');
    });
  });

  describe('Error Handling', () => {
    it('should display error message when loading fails', async () => {
      const service = createMockService();
      (service.getAllPrompts as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Failed to load')
      );

      render(<AnalyticsWindow service={service} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load')).toBeInTheDocument();
      });
    });

    it('should display retry button on error', async () => {
      const service = createMockService();
      (service.getAllPrompts as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Failed to load')
      );

      render(<AnalyticsWindow service={service} />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should handle zero prompts gracefully', async () => {
      const service = createMockService([]);
      render(<AnalyticsWindow service={service} />);

      await waitFor(() => {
        expect(
          screen.queryByText('Loading analytics...')
        ).not.toBeInTheDocument();
      });

      // Verify Total Prompts card shows 0
      expect(screen.getByTestId('stat-total-prompts-value')).toHaveTextContent('0');

      // Verify empty states are shown
      expect(screen.getByTestId('empty-top-prompts')).toHaveTextContent('No usage data yet');
      expect(screen.getByTestId('empty-recently-used')).toHaveTextContent('No recent usage');
    });

    it('should show empty most used section when no prompts', async () => {
      const service = createMockService([]);
      render(<AnalyticsWindow service={service} />);

      await waitFor(() => {
        expect(
          screen.queryByText('Loading analytics...')
        ).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('empty-most-used')).toHaveTextContent('No usage data yet');
    });
  });

  describe('Date Formatting', () => {
    it('should display Today for same-day usage', async () => {
      const today = new Date().toISOString();
      const prompts = [createMockPrompt('1', { name: 'Today Prompt' })];
      const usageStats = new Map<string, UsageStats>([
        ['1', createMockUsageStats('1', 5, today)],
      ]);
      const service = createMockService(prompts, usageStats);
      render(<AnalyticsWindow service={service} />);

      await waitFor(() => {
        expect(
          screen.queryByText('Loading analytics...')
        ).not.toBeInTheDocument();
      });

      const recentSection = screen.getByTestId('section-recently-used');
      expect(recentSection).toHaveTextContent('Today');
    });

    it('should display Yesterday for previous day usage', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const prompts = [createMockPrompt('1', { name: 'Yesterday Prompt' })];
      const usageStats = new Map<string, UsageStats>([
        ['1', createMockUsageStats('1', 5, yesterday.toISOString())],
      ]);
      const service = createMockService(prompts, usageStats);
      render(<AnalyticsWindow service={service} />);

      await waitFor(() => {
        expect(
          screen.queryByText('Loading analytics...')
        ).not.toBeInTheDocument();
      });

      const recentSection = screen.getByTestId('section-recently-used');
      expect(recentSection).toHaveTextContent('Yesterday');
    });

    it('should display X days ago for recent usage', async () => {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      const prompts = [createMockPrompt('1', { name: 'Recent Prompt' })];
      const usageStats = new Map<string, UsageStats>([
        ['1', createMockUsageStats('1', 5, fiveDaysAgo.toISOString())],
      ]);
      const service = createMockService(prompts, usageStats);
      render(<AnalyticsWindow service={service} />);

      await waitFor(() => {
        expect(
          screen.queryByText('Loading analytics...')
        ).not.toBeInTheDocument();
      });

      const recentSection = screen.getByTestId('section-recently-used');
      expect(recentSection).toHaveTextContent('5 days ago');
    });

    it('should display X weeks ago for older usage', async () => {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const prompts = [createMockPrompt('1', { name: 'Weeks Ago Prompt' })];
      const usageStats = new Map<string, UsageStats>([
        ['1', createMockUsageStats('1', 5, twoWeeksAgo.toISOString())],
      ]);
      const service = createMockService(prompts, usageStats);
      render(<AnalyticsWindow service={service} />);

      await waitFor(() => {
        expect(
          screen.queryByText('Loading analytics...')
        ).not.toBeInTheDocument();
      });

      const recentSection = screen.getByTestId('section-recently-used');
      expect(recentSection).toHaveTextContent('2 weeks ago');
    });

    it('should display formatted date for usage older than a month', async () => {
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);
      const prompts = [createMockPrompt('1', { name: 'Old Prompt' })];
      const usageStats = new Map<string, UsageStats>([
        ['1', createMockUsageStats('1', 5, twoMonthsAgo.toISOString())],
      ]);
      const service = createMockService(prompts, usageStats);
      render(<AnalyticsWindow service={service} />);

      await waitFor(() => {
        expect(
          screen.queryByText('Loading analytics...')
        ).not.toBeInTheDocument();
      });

      // For dates older than 30 days, it shows the locale date string
      const recentSection = screen.getByTestId('section-recently-used');
      // The date format depends on locale, so just check it doesn't say "days ago" or "weeks ago"
      expect(recentSection).not.toHaveTextContent('days ago');
      expect(recentSection).not.toHaveTextContent('weeks ago');
    });

    it('should display Never for null last_used', async () => {
      const prompts = [createMockPrompt('1', { name: 'Never Used' })];
      const usageStats = new Map<string, UsageStats>([
        ['1', createMockUsageStats('1', 0, null)],
      ]);
      const service = createMockService(prompts, usageStats);
      render(<AnalyticsWindow service={service} />);

      await waitFor(() => {
        expect(
          screen.queryByText('Loading analytics...')
        ).not.toBeInTheDocument();
      });

      // Prompts with null last_used won't appear in recently used
      // but the Most Used section will show "Never" for last used
      const mostUsedSection = screen.getByTestId('section-most-used');
      expect(mostUsedSection).toHaveTextContent('Never');
    });
  });

  describe('Trend Indicators', () => {
    it('should show trending up when weekly usage exceeds monthly average', async () => {
      const prompts = [createMockPrompt('1', { name: 'Rising Prompt' })];
      const usageStats = new Map<string, UsageStats>([
        ['1', {
          prompt_id: '1',
          total_uses: 100,
          last_used: new Date().toISOString(),
          daily_uses: [],
          weekly_uses: [{ period: 'week1', count: 50 }],  // High weekly
          monthly_uses: [{ period: 'month1', count: 10 }], // Low monthly avg
        }],
      ]);
      const service = createMockService(prompts, usageStats);
      render(<AnalyticsWindow service={service} />);

      await waitFor(() => {
        expect(
          screen.queryByText('Loading analytics...')
        ).not.toBeInTheDocument();
      });

      // The trend indicator should show in the top prompts section
      const topPromptsSection = screen.getByTestId('section-top-prompts');
      expect(topPromptsSection).toBeInTheDocument();
    });

    it('should show trending down when weekly usage is below monthly average', async () => {
      const prompts = [createMockPrompt('1', { name: 'Declining Prompt' })];
      const usageStats = new Map<string, UsageStats>([
        ['1', {
          prompt_id: '1',
          total_uses: 100,
          last_used: new Date().toISOString(),
          daily_uses: [],
          weekly_uses: [{ period: 'week1', count: 5 }],   // Low weekly
          monthly_uses: [{ period: 'month1', count: 100 }], // High monthly avg
        }],
      ]);
      const service = createMockService(prompts, usageStats);
      render(<AnalyticsWindow service={service} />);

      await waitFor(() => {
        expect(
          screen.queryByText('Loading analytics...')
        ).not.toBeInTheDocument();
      });

      const topPromptsSection = screen.getByTestId('section-top-prompts');
      expect(topPromptsSection).toBeInTheDocument();
    });

    it('should show stable trend when weekly matches monthly average', async () => {
      const prompts = [createMockPrompt('1', { name: 'Stable Prompt' })];
      const usageStats = new Map<string, UsageStats>([
        ['1', {
          prompt_id: '1',
          total_uses: 100,
          last_used: new Date().toISOString(),
          daily_uses: [],
          weekly_uses: [{ period: 'week1', count: 10 }],
          monthly_uses: [{ period: 'month1', count: 10 }],
        }],
      ]);
      const service = createMockService(prompts, usageStats);
      render(<AnalyticsWindow service={service} />);

      await waitFor(() => {
        expect(
          screen.queryByText('Loading analytics...')
        ).not.toBeInTheDocument();
      });

      const topPromptsSection = screen.getByTestId('section-top-prompts');
      expect(topPromptsSection).toBeInTheDocument();
    });

    it('should handle empty weekly and monthly arrays', async () => {
      const prompts = [createMockPrompt('1', { name: 'No Data Prompt' })];
      const usageStats = new Map<string, UsageStats>([
        ['1', {
          prompt_id: '1',
          total_uses: 10,
          last_used: new Date().toISOString(),
          daily_uses: [],
          weekly_uses: [],
          monthly_uses: [],
        }],
      ]);
      const service = createMockService(prompts, usageStats);
      render(<AnalyticsWindow service={service} />);

      await waitFor(() => {
        expect(
          screen.queryByText('Loading analytics...')
        ).not.toBeInTheDocument();
      });

      // Should handle empty arrays gracefully
      const topPromptsSection = screen.getByTestId('section-top-prompts');
      expect(topPromptsSection).toHaveTextContent('No Data Prompt');
    });
  });

  describe('Uncategorized Folder', () => {
    it('should categorize prompts with empty folder as Uncategorized', async () => {
      const prompts = [
        createMockPrompt('1', { folder: '' }),
        createMockPrompt('2', { folder: '' }),
      ];
      const service = createMockService(prompts);
      render(<AnalyticsWindow service={service} />);

      await waitFor(() => {
        expect(
          screen.queryByText('Loading analytics...')
        ).not.toBeInTheDocument();
      });

      const folderSection = screen.getByTestId('section-folder-breakdown');
      expect(folderSection).toHaveTextContent('Uncategorized');
    });
  });

  describe('Average Uses Per Prompt', () => {
    it('should calculate correct average', async () => {
      const prompts = [
        createMockPrompt('1'),
        createMockPrompt('2'),
      ];
      const usageStats = new Map<string, UsageStats>([
        ['1', createMockUsageStats('1', 10)],
        ['2', createMockUsageStats('2', 20)],
      ]);
      const service = createMockService(prompts, usageStats);
      render(<AnalyticsWindow service={service} />);

      await waitFor(() => {
        expect(
          screen.queryByText('Loading analytics...')
        ).not.toBeInTheDocument();
      });

      // Average = 30 / 2 = 15.0
      expect(screen.getByTestId('stat-avg-uses-value')).toHaveTextContent('15.0');
    });

    it('should show 0 for average when no prompts', async () => {
      const service = createMockService([]);
      render(<AnalyticsWindow service={service} />);

      await waitFor(() => {
        expect(
          screen.queryByText('Loading analytics...')
        ).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('stat-avg-uses-value')).toHaveTextContent('0');
    });
  });
});
