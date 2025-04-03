// File: src/utils/dataProcessing.js
// Updated with CQI functions and modifications

import _ from "lodash";

// Helper function to safely handle NaN values
const safeNumber = (value, defaultValue = 0) => {
  return isNaN(value) ? defaultValue : value;
};

// Get unique players from pqiData
export const getUniquePlayers = (pqiData) => {
  if (!pqiData || !Array.isArray(pqiData)) {
    console.warn("Invalid pqiData in getUniquePlayers");
    return [];
  }
  return _.uniqBy(pqiData, "id");
};

// Get player data for a specific player ID
export const getPlayerData = (playerID, fullData) => {
  if (!fullData || !Array.isArray(fullData)) {
    console.warn("Invalid fullData in getPlayerData");
    return [];
  }
  return _.filter(fullData, { id: playerID });
};

// Get player career data
export const getPlayerCareer = (playerID, fullData) => {
  const playerData = getPlayerData(playerID, fullData);
  if (!playerData || playerData.length === 0) {
    console.warn(`No career data found for player ID: ${playerID}`);
    return [];
  }

  console.log(
    `Found ${playerData.length} career data points for player ID: ${playerID}`
  );

  // Ensure each data point has an age
  const validData = playerData.filter(
    (p) => p.age !== undefined && p.age !== null
  );
  if (validData.length < playerData.length) {
    console.warn(
      `Filtered out ${
        playerData.length - validData.length
      } data points with missing age for player ID: ${playerID}`
    );
  }

  // Sort by age
  const sortedData = _.sortBy(validData, "age");
  return sortedData;
};

// Normalize player data as percentage of peak value
export const normalizePlayerData = (playerData) => {
  if (!playerData || !Array.isArray(playerData) || playerData.length === 0) {
    console.warn("Invalid playerData in normalizePlayerData");
    return [];
  }

  // Filter out entries with invalid values
  const validData = playerData.filter(
    (season) => season.value !== undefined && season.value !== null
  );

  if (validData.length === 0) {
    console.warn("No valid player value data found");
    return playerData.map((season) => ({
      ...season,
      normalizedValue: 0,
    }));
  }

  const maxValueObj = _.maxBy(validData, "value");
  const maxValue = maxValueObj?.value || 1;

  if (maxValue <= 0) {
    console.warn("Maximum player value is zero or negative");
    return playerData.map((season) => ({
      ...season,
      normalizedValue: 0,
    }));
  }

  console.log(`Max value for normalization: ${maxValue}`);

  return playerData.map((season) => {
    const value =
      season.value !== undefined && season.value !== null ? season.value : 0;
    const normalized = (value / maxValue) * 100;

    return {
      ...season,
      normalizedValue: normalized,
    };
  });
};

// Get player PQI data
export const getPlayerPQI = (playerID, pqiData) => {
  if (!pqiData || !Array.isArray(pqiData)) {
    console.warn("Invalid pqiData in getPlayerPQI");
    return null;
  }
  return _.find(pqiData, { id: playerID });
};

// NEW: Get player CQI data
export const getPlayerCQI = (playerID, cqiData) => {
  if (!cqiData || !Array.isArray(cqiData)) {
    console.warn("Invalid cqiData in getPlayerCQI");
    return null;
  }
  return _.find(cqiData, { id: playerID });
};

// Get player prime data (raw)
export const getPlayerPrimeRaw = (playerID, primesRawData) => {
  if (!primesRawData || !Array.isArray(primesRawData)) {
    console.warn("Invalid primesRawData in getPlayerPrimeRaw");
    return null;
  }
  return _.find(primesRawData, { id: playerID });
};

// Get player prime data (spline)
export const getPlayerPrimeSpline = (playerID, primesSplineData) => {
  if (!primesSplineData || !Array.isArray(primesSplineData)) {
    console.warn("Invalid primesSplineData in getPlayerPrimeSpline");
    return null;
  }
  return _.find(primesSplineData, { id: playerID });
};

// Get top players by PQI score
export const getTopPlayersByPQI = (pqiData, limit = 5000, filters = {}) => {
  if (!pqiData || !Array.isArray(pqiData)) {
    console.warn("Invalid pqiData in getTopPlayersByPQI");
    return [];
  }

  let filteredData = [...pqiData];

  // Handle both single value and array filters
  if (filters.sport) {
    if (Array.isArray(filters.sport) && filters.sport.length > 0) {
      filteredData = filteredData.filter((player) =>
        filters.sport.includes(player.sport)
      );
    } else {
      filteredData = _.filter(filteredData, { sport: filters.sport });
    }
  }

  if (filters.league) {
    if (Array.isArray(filters.league) && filters.league.length > 0) {
      filteredData = filteredData.filter((player) =>
        filters.league.includes(player.league)
      );
    } else {
      filteredData = _.filter(filteredData, { league: filters.league });
    }
  }

  if (filters.position) {
    if (Array.isArray(filters.position) && filters.position.length > 0) {
      filteredData = filteredData.filter((player) =>
        filters.position.includes(player.position)
      );
    } else {
      filteredData = _.filter(filteredData, { position: filters.position });
    }
  }

  // Use a safe sorting function that handles NaN
  return _.orderBy(
    filteredData,
    [(player) => safeNumber(player.pqi_selected, -Infinity)],
    ["desc"]
  ).slice(0, limit);
};

// NEW: Get top players by CQI score
export const getTopPlayersByCQI = (cqiData, limit = 5000, filters = {}) => {
  if (!cqiData || !Array.isArray(cqiData)) {
    console.warn("Invalid cqiData in getTopPlayersByCQI");
    return [];
  }

  let filteredData = [...cqiData];

  // Handle both single value and array filters
  if (filters.sport) {
    if (Array.isArray(filters.sport) && filters.sport.length > 0) {
      filteredData = filteredData.filter((player) =>
        filters.sport.includes(player.sport)
      );
    } else {
      filteredData = _.filter(filteredData, { sport: filters.sport });
    }
  }

  if (filters.league) {
    if (Array.isArray(filters.league) && filters.league.length > 0) {
      filteredData = filteredData.filter((player) =>
        filters.league.includes(player.league)
      );
    } else {
      filteredData = _.filter(filteredData, { league: filters.league });
    }
  }

  if (filters.position) {
    if (Array.isArray(filters.position) && filters.position.length > 0) {
      filteredData = filteredData.filter((player) =>
        filters.position.includes(player.position)
      );
    } else {
      filteredData = _.filter(filteredData, { position: filters.position });
    }
  }

  // Use a safe sorting function that handles NaN
  return _.orderBy(
    filteredData,
    [(player) => safeNumber(player.cqi_selected, -Infinity)],
    ["desc"]
  ).slice(0, limit);
};

// NEW: Helper to join PQI and CQI data for comparison views
export const joinPlayerMetrics = (
  pqiData,
  cqiData,
  limit = 500,
  filters = {}
) => {
  if (
    !pqiData ||
    !cqiData ||
    !Array.isArray(pqiData) ||
    !Array.isArray(cqiData)
  ) {
    console.warn("Invalid data in joinPlayerMetrics");
    return [];
  }

  // First, filter both datasets using the provided filters
  let filteredPQI = [...pqiData];
  let filteredCQI = [...cqiData];

  // Apply filters to both datasets
  if (filters.sport && filters.sport.length > 0) {
    filteredPQI = filteredPQI.filter((player) =>
      filters.sport.includes(player.sport)
    );
    filteredCQI = filteredCQI.filter((player) =>
      filters.sport.includes(player.sport)
    );
  }

  if (filters.league && filters.league.length > 0) {
    filteredPQI = filteredPQI.filter((player) =>
      filters.league.includes(player.league)
    );
    filteredCQI = filteredCQI.filter((player) =>
      filters.league.includes(player.league)
    );
  }

  if (filters.position && filters.position.length > 0) {
    filteredPQI = filteredPQI.filter((player) =>
      filters.position.includes(player.position)
    );
    filteredCQI = filteredCQI.filter((player) =>
      filters.position.includes(player.position)
    );
  }

  // Find common players using IDs
  const pqiIds = new Set(filteredPQI.map((player) => player.id));
  const cqiIds = new Set(filteredCQI.map((player) => player.id));

  // Get players that exist in both datasets
  const commonIds = [...pqiIds].filter((id) => cqiIds.has(id));

  // Join the data
  const joinedData = commonIds.map((id) => {
    const pqiPlayer = filteredPQI.find((p) => p.id === id);
    const cqiPlayer = filteredCQI.find((p) => p.id === id);

    return {
      id,
      player_name: pqiPlayer.player_name,
      sport: pqiPlayer.sport,
      league: pqiPlayer.league,
      position: pqiPlayer.position,
      pqi_score: pqiPlayer.pqi_selected || 0,
      cqi_score: cqiPlayer.cqi_selected || 0,
      pqi_tier: pqiPlayer.selected_tier,
      cqi_tier: cqiPlayer.selected_tier,
      career_seasons: pqiPlayer.career_seasons || cqiPlayer.career_seasons || 0,
      prime_seasons: pqiPlayer.prime_seasons || 0,
      prime_peak_value: pqiPlayer.prime_peak_value || 0,
      career_peak_value: cqiPlayer.career_peak_value || 0,
      career_avg_value: cqiPlayer.career_avg_value || 0,
      career_games: cqiPlayer.career_games || 0,
      is_active: cqiPlayer.is_active || false,
      // Calculate percentile difference
      index_difference:
        (cqiPlayer.cqi_selected || 0) - (pqiPlayer.pqi_selected || 0),
      index_ratio: pqiPlayer.pqi_selected
        ? (cqiPlayer.cqi_selected || 0) / pqiPlayer.pqi_selected
        : 0,
    };
  });

  // Sort by the absolute difference between CQI and PQI (to find most divergent players)
  return _.orderBy(
    joinedData,
    [(player) => Math.abs(player.index_difference)],
    ["desc"]
  ).slice(0, limit);
};

// Get players with longest primes
export const getPlayersByPrimeDuration = (
  primesSplineData,
  pqiData,
  limit = 100,
  filters = {}
) => {
  if (
    !primesSplineData ||
    !Array.isArray(primesSplineData) ||
    !pqiData ||
    !Array.isArray(pqiData)
  ) {
    console.warn("Invalid data in getPlayersByPrimeDuration");
    return [];
  }

  // Join prime duration data with player info
  const joinedData = primesSplineData
    .filter((prime) => prime && prime.id && prime.prime_duration) // Ensure we have valid data
    .map((prime) => {
      const playerInfo = _.find(pqiData, { id: prime.id });
      if (!playerInfo) return null;
      return {
        ...prime,
        ...playerInfo,
        // Ensure prime_duration is a number for proper sorting
        prime_duration:
          typeof prime.prime_duration === "number"
            ? prime.prime_duration
            : parseInt(prime.prime_duration) || 0,
      };
    })
    .filter((item) => item); // Remove null items

  console.log("Joined prime data:", joinedData.length, "players");

  let filteredData = [...joinedData];

  // Apply filters
  if (filters.sport) {
    if (Array.isArray(filters.sport) && filters.sport.length > 0) {
      filteredData = filteredData.filter((player) =>
        filters.sport.includes(player.sport)
      );
    } else {
      filteredData = _.filter(filteredData, { sport: filters.sport });
    }
  }

  if (filters.league) {
    if (Array.isArray(filters.league) && filters.league.length > 0) {
      filteredData = filteredData.filter((player) =>
        filters.league.includes(player.league)
      );
    } else {
      filteredData = _.filter(filteredData, { league: filters.league });
    }
  }

  if (filters.position) {
    if (Array.isArray(filters.position) && filters.position.length > 0) {
      filteredData = filteredData.filter((player) =>
        filters.position.includes(player.position)
      );
    } else {
      filteredData = _.filter(filteredData, { position: filters.position });
    }
  }

  // Log the range of prime durations to help debug
  if (filteredData.length > 0) {
    const durations = filteredData.map((p) => p.prime_duration);
    console.log(
      "Prime durations range:",
      Math.min(...durations),
      "to",
      Math.max(...durations),
      "Average:",
      _.mean(durations).toFixed(2)
    );
  }

  // Ensure we're sorting numerically, not alphabetically
  return _.orderBy(
    filteredData,
    [(player) => Number(player.prime_duration) || 0],
    ["desc"]
  ).slice(0, limit);
};

// Get prime distribution by age
export const getPrimeDistributionByAge = (fullData) => {
  if (!fullData || !Array.isArray(fullData)) {
    console.warn("Invalid fullData in getPrimeDistributionByAge");
    return [];
  }

  // Group data by age and count players in prime
  const ageGroups = _.groupBy(fullData, "age");

  return Object.keys(ageGroups)
    .map((age) => {
      const ageGroup = ageGroups[age];
      const totalPlayers = ageGroup.length;
      if (totalPlayers === 0) return null;

      const playersInPrime = _.filter(ageGroup, { in_prime: true }).length;
      const peakAgePlayers = _.filter(ageGroup, { is_peak_age: true }).length;

      return {
        age: parseInt(age),
        totalPlayers,
        playersInPrime,
        peakAgePlayers,
        primePercentage: safeNumber((playersInPrime / totalPlayers) * 100),
        peakPercentage: safeNumber((peakAgePlayers / totalPlayers) * 100),
      };
    })
    .filter((item) => item && item.totalPlayers > 10); // Filter out ages with too few samples
};

// Get aging curves by league
export const getAgingCurvesByLeague = (fullData) => {
  if (!fullData || !Array.isArray(fullData)) {
    console.warn("Invalid fullData in getAgingCurvesByLeague");
    return [];
  }

  // Group data by league and age
  const leagueGroups = _.groupBy(fullData, "league");

  return Object.keys(leagueGroups).map((league) => {
    const leagueData = leagueGroups[league];
    const ageGroups = _.groupBy(leagueData, "age");

    const agingCurve = Object.keys(ageGroups)
      .map((age) => {
        const ageGroup = ageGroups[age];
        if (ageGroup.length === 0) return null;

        // Safely calculate average value
        const avgValue = safeNumber(_.meanBy(ageGroup, "scaled_value"));

        return {
          age: parseInt(age),
          avgValue,
          count: ageGroup.length,
        };
      })
      .filter((item) => item && item.count > 5) // Filter out ages with too few samples
      .sort((a, b) => a.age - b.age);

    return {
      league,
      agingCurve,
    };
  });
};

// Get unique positions from data
export const getUniquePositions = (pqiData) => {
  if (!pqiData || !Array.isArray(pqiData)) {
    console.warn("Invalid pqiData in getUniquePositions");
    return [];
  }
  return _.uniq(pqiData.map((player) => player.position)).filter(Boolean);
};

// Get unique leagues from data
export const getUniqueLeagues = (pqiData) => {
  if (!pqiData || !Array.isArray(pqiData)) {
    console.warn("Invalid pqiData in getUniqueLeagues");
    return [];
  }
  return _.uniq(pqiData.map((player) => player.league)).filter(Boolean);
};

// Search players by name (partial match)
export const searchPlayersByName = (name, pqiData) => {
  if (!pqiData || !Array.isArray(pqiData) || !name) {
    console.warn("Invalid input in searchPlayersByName");
    return [];
  }

  const searchTerm = name.toLowerCase();
  return pqiData.filter(
    (player) =>
      player.player_name &&
      player.player_name.toLowerCase().includes(searchTerm)
  );
};

// Get predicted performance data for a specific player
export const getPlayerPredictions = (playerID, predictionsData) => {
  if (!predictionsData || !Array.isArray(predictionsData)) {
    console.warn("Invalid predictionsData in getPlayerPredictions");
    return [];
  }

  // Filter to get only this player's predictions
  const playerPredictions = predictionsData.filter(
    (prediction) => prediction.id === playerID
  );

  if (!playerPredictions || playerPredictions.length === 0) {
    console.warn(`No prediction data found for player ID: ${playerID}`);
    return [];
  }

  // Sort by age
  const sortedPredictions = _.sortBy(playerPredictions, "age");

  return sortedPredictions;
};
