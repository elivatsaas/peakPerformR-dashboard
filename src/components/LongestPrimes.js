// In LongestPrimes.js - Remove unused imports
import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
} from "recharts";
import { getPlayersByPrimeDuration } from "../utils/dataProcessing";
import { leagueColorMapping } from "../utils/constants";
import EnhancedFilters from "./EnhancedFilters";
import ContextInfo from "./ContextInfo";
import _ from "lodash";
import "../styles/LongestPrimes.css";
import "../styles/EnhancedFilters.css";

// New summary statistics component
const PrimeStatsSummary = ({ players }) => {
  if (!players || players.length === 0) return null;

  // Calculate summary statistics
  const avgPrimeDuration =
    players.reduce((sum, p) => sum + (Number(p.prime_duration) || 0), 0) /
    players.length;
  const maxPrimeDuration = Math.max(
    ...players.map((p) => Number(p.prime_duration) || 0)
  );
  const minPrimeDuration = Math.min(
    ...players.map((p) => Number(p.prime_duration) || 0)
  );

  const avgStartAge =
    players.reduce((sum, p) => sum + (Number(p.start_age) || 0), 0) /
    players.length;
  const avgEndAge =
    players.reduce((sum, p) => sum + (Number(p.end_age) || 0), 0) /
    players.length;
  const avgPeakAge =
    players.reduce((sum, p) => sum + (Number(p.max_value_age) || 0), 0) /
    players.length;

  return (
    <div className="prime-stats-summary">
      <h3>
        Prime Statistics Summary
        <ContextInfo
          title="Prime Statistics Summary"
          description="This table shows aggregate statistics about athlete prime periods. It includes average, minimum, and maximum prime durations, as well as the typical ages at which athletes begin, peak, and conclude their prime years."
        />
      </h3>
      <div className="stats-grid">
        <div className="stat-column">
          <h4>Prime Duration</h4>
          <div className="stat-row">
            <div className="stat-label">Average:</div>
            <div className="stat-value">
              {avgPrimeDuration.toFixed(1)} years
            </div>
          </div>
          <div className="stat-row">
            <div className="stat-label">Maximum:</div>
            <div className="stat-value">
              {maxPrimeDuration.toFixed(1)} years
            </div>
          </div>
          <div className="stat-row">
            <div className="stat-label">Minimum:</div>
            <div className="stat-value">
              {minPrimeDuration.toFixed(1)} years
            </div>
          </div>
        </div>

        <div className="stat-column">
          <h4>Key Ages</h4>
          <div className="stat-row">
            <div className="stat-label">Avg. Start Age:</div>
            <div className="stat-value">{avgStartAge.toFixed(1)} years</div>
          </div>
          <div className="stat-row">
            <div className="stat-label">Avg. Peak Age:</div>
            <div className="stat-value">{avgPeakAge.toFixed(1)} years</div>
          </div>
          <div className="stat-row">
            <div className="stat-label">Avg. End Age:</div>
            <div className="stat-value">{avgEndAge.toFixed(1)} years</div>
          </div>
        </div>

        <div className="stat-column">
          <h4>Data Sample</h4>
          <div className="stat-row">
            <div className="stat-label">Players Analyzed:</div>
            <div className="stat-value">{players.length}</div>
          </div>
          <div className="stat-row">
            <div className="stat-label">Sports Included:</div>
            <div className="stat-value">
              {new Set(players.map((p) => p.sport)).size}
            </div>
          </div>
          <div className="stat-row">
            <div className="stat-label">Leagues Included:</div>
            <div className="stat-value">
              {new Set(players.map((p) => p.league)).size}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LongestPrimes = ({
  data,
  positions,
  leagues,
  // New props from Dashboard
  selectedSports = [],
  selectedLeagues = [],
  selectedPositions = [],
  limit = 25,
  setSelectedSports = () => {},
  setSelectedLeagues = () => {},
  setSelectedPositions = () => {},
  setLimit = () => {},
}) => {
  const [viewMode, setViewMode] = useState("table");
  const [players, setPlayers] = useState([]);

  // Get all unique sports
  const allSports = React.useMemo(() => {
    if (!data || !data.pqiData) return [];
    return [...new Set(data.pqiData.map((player) => player.sport))].filter(
      Boolean
    );
  }, [data]);

  useEffect(() => {
    if (data) {
      // Use multi-select filter arrays
      const filters = {
        sport: selectedSports.length > 0 ? selectedSports : undefined,
        league: selectedLeagues.length > 0 ? selectedLeagues : undefined,
        position: selectedPositions.length > 0 ? selectedPositions : undefined,
      };

      // Use 0 as "None" (all) option
      const limitValue = limit === 0 ? 7000 : limit;

      const longestPrimePlayers = getPlayersByPrimeDuration(
        data.primesSplineData,
        data.pqiData,
        limitValue,
        filters
      );
      setPlayers(longestPrimePlayers);
    }
  }, [data, selectedSports, selectedLeagues, selectedPositions, limit]);

  const renderTableView = () => {
    return (
      <div className="table-view">
        <PrimeStatsSummary players={players} />
        <h3>
          Players with Longest Primes
          <ContextInfo
            title="Longest Prime List"
            description="This table ranks athletes by their prime duration in years. A player's prime is defined as the continuous period where performance remains above a 70% threshold percentage of peak value, with adjustments for low games played. The table shows when their prime started, ended, and reached its peak."
          />
        </h3>
        <table className="player-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Sport</th>
              <th>League</th>
              <th>Position</th>
              <th>Prime Duration</th>
              <th>Start Age</th>
              <th>End Age</th>
              <th>Peak Age</th>
              <th>PQI Score</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, index) => (
              <tr key={player.id}>
                <td>{index + 1}</td>
                <td>{player.player_name}</td>
                <td>{player.sport}</td>
                <td>{player.league}</td>
                <td>{player.position}</td>
                <td>{player.prime_duration}</td>
                <td>{player.start_age}</td>
                <td>{player.end_age}</td>
                <td>{player.max_value_age}</td>
                <td>{player.pqi_selected?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderChartView = () => {
    // Prepare data for bar chart - Top 15 players
    const barData = players.slice(0, 15).map((player) => ({
      name: player.player_name,
      duration: player.prime_duration,
      league: player.league,
    }));

    // Prepare data for scatter plot
    const scatterData = players.map((player) => ({
      x: player.start_age,
      y: player.prime_duration,
      name: player.player_name,
      league: player.league,
      z: player.pqi_selected || 1,
    }));

    // Prepare data for league comparison
    const leagueData = [];
    const leagueMap = {};

    players.forEach((player) => {
      if (!leagueMap[player.league]) {
        leagueMap[player.league] = {
          league: player.league,
          players: [],
          avgDuration: 0,
          avgStartAge: 0,
          avgEndAge: 0,
        };
      }
      leagueMap[player.league].players.push(player);
    });

    Object.keys(leagueMap).forEach((key) => {
      const leaguePlayers = leagueMap[key].players;
      leagueMap[key].avgDuration =
        leaguePlayers.reduce((sum, p) => sum + p.prime_duration, 0) /
        leaguePlayers.length;
      leagueMap[key].avgStartAge =
        leaguePlayers.reduce((sum, p) => sum + p.start_age, 0) /
        leaguePlayers.length;
      leagueMap[key].avgEndAge =
        leaguePlayers.reduce((sum, p) => sum + p.end_age, 0) /
        leaguePlayers.length;
      leagueData.push(leagueMap[key]);
    });

    return (
      <div className="chart-view">
        <div className="chart-container">
          <h3>
            Top 15 Players by Prime Duration
            <ContextInfo
              title="Top Players Bar Chart"
              description="This chart shows the 15 athletes with the longest prime durations in years. Each bar is colored according to the athlete's league. Longer bars indicate more sustained peak performance."
            />
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={120} />
              <YAxis
                label={{
                  value: "Prime Duration (Years)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip />
              <Legend />
              <Bar dataKey="duration" name="Prime Duration">
                {barData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={leagueColorMapping[entry.league]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="charts-row">
          <div className="chart-container half-width">
            <h3>
              Prime Start Age vs. Duration
              <ContextInfo
                title="Start Age vs. Duration"
                description="This scatter plot shows the relationship between when athletes start their prime (x-axis) and how long their prime lasts (y-axis). Each point represents an athlete, colored by league, with point size indicating their PQI score."
              />
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Start Age"
                  label={{
                    value: "Prime Start Age",
                    position: "insideBottom",
                    offset: -5,
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Duration"
                  label={{
                    value: "Prime Duration (Years)",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <ZAxis type="number" dataKey="z" range={[50, 400]} name="PQI" />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  formatter={(value, name, props) => {
                    if (name === "Start Age") return value;
                    if (name === "Duration") return value;
                    return value;
                  }}
                  labelFormatter={(label) => ""}
                  content={(props) => {
                    const { payload } = props;
                    if (payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="custom-tooltip">
                          <p>{data.name}</p>
                          <p>{`${data.league} - Start Age: ${data.x}, Duration: ${data.y}`}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                {Object.keys(leagueMap).map((league) => (
                  <Scatter
                    key={league}
                    name={league}
                    data={scatterData.filter((d) => d.league === league)}
                    fill={leagueColorMapping[league]}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container half-width">
            <h3>
              League Comparison
              <ContextInfo
                title="League Average Prime Durations"
                description="This bar chart compares the average prime duration across different leagues. Longer bars indicate sports/leagues where athletes tend to maintain their peak performance for longer periods."
              />
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={leagueData.sort((a, b) => b.avgDuration - a.avgDuration)}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  label={{
                    value: "Prime Duration (Years)",
                    position: "insideBottom",
                    offset: -5,
                  }}
                />
                <YAxis type="category" dataKey="league" width={80} />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgDuration" name="Avg. Prime Duration">
                  {leagueData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={leagueColorMapping[entry.league]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderComparisonView = () => {
    // Group by league
    const leagueMap = {};
    players.forEach((player) => {
      if (!leagueMap[player.league]) {
        leagueMap[player.league] = [];
      }
      leagueMap[player.league].push(player);
    });

    // Calculate stats by league
    const leagueStats = Object.keys(leagueMap)
      .map((league) => {
        const leaguePlayers = leagueMap[league];
        const avgStartAge =
          leaguePlayers.reduce((sum, p) => sum + p.start_age, 0) /
          leaguePlayers.length;
        const avgEndAge =
          leaguePlayers.reduce((sum, p) => sum + p.end_age, 0) /
          leaguePlayers.length;
        const avgPeakAge =
          leaguePlayers.reduce((sum, p) => sum + p.max_value_age, 0) /
          leaguePlayers.length;
        const avgDuration =
          leaguePlayers.reduce((sum, p) => sum + p.prime_duration, 0) /
          leaguePlayers.length;

        return {
          league,
          avgStartAge: avgStartAge.toFixed(1),
          avgEndAge: avgEndAge.toFixed(1),
          avgPeakAge: avgPeakAge.toFixed(1),
          avgDuration: avgDuration.toFixed(1),
          count: leaguePlayers.length,
        };
      })
      .sort((a, b) => b.avgDuration - a.avgDuration);

    // Find max observed age with buffer
    const maxObservedAge = Math.max(
      ...leagueStats.map((stat) => parseFloat(stat.avgEndAge) + 5)
    );
    const minObservedAge = Math.min(
      ...leagueStats.map((stat) => parseFloat(stat.avgStartAge) - 2)
    );

    return (
      <div className="comparison-view">
        <h3>
          League Comparison
          <ContextInfo
            title="League Prime Comparison"
            description="This table compares prime duration data across different leagues. It shows the average ages at which athletes start, peak, and end their prime periods, as well as the average prime duration for each league."
          />
        </h3>
        <table className="comparison-table">
          <thead>
            <tr>
              <th>League</th>
              <th>Avg. Start Age</th>
              <th>Avg. Peak Age</th>
              <th>Avg. End Age</th>
              <th>Avg. Prime Duration</th>
              <th>Players</th>
            </tr>
          </thead>
          <tbody>
            {leagueStats.map((stat) => (
              <tr
                key={stat.league}
                style={{
                  backgroundColor: `${leagueColorMapping[stat.league]}20`,
                }}
              >
                <td
                  style={{
                    color: leagueColorMapping[stat.league],
                    fontWeight: "bold",
                  }}
                >
                  {stat.league}
                </td>
                <td>{stat.avgStartAge}</td>
                <td>{stat.avgPeakAge}</td>
                <td>{stat.avgEndAge}</td>
                <td>{stat.avgDuration}</td>
                <td>{stat.count}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="prime-timeline-visual">
          <h3>
            Prime Age Ranges by League
            <ContextInfo
              title="Prime Age Ranges Visualization"
              description="This visualization shows the average prime age range for each league on a common timeline. Colored bars represent prime periods, with stars marking peak performance ages. The age scale is standardized to allow direct comparison between sports."
            />
          </h3>
          <div className="timeline-container">
            {leagueStats.map((stat) => {
              // Calculate the actual prime duration for display
              const primeDuration =
                parseFloat(stat.avgEndAge) - parseFloat(stat.avgStartAge) + 1;

              return (
                <div className="timeline-row" key={stat.league}>
                  <div
                    className="timeline-label"
                    style={{ color: leagueColorMapping[stat.league] }}
                  >
                    {stat.league}
                  </div>
                  <div className="timeline-bar">
                    {Array.from(
                      { length: Math.ceil(maxObservedAge - minObservedAge) },
                      (_, i) => i + Math.floor(minObservedAge)
                    ).map((age) => {
                      const isInPrime =
                        age >= parseFloat(stat.avgStartAge) &&
                        age <= parseFloat(stat.avgEndAge);
                      const isPeak =
                        Math.round(parseFloat(stat.avgPeakAge)) === age;

                      return (
                        <div
                          key={age}
                          className={`timeline-age ${
                            isInPrime ? "in-prime" : ""
                          } ${isPeak ? "peak-age" : ""}`}
                          style={{
                            backgroundColor: isInPrime
                              ? leagueColorMapping[stat.league]
                              : "transparent",
                            opacity: isInPrime ? 0.7 : 0.1,
                          }}
                        >
                          {isPeak && <div className="peak-marker">★</div>}
                          <div className="age-label">{age}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="timeline-info">
                    <span>Prime: {primeDuration.toFixed(1)} years</span>
                    <span>
                      ({stat.avgStartAge} - {stat.avgEndAge})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="longest-primes">
      <div className="section-header">
        <h2>
          Longest Primes
          <ContextInfo
            title="Longest Prime List"
            description="This table ranks athletes by their prime duration in years. A player's prime is defined as the continuous period where performance remains above a 70% threshold percentage of peak value, with adjustments for low games played. The table shows when their prime started, ended, and reached its peak."
          />
        </h2>
        <div className="view-toggles">
          <button
            className={viewMode === "table" ? "active" : ""}
            onClick={() => setViewMode("table")}
          >
            Table View
          </button>
          <button
            className={viewMode === "chart" ? "active" : ""}
            onClick={() => setViewMode("chart")}
          >
            Chart View
          </button>
          <button
            className={viewMode === "comparison" ? "active" : ""}
            onClick={() => setViewMode("comparison")}
          >
            Comparison View
          </button>
        </div>
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
        limit={limit}
        onSportsChange={setSelectedSports}
        onLeaguesChange={setSelectedLeagues}
        onPositionsChange={setSelectedPositions}
        onLimitChange={setLimit}
        showLimit={true}
      />

      <div className="results-section">
        {viewMode === "table" && renderTableView()}
        {viewMode === "chart" && renderChartView()}
        {viewMode === "comparison" && renderComparisonView()}
      </div>
    </div>
  );
};

export default LongestPrimes;
