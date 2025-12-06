/**
 * Skeleton Loading Component
 *
 * Provides shimmer animation placeholders for content loading states.
 * Following Apple-style design: subtle, smooth, unobtrusive.
 */

interface SkeletonProps {
  /** Width of the skeleton (CSS value) */
  width?: string;
  /** Height of the skeleton (CSS value) */
  height?: string;
  /** Border radius (CSS value) */
  borderRadius?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Basic skeleton placeholder with shimmer animation
 */
export function Skeleton({
  width = '100%',
  height = '1rem',
  borderRadius = '4px',
  className = '',
}: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius }}
      aria-hidden="true"
    />
  );
}

/**
 * Skeleton for result item (matches ResultItem layout)
 */
export function ResultItemSkeleton() {
  return (
    <div className="result-item-skeleton" aria-hidden="true">
      <Skeleton width="32px" height="32px" borderRadius="8px" />
      <div className="skeleton-content">
        <Skeleton width="60%" height="1rem" />
        <Skeleton width="40%" height="0.75rem" />
      </div>
    </div>
  );
}

/**
 * Skeleton list for results loading state
 */
export function ResultsListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div
      className="results-list-skeleton"
      role="status"
      aria-label="Loading prompts"
    >
      {Array.from({ length: count }).map((_, index) => (
        <ResultItemSkeleton key={index} />
      ))}
    </div>
  );
}
