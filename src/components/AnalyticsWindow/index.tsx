import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, TrendingUp, Clock, Star, Hash,
  Calendar, ArrowUp, ArrowDown, Minus, RefreshCw
} from 'lucide-react';
import type { PromptService } from '../../services/PromptService';
import type { Prompt, UsageStats } from '../../lib/types';
import { Button } from '../shared';

// =============================================================================
// TYPES
// =============================================================================

interface AnalyticsWindowProps {
  service: PromptService;
  onClose?: () => void;
}

interface PromptWithStats {
  prompt: Prompt;
  stats: UsageStats;
}

interface DashboardStats {
  totalPrompts: number;
  totalFavorites: number;
  totalUses: number;
  mostUsedPrompt: PromptWithStats | null;
  recentlyUsed: PromptWithStats[];
  topPrompts: PromptWithStats[];
  folderBreakdown: { folder: string; count: number }[];
}

type TimeRange = '7d' | '30d' | '90d' | 'all';

// =============================================================================
// COMPONENT: AnalyticsWindow
// =============================================================================

export function AnalyticsWindow({ service, onClose: _onClose }: AnalyticsWindowProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [error, setError] = useState<string | null>(null);

  // Load analytics data
  const loadAnalytics = useCallback(async () => {
    try {
      setError(null);
      const prompts = await service.getAllPrompts();
      const favorites = await service.getFavoritePrompts();

      // Fetch usage stats for all prompts
      const promptsWithStats: PromptWithStats[] = await Promise.all(
        prompts.map(async (prompt) => {
          const stats = await service.getUsageStats(prompt.id);
          return { prompt, stats };
        })
      );

      // Calculate total uses
      const totalUses = promptsWithStats.reduce(
        (sum, p) => sum + p.stats.total_uses,
        0
      );

      // Sort by usage for top prompts
      const sortedByUsage = [...promptsWithStats].sort(
        (a, b) => b.stats.total_uses - a.stats.total_uses
      );

      // Sort by last used for recently used
      const sortedByRecent = [...promptsWithStats]
        .filter((p) => p.stats.last_used)
        .sort((a, b) => {
          const dateA = new Date(a.stats.last_used || 0);
          const dateB = new Date(b.stats.last_used || 0);
          return dateB.getTime() - dateA.getTime();
        });

      // Calculate folder breakdown
      const folderCounts: Record<string, number> = {};
      prompts.forEach((p) => {
        const folder = p.folder || 'Uncategorized';
        folderCounts[folder] = (folderCounts[folder] || 0) + 1;
      });
      const folderBreakdown = Object.entries(folderCounts)
        .map(([folder, count]) => ({ folder, count }))
        .sort((a, b) => b.count - a.count);

      setStats({
        totalPrompts: prompts.length,
        totalFavorites: favorites.length,
        totalUses,
        mostUsedPrompt: sortedByUsage[0] || null,
        recentlyUsed: sortedByRecent.slice(0, 5),
        topPrompts: sortedByUsage.slice(0, 10),
        folderBreakdown,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [service]);

  // Initial load
  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadAnalytics();
  }, [loadAnalytics]);

  // Format date for display
  const formatDate = useCallback((dateStr: string | null): string => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  }, []);

  // Calculate trend indicator
  const getTrendIndicator = useCallback((stats: UsageStats) => {
    // Compare weekly to monthly average
    const weeklyTotal = stats.weekly_uses?.reduce((s, w) => s + w.count, 0) || 0;
    const monthlyTotal = stats.monthly_uses?.reduce((s, m) => s + m.count, 0) || 0;
    const weeklyAvg = weeklyTotal / Math.max(stats.weekly_uses?.length || 1, 1);
    const monthlyAvg = monthlyTotal / Math.max(stats.monthly_uses?.length || 1, 1);

    if (weeklyAvg > monthlyAvg * 1.1) {
      return { icon: ArrowUp, color: 'text-green-400', label: 'Trending up' };
    } else if (weeklyAvg < monthlyAvg * 0.9) {
      return { icon: ArrowDown, color: 'text-red-400', label: 'Trending down' };
    }
    return { icon: Minus, color: 'text-gray-400', label: 'Stable' };
  }, []);

  if (loading) {
    return (
      <div className="analytics-window flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-window flex flex-col items-center justify-center h-screen bg-gray-900">
        <p className="text-red-400 mb-4">{error}</p>
        <Button variant="secondary" onClick={handleRefresh}>
          Retry
        </Button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="analytics-window flex items-center justify-center h-screen bg-gray-900">
        <p className="text-gray-400">No data available</p>
      </div>
    );
  }

  return (
    <div className="analytics-window flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-blue-500" />
          <h1 className="text-xl font-semibold">Analytics</h1>
        </div>
        <div className="flex items-center gap-2">
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            loading={refreshing}
            icon={<RefreshCw size={16} />}
          >
            Refresh
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Hash size={20} />}
            label="Total Prompts"
            value={stats.totalPrompts}
            color="blue"
            testId="stat-total-prompts"
          />
          <StatCard
            icon={<Star size={20} />}
            label="Favorites"
            value={stats.totalFavorites}
            color="yellow"
            testId="stat-favorites"
          />
          <StatCard
            icon={<TrendingUp size={20} />}
            label="Total Uses"
            value={stats.totalUses}
            color="green"
            testId="stat-total-uses"
          />
          <StatCard
            icon={<Clock size={20} />}
            label="Avg Uses/Prompt"
            value={
              stats.totalPrompts > 0
                ? (stats.totalUses / stats.totalPrompts).toFixed(1)
                : '0'
            }
            color="purple"
            testId="stat-avg-uses"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Top Prompts */}
          <section className="bg-gray-800/50 rounded-lg p-4" data-testid="section-top-prompts">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-green-400" />
              Top Prompts
            </h2>
            <div className="space-y-2">
              {stats.topPrompts.length === 0 ? (
                <p className="text-gray-500 text-sm" data-testid="empty-top-prompts">No usage data yet</p>
              ) : (
                stats.topPrompts.map((item, index) => {
                  const trend = getTrendIndicator(item.stats);
                  const TrendIcon = trend.icon;
                  return (
                    <div
                      key={item.prompt.id}
                      className="flex items-center gap-3 py-2 px-3 bg-gray-800 rounded-lg"
                    >
                      <span className="text-gray-500 w-6 text-sm">
                        #{index + 1}
                      </span>
                      <span className="text-lg">{item.prompt.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.prompt.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {item.prompt.folder}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendIcon size={14} className={trend.color} />
                        <span className="text-sm text-gray-300">
                          {item.stats.total_uses} uses
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Recently Used */}
          <section className="bg-gray-800/50 rounded-lg p-4" data-testid="section-recently-used">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Clock size={18} className="text-blue-400" />
              Recently Used
            </h2>
            <div className="space-y-2">
              {stats.recentlyUsed.length === 0 ? (
                <p className="text-gray-500 text-sm" data-testid="empty-recently-used">No recent usage</p>
              ) : (
                stats.recentlyUsed.map((item) => (
                  <div
                    key={item.prompt.id}
                    className="flex items-center gap-3 py-2 px-3 bg-gray-800 rounded-lg"
                  >
                    <span className="text-lg">{item.prompt.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.prompt.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {item.prompt.folder}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatDate(item.stats.last_used)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Folder Breakdown */}
          <section className="bg-gray-800/50 rounded-lg p-4" data-testid="section-folder-breakdown">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-purple-400" />
              By Folder
            </h2>
            <div className="space-y-3">
              {stats.folderBreakdown.map((item) => {
                const percentage = (item.count / stats.totalPrompts) * 100;
                return (
                  <div key={item.folder} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">{item.folder}</span>
                      <span className="text-gray-500">
                        {item.count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Most Used Prompt Spotlight */}
          <section className="bg-gray-800/50 rounded-lg p-4" data-testid="section-most-used">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Star size={18} className="text-yellow-400" />
              Most Used Prompt
            </h2>
            {stats.mostUsedPrompt ? (
              <div className="bg-gray-800 rounded-lg p-4" data-testid="most-used-details">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-3xl">{stats.mostUsedPrompt.prompt.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-medium text-lg" data-testid="most-used-name">
                      {stats.mostUsedPrompt.prompt.name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {stats.mostUsedPrompt.prompt.folder}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-gray-700/50 rounded p-2">
                    <p className="text-2xl font-bold text-green-400" data-testid="most-used-count">
                      {stats.mostUsedPrompt.stats.total_uses}
                    </p>
                    <p className="text-xs text-gray-400">Total Uses</p>
                  </div>
                  <div className="bg-gray-700/50 rounded p-2">
                    <p className="text-sm font-medium text-blue-400">
                      {formatDate(stats.mostUsedPrompt.stats.last_used)}
                    </p>
                    <p className="text-xs text-gray-400">Last Used</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm" data-testid="empty-most-used">No usage data yet</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: 'blue' | 'green' | 'yellow' | 'purple';
  testId?: string;
}

function StatCard({ icon, label, value, color, testId }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    green: 'bg-green-500/10 text-green-400 border-green-500/30',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  };

  return (
    <div
      className={`rounded-lg p-4 border ${colorClasses[color]} transition-all hover:scale-[1.02]`}
      data-testid={testId}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs uppercase tracking-wider text-gray-400">
          {label}
        </span>
      </div>
      <p className="text-3xl font-bold" data-testid={testId ? `${testId}-value` : undefined}>{value}</p>
    </div>
  );
}

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
}

function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  const options: { value: TimeRange; label: string }[] = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: 'all', label: 'All Time' },
  ];

  return (
    <div className="flex bg-gray-800 rounded-lg p-1">
      {options.map((option) => (
        <button
          type="button"
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-3 py-1 text-xs rounded transition-colors ${
            value === option.value
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
