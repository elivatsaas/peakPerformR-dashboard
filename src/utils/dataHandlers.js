// src/utils/dataHandlers.js
import _ from "lodash";

/**
 * Updates the main player dataset with 'in_prime' indicators based on calculated prime boundaries.
 * Uses the 'raw' prime method results for this flag.
 *
 * @param {Array<Object>} fullData - The original full dataset of player seasons.
 * @param {Array<Object>} newRawPrimes - The array of prime results calculated using method='actual'.
 * @returns {Array<Object>} A new array with updated 'in_prime' flags.
 */
export const updatePrimeIndicators = (fullData, newRawPrimes) => {
  if (!Array.isArray(fullData) || !Array.isArray(newRawPrimes)) {
    console.error("updatePrimeIndicators: Invalid input data.");
    return fullData || []; // Return original or empty if invalid
  }

  // Create a map for faster lookup of prime data by player ID
  const primeMap = new Map(newRawPrimes.map((p) => [p.id, p]));

  return fullData.map((season) => {
    const primeInfo = primeMap.get(season.id);
    let in_prime = false; // Default to false

    if (primeInfo && typeof season.age === "number") {
      in_prime =
        season.age >= primeInfo.start_age && season.age <= primeInfo.end_age;
    }

    return {
      ...season,
      in_prime, // Add or update the in_prime flag
    };
  });
};

// We might not need storeOriginalData or createModifiedDataset if
// the parent component manages the active dataset. Let's keep it simple for now.
