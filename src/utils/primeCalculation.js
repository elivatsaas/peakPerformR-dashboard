// src/utils/primeCalculation.js
import _ from "lodash";

// --- Constants ---
const DEFAULT_METHOD = "predicted";
const DEFAULT_THRESHOLD_PCT = 70;
const DEFAULT_GAMES_PCT_THRESHOLD = 40;
const DEFAULT_MIN_SEASONS = 5;
const PROGRESS_UPDATE_INTERVAL = 100; // Update progress every N players

// --- Helper Functions (calculatePercentile, calculateGamesThresholds, findPeakPerformance, calculateThresholdValue) ---
// Keep the helper functions as provided in the previous answer. They are robust.
// Ensure JSDoc comments are clear and accurate for each.

/**
 * Calculates the value at a given percentile in an array using linear interpolation.
 * Matches R's type 7 quantile behavior (default).
 * @param {number[]} values - Array of numeric values (will be sorted internally).
 * @param {number} percentile - Percentile to calculate (0-100).
 * @returns {number} The calculated percentile value, or NaN if input is invalid.
 * @throws {Error} if percentile is not between 0 and 100.
 */
export const calculatePercentile = (values, percentile) => {
  if (!Array.isArray(values) || values.length === 0) {
    return NaN;
  }
  if (percentile < 0 || percentile > 100) {
    throw new Error("Percentile must be between 0 and 100.");
  }
  const sorted = values
    .filter((v) => typeof v === "number" && !isNaN(v))
    .sort((a, b) => a - b);
  if (sorted.length === 0) {
    return NaN;
  }
  if (sorted.length === 1) {
    return sorted[0];
  }
  const index = (percentile / 100) * (sorted.length - 1);
  const lowerIndex = Math.floor(index);
  const upperIndex = Math.ceil(index);
  if (index === 0) return sorted[0];
  if (index === sorted.length - 1) return sorted[sorted.length - 1];
  if (lowerIndex === upperIndex) {
    return sorted[lowerIndex];
  }
  const lowerValue = sorted[lowerIndex];
  const upperValue = sorted[upperIndex];
  const weight = index - lowerIndex;
  return lowerValue * (1 - weight) + upperValue * weight;
};

/**
 * Calculates games played percentile thresholds for each league.
 * @param {Array<Object>} data - Array of player season objects. Must have 'league', 'games_played'.
 * @param {number} gamesPctThreshold - Percentile threshold (0-100).
 * @returns {Object<string, number>} Mapping of league to games threshold. Returns NaN for leagues with insufficient valid data.
 */
export const calculateGamesThresholds = (data, gamesPctThreshold) => {
  if (!Array.isArray(data)) return {};
  const leagueGroups = _.groupBy(data, "league");
  const gamesThresholds = {};
  Object.keys(leagueGroups).forEach((league) => {
    const gamesPlayed = leagueGroups[league]
      .map((row) => row.games_played)
      .filter((games) => typeof games === "number" && !isNaN(games));
    if (gamesPlayed.length > 0) {
      gamesThresholds[league] = calculatePercentile(
        gamesPlayed,
        gamesPctThreshold
      );
    } else {
      gamesThresholds[league] = NaN;
      // Consider logging this warning only if verbose logging is enabled
      // console.warn(`No valid games_played data for league: ${league}. Threshold set to NaN.`);
    }
  });
  return gamesThresholds;
};

/**
 * Finds the peak performance season for a player.
 * @param {Array<Object>} playerData - Player's season data, sorted by age.
 * @param {string} valueField - Key ('predicted_value' or 'player_value') for peak finding.
 * @returns {{maxValue: number, maxAge: number, maxIdx: number} | null} Peak info or null.
 */
export const findPeakPerformance = (playerData, valueField) => {
  let maxValue = -Infinity;
  let maxAge = null;
  let maxIdx = -1;
  playerData.forEach((season, idx) => {
    const value = season[valueField];
    if (typeof value === "number" && !isNaN(value) && value > maxValue) {
      maxValue = value;
      maxAge = season.age;
      maxIdx = idx;
    }
  });
  return maxIdx === -1 ? null : { maxValue, maxAge, maxIdx };
};

/**
 * Calculates the performance threshold value for prime determination.
 * @param {Array<Object>} playerData - Player's season data.
 * @param {number} maxValue - Player's peak performance value.
 * @param {string} valueField - Key ('predicted_value' or 'player_value').
 * @param {number} thresholdPct - Percentage threshold (0-100).
 * @returns {number} Calculated threshold value, or NaN.
 */
export const calculateThresholdValue = (
  playerData,
  maxValue,
  valueField,
  thresholdPct
) => {
  const values = playerData
    .map((season) => season[valueField])
    .filter((value) => typeof value === "number" && !isNaN(value));
  if (values.length === 0) return NaN;
  const minValue = Math.min(...values);
  const valueRange = maxValue - minValue;
  if (valueRange === 0) return maxValue; // Or minValue, they are the same
  const thresholdDecimal = thresholdPct / 100;
  return minValue + valueRange * thresholdDecimal;
};

/**
 * Cleans and prepares player data for prime calculation for a single player.
 * Ensures required fields are present and valid, defaults games_played.
 * @param {Array<Object>} rawPlayerData - Unfiltered data for a single player.
 * @param {string} valueField - The field used for performance value.
 * @returns {Array<Object>} Sorted and cleaned player data.
 */
const preparePlayerData = (rawPlayerData, valueField) => {
  return _.sortBy(rawPlayerData, "age")
    .filter(
      (row) =>
        row.age !== undefined &&
        row.age !== null &&
        row[valueField] !== undefined &&
        row[valueField] !== null &&
        // Allow missing games_played initially, will be defaulted
        (typeof row.games_played === "number" ||
          row.games_played === undefined ||
          row.games_played === null)
    )
    .map((row) => ({
      ...row,
      // Ensure games_played is 0 if missing/invalid for skip logic consistency
      games_played:
        typeof row.games_played === "number" && !isNaN(row.games_played)
          ? row.games_played
          : 0,
    }));
};

/**
 * Identifies prime years for players based on performance data.
 * Replicates the logic of the R `identify_prime` function.
 *
 * @param {Array<Object>} data - Full dataset of player seasons. Required fields: 'id', 'league', 'age', 'games_played', and either 'predicted_value' or 'player_value'. For method='actual', 'season' is also needed.
 * @param {Object} options - Calculation options.
 * @param {"predicted" | "actual"} [options.method=DEFAULT_METHOD] - Method to use.
 * @param {number} [options.thresholdPct=DEFAULT_THRESHOLD_PCT] - Performance threshold percentage (0-100).
 * @param {number} [options.gamesPctThreshold=DEFAULT_GAMES_PCT_THRESHOLD] - Games played percentile threshold (0-100).
 * @param {number} [options.minSeasons=DEFAULT_MIN_SEASONS] - Minimum seasons for method='actual'.
 * @param {function(number, number): void} [options.progressCallback=null] - Optional callback for progress (processedCount, totalCount).
 * @param {boolean} [options.verbose=false] - Enable verbose logging for warnings.
 * @returns {Array<Object>} Array of prime results for eligible players. Fields: id, league, max_value_age, start_age, end_age, prime_duration, threshold_value, threshold_pct, skip_before_used, skip_after_used.
 */
export const identifyPrime = (data, options = {}) => {
  if (!Array.isArray(data) || data.length === 0) {
    console.error(
      "identifyPrime: Invalid input data provided. Returning empty array."
    );
    return [];
  }

  // --- Options Processing & Validation ---
  const {
    method = DEFAULT_METHOD,
    thresholdPct = DEFAULT_THRESHOLD_PCT,
    gamesPctThreshold = DEFAULT_GAMES_PCT_THRESHOLD,
    minSeasons = DEFAULT_MIN_SEASONS,
    progressCallback = null,
    verbose = false, // Added verbose option
  } = options;

  // Validate options (throw errors for invalid critical options)
  if (!["predicted", "actual"].includes(method))
    throw new Error("Invalid method. Use 'predicted' or 'actual'.");
  if (thresholdPct < 0 || thresholdPct > 100)
    throw new Error("thresholdPct must be between 0 and 100.");
  if (gamesPctThreshold < 0 || gamesPctThreshold > 100)
    throw new Error("gamesPctThreshold must be between 0 and 100.");
  if (minSeasons < 1) throw new Error("minSeasons must be at least 1.");

  const valueField =
    method === "predicted" ? "predicted_value" : "player_value";

  // --- Pre-calculations ---
  const gamesThresholds = calculateGamesThresholds(data, gamesPctThreshold);

  // --- Determine Player IDs ---
  let playerIds;
  if (method === "actual") {
    const playerSeasons = _.groupBy(data, "id");
    playerIds = Object.keys(playerSeasons).filter((id) => {
      const seasons =
        playerSeasons[id]?.map((s) => s.season).filter((s) => s != null) ?? [];
      return new Set(seasons).size >= minSeasons;
    });
  } else {
    playerIds = [...new Set(data.map((row) => row.id))];
  }

  // --- Main Processing Loop ---
  const primeResults = [];
  const totalPlayers = playerIds.length;
  if (verbose)
    console.log(
      `identifyPrime: Starting for ${totalPlayers} players (method: ${method})`
    );

  playerIds.forEach((pid, index) => {
    const rawPlayerData = data.filter((row) => row.id === pid);
    const playerData = preparePlayerData(rawPlayerData, valueField);

    // --- Eligibility Checks ---
    if (
      (method === "predicted" && playerData.length < 2) ||
      (method === "actual" && playerData.length < minSeasons)
    ) {
      // if (verbose) console.warn(`Skipping player ${pid}: Insufficient valid data points (${playerData.length}).`);
      return;
    }

    const playerLeague = playerData[0]?.league;
    if (!playerLeague) {
      if (verbose)
        console.warn(`Skipping player ${pid}: Missing league information.`);
      return;
    }

    const gamesThreshold = gamesThresholds[playerLeague];
    if (isNaN(gamesThreshold)) {
      if (verbose)
        console.warn(
          `Skipping player ${pid}: Invalid games threshold (NaN) for league ${playerLeague}.`
        );
      return;
    }

    const peakInfo = findPeakPerformance(playerData, valueField);
    if (!peakInfo) {
      // if (verbose) console.warn(`Skipping player ${pid}: Could not find peak performance.`);
      return;
    }
    const { maxValue, maxAge, maxIdx } = peakInfo;

    const thresholdValue = calculateThresholdValue(
      playerData,
      maxValue,
      valueField,
      thresholdPct
    );
    if (isNaN(thresholdValue)) {
      // if (verbose) console.warn(`Skipping player ${pid}: Could not calculate threshold value.`);
      return;
    }

    // --- Find Prime Boundaries ---
    let startIdx = maxIdx;
    let skipUsedBefore = false;
    if (maxIdx > 0) {
      for (let i = maxIdx - 1; i >= 0; i--) {
        const season = playerData[i];
        if (season[valueField] >= thresholdValue) {
          startIdx = i;
        } else if (!skipUsedBefore && season.games_played <= gamesThreshold) {
          skipUsedBefore = true; // Consume the skip
        } else {
          break; // Stop extending
        }
      }
    }

    let endIdx = maxIdx;
    let skipUsedAfter = false;
    if (maxIdx < playerData.length - 1) {
      for (let i = maxIdx + 1; i < playerData.length; i++) {
        const season = playerData[i];
        if (season[valueField] >= thresholdValue) {
          endIdx = i;
        } else if (!skipUsedAfter && season.games_played <= gamesThreshold) {
          skipUsedAfter = true; // Consume the skip
        } else {
          break; // Stop extending
        }
      }
    }

    // --- Record Result ---
    const startAge = playerData[startIdx]?.age;
    const endAge = playerData[endIdx]?.age;
    if (typeof startAge !== "number" || typeof endAge !== "number") {
      if (verbose)
        console.warn(
          `Skipping player ${pid}: Invalid start (${startAge}) or end (${endAge}) age calculated.`
        );
      return;
    }

    primeResults.push({
      id: pid,
      league: playerLeague,
      max_value_age: maxAge,
      start_age: startAge,
      end_age: endAge,
      prime_duration: endAge - startAge + 1,
      threshold_value: thresholdValue,
      threshold_pct: thresholdPct,
      skip_before_used: skipUsedBefore,
      skip_after_used: skipUsedAfter,
    });

    // --- Progress ---
    if (progressCallback && (index + 1) % PROGRESS_UPDATE_INTERVAL === 0) {
      progressCallback(index + 1, totalPlayers);
    }
  }); // End forEach player

  if (verbose)
    console.log(
      `identifyPrime: Finished. Found primes for ${primeResults.length} / ${totalPlayers} players.`
    );
  if (progressCallback) progressCallback(totalPlayers, totalPlayers); // Final update

  return primeResults;
};
