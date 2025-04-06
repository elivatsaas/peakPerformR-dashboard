// src/utils/pqiCqi.js
import _ from "lodash";

/**
 * Calculates the percentile rank of values in an array.
 * Mimics dplyr::percent_rank -> (rank(x, ties.method = "min") - 1) / (n - 1)
 * @param {number[]} values - Array of numeric values.
 * @returns {number[]} Array of percentile ranks (0-1), or empty array if input is invalid.
 */
const calculatePercentRank = (values) => {
  if (!Array.isArray(values) || values.length === 0) {
    return [];
  }
  if (values.length === 1) {
    return [0.5]; // Or 0, depending on desired behavior for single item. R's behavior might yield NaN or 0. Let's default to 0.5 as a neutral middle. Adjust if needed.
    // R's percent_rank would likely produce NaN here as (1-1)/(1-1) = 0/0.
    // A single value doesn't have a rank relative to others.
    // Let's return NaN to signal this edge case clearly.
    return [NaN]; // More accurate reflection of the formula limitation
  }

  // Create pairs of [value, originalIndex]
  const indexedValues = values.map((value, index) => ({ value, index }));

  // Sort by value
  indexedValues.sort((a, b) => a.value - b.value);

  // Calculate min ranks (handle ties)
  const ranks = new Array(values.length);
  let currentRank = 1;
  for (let i = 0; i < indexedValues.length; i++) {
    if (i > 0 && indexedValues[i].value > indexedValues[i - 1].value) {
      currentRank = i + 1; // Update rank only if value changed
    }
    // Assign rank based on original index
    ranks[indexedValues[i].index] = currentRank;
  }

  // Calculate percentile rank: (rank - 1) / (n - 1)
  const n = values.length;
  const percentRanks = ranks.map((rank) => (rank - 1) / (n - 1));

  return percentRanks;
};

/**
 * Assigns a PQI tier based on the PQI score (percentile rank * 100).
 * Matches the R code's percentile tier boundaries.
 * @param {number} pqiScore - The PQI score (0-100).
 * @returns {string} The assigned prime tier name.
 */
const assignPrimeTierPercentile = (pqiScore) => {
  if (isNaN(pqiScore)) return "N/A"; // Handle NaN scores
  if (pqiScore >= 95) return "Hall of Fame";
  if (pqiScore >= 75) return "Elite Player";
  if (pqiScore >= 45) return "Great Starter";
  if (pqiScore >= 15) return "Starter";
  return "Backup";
};

/**
 * Assigns a CQI tier based on the CQI score (percentile rank * 100).
 * Matches the R code's percentile tier boundaries.
 * @param {number} cqiScore - The CQI score (0-100).
 * @returns {string} The assigned career tier name.
 */
const assignCareerTierPercentile = (cqiScore) => {
  if (isNaN(cqiScore)) return "N/A"; // Handle NaN scores
  if (cqiScore >= 95) return "Hall of Fame";
  if (cqiScore >= 85) return "Elite Career"; // Note: R uses 85 for CQI Elite
  if (cqiScore >= 70) return "Great Career"; // Note: R uses 70 for CQI Great
  if (cqiScore >= 40) return "Solid Career"; // Note: R uses 40 for CQI Solid
  return "Limited Career";
};

/**
 * Calculate Prime Quality Index (PQI). Mirrors R's calculate_prime_quality_index.
 * Assumes input data is pre-processed similar to R's process_player_primes output.
 * Uses percentile tiering only.
 *
 * @param {Array<Object>} playerData - Array of player summary objects. Required fields: id, league, position, prime_seasons, prime_avg_tier, prime_avg_value, prime_peak_value.
 * @param {Object} options - Calculation options.
 * @param {boolean} [options.nflByPosition=true] - Whether to normalize NFL by position.
 * @param {string[]} [options.excludePositions=["OL"]] - Positions to exclude.
 * // tier_method is assumed 'percentile' as clustering is not implemented here.
 * @returns {Array<Object>} playerData with added pqi_raw, pqi_score, and prime_tier fields.
 */
export const calculatePQI = (playerData, options = {}) => {
  if (!Array.isArray(playerData)) {
    console.error("calculatePQI: Invalid playerData input.");
    return [];
  }

  const {
    nflByPosition = true,
    excludePositions = ["OL"], // Default from R code
    // tier_method = "percentile" // Implicitly percentile
  } = options;

  // 1. Filter out excluded positions
  const filteredData = playerData.filter(
    (player) => player.position && !excludePositions.includes(player.position)
  );

  // 2. Ensure distinct players (R code does this, good practice)
  // Note: This assumes the input might have duplicates per ID, adjust if input is guaranteed unique
  const distinctData = _.uniqBy(filteredData, "id");

  // 3. Calculate raw PQI score for each player
  const withRawPQI = distinctData.map((player) => {
    // Validate required fields exist and are numbers
    const requiredFields = [
      "prime_seasons",
      "prime_avg_tier",
      "prime_avg_value",
      "prime_peak_value",
    ];
    const hasRequired = requiredFields.every(
      (f) => typeof player[f] === "number" && !isNaN(player[f])
    );

    let pqi_raw = 0.01; // Default small value like R

    if (hasRequired && player.prime_seasons > 0) {
      // Apply safety check similar to R's pmax(prime_avg_value, 0.01)
      const primeAvgValueSafe = Math.max(player.prime_avg_value, 0.01);

      // R formula: prime_avg_tier * log(prime_seasons + 1) * prime_avg_value_safe * (1 + (prime_peak_value * 0.3))
      pqi_raw =
        player.prime_avg_tier *
        Math.log(player.prime_seasons + 1) *
        primeAvgValueSafe *
        (1 + player.prime_peak_value * 0.3);

      // Handle potential NaN/Infinity from log or calculations
      if (isNaN(pqi_raw) || !isFinite(pqi_raw)) {
        pqi_raw = 0.01;
      }
    } else if (player.prime_seasons === 0) {
      pqi_raw = 0.01; // Explicitly handle 0 prime seasons case
    }
    // If required fields are missing, pqi_raw remains 0.01

    return { ...player, pqi_raw };
  });

  // 4. Group data for percentile calculation (matches R logic)
  const groupedData = _.groupBy(withRawPQI, (player) => {
    const usePositionGrouping = nflByPosition && player.league === "NFL";
    return usePositionGrouping
      ? `${player.league}-${player.position}`
      : player.league;
  });

  // 5. Calculate percentile ranks (pqi_score) within each group
  const withPqiScore = [];
  Object.values(groupedData).forEach((group) => {
    const rawValues = group.map((p) => p.pqi_raw);
    const percentRanks = calculatePercentRank(rawValues); // Get ranks (0-1)

    group.forEach((player, index) => {
      // Convert percentile rank (0-1) to score (0-100)
      const pqi_score = isNaN(percentRanks[index])
        ? 0
        : percentRanks[index] * 100; // Default NaN to 0 score

      // Assign tier based on the calculated score
      const prime_tier = assignPrimeTierPercentile(pqi_score);

      withPqiScore.push({
        ...player,
        pqi_score,
        prime_tier,
      });
    });
  });

  return withPqiScore; // Return the final data with PQI scores and tiers
};

/**
 * Calculate Career Quality Index (CQI). Mirrors R's calculate_career_quality_index.
 * Assumes input data is pre-aggregated at the career level.
 * Uses percentile tiering only.
 *
 * @param {Array<Object>} careerData - Array of player career summary objects. Required fields: id, league, position, career_seasons, career_avg_tier, career_avg_value, career_peak_value.
 * @param {Object} options - Calculation options.
 * @param {boolean} [options.nflByPosition=true] - Whether to normalize NFL by position.
 * @param {string[]} [options.excludePositions=["OL"]] - Positions to exclude.
 * @param {number} [options.minSeasons=5] - Minimum career seasons required.
 * // tier_method is assumed 'percentile'
 * @returns {Array<Object>} careerData with added cqi_raw, cqi_score, and career_tier fields.
 */
export const calculateCQI = (careerData, options = {}) => {
  if (!Array.isArray(careerData)) {
    console.error("calculateCQI: Invalid careerData input.");
    return [];
  }

  const {
    nflByPosition = true,
    excludePositions = ["OL"],
    minSeasons = 5, // Default from R code
    // tier_method = "percentile" // Implicitly percentile
  } = options;

  // 1. Filter out excluded positions AND players below min_seasons
  const filteredData = careerData.filter(
    (player) =>
      player.position &&
      !excludePositions.includes(player.position) &&
      typeof player.career_seasons === "number" &&
      player.career_seasons >= minSeasons
  );

  // 2. Ensure distinct players (R code does this)
  const distinctData = _.uniqBy(filteredData, "id");

  // 3. Calculate raw CQI score
  const withRawCQI = distinctData.map((player) => {
    // Validate required fields
    const requiredFields = [
      "career_seasons",
      "career_avg_tier",
      "career_avg_value",
      "career_peak_value",
    ];
    const hasRequired = requiredFields.every(
      (f) => typeof player[f] === "number" && !isNaN(player[f])
    );

    let cqi_raw = 0.01; // Default small value

    if (hasRequired && player.career_seasons > 0) {
      // career_seasons already filtered >= minSeasons
      const careerAvgValueSafe = Math.max(player.career_avg_value, 0.01);

      // R formula: career_avg_tier * log(career_seasons + 1) * career_avg_value_safe * (1 + (career_peak_value * 0.1))
      cqi_raw =
        player.career_avg_tier *
        Math.log(player.career_seasons + 1) *
        careerAvgValueSafe *
        (1 + player.career_peak_value * 0.1); // Note 0.1 peak bonus for CQI

      if (isNaN(cqi_raw) || !isFinite(cqi_raw)) {
        cqi_raw = 0.01;
      }
    } // No explicit else needed as default is 0.01

    return { ...player, cqi_raw };
  });

  // 4. Group data for percentile calculation (matches R logic)
  const groupedData = _.groupBy(withRawCQI, (player) => {
    const usePositionGrouping = nflByPosition && player.league === "NFL";
    return usePositionGrouping
      ? `${player.league}-${player.position}`
      : player.league;
  });

  // 5. Calculate percentile ranks (cqi_score) within each group
  const withCqiScore = [];
  Object.values(groupedData).forEach((group) => {
    const rawValues = group.map((p) => p.cqi_raw);
    const percentRanks = calculatePercentRank(rawValues); // Ranks (0-1)

    group.forEach((player, index) => {
      const cqi_score = isNaN(percentRanks[index])
        ? 0
        : percentRanks[index] * 100; // Score (0-100), default NaN to 0

      // Assign tier based on score using CQI boundaries from R
      const career_tier = assignCareerTierPercentile(cqi_score);

      withCqiScore.push({
        ...player,
        cqi_score,
        career_tier,
      });
    });
  });

  return withCqiScore;
};
