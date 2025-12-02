use chrono::{DateTime, Utc};

/// Encapsulated frecency scoring logic
/// Formula: score = use_count * recency_decay
/// where recency_decay = 1.0 / (1.0 + days_since_last_use * 0.1)
#[derive(Debug, Clone)]
pub struct FrecencyScore {
    use_count: u32,
    last_used: DateTime<Utc>,
}

impl FrecencyScore {
    pub fn new(use_count: u32, last_used: DateTime<Utc>) -> Self {
        Self {
            use_count,
            last_used,
        }
    }

    /// Calculate frecency score using time decay algorithm
    pub fn calculate(&self) -> f64 {
        let now = Utc::now();
        let days_since = (now - self.last_used).num_days() as f64;
        let recency_decay = 1.0 / (1.0 + days_since * 0.1);
        self.use_count as f64 * recency_decay
    }

    /// Calculate frecency score at a specific point in time (for testing)
    #[cfg(test)]
    pub fn calculate_at(&self, now: DateTime<Utc>) -> f64 {
        let days_since = (now - self.last_used).num_days() as f64;
        let recency_decay = 1.0 / (1.0 + days_since * 0.1);
        self.use_count as f64 * recency_decay
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Duration;

    #[test]
    fn test_frecency_score_just_used() {
        let now = Utc::now();
        let score = FrecencyScore::new(10, now);
        let calculated = score.calculate_at(now);

        // Just used: recency_decay = 1.0 / (1.0 + 0 * 0.1) = 1.0
        // score = 10 * 1.0 = 10.0
        assert_eq!(calculated, 10.0);
    }

    #[test]
    fn test_frecency_score_decays_over_time() {
        let now = Utc::now();
        let thirty_days_ago = now - Duration::days(30);
        let score = FrecencyScore::new(10, thirty_days_ago);
        let calculated = score.calculate_at(now);

        // 30 days ago: recency_decay = 1.0 / (1.0 + 30 * 0.1) = 1.0 / 4.0 = 0.25
        // score = 10 * 0.25 = 2.5
        assert_eq!(calculated, 2.5);
    }

    #[test]
    fn test_frecency_score_high_usage_old_prompt() {
        let now = Utc::now();
        let sixty_days_ago = now - Duration::days(60);
        let score = FrecencyScore::new(100, sixty_days_ago);
        let calculated = score.calculate_at(now);

        // 60 days ago: recency_decay = 1.0 / (1.0 + 60 * 0.1) = 1.0 / 7.0 ≈ 0.142857
        // score = 100 * 0.142857 ≈ 14.2857
        assert!((calculated - 14.285714).abs() < 0.001);
    }

    #[test]
    fn test_frecency_score_low_usage_recent_prompt() {
        let now = Utc::now();
        let one_day_ago = now - Duration::days(1);
        let score = FrecencyScore::new(2, one_day_ago);
        let calculated = score.calculate_at(now);

        // 1 day ago: recency_decay = 1.0 / (1.0 + 1 * 0.1) = 1.0 / 1.1 ≈ 0.909090
        // score = 2 * 0.909090 ≈ 1.818181
        assert!((calculated - 1.818181).abs() < 0.001);
    }

    #[test]
    fn test_frecency_score_zero_usage() {
        let now = Utc::now();
        let score = FrecencyScore::new(0, now);
        assert_eq!(score.calculate_at(now), 0.0);
    }

    #[test]
    fn test_frecency_score_very_old_prompt() {
        let now = Utc::now();
        let year_ago = now - Duration::days(365);
        let score = FrecencyScore::new(10, year_ago);
        let calculated = score.calculate_at(now);

        // 365 days ago: recency_decay = 1.0 / (1.0 + 365 * 0.1) = 1.0 / 37.5 ≈ 0.0267
        // score = 10 * 0.0267 ≈ 0.267
        assert!((calculated - 0.266666).abs() < 0.01);
    }
}
