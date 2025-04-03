import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  searchPlayersByName,
  getPlayerCareer,
  getPlayerPQI,
  getPlayerCQI,
  getPlayerPrimeRaw,
  getPlayerPrimeSpline,
  getPlayerPredictions,
} from "../utils/dataProcessing";
import { leagueColorMapping, tierColorMapping } from "../utils/constants";
import ContextInfo from "./ContextInfo";
import "../styles/PlayerComparison.css";

// Helper function to normalize a player's values to 0-100 scale
const normalizePlayerValues = (data, valueKey) => {
  if (!data || data.length === 0) return [];

  // Find min and max values
  const validValues = data
    .filter((item) => item && typeof item[valueKey] === "number")
    .map((item) => item[valueKey]);

  if (validValues.length === 0) return data;

  const minValue = Math.min(...validValues);
  const maxValue = Math.max(...validValues);

  // Avoid division by zero
  const valueRange = maxValue - minValue;
  if (valueRange === 0) {
    return data.map((item) => ({
      ...item,
      normalizedValue: 50,
    }));
  }

  // Normalize each value to 0-100 scale
  return data.map((item) => {
    if (item && typeof item[valueKey] === "number") {
      const normalizedValue = ((item[valueKey] - minValue) / valueRange) * 100;
      return {
        ...item,
        normalizedValue,
      };
    }
    return { ...item, normalizedValue: null };
  });
};

const PlayerSummaryTable = ({ player, playerInfo }) => {
  if (!playerInfo) return null;

  // Use spline data to determine prime metrics and use predicted data for the peak value
  const peakAge = playerInfo.primeSpline?.max_value_age || "N/A";
  const primePeakValue =
    playerInfo.predictedData
      ?.find((d) => d.age === peakAge)
      ?.normalizedValue?.toFixed(1) || "N/A";
  const primeStart = playerInfo.primeSpline?.start_age || "N/A";
  const primeEnd = playerInfo.primeSpline?.end_age || "N/A";
  const primeDuration = playerInfo.primeSpline
    ? playerInfo.primeSpline.end_age - playerInfo.primeSpline.start_age + 1
    : "N/A";

  return (
    <div className="player-summary">
      <h4>
        Career Summary
        <ContextInfo
          title="Career Summary Table"
          description="This table shows key metrics about the player's career path using spline-based predicted data, including their prime years, peak age, and both PQI and CQI scores. PQI (Performance Quotient Index) focuses on prime years and peak performance, while CQI (Career Quality Index) evaluates overall career quality."
        />
      </h4>
      <table>
        <tbody>
          <tr>
            <td>Peak Age:</td>
            <td>{peakAge}</td>
            <td>Prime Duration:</td>
            <td>{primeDuration} years</td>
          </tr>
          <tr>
            <td>Prime Period:</td>
            <td colSpan="3">
              Ages {primeStart} - {primeEnd}
            </td>
          </tr>
          <tr>
            <td>PQI Score:</td>
            <td>{playerInfo.pqiData?.pqi_selected?.toFixed(2) || "N/A"}</td>
            <td>PQI Tier:</td>
            <td
              style={{
                color:
                  tierColorMapping[playerInfo.pqiData?.selected_tier] || "#333",
              }}
            >
              {playerInfo.pqiData?.selected_tier || "N/A"}
            </td>
          </tr>
          <tr>
            <td>CQI Score:</td>
            <td>{playerInfo.cqiData?.cqi_selected?.toFixed(2) || "N/A"}</td>
            <td>CQI Tier:</td>
            <td
              style={{
                color:
                  tierColorMapping[playerInfo.cqiData?.selected_tier] || "#333",
              }}
            >
              {playerInfo.cqiData?.selected_tier || "N/A"}
            </td>
          </tr>
          <tr>
            <td>Peak Value:</td>
            <td colSpan="3">{primePeakValue}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// Chart component to keep rendering consistent between main view and popup
const PlayerCharts = ({ player, playerInfo, isPopup = false }) => {
  const {
    careerData = [],
    predictedData = [],
    primeRaw,
    primeSpline,
  } = playerInfo || {};

  // Ensure we have valid chart data
  const hasValidData = careerData && careerData.length > 0;
  const hasPredictedData = predictedData && predictedData.length > 0;

  return (
    <div className={`charts-container ${isPopup ? "popup-charts" : ""}`}>
      <div className={`charts-row ${isPopup ? "popup-charts-row" : ""}`}>
        {/* Actual Performance Chart with Raw Prime */}
        <div className={`chart-column ${isPopup ? "popup-chart-column" : ""}`}>
          <h4>
            Actual Performance
            {!isPopup && (
              <ContextInfo
                title="Actual Performance Chart"
                description="This chart shows the player's normalized performance (0-100%) throughout their career. The shaded area indicates their prime years, and the vertical line shows their peak age."
              />
            )}
          </h4>
          {hasValidData ? (
            <ResponsiveContainer width="100%" height={isPopup ? 300 : 300}>
              <LineChart
                data={careerData.filter(
                  (d) =>
                    d && d.age !== undefined && d.normalizedValue !== undefined
                )}
                margin={{ top: 5, right: 20, bottom: 20, left: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="age"
                  type="number"
                  domain={["auto", "auto"]}
                  allowDecimals={false}
                  label={{
                    value: "Age",
                    position: "insideBottom",
                    offset: -5,
                  }}
                />
                <YAxis
                  domain={[0, 100]}
                  label={{
                    value: "Performance (%)",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip
                  formatter={(value) => (value ? value.toFixed(1) : "N/A")}
                />
                <Legend />

                {/* Prime period (raw) */}
                {primeRaw && (
                  <ReferenceArea
                    x1={primeRaw.start_age}
                    x2={primeRaw.end_age}
                    fill={leagueColorMapping[player.league] || "#8884d8"}
                    fillOpacity={0.2}
                  />
                )}

                {/* Peak age line */}
                {primeRaw && (
                  <ReferenceLine
                    x={primeRaw.max_value_age}
                    stroke={leagueColorMapping[player.league] || "#8884d8"}
                    strokeDasharray="3 3"
                    label={{ value: "Peak", position: "top" }}
                  />
                )}

                <Line
                  type="monotone"
                  dataKey="normalizedValue"
                  stroke={leagueColorMapping[player.league] || "#8884d8"}
                  activeDot={{ r: 6 }}
                  name="Actual Performance"
                  isAnimationActive={false}
                  dot={true}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-chart-data">
              No career performance data available for this player
            </div>
          )}
        </div>

        {/* Predicted Performance Chart with Spline Prime */}
        <div className={`chart-column ${isPopup ? "popup-chart-column" : ""}`}>
          <h4>
            Predicted Performance
            {!isPopup && (
              <ContextInfo
                title="Predicted Performance Chart"
                description="This chart shows the player's predicted performance trajectory based on our statistical model. The shaded area indicates the predicted prime years, and the vertical line shows the projected peak age."
              />
            )}
          </h4>
          {hasPredictedData ? (
            <ResponsiveContainer width="100%" height={isPopup ? 300 : 300}>
              <LineChart
                data={predictedData.filter(
                  (d) =>
                    d && d.age !== undefined && d.normalizedValue !== undefined
                )}
                margin={{ top: 5, right: 20, bottom: 20, left: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="age"
                  type="number"
                  domain={["auto", "auto"]}
                  allowDecimals={false}
                  label={{
                    value: "Age",
                    position: "insideBottom",
                    offset: -5,
                  }}
                />
                <YAxis
                  domain={[0, 100]}
                  label={{
                    value: "Performance (%)",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip
                  formatter={(value) => (value ? value.toFixed(1) : "N/A")}
                />
                <Legend />

                {/* Prime period (spline) */}
                {primeSpline && (
                  <ReferenceArea
                    x1={primeSpline.start_age}
                    x2={primeSpline.end_age}
                    fill={leagueColorMapping[player.league] || "#82ca9d"}
                    fillOpacity={0.2}
                  />
                )}

                {/* Peak age line */}
                {primeSpline && (
                  <ReferenceLine
                    x={primeSpline.max_value_age}
                    stroke={leagueColorMapping[player.league] || "#82ca9d"}
                    strokeDasharray="3 3"
                    label={{ value: "Peak", position: "top" }}
                  />
                )}

                <Line
                  type="monotone"
                  dataKey="normalizedValue"
                  stroke={leagueColorMapping[player.league] || "#82ca9d"}
                  activeDot={{ r: 6 }}
                  name="Predicted Performance"
                  isAnimationActive={false}
                  dot={true}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-chart-data">
              No predicted performance data available for this player
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// NEW: Performance Metrics component for showing both PQI and CQI
const PerformanceMetrics = ({ player, playerInfo }) => {
  if (!playerInfo || (!playerInfo.pqiData && !playerInfo.cqiData)) return null;

  const pqiScore = playerInfo.pqiData?.pqi_selected || 0;
  const cqiScore = playerInfo.cqiData?.cqi_selected || 0;

  // Calculate difference between metrics
  const scoreDifference = cqiScore - pqiScore;
  const primaryMetric = scoreDifference > 0 ? "CQI" : "PQI";
  const primaryColor = scoreDifference > 0 ? "#4caf50" : "#6d1945";

  // Prepare data for the bar chart
  const barData = [
    { name: "PQI", value: pqiScore, color: "#6d1945" },
    { name: "CQI", value: cqiScore, color: "#4caf50" },
  ];

  return (
    <div className="performance-metrics-card">
      <h4>
        Performance Metrics
        <ContextInfo
          title="Performance Metrics"
          description="This chart compares the player's Performance Quotient Index (PQI) and Career Quality Index (CQI) scores. PQI focuses on the player's prime years and peak performance, while CQI evaluates career-wide achievements. A higher score in one metric versus the other reveals whether a player was more of a 'peak performer' (higher PQI) or 'career accumulator' (higher CQI)."
        />
      </h4>

      <div className="metrics-chart">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={barData}
            margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip formatter={(value) => value.toFixed(2)} />
            <Bar dataKey="value" name="Score">
              {barData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="metrics-summary">
        <div className="metrics-difference">
          <span className="difference-label">Difference:</span>
          <span className="difference-value" style={{ color: primaryColor }}>
            {Math.abs(scoreDifference).toFixed(2)} points higher {primaryMetric}
          </span>
        </div>
        <div className="metrics-insight">
          {Math.abs(scoreDifference) < 5 ? (
            <p>This player has balanced peak and career metrics.</p>
          ) : scoreDifference > 0 ? (
            <p>
              This player's career longevity and total production exceeds their
              peak performance.
            </p>
          ) : (
            <p>
              This player's peak performance value exceeds their career
              accumulation.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
const ChartIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="20" x2="18" y2="10"></line>
    <line x1="12" y1="20" x2="12" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="14"></line>
    <rect x="2" y="20" width="20" height="2" rx="2"></rect>
  </svg>
);
const PlayerComparison = ({ data, positions, leagues }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [playerData, setPlayerData] = useState({});
  const [viewMode, setViewMode] = useState("individual");
  const [showChartPopup, setShowChartPopup] = useState(false);

  useEffect(() => {
    if (searchTerm.length >= 2 && data && data.pqiData) {
      const results = searchPlayersByName(searchTerm, data.pqiData);
      setSearchResults(results.slice(0, 10)); // Limit to 10 results
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, data]);

  useEffect(() => {
    // Load data for selected players
    const loadPlayerData = async () => {
      if (
        !data ||
        !data.fullData ||
        !data.pqiData ||
        !data.cqiData ||
        !data.primesRawData ||
        !data.primesSplineData ||
        !data.playerPredictions
      ) {
        console.error("Missing required data sources");
        return;
      }

      const newPlayerData = {};

      for (const player of selectedPlayers) {
        try {
          // Get career data with player_value
          const careerData = getPlayerCareer(player.id, data.fullData) || [];

          // Get predicted values
          const predictedData =
            getPlayerPredictions(player.id, data.playerPredictions) || [];

          // Normalize player_value to 0-100 scale for this player
          const normalizedActualData = normalizePlayerValues(
            careerData,
            "player_value"
          );

          // Normalize predicted_value to 0-100 scale for this player
          const normalizedPredictedData = normalizePlayerValues(
            predictedData,
            "predicted_value"
          );

          // Get PQI data
          const pqiData = getPlayerPQI(player.id, data.pqiData);

          // Get CQI data - NEW
          const cqiData = getPlayerCQI(player.id, data.cqiData);

          // Get raw prime data
          const primeRaw = getPlayerPrimeRaw(player.id, data.primesRawData);

          // Get spline prime data
          const primeSpline = getPlayerPrimeSpline(
            player.id,
            data.primesSplineData
          );

          newPlayerData[player.id] = {
            careerData: normalizedActualData,
            predictedData: normalizedPredictedData,
            pqiData,
            cqiData, // Added CQI data
            primeRaw,
            primeSpline,
          };
        } catch (err) {
          console.error(
            `Error loading data for player ${player.player_name}:`,
            err
          );
        }
      }

      setPlayerData(newPlayerData);
    };

    if (selectedPlayers.length > 0 && data) {
      loadPlayerData();
    }
  }, [selectedPlayers, data]);

  const handlePlayerSelect = (player) => {
    if (selectedPlayers.length < 5) {
      setSelectedPlayers([...selectedPlayers, player]);
      setSearchTerm("");
      setSearchResults([]);
    }
  };

  const handlePlayerRemove = (playerId) => {
    setSelectedPlayers(
      selectedPlayers.filter((player) => player.id !== playerId)
    );
  };

  const renderPlayerCard = (player) => {
    const playerInfo = playerData[player.id];
    if (!playerInfo) return null;

    return (
      <div className="player-card" key={player.id}>
        <div
          className="player-header"
          style={{
            backgroundColor: leagueColorMapping[player.league] || "#6d1945",
          }}
        >
          <h3>{player.player_name}</h3>
          <button onClick={() => handlePlayerRemove(player.id)}>Remove</button>
        </div>

        <div className="player-info-grid">
          <div className="info-item">
            <span className="label">Sport/League:</span>
            <span className="value">
              {player.sport} / {player.league}
            </span>
          </div>
          <div className="info-item">
            <span className="label">Position:</span>
            <span className="value">{player.position}</span>
          </div>
          <div className="info-item">
            <span className="label">Career Seasons:</span>
            <span className="value">
              {playerInfo.pqiData?.career_seasons ||
                playerInfo.cqiData?.career_seasons ||
                "N/A"}
            </span>
          </div>
          <div className="info-item">
            <span className="label">Prime Seasons:</span>
            <span className="value">
              {playerInfo.pqiData?.prime_seasons || "N/A"}
            </span>
          </div>
          <div className="info-item">
            <span className="label">PQI Score:</span>
            <span className="value">
              {playerInfo.pqiData?.pqi_selected?.toFixed(2) || "N/A"}
            </span>
          </div>
          <div className="info-item">
            <span className="label">CQI Score:</span>
            <span className="value">
              {playerInfo.cqiData?.cqi_selected?.toFixed(2) || "N/A"}
            </span>
          </div>
        </div>

        {/* Added Performance Metrics comparison */}
        <PerformanceMetrics player={player} playerInfo={playerInfo} />

        <PlayerSummaryTable player={player} playerInfo={playerInfo} />

        {/* Use the PlayerCharts component for consistent rendering */}
        <PlayerCharts player={player} playerInfo={playerInfo} />
      </div>
    );
  };

  const renderOverlayView = () => {
    if (selectedPlayers.length === 0) return null;

    // Combine all player data into a single array for the overlay chart
    const allPlayerData = [];

    // Create a consistent color palette for up to 5 players
    // Use distinct colors based on tier mapping to make each player distinguishable
    const playerColors = [
      "#6d1945", // Primary burgundy
      "#4caf50", // Green
      "#ff9800", // Orange
      "#2196f3", // Blue
      "#9c27b0", // Purple
    ];

    selectedPlayers.forEach((player, index) => {
      const playerInfo = playerData[player.id];
      if (playerInfo && playerInfo.predictedData) {
        playerInfo.predictedData.forEach((season) => {
          if (season) {
            allPlayerData.push({
              ...season,
              playerName: player.player_name,
              league: player.league,
              playerIndex: index, // Add player index for consistent coloring
            });
          }
        });
      }
    });

    // Sort the combined predicted data by age
    const sortedAllPlayerData = allPlayerData.sort((a, b) => a.age - b.age);

    return (
      <div className="overlay-view">
        <h3>
          Performance Comparison
          <ContextInfo
            title="Performance Comparison Chart"
            description="This chart overlays the normalized performance curves of all selected players, allowing for direct comparison of their career trajectories and peak ages."
          />
        </h3>
        <ResponsiveContainer width="100%" height={500}>
          <LineChart data={sortedAllPlayerData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="age"
              type="number"
              domain={["dataMin", "dataMax"]}
              label={{ value: "Age", position: "insideBottom", offset: -5 }}
              tick={{ fontSize: 12 }}
            />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />

            {selectedPlayers.map((player, index) => {
              // Filter sorted data for the current player
              const playerPredictedData = sortedAllPlayerData.filter(
                (s) => s.playerName === player.player_name
              );
              return playerPredictedData && playerPredictedData.length > 0 ? (
                <Line
                  key={player.id}
                  dataKey="normalizedValue"
                  data={playerPredictedData}
                  stroke={playerColors[index % playerColors.length]} // Use consistent distinct colors
                  name={player.player_name}
                  connectNulls
                />
              ) : null;
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderTimelineView = () => {
    if (selectedPlayers.length === 0) return null;

    // Calculate max age among selected players
    const maxPlayerAge = Math.max(
      ...selectedPlayers.map((player) => {
        const playerInfo = playerData[player.id];
        if (!playerInfo || !playerInfo.careerData) return 38; // default fallback
        return Math.max(...playerInfo.careerData.map((d) => d.age || 0));
      })
    );

    return (
      <div className="timeline-view">
        <h3>
          Career Prime Timeline
          <ContextInfo
            title="Career Prime Timeline"
            description="This visualization shows the prime years of each selected player on a common timeline. The colored sections represent the prime period, and stars mark peak performance ages."
          />
        </h3>
        <div className="timeline-container">
          {selectedPlayers.map((player) => {
            const primeSpline = playerData[player.id]?.primeSpline;
            if (!primeSpline) return null;

            // Calculate prime duration
            const primeDuration =
              primeSpline.prime_duration ||
              primeSpline.end_age - primeSpline.start_age + 1;

            return (
              <div className="timeline-row" key={player.id}>
                <div className="timeline-label">{player.player_name}</div>
                <div className="timeline-bar">
                  {Array.from(
                    { length: maxPlayerAge - 17 },
                    (_, i) => i + 18
                  ).map((age) => {
                    const isPrime =
                      age >= primeSpline.start_age &&
                      age <= primeSpline.end_age;
                    const isPeak = age === primeSpline.max_value_age;

                    return (
                      <div
                        key={age}
                        className={`timeline-age ${isPrime ? "in-prime" : ""} ${
                          isPeak ? "peak-age" : ""
                        }`}
                        style={{
                          backgroundColor: isPrime
                            ? leagueColorMapping[player.league]
                            : "transparent",
                        }}
                      >
                        {/* Move peak marker to the center of the timeline box */}
                        {isPeak && (
                          <div
                            className="peak-marker"
                            style={{
                              top: "50%",
                              transform: "translateY(-50%)",
                            }}
                          >
                            ★
                          </div>
                        )}
                        <div className="age-label">{age}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="timeline-info">
                  <span>Prime: {primeDuration} years</span>
                  <span>
                    ({primeSpline.start_age} - {primeSpline.end_age})
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // NEW: Metrics Comparison view to compare PQI and CQI for all selected players
  const renderMetricsView = () => {
    if (selectedPlayers.length === 0) return null;

    // Prepare comparison data
    const metricsData = selectedPlayers
      .map((player) => {
        const playerInfo = playerData[player.id];
        if (!playerInfo) return null;

        const pqiScore = playerInfo.pqiData?.pqi_selected || 0;
        const cqiScore = playerInfo.cqiData?.cqi_selected || 0;
        const difference = cqiScore - pqiScore;

        return {
          id: player.id,
          name: player.player_name,
          league: player.league,
          pqiScore,
          cqiScore,
          difference,
          pqiTier: playerInfo.pqiData?.selected_tier || "N/A",
          cqiTier: playerInfo.cqiData?.selected_tier || "N/A",
          careerGames: playerInfo.pqiData?.career_games || 0,
          primeDuration: playerInfo.pqiData?.prime_seasons || 0,
          primePercentage: playerInfo.pqiData?.prime_density || 0,
        };
      })
      .filter((p) => p !== null);

    // Sort by absolute difference
    const sortedMetrics = [...metricsData].sort(
      (a, b) => Math.abs(b.difference) - Math.abs(a.difference)
    );

    return (
      <div className="metrics-view">
        <h3>
          PQI vs CQI Comparison
          <ContextInfo
            title="Performance vs Career Metrics"
            description="This view compares each player's Performance Quotient Index (PQI) and Career Quality Index (CQI) scores. PQI focuses on peak performance and prime years, while CQI evaluates career-wide quality including longevity and accumulation."
          />
        </h3>

        <div className="metrics-chart-container">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={metricsData}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip
                formatter={(value, name) => [
                  value.toFixed(2),
                  name === "pqiScore" ? "PQI Score" : "CQI Score",
                ]}
              />
              <Legend />
              <Bar dataKey="pqiScore" name="PQI Score" fill="#6d1945" />
              <Bar dataKey="cqiScore" name="CQI Score" fill="#4caf50" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Improved explanation section */}
        <div className="metrics-explanation">
          <h4>What Explains the Differences?</h4>
          <div className="explanation-content">
            <div className="explanation-text">
              <p>
                <strong>Performance Quotient Index (PQI)</strong> measures the
                quality and impact of an athlete's peak performance years. It's
                calculated using:
              </p>
              <ul>
                <li>
                  Prime seasons duration (weighted by logarithmic scaling)
                </li>
                <li>Average performance value during prime years</li>
                <li>Peak performance value (with 30% bonus weight)</li>
                <li>Consistency during prime years</li>
              </ul>
              <p>
                <strong>Career Quality Index (CQI)</strong> evaluates an
                athlete's entire career contribution. It considers:
              </p>
              <ul>
                <li>Total career seasons (weighted by logarithmic scaling)</li>
                <li>Average performance value across all seasons</li>
                <li>Career peak value (with only 10% bonus weight)</li>
                <li>Overall career consistency</li>
              </ul>
              <p>
                Athletes with significantly higher <strong>PQI than CQI</strong>{" "}
                typically had exceptional peak performance but shorter careers.
                Their prime years were remarkably productive but represented a
                smaller portion of their total career.
              </p>
              <p>
                Athletes with significantly higher <strong>CQI than PQI</strong>{" "}
                typically had longer careers with consistent performance,
                accumulating value over time. They may not have reached the same
                peak heights but maintained quality performance across more
                seasons.
              </p>
            </div>

            {/* Player Career Metrics Summary */}
            <div className="players-summary">
              <h4>Player Career Metrics</h4>
              <table>
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Prime %</th>
                    <th>Prime Seasons</th>
                    <th>Career Games</th>
                    <th>Index Diff</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMetrics.map((player, index) => (
                    <tr key={player.id}>
                      <td style={{ color: leagueColorMapping[player.league] }}>
                        {player.name}
                      </td>
                      <td>{player.primePercentage?.toFixed(1)}%</td>
                      <td>{player.primeDuration}</td>
                      <td>{Math.round(player.careerGames)}</td>
                      <td
                        className={
                          player.difference < 0 ? "negative" : "positive"
                        }
                      >
                        {player.difference > 0
                          ? `+${player.difference.toFixed(1)} CQI`
                          : `${player.difference.toFixed(1)} CQI`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Charts popup component integrated directly into PlayerComparison
  const ChartsPopup = ({
    showChartPopup,
    setShowChartPopup,
    selectedPlayers,
    playerData,
  }) => {
    if (!showChartPopup) return null;

    const handleOverlayClick = (e) => {
      if (e.target.className === "charts-popup-overlay") {
        setShowChartPopup(false);
      }
    };

    return (
      <div className="charts-popup-overlay" onClick={handleOverlayClick}>
        <div className="charts-popup-container">
          <div className="charts-popup-header">
            <h3>Performance Charts</h3>
            <button
              className="close-button"
              onClick={() => setShowChartPopup(false)}
            >
              ×
            </button>
          </div>

          <div className="charts-popup-content">
            {/* ACTUAL PERFORMANCE - All players in one row */}
            <div className="chart-type-section">
              <h4 className="chart-type-title">Actual Performance</h4>
              <div className="chart-comparison-row">
                {selectedPlayers.map((currentPlayer) => {
                  const playerInfo = playerData[currentPlayer.id];
                  if (!playerInfo) return null;
                  const { careerData = [], primeRaw } = playerInfo;
                  const hasValidData = careerData && careerData.length > 0;

                  return (
                    <div
                      className="comparison-chart-container"
                      key={`actual-${currentPlayer.id}`}
                    >
                      <div
                        className="chart-player-name"
                        style={{
                          color:
                            leagueColorMapping[currentPlayer.league] ||
                            "#6d1945",
                        }}
                      >
                        {currentPlayer.player_name}
                      </div>

                      {hasValidData ? (
                        <ResponsiveContainer width="100%" height={220}>
                          <LineChart
                            data={careerData.filter(
                              (d) =>
                                d?.age !== undefined &&
                                d?.normalizedValue !== undefined
                            )}
                            margin={{ top: 5, right: 5, bottom: 20, left: 5 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#eee"
                            />
                            <XAxis
                              dataKey="age"
                              type="number"
                              domain={[18, 40]}
                              tickCount={5}
                              label={{
                                value: "Age",
                                position: "insideBottom",
                                offset: -5,
                                fontSize: 10,
                              }}
                            />
                            <YAxis domain={[0, 100]} tickCount={5} />
                            <Tooltip
                              formatter={(value) =>
                                value ? value.toFixed(1) : "N/A"
                              }
                            />

                            {/* Prime period */}
                            {primeRaw && (
                              <ReferenceArea
                                x1={primeRaw.start_age}
                                x2={primeRaw.end_age}
                                fill={
                                  leagueColorMapping[currentPlayer.league] ||
                                  "#8884d8"
                                }
                                stroke={
                                  leagueColorMapping[currentPlayer.league] ||
                                  "#8884d8"
                                }
                                fillOpacity={0.3}
                                strokeOpacity={0.5}
                                strokeWidth={1}
                              />
                            )}

                            {/* Peak age line */}
                            {primeRaw && (
                              <ReferenceLine
                                x={primeRaw.max_value_age}
                                stroke={
                                  leagueColorMapping[currentPlayer.league] ||
                                  "#8884d8"
                                }
                                strokeDasharray="3 3"
                              />
                            )}

                            <Line
                              type="monotone"
                              dataKey="normalizedValue"
                              stroke={
                                leagueColorMapping[currentPlayer.league] ||
                                "#8884d8"
                              }
                              activeDot={{ r: 4 }}
                              dot={true}
                              isAnimationActive={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="no-chart-data-small">No data</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PREDICTED PERFORMANCE - All players in one row */}
            <div className="chart-type-section">
              <h4 className="chart-type-title">Predicted Performance</h4>
              <div className="chart-comparison-row">
                {selectedPlayers.map((currentPlayer) => {
                  const playerInfo = playerData[currentPlayer.id];
                  if (!playerInfo) return null;
                  const { predictedData = [], primeSpline } = playerInfo;
                  const hasPredictedData =
                    predictedData && predictedData.length > 0;

                  return (
                    <div
                      className="comparison-chart-container"
                      key={`predicted-${currentPlayer.id}`}
                    >
                      <div
                        className="chart-player-name"
                        style={{
                          color:
                            leagueColorMapping[currentPlayer.league] ||
                            "#6d1945",
                        }}
                      >
                        {currentPlayer.player_name}
                      </div>

                      {hasPredictedData ? (
                        <ResponsiveContainer width="100%" height={220}>
                          <LineChart
                            data={predictedData.filter(
                              (d) =>
                                d?.age !== undefined &&
                                d?.normalizedValue !== undefined
                            )}
                            margin={{ top: 5, right: 5, bottom: 20, left: 5 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#eee"
                            />
                            <XAxis
                              dataKey="age"
                              type="number"
                              domain={[18, 40]}
                              tickCount={5}
                              label={{
                                value: "Age",
                                position: "insideBottom",
                                offset: -5,
                                fontSize: 10,
                              }}
                            />
                            <YAxis domain={[0, 100]} tickCount={5} />
                            <Tooltip
                              formatter={(value) =>
                                value ? value.toFixed(1) : "N/A"
                              }
                            />

                            {/* Prime period */}
                            {primeSpline && (
                              <ReferenceArea
                                x1={primeSpline.start_age}
                                x2={primeSpline.end_age}
                                fill={
                                  leagueColorMapping[currentPlayer.league] ||
                                  "#82ca9d"
                                }
                                stroke={
                                  leagueColorMapping[currentPlayer.league] ||
                                  "#82ca9d"
                                }
                                fillOpacity={0.3}
                                strokeOpacity={0.5}
                                strokeWidth={1}
                              />
                            )}

                            {/* Peak age line */}
                            {primeSpline && (
                              <ReferenceLine
                                x={primeSpline.max_value_age}
                                stroke={
                                  leagueColorMapping[currentPlayer.league] ||
                                  "#82ca9d"
                                }
                                strokeDasharray="3 3"
                              />
                            )}

                            <Line
                              type="monotone"
                              dataKey="normalizedValue"
                              stroke={
                                leagueColorMapping[currentPlayer.league] ||
                                "#82ca9d"
                              }
                              activeDot={{ r: 4 }}
                              dot={true}
                              isAnimationActive={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="no-chart-data-small">No data</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="player-comparison">
      <div className="section-header">
        <h2>
          Player Comparison
          <ContextInfo
            title="Player Comparison Tool"
            description="This tool allows you to search for and compare up to 5 athletes across different sports. You can analyze their actual career trajectories, predicted performance curves, PQI and CQI metrics, and visualize their prime years on a common timeline."
          />
        </h2>
        <div className="view-toggles">
          <button
            className={viewMode === "individual" ? "active" : ""}
            onClick={() => setViewMode("individual")}
          >
            Individual View
          </button>
          <button
            className={viewMode === "overlay" ? "active" : ""}
            onClick={() => setViewMode("overlay")}
          >
            Overlay View
          </button>
          <button
            className={viewMode === "timeline" ? "active" : ""}
            onClick={() => setViewMode("timeline")}
          >
            Career Timeline
          </button>
          <button
            className={viewMode === "metrics" ? "active" : ""}
            onClick={() => setViewMode("metrics")}
          >
            Metrics Comparison
          </button>
          {selectedPlayers.length > 1 && (
            <button
              className="compare-charts-button"
              onClick={() => setShowChartPopup(true)}
            >
              <ChartIcon />
              Charts
            </button>
          )}
        </div>
      </div>

      <div className="search-section">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((player) => (
                <div
                  key={player.id}
                  className="search-result-item"
                  onClick={() => handlePlayerSelect(player)}
                >
                  <div>{player.player_name}</div>
                  <div className="player-details">
                    {player.sport} / {player.league} - {player.position}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="selected-players-container">
          <div className="selected-count">
            Selected Players ({selectedPlayers.length}/5)
          </div>
          <div className="selected-list">
            {selectedPlayers.map((player) => (
              <div key={player.id} className="selected-player-item">
                {player.player_name}
                <button onClick={() => handlePlayerRemove(player.id)}>✕</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="results-section">
        {selectedPlayers.length === 0 ? (
          <div className="no-players-selected">
            Search and select players to compare their performance over time.
          </div>
        ) : (
          <>
            {viewMode === "individual" && (
              <div className="individual-view">
                {selectedPlayers.map((player) => renderPlayerCard(player))}
              </div>
            )}

            {viewMode === "overlay" && renderOverlayView()}

            {viewMode === "timeline" && renderTimelineView()}

            {viewMode === "metrics" && renderMetricsView()}
          </>
        )}
      </div>

      {/* Integrated Charts Popup */}
      <ChartsPopup
        showChartPopup={showChartPopup}
        setShowChartPopup={setShowChartPopup}
        selectedPlayers={selectedPlayers}
        playerData={playerData}
      />
    </div>
  );
};

export default PlayerComparison;
