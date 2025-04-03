import React, { useState, useEffect, useCallback } from "react";
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
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { leagueColorMapping, tierColorMapping } from "../utils/constants";
import EnhancedFilters from "./EnhancedFilters";
import ContextInfo from "./ContextInfo";
import _ from "lodash";
import "../styles/PrimeExplorer.css";
import "../styles/EnhancedFilters.css";

// Performance Metrics summary component - improved layout and clearer labels
const PerformanceMetrics = ({ statsSummary }) => {
  if (!statsSummary) return null;

  return (
    <div className="performance-metrics">
      <h3>
        Key Performance Indicators at Age {statsSummary.selectedAge}
        <ContextInfo
          title="Performance Indicators"
          description="This section shows key metrics for athletes at the selected age. It displays the percentage of athletes in different career phases and the sample size of the data. These metrics help understand athlete development and career progression at this specific age point."
        />
      </h3>
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-value">
            {statsSummary.inPrimePercent?.toFixed(1)}%
          </div>
          <div className="metric-label">In Prime</div>
          <div className="metric-desc">Athletes at peak performance</div>
        </div>

        <div className="metric-card">
          <div className="metric-value">
            {statsSummary.atPeakPercent?.toFixed(1)}%
          </div>
          <div className="metric-label">At Peak Age</div>
          <div className="metric-desc">Athletes at absolute peak</div>
        </div>

        <div className="metric-card">
          <div className="metric-value">
            {statsSummary.prePeakPercent?.toFixed(1)}% /{" "}
            {statsSummary.postPeakPercent?.toFixed(1)}%
          </div>
          <div className="metric-label">Pre-Peak / Post-Peak</div>
          <div className="metric-desc">Rising vs. declining athletes</div>
        </div>

        <div className="metric-card">
          <div className="metric-value">
            {(statsSummary.totalPlayers || 0).toLocaleString()}
          </div>
          <div className="metric-label">Sample Size</div>
          <div className="metric-desc">Total athletes analyzed</div>
        </div>
      </div>
    </div>
  );
};

// Updated Career Phase Chart component using bar chart
const CareerPhaseChart = ({ phaseData }) => {
  if (!phaseData || phaseData.length === 0) return null;

  // Refined categories as requested
  const refinedPhaseData = [
    {
      name: "Pre-Prime",
      value:
        (phaseData.find((p) => p.name === "Outside Prime")?.value || 0) / 2, // Approximation
      color: "#9575cd", // Light purple
    },
    {
      name: "In-Prime Pre-Peak",
      value: phaseData.find((p) => p.name === "Pre-Peak")?.value || 0,
      color: "#5e35b1", // Darker purple
    },
    {
      name: "At Peak",
      value: phaseData.find((p) => p.name === "At Peak")?.value || 0,
      color: "#ff7043", // Orange
    },
    {
      name: "In-Prime Post-Peak",
      value: phaseData.find((p) => p.name === "Post-Peak")?.value || 0,
      color: "#43a047", // Green
    },
    {
      name: "Post-Prime",
      value:
        (phaseData.find((p) => p.name === "Outside Prime")?.value || 0) / 2, // Approximation
      color: "#9e9e9e", // Updated to darker gray (was #bdbdbd)
    },
  ];

  return (
    <div className="career-phase-chart">
      <h3>Career Phase Distribution</h3>

      {/* Bar chart display for career phases */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={refinedPhaseData}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 14 }} />
          <Tooltip
            formatter={(value) => [`${value.toFixed(1)}%`]}
            labelFormatter={(name) => `${name} Phase`}
          />
          <Bar dataKey="value" name="Percentage">
            {refinedPhaseData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Data table display */}
      <div className="phase-data-table">
        <div className="phase-table-header">
          <div className="phase-name">Career Phase</div>
          <div className="phase-value">Percentage</div>
          <div className="phase-count">Count*</div>
        </div>
        {refinedPhaseData.map((phase, index) => (
          <div className="phase-table-row" key={index}>
            <div className="phase-name">
              <span
                className="phase-color"
                style={{ backgroundColor: phase.color }}
              ></span>
              {phase.name}
            </div>
            <div className="phase-value">{phase.value.toFixed(1)}%</div>
            <div className="phase-count">
              {/* Approximate count based on percentage */}
              {Math.round(
                (phase.value / 100) *
                  (phaseData[0]?.totalSample ||
                    phaseData.reduce((sum, p) => sum + p.count, 0))
              )}
            </div>
          </div>
        ))}
        <div className="phase-table-footer">
          * Estimated count based on total sample
        </div>
      </div>
    </div>
  );
};

const PrimeExplorer = ({
  data,
  positions,
  leagues,
  // New props from Dashboard
  selectedSports = [],
  selectedLeagues = [],
  selectedPositions = [],
  setSelectedSports = () => {},
  setSelectedLeagues = () => {},
  setSelectedPositions = () => {},
}) => {
  const [selectedAge, setSelectedAge] = useState(28);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Split state to avoid expensive re-renders
  const [statsSummary, setStatsSummary] = useState(null);
  const [phaseData, setPhaseData] = useState([]);
  const [trajectoryData, setTrajectoryData] = useState([]);
  const [topPlayers, setTopPlayers] = useState([]);
  const [cardsPerRow, setCardsPerRow] = useState(5); // Default number of cards per row

  // Get all unique sports
  const allSports = React.useMemo(() => {
    if (!data || !data.pqiData) return [];
    return [...new Set(data.pqiData.map((player) => player.sport))].filter(
      Boolean
    );
  }, [data]);

  // Handle window resize to adjust cards per row
  useEffect(() => {
    const handleResize = () => {
      // Adjust cards per row based on window width
      const width = window.innerWidth;
      if (width < 768) {
        setCardsPerRow(2); // Small screens: 2 cards per row
      } else if (width < 1200) {
        setCardsPerRow(3); // Medium screens: 3 cards per row
      } else if (width < 1600) {
        setCardsPerRow(4); // Large screens: 4 cards per row
      } else {
        setCardsPerRow(5); // Extra large screens: 5 cards per row
      }
    };

    // Set initial value
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Memoized data processing function to prevent performance issues
  const processData = useCallback(() => {
    if (!data || !data.fullData || data.fullData.length === 0) {
      setError("No data available");
      setIsLoading(false);
      return;
    }

    console.log("Processing data for Prime Explorer...");
    setIsLoading(true);

    try {
      // Use setTimeout to prevent UI freezing
      setTimeout(() => {
        try {
          // Filter data based on selected filters
          let filteredData = [...data.fullData];

          // Apply multi-select filters
          if (selectedSports.length > 0) {
            filteredData = filteredData.filter((player) =>
              selectedSports.includes(player.sport)
            );
          }

          if (selectedLeagues.length > 0) {
            filteredData = filteredData.filter((player) =>
              selectedLeagues.includes(player.league)
            );
          }

          if (selectedPositions.length > 0) {
            filteredData = filteredData.filter((player) =>
              selectedPositions.includes(player.position)
            );
          }

          // Get players at selected age
          const playersAtAge = filteredData.filter(
            (player) => player.age === selectedAge
          );

          if (playersAtAge.length === 0) {
            setStatsSummary(null);
            setPhaseData([]);
            setTrajectoryData([]);
            setTopPlayers([]);
            setIsLoading(false);
            return;
          }

          // Calculate stats summary
          const total = playersAtAge.length;
          const inPrimeCount = playersAtAge.filter(
            (player) => player.in_prime === true
          ).length;
          const atPeakCount = playersAtAge.filter(
            (player) => player.is_peak_age === true
          ).length;
          const prePeakCount = playersAtAge.filter(
            (player) =>
              typeof player.years_from_peak === "number" &&
              player.years_from_peak < 0 &&
              player.is_peak_age !== true
          ).length;
          const postPeakCount = playersAtAge.filter(
            (player) =>
              typeof player.years_from_peak === "number" &&
              player.years_from_peak > 0
          ).length;

          const avgValue = _.meanBy(playersAtAge, "scaled_value") || 0;

          setStatsSummary({
            selectedAge,
            inPrimePercent: (inPrimeCount / total) * 100,
            atPeakPercent: (atPeakCount / total) * 100,
            prePeakPercent: (prePeakCount / total) * 100,
            postPeakPercent: (postPeakCount / total) * 100,
            averageValue: avgValue,
            totalPlayers: total,
          });

          // Prepare phase data for new bar chart
          setPhaseData([
            {
              name: "Pre-Peak",
              value: (prePeakCount / total) * 100,
              color: "#8884d8",
              count: prePeakCount,
              totalSample: total,
            },
            {
              name: "At Peak",
              value: (atPeakCount / total) * 100,
              color: "#ff7300",
              count: atPeakCount,
              totalSample: total,
            },
            {
              name: "Post-Peak",
              value: (postPeakCount / total) * 100,
              color: "#82ca9d",
              count: postPeakCount,
              totalSample: total,
            },
            {
              name: "Outside Prime",
              value: ((total - inPrimeCount) / total) * 100,
              color: "#9e9e9e", // Updated to darker gray
              count: total - inPrimeCount,
              totalSample: total,
            },
          ]);

          // Calculate trajectory for a relevant age range (± 5 years)
          const ageStart = Math.max(18, selectedAge - 5);
          const ageEnd = Math.min(40, selectedAge + 5);
          const ageRange = Array.from(
            { length: ageEnd - ageStart + 1 },
            (_, i) => ageStart + i
          );

          const trajectory = ageRange
            .map((a) => {
              const playersAtThisAge = filteredData.filter(
                (player) => player.age === a
              );

              if (playersAtThisAge.length < 10) return null; // Require minimum sample size

              return {
                age: a,
                avgValue:
                  playersAtThisAge.length > 0
                    ? _.meanBy(playersAtThisAge, "scaled_value") || 0
                    : 0,
                inPrimePercent:
                  playersAtThisAge.length > 0
                    ? (playersAtThisAge.filter(
                        (player) => player.in_prime === true
                      ).length /
                        playersAtThisAge.length) *
                      100
                    : 0,
                sampleSize: playersAtThisAge.length,
              };
            })
            .filter(Boolean); // Filter out null values

          setTrajectoryData(trajectory);

          // Find top performers
          const allTopPerformers = _.orderBy(
            playersAtAge,
            ["scaled_value"],
            ["desc"]
          ).map((player) => {
            const fullPlayerData =
              data.pqiData.find((p) => p.id === player.id) || {};
            return {
              ...player,
              playerName: player.player_name,
              pqiScore: fullPlayerData?.pqi_selected || 0,
              tier: fullPlayerData?.selected_tier || "N/A",
            };
          });

          // Set top performers - use cardsPerRow * 2 to fill exactly two rows
          setTopPlayers(allTopPerformers);
          setIsLoading(false);
          setError(null);
        } catch (err) {
          console.error("Error processing Prime Explorer data:", err);
          setError(`Processing error: ${err.message}`);
          setIsLoading(false);
        }
      }, 100); // Small delay to prevent UI blocking
    } catch (err) {
      console.error("Error setting up Prime Explorer processing:", err);
      setError(`Setup error: ${err.message}`);
      setIsLoading(false);
    }
  }, [
    data,
    selectedAge,
    selectedSports,
    selectedLeagues,
    selectedPositions,
    cardsPerRow,
  ]);

  // Run data processing when inputs change
  useEffect(() => {
    processData();
  }, [processData]);

  const renderTrajectoryChart = () => {
    if (trajectoryData.length === 0) return null;

    return (
      <div className="chart-container full-width">
        <h3>
          Expected Performance Trajectory
          <ContextInfo
            title="Performance Trajectory"
            description="This chart shows the expected performance trajectory around the selected age. The blue line shows average performance value, while the green line shows the percentage of athletes in their prime at each age. The vertical red line marks the currently selected age."
          />
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={trajectoryData}
            margin={{ top: 20, right: 40, left: 30, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="age"
              type="number"
              domain={["dataMin", "dataMax"]}
              allowDecimals={false}
              label={{
                value: "Age",
                position: "insideBottom",
                offset: -5,
                style: { textAnchor: "middle" },
              }}
            />
            <YAxis
              yAxisId="left"
              domain={[0, "auto"]}
              label={{
                value: "Performance",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: "12px", textAnchor: "middle" },
                dx: -10,
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              label={{
                value: "In Prime %",
                angle: 90,
                position: "insideRight",
                style: { fontSize: "12px", textAnchor: "middle" },
                dx: 10,
              }}
            />
            <Tooltip
              formatter={(value, name) => {
                if (name === "Avg. Performance")
                  return [value.toFixed(3), name];
                return [`${value.toFixed(1)}%`, name];
              }}
            />
            <Legend verticalAlign="top" height={36} />
            <ReferenceLine
              x={selectedAge}
              yAxisId="left"
              stroke="red"
              strokeDasharray="3 3"
              label={{
                value: "Current",
                position: "top",
                fill: "red",
                fontSize: 12,
              }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="avgValue"
              name="Avg. Performance"
              stroke="#8884d8"
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="inPrimePercent"
              name="In Prime %"
              stroke="#82ca9d"
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderSimilarPlayers = () => {
    if (topPlayers.length === 0) return null;

    // Calculate how many players to show based on cardsPerRow to fill exactly 2 rows
    const rowsToShow = 2;
    const numToShow = cardsPerRow * rowsToShow;
    const actualNumToShow = Math.min(numToShow, topPlayers.length);
    // Force an even distribution - avoid uneven bottom row
    const balancedNumToShow =
      Math.floor(actualNumToShow / cardsPerRow) * cardsPerRow;
    const playersToShow = topPlayers.slice(0, balancedNumToShow);

    return (
      <div className="similar-players">
        <h3>
          Top Performers at Age {selectedAge}
          <ContextInfo
            title="Top Performers"
            description="These cards show the top-performing athletes at the selected age. Each card displays the player's key metrics including their performance value, PQI score, career tier, and whether they are in their prime or at their peak age."
          />
        </h3>
        <div className="player-cards-container">
          <div
            className="player-cards uniform-grid"
            style={{ gridTemplateColumns: `repeat(${cardsPerRow}, 1fr)` }}
          >
            {playersToShow.map((player, index) => (
              <div
                className="player-card uniform-size"
                key={`player-${index}`}
                style={{
                  borderColor: leagueColorMapping[player.league] || "#ccc",
                }}
              >
                <div
                  className="card-header"
                  style={{
                    backgroundColor:
                      leagueColorMapping[player.league] || "#ccc",
                  }}
                >
                  <h4>{player.playerName || player.player_name || "Player"}</h4>
                </div>
                <div className="card-content">
                  <div className="stat-row">
                    <span className="stat-label">League:</span>
                    <span className="stat-value">
                      {player.league || "Unknown"}
                    </span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Position:</span>
                    <span className="stat-value">
                      {player.position || "Unknown"}
                    </span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Value:</span>
                    <span className="stat-value">
                      {typeof player.scaled_value === "number"
                        ? player.scaled_value.toFixed(2)
                        : "N/A"}
                    </span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">PQI Score:</span>
                    <span className="stat-value">
                      {typeof player.pqiScore === "number"
                        ? player.pqiScore.toFixed(2)
                        : "N/A"}
                    </span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Tier:</span>
                    <span
                      className="stat-value"
                      style={{
                        color: tierColorMapping[player.tier] || "#333",
                      }}
                    >
                      {player.tier || "N/A"}
                    </span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">In Prime:</span>
                    <span className="stat-value">
                      {player.in_prime === true ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Peak Age:</span>
                    <span className="stat-value">
                      {player.is_peak_age === true ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Active:</span>
                    <span className="stat-value">
                      {player.is_active === true ? "Yes" : "No"}
                    </span>
                  </div>
                  {player.is_active && (
                    <div
                      className="active-indicator"
                      style={{
                        marginTop: "8px",
                        backgroundColor: "#4caf50",
                        color: "white",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        display: "inline-block",
                        fontSize: "11px",
                        fontWeight: "bold",
                      }}
                    >
                      ACTIVE
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="prime-explorer">
      <div className="section-header">
        <h2>
          Interactive Prime Explorer
          <ContextInfo
            title="Interactive Prime Explorer"
            description="This tool allows you to explore athlete performance and career phases at specific ages. By adjusting the age slider, you can see how performance changes over time, what percentage of athletes are in their prime at each age, and who the top performers are."
          />
        </h2>
      </div>

      {/* Use Enhanced Filters component */}
      <EnhancedFilters
        allData={data?.pqiData || []}
        sports={allSports}
        leagues={leagues}
        positions={positions}
        selectedSports={selectedSports}
        selectedLeagues={selectedLeagues}
        selectedPositions={selectedPositions}
        onSportsChange={setSelectedSports}
        onLeaguesChange={setSelectedLeagues}
        onPositionsChange={setSelectedPositions}
        showLimit={false} // No limit needed for this component
      />

      <div className="age-selector-container">
        <h3>
          Select Age to Explore: {selectedAge}
          <ContextInfo
            title="Age Selector"
            description="Use this slider to select a specific age and explore the distribution of athletes across different career phases at that age point. The slider covers the typical career age range from 18 to 40."
          />
        </h3>
        <input
          type="range"
          min={18}
          max={40}
          value={selectedAge}
          onChange={(e) => setSelectedAge(parseInt(e.target.value))}
          className="age-slider"
        />
      </div>

      {isLoading ? (
        <div className="loading">Loading data...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : statsSummary ? (
        <>
          {/* Add Performance Metrics component */}
          <PerformanceMetrics statsSummary={statsSummary} />

          <div className="charts-container">
            <div className="charts-row">
              {/* New Career Phase Chart component replacing the radar chart */}
              <div className="chart-container half-width">
                <CareerPhaseChart phaseData={phaseData} />
              </div>
              {renderTrajectoryChart()}
            </div>

            {renderSimilarPlayers()}
          </div>
        </>
      ) : (
        <div className="no-data">
          No data available for the selected filters.
        </div>
      )}
    </div>
  );
};

export default PrimeExplorer;
