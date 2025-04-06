// src/utils/metricProcessing.js
import _ from "lodash";

/**
 * Calculates the standard deviation of an array of numbers.
 * Handles cases with less than 2 elements.
 * @param {number[]} arr - Array of numbers.
 * @returns {number} Standard deviation or 0 if insufficient data.
 */
const calculateSD = (arr) => {
  const validValues = arr.filter((v) => typeof v === "number" && !isNaN(v));
  if (validValues.length < 2) {
    return 0;
  }
  const n = validValues.length;
  const mean = _.mean(validValues);
  const variance = _.sumBy(validValues, (x) => Math.pow(x - mean, 2)) / (n - 1);
  return Math.sqrt(variance);
};

/**
 * Aggregates season-level player data to player-level summaries with prime-related metrics.
 * Mirrors the logic of R's process_player_primes.
 *
 * Assumes input data contains necessary season-level fields like:
 * id, player_name, sport, league, position, season, age, games_played, in_prime,
 * scaled_value (for performance), tier_score (numeric tier), performance_tier (string tier)
 *
 * @param {Array<Object>} fullPlayerData - Array of player-season objects (e.g., updatedFullDataWithPrimes).
 * // Removed `seasonData` as separate param, assuming fullPlayerData has needed fields. Adjust if needed.
 * @returns {Array<Object>} Array of player summary objects ready for PQI/CQI calculation.
 */
export const processPlayerPrimes = (fullPlayerData) => {
  if (!Array.isArray(fullPlayerData)) return [];

  // Determine the latest season per league for 'is_active' flag
  const latestSeasonsByLeague = _.mapValues(
    _.groupBy(fullPlayerData, "league"),
    (seasons) => _.maxBy(seasons, "season")?.season ?? 0
  );

  // Group data by player ID
  const groupedById = _.groupBy(fullPlayerData, "id");

  const playerSummaries = Object.values(groupedById)
    .map((playerSeasons) => {
      if (!playerSeasons || playerSeasons.length === 0) return null;

      const firstSeason = playerSeasons[0];
      const league = firstSeason.league;
      const maxLeagueSeason = latestSeasonsByLeague[league] || 0;

      // Filter prime seasons
      const primeSeasonsData = playerSeasons.filter((s) => s.in_prime);
      const numPrimeSeasons = primeSeasonsData.length;

      // Get all valid scaled_values for career and prime
      const careerValues = playerSeasons
        .map((s) => s.scaled_value)
        .filter((v) => typeof v === "number" && !isNaN(v));
      const primeValues = primeSeasonsData
        .map((s) => s.scaled_value)
        .filter((v) => typeof v === "number" && !isNaN(v));

      // Calculate prime aggregates safely
      const primeAvgTier =
        numPrimeSeasons > 0
          ? _.meanBy(primeSeasonsData, (s) =>
              typeof s.tier_score === "number" ? s.tier_score : NaN
            )
          : NaN;
      const primePeakValue =
        primeValues.length > 0 ? Math.max(...primeValues) : NaN;
      const primeAvgValue = primeValues.length > 0 ? _.mean(primeValues) : NaN;

      // Calculate prime tier percentages
      let primeElitePct = 0,
        primeGreatPct = 0,
        primeAvgPct = 0;
      if (numPrimeSeasons > 0) {
        const primeTiers = primeSeasonsData
          .map((s) => s.performance_tier)
          .filter(Boolean); // Get non-null tier strings
        primeElitePct =
          (primeTiers.filter((t) => t === "Elite").length / numPrimeSeasons) *
          100;
        primeGreatPct =
          (primeTiers.filter((t) => t === "Great").length / numPrimeSeasons) *
          100;
        primeAvgPct =
          (primeTiers.filter((t) => t === "Average").length / numPrimeSeasons) *
          100;
        // Add other tiers if needed (Below Average, Replacement Level)
      }

      // Calculate career aggregates
      const numCareerSeasons = new Set(playerSeasons.map((s) => s.season)).size; // Use unique seasons
      const careerAvgTier = _.meanBy(playerSeasons, (s) =>
        typeof s.tier_score === "number" ? s.tier_score : NaN
      );
      const careerPeakValue =
        careerValues.length > 0 ? Math.max(...careerValues) : NaN;
      const careerAvgValue =
        careerValues.length > 0 ? _.mean(careerValues) : NaN;

      // Career tier percentages
      const careerTiers = playerSeasons
        .map((s) => s.performance_tier)
        .filter(Boolean);
      const careerElitePct =
        careerTiers.length > 0
          ? (careerTiers.filter((t) => t === "Elite").length /
              careerTiers.length) *
            100
          : 0;
      const careerGreatPct =
        careerTiers.length > 0
          ? (careerTiers.filter((t) => t === "Great").length /
              careerTiers.length) *
            100
          : 0;

      // Consistency (Standard Deviation)
      const primeSD = calculateSD(primeValues);
      const careerSD = calculateSD(careerValues);

      // Consistency factors (higher = more consistent)
      const primeSDRatio =
        primeAvgValue && primeAvgValue !== 0
          ? Math.min(primeSD / Math.abs(primeAvgValue), 1)
          : 0; // Avoid division by zero, use abs
      const careerSDRatio =
        careerAvgValue && careerAvgValue !== 0
          ? Math.min(careerSD / Math.abs(careerAvgValue), 1)
          : 0;
      const primeConsistency = Math.max(1 - primeSDRatio * 0.5, 0.5); // R formula: pmax(1-(ratio*0.5), 0.5)
      const careerConsistency = Math.max(1 - careerSDRatio * 0.5, 0.5);

      const latestSeasonPlayed = _.maxBy(playerSeasons, "season")?.season ?? 0;
      const maxAge = _.maxBy(playerSeasons, "age")?.age ?? 0;

      // R 'is_active' logic was just latest_season_played == max_season
      const isActive = latestSeasonPlayed === maxLeagueSeason;

      const summary = {
        id: firstSeason.id,
        player_name: firstSeason.player_name,
        sport: firstSeason.sport,
        league: firstSeason.league,
        position: _.last(playerSeasons)?.position, // Use last known position
        career_seasons: numCareerSeasons,
        career_games: _.sumBy(playerSeasons, (s) =>
          typeof s.games_played === "number" ? s.games_played : 0
        ),
        prime_seasons: numPrimeSeasons,
        prime_avg_tier: primeAvgTier,
        prime_peak_value: primePeakValue,
        prime_avg_value: primeAvgValue,
        prime_elite_pct: primeElitePct,
        prime_great_pct: primeGreatPct,
        prime_avg_pct: primeAvgPct,
        career_avg_tier: careerAvgTier,
        career_elite_pct: careerElitePct,
        career_great_pct: careerGreatPct,
        career_avg_value: careerAvgValue,
        career_peak_value: careerPeakValue,
        prime_density:
          numCareerSeasons > 0 ? (numPrimeSeasons / numCareerSeasons) * 100 : 0,
        latest_season_played: latestSeasonPlayed,
        max_age: maxAge,
        is_active: isActive,
        // Consistency metrics from R code
        prime_sd: primeSD,
        career_sd: careerSD,
        prime_consistency: primeConsistency,
        career_consistency: careerConsistency,
        // Add counts used for SD calculation if needed for debugging
        // prime_value_count: primeValues.length,
        // career_value_count: careerValues.length,
      };

      // Replace potential NaN numeric values with null or 0 for cleaner JSON/handling
      Object.keys(summary).forEach((key) => {
        if (typeof summary[key] === "number" && isNaN(summary[key])) {
          summary[key] = null; // Or 0, depending on preference
        }
      });

      return summary;
    })
    .filter(Boolean); // Remove null entries if any player had no seasons

  return playerSummaries;
};
