import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  ReferenceLine,
  Label,
} from "recharts";
import {
  getTopPlayersByPQI,
  getTopPlayersByCQI,
  joinPlayerMetrics,
} from "../utils/dataProcessing";
import { leagueColorMapping, tierColorMapping } from "../utils/constants";
import EnhancedFilters from "./EnhancedFilters";
import ContextInfo from "./ContextInfo";
import _ from "lodash";
import "../styles/IndexExplorer.css";
import "../styles/EnhancedFilters.css";

// Helper function to safely format number values
const safeFormat = (value, decimals = 2) => {
  if (value === undefined || value === null || isNaN(value)) {
    return "N/A";
  }
  return Number(value).toFixed(decimals);
};

// Index Summary Statistics component
const IndexSummaryStats = ({ players, metricType }) => {
  if (!players || players.length === 0) return null;

  const metricKey = metricType === "pqi" ? "pqi_selected" : "cqi_selected";
  const indexName = metricType === "pqi" ? "PQI" : "CQI";

  // Calculate tier distribution
  const tierDistribution = {};
  let totalScore = 0;
  let totalPlayers = 0;

  players.forEach((player) => {
    if (!player.selected_tier) return;

    totalScore += player[metricKey] || 0;
    totalPlayers++;

    if (!tierDistribution[player.selected_tier]) {
      tierDistribution[player.selected_tier] = {
        count: 0,
        totalScore: 0,
        avgScore: 0,
        sports: new Set(),
        leagues: new Set(),
      };
    }

    tierDistribution[player.selected_tier].count++;
    tierDistribution[player.selected_tier].totalScore += player[metricKey] || 0;

    if (player.sport) {
      tierDistribution[player.selected_tier].sports.add(player.sport);
    }

    if (player.league) {
      tierDistribution[player.selected_tier].leagues.add(player.league);
    }
  });

  // Calculate averages
  Object.keys(tierDistribution).forEach((tier) => {
    tierDistribution[tier].avgScore =
      tierDistribution[tier].totalScore / tierDistribution[tier].count;
  });

  // Sort tiers by importance
  const tierOrder = [
    "Hall of Fame",
    "Elite Player",
    "Great Starter",
    "Starter",
    "Backup",
  ];
  const sortedTiers = tierOrder.filter((tier) => tierDistribution[tier]);

  // Prepare data for visualization
  const tierSummary = sortedTiers.map((tier) => ({
    tier,
    count: tierDistribution[tier].count,
    percentage: (tierDistribution[tier].count / totalPlayers) * 100,
    avgScore: tierDistribution[tier].avgScore,
    sportsCount: tierDistribution[tier].sports.size,
    leaguesCount: tierDistribution[tier].leagues.size,
    color: tierColorMapping[tier] || "#6d1945",
  }));

  return (
    <div className="index-summary">
      <h3>
        {indexName} Metrics Overview
        <ContextInfo
          title={`${indexName} Metrics Overview`}
          description={`This overview provides key insights into the ${
            indexName === "PQI"
              ? "Performance Quotient Index"
              : "Career Quality Index"
          } distribution across different tiers. ${
            indexName === "PQI"
              ? "PQI measures an athlete's career achievement accounting for peak performance, career longevity, and consistency."
              : "CQI evaluates an athlete's overall career quality, considering total career length, average performance, and statistical accumulation."
          }`}
        />
      </h3>

      <div className="metrics-grid">
        <div className="metric-card tier-distribution">
          <h4>Tier Distribution</h4>
          <div className="tier-chart">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={tierSummary}
                  dataKey="count"
                  nameKey="tier"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  labelStyle={{ fontSize: "7px" }}
                  label={({ tier, percentage }) =>
                    `${tier}: ${percentage.toFixed(1)}%`
                  }
                >
                  {tierSummary.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => [
                    `${value} players (${props.payload.percentage.toFixed(
                      1
                    )}%)`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="metric-card index-bars">
          <h4>{indexName} Score by Tier</h4>
          <div className="index-chart">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={tierSummary} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  label={{
                    value: `Average ${indexName} Score`,
                    position: "insideBottom",
                    offset: -5,
                  }}
                />
                <YAxis dataKey="tier" type="category" width={100} />
                <Tooltip
                  formatter={(value) => [`${parseFloat(value).toFixed(2)}`]}
                />
                <Bar dataKey="avgScore" name={`Avg. ${indexName} Score`}>
                  {tierSummary.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="metric-card career-metrics">
          <h4>Career Metrics</h4>
          <div className="career-stats">
            <div className="stat-row">
              <div className="stat-label">Avg. Career Length:</div>
              <div className="stat-value">
                {_.meanBy(players, "career_seasons").toFixed(1)} seasons
              </div>
            </div>
            {metricType === "pqi" && (
              <div className="stat-row">
                <div className="stat-label">Avg. Prime Duration:</div>
                <div className="stat-value">
                  {_.meanBy(players, "prime_seasons").toFixed(1)} seasons
                </div>
              </div>
            )}
            {metricType === "pqi" && (
              <div className="stat-row">
                <div className="stat-label">Prime/Career Ratio:</div>
                <div className="stat-value">
                  {(
                    (_.meanBy(players, "prime_seasons") /
                      _.meanBy(players, "career_seasons")) *
                    100
                  ).toFixed(1)}
                  %
                </div>
              </div>
            )}
            {metricType === "cqi" && (
              <div className="stat-row">
                <div className="stat-label">Avg. Career Games:</div>
                <div className="stat-value">
                  {_.meanBy(players, "career_games").toFixed(1)}
                </div>
              </div>
            )}
            {metricType === "cqi" && (
              <div className="stat-row">
                <div className="stat-label">Active Players:</div>
                <div className="stat-value">
                  {players.filter((p) => p.is_active).length} (
                  {(
                    (players.filter((p) => p.is_active).length /
                      players.length) *
                    100
                  ).toFixed(1)}
                  %)
                </div>
              </div>
            )}
            <div className="stat-row">
              <div className="stat-label">Players Analyzed:</div>
              <div className="stat-value">{totalPlayers.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="tier-legend">
        {tierSummary.map((tier) => (
          <div key={tier.tier} className="tier-legend-item">
            <span
              className="tier-color"
              style={{ backgroundColor: tier.color }}
            ></span>
            <span className="tier-name">{tier.tier}</span>
            <span className="tier-count">{tier.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Players Comparison component for viewing both PQI and CQI
const PlayersComparison = ({ joinedPlayers }) => {
  if (!joinedPlayers || joinedPlayers.length === 0) return null;

  // Calculate statistics for the chart data
  const avgAbsDiff = Math.abs(_.meanBy(joinedPlayers, "index_difference"));
  const pqiOverCqi = joinedPlayers.filter(
    (p) => p.pqi_score > p.cqi_score
  ).length;
  const cqiOverPqi = joinedPlayers.filter(
    (p) => p.cqi_score > p.pqi_score
  ).length;
  const totalPlayers = joinedPlayers.length;

  // Calculate percentages
  const pqiOverCqiPct = ((pqiOverCqi / totalPlayers) * 100).toFixed(1);
  const cqiOverPqiPct = ((cqiOverPqi / totalPlayers) * 100).toFixed(1);

  // Improved metrics
  const metrics = [
    {
      name: "Average Index Difference",
      value: avgAbsDiff.toFixed(2),
      description: "Average absolute difference between CQI and PQI scores",
    },
    {
      name: "Peak Performers (PQI > CQI)",
      value: `${pqiOverCqi} (${pqiOverCqiPct}%)`,
      description: "Athletes with higher peak value than career accumulation",
    },
    {
      name: "Career Accumulators (CQI > PQI)",
      value: `${cqiOverPqi} (${cqiOverPqiPct}%)`,
      description: "Athletes with higher career accumulation than peak value",
    },
    {
      name: "Athletes Analyzed",
      value: totalPlayers,
      description: "Total number of athletes in this comparison",
    },
  ];

  // Prepare data for the scatter plot
  const scatterData = joinedPlayers.map((player) => ({
    id: player.id,
    name: player.player_name,
    league: player.league,
    sport: player.sport,
    position: player.position,
    pqi: player.pqi_score,
    cqi: player.cqi_score,
    career_seasons: player.career_seasons,
    prime_seasons: player.prime_seasons,
    career_games: player.career_games,
    difference: player.index_difference,
  }));

  // Get insights on player archetypes
  const balancedPlayers = joinedPlayers.filter(
    (p) => Math.abs(p.index_difference) < 5
  );
  const peakPerformers = joinedPlayers.filter(
    (p) => p.pqi_score > p.cqi_score && p.index_difference < -5
  );
  const careerAccumulators = joinedPlayers.filter(
    (p) => p.cqi_score > p.pqi_score && p.index_difference > 5
  );

  // Interesting archetype examples
  const topPeakPerformer = _.maxBy(peakPerformers, (p) =>
    Math.abs(p.index_difference)
  );
  const topCareerAccumulator = _.maxBy(
    careerAccumulators,
    (p) => p.index_difference
  );
  const mostBalanced = _.minBy(balancedPlayers, (p) =>
    Math.abs(p.index_difference)
  );

  // Player archetype examples
  const archetypeExamples = [];

  if (topPeakPerformer) {
    archetypeExamples.push({
      name: topPeakPerformer.player_name,
      sport: topPeakPerformer.sport,
      league: topPeakPerformer.league,
      pqi: topPeakPerformer.pqi_score.toFixed(1),
      cqi: topPeakPerformer.cqi_score.toFixed(1),
      diff: topPeakPerformer.index_difference.toFixed(1),
      type: "Peak Performer",
      description: "High PQI with shorter but exceptional prime years",
    });
  }

  if (topCareerAccumulator) {
    archetypeExamples.push({
      name: topCareerAccumulator.player_name,
      sport: topCareerAccumulator.sport,
      league: topCareerAccumulator.league,
      pqi: topCareerAccumulator.pqi_score.toFixed(1),
      cqi: topCareerAccumulator.cqi_score.toFixed(1),
      diff: topCareerAccumulator.index_difference.toFixed(1),
      type: "Career Accumulator",
      description: "High CQI with longer career and consistent production",
    });
  }

  if (mostBalanced) {
    archetypeExamples.push({
      name: mostBalanced.player_name,
      sport: mostBalanced.sport,
      league: mostBalanced.league,
      pqi: mostBalanced.pqi_score.toFixed(1),
      cqi: mostBalanced.cqi_score.toFixed(1),
      diff: mostBalanced.index_difference.toFixed(1),
      type: "Balanced Career",
      description:
        "Nearly identical PQI and CQI values, balanced prime and career quality",
    });
  }

  return (
    <div className="metrics-comparison">
      <div className="comparison-header">
        <h3>
          PQI vs CQI Comparison
          <ContextInfo
            title="Performance vs Career Quality"
            description="This analysis compares Performance Quotient Index (PQI) and Career Quality Index (CQI) metrics. PQI focuses on peak performance periods and prime years, while CQI evaluates overall career quality including longevity and career-wide statistical production. The scatter plot shows correlation between these two metrics, with divergent players highlighted."
          />
        </h3>
        <div className="metrics-overview">
          {metrics.map((metric, index) => (
            <div key={index} className="metric-box" title={metric.description}>
              <div className="metric-value">{metric.value}</div>
              <div className="metric-label">{metric.name}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="comparison-charts">
        <div className="chart-container full-width">
          <h4>PQI-CQI Correlation</h4>
          <ResponsiveContainer width="100%" height={500}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
              <CartesianGrid />
              <XAxis
                type="number"
                dataKey="pqi"
                name="PQI Score"
                domain={[0, 100]}
                label={{
                  value: "PQI Score",
                  position: "insideBottom",
                  offset: -10,
                }}
              />
              <YAxis
                type="number"
                dataKey="cqi"
                name="CQI Score"
                domain={[0, 100]}
                label={{
                  value: "CQI Score",
                  angle: -90,
                  position: "insideLeft",
                  offset: 0,
                }}
              />
              <ZAxis range={[50, 400]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                formatter={(value, name) => [
                  value.toFixed(2),
                  name === "pqi" ? "PQI Score" : "CQI Score",
                ]}
                labelFormatter={(label) => ""}
                content={(props) => {
                  const { payload } = props;
                  if (payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="custom-tooltip">
                        <p className="tooltip-name">{data.name}</p>
                        <p className="tooltip-league">
                          {data.league} - {data.position}
                        </p>
                        <p className="tooltip-pqi">
                          PQI: <strong>{data.pqi.toFixed(2)}</strong>
                        </p>
                        <p className="tooltip-cqi">
                          CQI: <strong>{data.cqi.toFixed(2)}</strong>
                        </p>
                        <p className="tooltip-diff">
                          Difference:{" "}
                          <strong>{data.difference.toFixed(2)}</strong>
                        </p>
                        <p className="tooltip-career">
                          Career: <strong>{data.career_seasons} seasons</strong>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />

              {/* 1:1 reference line */}
              <ReferenceLine
                segment={[
                  { x: 0, y: 0 },
                  { x: 100, y: 100 },
                ]}
                stroke="#666"
                strokeDasharray="3 3"
              />

              {/* Group by league for different colors */}
              {Object.keys(leagueColorMapping).map((league) => {
                const leagueData = scatterData.filter(
                  (d) => d.league === league
                );
                return leagueData.length > 0 ? (
                  <Scatter
                    key={league}
                    name={league}
                    data={leagueData}
                    fill={leagueColorMapping[league]}
                  />
                ) : null;
              })}
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="comparison-insights full-width">
          <h4>What Explains the Differences?</h4>
          <div className="insights-content">
            <div className="insights-text">
              <p>
                <strong>Performance Quotient Index (PQI)</strong> focuses on an
                athlete's peak performance periods, emphasizing quality over
                quantity. The formula includes:
              </p>
              <ul>
                <li>
                  Prime seasons duration (weighted by logarithmic scaling)
                </li>
                <li>Average tier score during prime years</li>
                <li>Average performance value in prime seasons</li>
                <li>Peak performance value (with 30% bonus weight)</li>
                <li>Consistency during prime years</li>
              </ul>
              <p>
                <strong>Career Quality Index (CQI)</strong> evaluates an
                athlete's entire career contribution, including longevity and
                total accumulated value. It's calculated using:
              </p>
              <ul>
                <li>Total career seasons (weighted by logarithmic scaling)</li>
                <li>Average tier score across entire career</li>
                <li>Average value across all seasons</li>
                <li>Career peak value (with only 10% bonus weight)</li>
                <li>Overall career consistency</li>
              </ul>
              <p>
                The scatter plot reveals distinct player archetypes based on
                index differences:
              </p>
              <ul>
                <li>
                  <strong>Balanced Careers</strong> - Athletes near the diagonal
                  line whose career quality matches their peak performance
                </li>
                <li>
                  <strong>Peak Performers</strong> - Athletes above the line
                  with higher PQI than CQI, indicating exceptional but shorter
                  peaks
                </li>
                <li>
                  <strong>Career Accumulators</strong> - Athletes below the line
                  with higher CQI than PQI, showing longer careers with
                  consistent production
                </li>
              </ul>
            </div>

            <div className="insights-table">
              <h5>Player Archetype Examples</h5>
              <table>
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Type</th>
                    <th>PQI</th>
                    <th>CQI</th>
                    <th>Diff</th>
                  </tr>
                </thead>
                <tbody>
                  {archetypeExamples.map((player, index) => (
                    <tr key={index}>
                      <td>{player.name}</td>
                      <td>{player.type}</td>
                      <td className={player.diff < 0 ? "highlight" : ""}>
                        {player.pqi}
                      </td>
                      <td className={player.diff > 0 ? "highlight" : ""}>
                        {player.cqi}
                      </td>
                      <td>{player.diff}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Card View for display of top players
const CardView = ({ players, metricType }) => {
  if (!players || players.length === 0) return null;

  const metricKey = metricType === "pqi" ? "pqi_selected" : "cqi_selected";
  const indexName = metricType === "pqi" ? "PQI" : "CQI";
  const uniqueMetric = metricType === "pqi" ? "prime_seasons" : "career_games";
  const uniqueMetricLabel =
    metricType === "pqi" ? "Prime Seasons" : "Career Games";

  return (
    <div className="card-view">
      <h3>
        Top Athletes by {indexName}
        <ContextInfo
          title={`${indexName} Player Cards`}
          description={`These cards display the top athletes ranked by their ${indexName} score in a visual format. Each card is color-coded by league and shows key performance metrics including ${indexName} score, tier classification, and career data.`}
        />
      </h3>
      <div className="index-cards">
        {players.slice(0, 15).map((player, index) => (
          <div
            className="index-card"
            key={player.id}
            style={{
              borderLeftColor: leagueColorMapping[player.league] || "#6d1945",
              borderLeftWidth: "4px",
              borderLeftStyle: "solid",
            }}
          >
            <div
              className="card-header"
              style={{
                backgroundColor: leagueColorMapping[player.league] || "#6d1945",
              }}
            >
              <div className="card-rank">{index + 1}</div>
              <h4>{player.player_name}</h4>
            </div>

            <div className="card-content">
              <div className="card-stat">
                <span className="stat-label">Sport/League:</span>
                <span className="stat-value">
                  {player.sport} / {player.league}
                </span>
              </div>

              <div className="card-stat">
                <span className="stat-label">Position:</span>
                <span className="stat-value">{player.position}</span>
              </div>

              <div className="card-stat">
                <span className="stat-label">{indexName} Score:</span>
                <span className="stat-value">
                  {player[metricKey]?.toFixed(2)}
                </span>
              </div>

              <div className="card-stat">
                <span className="stat-label">Tier:</span>
                <span
                  className="stat-value"
                  style={{ color: tierColorMapping[player.selected_tier] }}
                >
                  {player.selected_tier}
                </span>
              </div>

              <div className="card-stat">
                <span className="stat-label">Career Seasons:</span>
                <span className="stat-value">{player.career_seasons}</span>
              </div>

              <div className="card-stat">
                <span className="stat-label">{uniqueMetricLabel}:</span>
                <span className="stat-value">
                  {/* For CQI, ensure career_games is displayed properly */}
                  {metricType === "cqi"
                    ? Math.round(player.career_games)
                    : player[uniqueMetric]}
                </span>
              </div>

              {metricType === "pqi" && (
                <div className="card-metric">
                  <div className="metric-label">Prime Density</div>
                  <div className="metric-bar">
                    <div
                      className="metric-fill"
                      style={{
                        width: `${(player.prime_density || 0) * 100}%`,
                        backgroundColor:
                          leagueColorMapping[player.league] ||
                          tierColorMapping[player.selected_tier],
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {player.is_active && (
                <div className="active-indicator">ACTIVE</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Rankings Table View
const RankingsTable = ({ players, metricType }) => {
  if (!players || players.length === 0) return null;

  const metricKey = metricType === "pqi" ? "pqi_selected" : "cqi_selected";
  const indexName = metricType === "pqi" ? "PQI" : "CQI";
  const uniqueColumns =
    metricType === "pqi"
      ? [
          { key: "prime_seasons", label: "Prime" },
          { key: "prime_peak_value", label: "Peak Value" },
        ]
      : [
          { key: "career_games", label: "Games" },
          { key: "career_peak_value", label: "Peak Value" },
        ];

  return (
    <div className="table-view">
      <h3>
        {indexName} Rankings Table
        <ContextInfo
          title={`${indexName} Rankings`}
          description={`This table lists athletes ranked by their ${indexName} score. ${indexName} is a standardized metric that allows comparing performance across different sports and positions. The table includes each athlete's tier classification, career seasons, and other key metrics.`}
        />
      </h3>
      <div className="table-container">
        <table className="player-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Sport</th>
              <th>League</th>
              <th>Position</th>
              <th>{indexName} Score</th>
              <th>Tier</th>
              <th>Career</th>
              {uniqueColumns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
              {metricType === "cqi" && <th>Active</th>}
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
                <td>{safeFormat(player[metricKey])}</td>
                <td style={{ color: tierColorMapping[player.selected_tier] }}>
                  {player.selected_tier}
                </td>
                <td>{player.career_seasons}</td>
                {uniqueColumns.map((col) => (
                  <td key={col.key}>
                    {col.key === "prime_peak_value" ||
                    col.key === "career_peak_value"
                      ? safeFormat(player[col.key])
                      : col.key === "career_games"
                      ? Math.round(player[col.key]) // Round career games to whole number
                      : player[col.key]}
                  </td>
                ))}
                {metricType === "cqi" && (
                  <td>{player.is_active ? "Yes" : "No"}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Main IndexExplorer component
const IndexExplorer = ({
  data,
  positions,
  leagues,
  selectedSports = [],
  selectedLeagues = [],
  selectedPositions = [],
  limit = 25,
  setSelectedSports = () => {},
  setSelectedLeagues = () => {},
  setSelectedPositions = () => {},
  setLimit = () => {},
}) => {
  const [viewMode, setViewMode] = useState("overview");
  const [selectedMetric, setSelectedMetric] = useState("pqi"); // "pqi", "cqi", or "comparison"
  const [pqiPlayers, setPqiPlayers] = useState([]);
  const [cqiPlayers, setCqiPlayers] = useState([]);
  const [joinedPlayers, setJoinedPlayers] = useState([]);

  // Get all unique sports
  const allSports = React.useMemo(() => {
    if (!data || !data.pqiData) return [];
    return [...new Set(data.pqiData.map((player) => player.sport))].filter(
      Boolean
    );
  }, [data]);

  // When viewMode is "factors", automatically set limit to 0 (None/All)
  useEffect(() => {
    if (viewMode === "factors" && limit !== 0) {
      setLimit(0);
    }
  }, [viewMode, limit, setLimit]);

  // Update player data when filters change
  useEffect(() => {
    if (data && data.pqiData && data.cqiData) {
      // Create filters object with multi-select arrays
      const filters = {
        sport: selectedSports.length > 0 ? selectedSports : undefined,
        league: selectedLeagues.length > 0 ? selectedLeagues : undefined,
        position: selectedPositions.length > 0 ? selectedPositions : undefined,
      };

      // Use 0 as "None" (all) option
      const limitValue = limit === 0 ? 7000 : limit;

      // Get top players for each metric
      const topPQIPlayers = getTopPlayersByPQI(
        data.pqiData,
        limitValue,
        filters
      );
      const topCQIPlayers = getTopPlayersByCQI(
        data.cqiData,
        limitValue,
        filters
      );

      // Get joined player data for comparison view
      const joinedPlayerData = joinPlayerMetrics(
        data.pqiData,
        data.cqiData,
        limitValue,
        filters
      );

      setPqiPlayers(topPQIPlayers);
      setCqiPlayers(topCQIPlayers);
      setJoinedPlayers(joinedPlayerData);
    }
  }, [data, selectedSports, selectedLeagues, selectedPositions, limit]);

  // Get appropriate player data based on selected metric
  const getPlayersForCurrentView = () => {
    if (selectedMetric === "pqi") return pqiPlayers;
    if (selectedMetric === "cqi") return cqiPlayers;
    return joinedPlayers;
  };

  // Render overview based on selected metric
  const renderOverview = () => {
    if (selectedMetric === "comparison") {
      return <PlayersComparison joinedPlayers={joinedPlayers} />;
    }

    return (
      <div className="overview-view">
        <IndexSummaryStats
          players={getPlayersForCurrentView()}
          metricType={selectedMetric}
        />
        <CardView
          players={getPlayersForCurrentView()}
          metricType={selectedMetric}
        />
      </div>
    );
  };

  // Render table view based on selected metric
  const renderTableView = () => {
    if (selectedMetric === "comparison") {
      return (
        <div className="comparison-table-view">
          <PlayersComparison joinedPlayers={joinedPlayers} />
          <div className="dual-tables">
            <div className="table-half">
              <h3>PQI Rankings</h3>
              <RankingsTable
                players={pqiPlayers.slice(0, 10)}
                metricType="pqi"
              />
            </div>
            <div className="table-half">
              <h3>CQI Rankings</h3>
              <RankingsTable
                players={cqiPlayers.slice(0, 10)}
                metricType="cqi"
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <RankingsTable
        players={getPlayersForCurrentView()}
        metricType={selectedMetric}
      />
    );
  };

  return (
    <div className="index-explorer">
      <div className="section-header">
        <h2>
          Index Explorer
          <ContextInfo
            title="Performance and Career Metrics"
            description="The Index Explorer allows you to analyze two complementary metrics: Performance Quotient Index (PQI) measures peak performance and prime years, while Career Quality Index (CQI) evaluates overall career quality and longevity. Compare these metrics to gain insights into different aspects of athletic careers."
          />
        </h2>
        <div className="view-toggles">
          <button
            className={viewMode === "overview" ? "active" : ""}
            onClick={() => setViewMode("overview")}
          >
            Overview
          </button>
          <button
            className={viewMode === "table" ? "active" : ""}
            onClick={() => setViewMode("table")}
          >
            Rankings Table
          </button>
        </div>
      </div>

      {/* Metric selection tabs */}
      <div className="metric-selector">
        <button
          className={`metric-tab ${selectedMetric === "pqi" ? "active" : ""}`}
          onClick={() => setSelectedMetric("pqi")}
        >
          PQI
          <span className="metric-description">Performance Quotient Index</span>
        </button>
        <button
          className={`metric-tab ${selectedMetric === "cqi" ? "active" : ""}`}
          onClick={() => setSelectedMetric("cqi")}
        >
          CQI
          <span className="metric-description">Career Quality Index</span>
        </button>
        <button
          className={`metric-tab ${
            selectedMetric === "comparison" ? "active" : ""
          }`}
          onClick={() => setSelectedMetric("comparison")}
        >
          Compare
          <span className="metric-description">PQI vs CQI Analysis</span>
        </button>
      </div>

      {/* EnhancedFilters component */}
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
        {viewMode === "overview" && renderOverview()}
        {viewMode === "table" && renderTableView()}
      </div>
    </div>
  );
};

export default IndexExplorer;
