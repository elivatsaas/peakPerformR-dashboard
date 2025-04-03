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
} from "recharts";
import { getTopPlayersByPQI } from "../utils/dataProcessing";
import { leagueColorMapping, tierColorMapping } from "../utils/constants";
import EnhancedFilters from "./EnhancedFilters";
import ContextInfo from "./ContextInfo";
import _ from "lodash";
import "../styles/PQIExplorer.css";
import "../styles/EnhancedFilters.css";

// Helper function to safely format number values
const safeFormat = (value, decimals = 2) => {
  if (value === undefined || value === null || isNaN(value)) {
    return "N/A";
  }
  return Number(value).toFixed(decimals);
};

// PQI Summary Statistics component
const PQISummaryStats = ({ players }) => {
  if (!players || players.length === 0) return null;

  // Calculate tier distribution
  const tierDistribution = {};
  let totalPQI = 0;
  let totalPlayers = 0;

  players.forEach((player) => {
    if (!player.selected_tier) return;

    totalPQI += player.pqi_selected || 0;
    totalPlayers++;

    if (!tierDistribution[player.selected_tier]) {
      tierDistribution[player.selected_tier] = {
        count: 0,
        totalPQI: 0,
        avgPQI: 0,
        sports: new Set(),
        leagues: new Set(),
      };
    }

    tierDistribution[player.selected_tier].count++;
    tierDistribution[player.selected_tier].totalPQI += player.pqi_selected || 0;

    if (player.sport) {
      tierDistribution[player.selected_tier].sports.add(player.sport);
    }

    if (player.league) {
      tierDistribution[player.selected_tier].leagues.add(player.league);
    }
  });

  // Calculate averages
  Object.keys(tierDistribution).forEach((tier) => {
    tierDistribution[tier].avgPQI =
      tierDistribution[tier].totalPQI / tierDistribution[tier].count;
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
    avgPQI: tierDistribution[tier].avgPQI,
    sportsCount: tierDistribution[tier].sports.size,
    leaguesCount: tierDistribution[tier].leagues.size,
    color: tierColorMapping[tier] || "#6d1945",
  }));

  // Additional career metrics
  const avgCareerSeasons = _.meanBy(players, "career_seasons") || 0;
  const avgPrimeSeasons = _.meanBy(players, "prime_seasons") || 0;
  const primeToPct = (avgPrimeSeasons / avgCareerSeasons) * 100 || 0;

  return (
    <div className="pqi-summary">
      <h3>
        PQI Metrics Overview
        <ContextInfo
          title="PQI Metrics Overview"
          description="This overview provides key insights into the Performance Quotient Index (PQI) distribution across different tiers. PQI measures an athlete's career achievement accounting for peak performance, career longevity, and consistency."
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

        <div className="metric-card pqi-bars">
          <h4>PQI Score by Tier</h4>
          <div className="pqi-chart">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={tierSummary} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  label={{
                    value: "Average PQI Score",
                    position: "insideBottom",
                    offset: -5,
                  }}
                />
                <YAxis dataKey="tier" type="category" width={100} />
                <Tooltip
                  formatter={(value) => [`${parseFloat(value).toFixed(2)}`]}
                />
                <Bar dataKey="avgPQI" name="Avg. PQI Score">
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
                {avgCareerSeasons.toFixed(1)} seasons
              </div>
            </div>
            <div className="stat-row">
              <div className="stat-label">Avg. Prime Duration:</div>
              <div className="stat-value">
                {avgPrimeSeasons.toFixed(1)} seasons
              </div>
            </div>
            <div className="stat-row">
              <div className="stat-label">Prime/Career Ratio:</div>
              <div className="stat-value">{primeToPct.toFixed(1)}%</div>
            </div>
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

// PQI Factor Analysis component
const PQIFactorAnalysis = ({ players }) => {
  if (!players || players.length === 0) return null;

  // Get a distribution of common factors that contribute to PQI
  const factorsByTier = {};
  const tierOrder = [
    "Hall of Fame",
    "Elite Player",
    "Great Starter",
    "Starter",
    "Backup",
  ];

  // Initialize tier data
  tierOrder.forEach((tier) => {
    factorsByTier[tier] = {
      careerSeasons: [],
      primeSeasons: [],
      primePeakValue: [],
      primeAvgValue: [],
      primeElitePct: [],
      careerElitePct: [],
      primeDensity: [],
    };
  });

  // Group data by tier
  players.forEach((player) => {
    const tier = player.selected_tier;
    if (!tier || !factorsByTier[tier]) return;

    // Add data to appropriate tier group
    factorsByTier[tier].careerSeasons.push(player.career_seasons || 0);
    factorsByTier[tier].primeSeasons.push(player.prime_seasons || 0);
    factorsByTier[tier].primePeakValue.push(player.prime_peak_value || 0);
    factorsByTier[tier].primeAvgValue.push(player.prime_avg_value || 0);
    factorsByTier[tier].primeElitePct.push(player.prime_elite_pct || 0);
    factorsByTier[tier].careerElitePct.push(player.career_elite_pct || 0);
    factorsByTier[tier].primeDensity.push(player.prime_density || 0);
  });

  // Calculate averages for each tier and factor
  const radarData = tierOrder
    .filter((tier) => factorsByTier[tier].careerSeasons.length > 0)
    .map((tier) => {
      const tierData = factorsByTier[tier];
      return {
        tier,
        "Career Length": _.mean(tierData.careerSeasons),
        "Prime Duration": _.mean(tierData.primeSeasons),
        "Peak Value": _.mean(tierData.primePeakValue) * 100, // Scale for visibility
        "Average Value": _.mean(tierData.primeAvgValue) * 100, // Scale for visibility
        "Elite %": _.mean(tierData.primeElitePct) * 100,
        "Career Consistency": _.mean(tierData.careerElitePct) * 100,
        "Prime Density": _.mean(tierData.primeDensity) * 100,
      };
    });

  return (
    <div className="pqi-factor-analysis">
      <h3>
        PQI Factor Analysis
        <ContextInfo
          title="PQI Factor Analysis"
          description="This radar chart shows the key factors that contribute to the PQI score across different tiers. It visualizes how career length, prime duration, peak performance, and consistency vary between tiers."
        />
      </h3>

      <div className="radar-chart">
        <ResponsiveContainer width="100%" height={500}>
          <RadarChart
            data={radarData}
            margin={{ top: 10, right: 30, left: 30, bottom: 10 }}
          >
            <PolarGrid />
            <PolarAngleAxis dataKey="tier" />
            <PolarRadiusAxis angle={30} domain={[0, "auto"]} />

            {radarData.map((entry, index) => (
              <Radar
                key={entry.tier}
                name={entry.tier}
                dataKey={entry.tier}
                stroke={tierColorMapping[entry.tier]}
                fill={tierColorMapping[entry.tier]}
                fillOpacity={0.3}
              />
            ))}

            <Radar
              name="Career Length"
              dataKey="Career Length"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.6}
            />
            <Radar
              name="Prime Duration"
              dataKey="Prime Duration"
              stroke="#82ca9d"
              fill="#82ca9d"
              fillOpacity={0.6}
            />
            <Radar
              name="Peak Value"
              dataKey="Peak Value"
              stroke="#ffc658"
              fill="#ffc658"
              fillOpacity={0.6}
            />
            <Radar
              name="Elite %"
              dataKey="Elite %"
              stroke="#ff8042"
              fill="#ff8042"
              fillOpacity={0.6}
            />
            <Radar
              name="Prime Density"
              dataKey="Prime Density"
              stroke="#0088fe"
              fill="#0088fe"
              fillOpacity={0.6}
            />

            <Legend />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// PQI Distribution component
const PQIDistribution = ({ players }) => {
  if (!players || players.length === 0) return null;

  // Group by league and calculate PQI distribution
  const leagues = _.groupBy(players, "league");

  // Prepare data for visualization
  const leagueData = Object.keys(leagues)
    .map((league) => {
      const leaguePlayers = leagues[league];
      const avgPQI = _.meanBy(leaguePlayers, "pqi_selected") || 0;
      const maxPQI = _.maxBy(leaguePlayers, "pqi_selected")?.pqi_selected || 0;
      const medianPQI =
        _.sortBy(leaguePlayers, "pqi_selected")[
          Math.floor(leaguePlayers.length / 2)
        ]?.pqi_selected || 0;

      // Calculate tier distribution for this league
      const tierCounts = _.countBy(leaguePlayers, "selected_tier");
      const tierPercentages = {};

      Object.keys(tierCounts).forEach((tier) => {
        tierPercentages[tier] = (tierCounts[tier] / leaguePlayers.length) * 100;
      });

      return {
        league,
        players: leaguePlayers.length,
        avgPQI,
        maxPQI,
        medianPQI,
        hofPct: tierPercentages["Hall of Fame"] || 0,
        elitePct: tierPercentages["Elite Player"] || 0,
        greatPct: tierPercentages["Great Starter"] || 0,
        starterPct: tierPercentages["Starter"] || 0,
        backupPct: tierPercentages["Backup"] || 0,
      };
    })
    .sort((a, b) => b.avgPQI - a.avgPQI);

  return (
    <div className="pqi-distribution">
      <h3>
        PQI Distribution by League
        <ContextInfo
          title="PQI Distribution by League"
          description="This chart shows how PQI scores are distributed across different leagues. It allows you to compare the average, median, and maximum PQI scores, as well as the tier distribution within each league."
        />
      </h3>

      <div className="league-pqi-chart">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={leagueData}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              domain={[0, 100]}
              label={{
                value: "PQI Score",
                position: "insideBottom",
                offset: -5,
              }}
            />
            <YAxis dataKey="league" type="category" width={80} />
            <Tooltip
              formatter={(value, name) => {
                const formatted = parseFloat(value).toFixed(2);
                const label =
                  name === "avgPQI"
                    ? "Average PQI"
                    : name === "maxPQI"
                    ? "Maximum PQI"
                    : name === "medianPQI"
                    ? "Median PQI"
                    : name;
                return [`${formatted}`, label];
              }}
              labelFormatter={(label) =>
                `${label} League (${
                  leagueData.find((l) => l.league === label).players
                } players)`
              }
            />
            <Legend />
            <Bar dataKey="avgPQI" name="Average PQI" fill="#8884d8" />
            <Bar dataKey="medianPQI" name="Median PQI" fill="#82ca9d" />
            <Bar dataKey="maxPQI" name="Maximum PQI" fill="#ffc658" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="tier-distribution-by-league">
        <h4>Tier Distribution by League</h4>
        <div className="stacked-bar-chart">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={leagueData}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                domain={[0, 100]}
                label={{
                  value: "Percentage of Players",
                  position: "insideBottom",
                  offset: -5,
                }}
              />
              <YAxis dataKey="league" type="category" width={80} />
              <Tooltip
                formatter={(value) => [`${parseFloat(value).toFixed(1)}%`]}
              />
              <Legend />
              <Bar
                dataKey="hofPct"
                name="Hall of Fame"
                stackId="a"
                fill={tierColorMapping["Hall of Fame"]}
              />
              <Bar
                dataKey="elitePct"
                name="Elite Player"
                stackId="a"
                fill={tierColorMapping["Elite Player"]}
              />
              <Bar
                dataKey="greatPct"
                name="Great Starter"
                stackId="a"
                fill={tierColorMapping["Great Starter"]}
              />
              <Bar
                dataKey="starterPct"
                name="Starter"
                stackId="a"
                fill={tierColorMapping["Starter"]}
              />
              <Bar
                dataKey="backupPct"
                name="Backup"
                stackId="a"
                fill={tierColorMapping["Backup"]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// PQI Explorer Card View
const CardView = ({ players }) => {
  if (!players || players.length === 0) return null;

  return (
    <div className="card-view">
      <h3>
        Top Athletes by PQI
        <ContextInfo
          title="Top Athletes by PQI"
          description="These cards display the top-performing athletes ranked by their Performance Quotient Index (PQI) score. Each card shows the key metrics that contribute to the athlete's classification."
        />
      </h3>

      <div className="pqi-cards">
        {players.slice(0, 15).map((player, index) => (
          <div
            className="pqi-card"
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
                <span className="stat-label">PQI Score:</span>
                <span className="stat-value">
                  {player.pqi_selected?.toFixed(2)}
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
                <span className="stat-label">Prime Seasons:</span>
                <span className="stat-value">{player.prime_seasons}</span>
              </div>

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

              <div className="card-metric">
                <div className="metric-label">Prime Elite %</div>
                <div className="metric-bar">
                  <div
                    className="metric-fill"
                    style={{
                      width: `${(player.prime_elite_pct || 0) * 100}%`,
                      backgroundColor:
                        leagueColorMapping[player.league] ||
                        tierColorMapping[player.selected_tier],
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Career vs Prime Scatter plot
const CareerVsPrime = ({ players }) => {
  if (!players || players.length === 0) return null;

  // Prepare data for scatter plot
  const scatterData = players.map((player) => ({
    id: player.id,
    name: player.player_name,
    sport: player.sport,
    league: player.league,
    position: player.position,
    careerSeasons: player.career_seasons || 0,
    primeSeasons: player.prime_seasons || 0,
    pqiScore: player.pqi_selected || 0,
    tier: player.selected_tier || "Unknown",
    primePct:
      player.prime_seasons && player.career_seasons
        ? (player.prime_seasons / player.career_seasons) * 100
        : 0,
  }));

  // Group by tier for different colored scatter points
  const tierGroups = _.groupBy(scatterData, "tier");

  return (
    <div className="career-vs-prime">
      <h3>
        Career Length vs. Prime Duration
        <ContextInfo
          title="Career Length vs. Prime Duration Analysis"
          description="This scatter plot visualizes the relationship between career length and prime duration. Each point represents an athlete, with color indicating their PQI tier. The chart helps identify how prime duration correlates with overall career length across different performance tiers."
        />
      </h3>

      <div className="scatter-chart">
        <ResponsiveContainer width="100%" height={500}>
          <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="careerSeasons"
              type="number"
              name="Career Seasons"
              label={{
                value: "Career Length (Seasons)",
                position: "insideBottom",
                offset: -5,
              }}
            />
            <YAxis
              dataKey="primeSeasons"
              type="number"
              name="Prime Seasons"
              label={{
                value: "Prime Duration (Seasons)",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <ZAxis dataKey="pqiScore" range={[40, 400]} name="PQI Score" />

            {/* Reference line for 1:1 ratio (theoretical maximum) */}
            <ReferenceLine
              stroke="#666"
              strokeDasharray="3 3"
              segment={[
                { x: 0, y: 0 },
                { x: 30, y: 30 },
              ]}
            />

            {/* Reference line for average ratio */}
            <ReferenceLine
              stroke="#ff7300"
              strokeDasharray="3 3"
              segment={[
                { x: 0, y: 0 },
                {
                  x: 30,
                  y:
                    30 *
                    (_.meanBy(players, "prime_seasons") /
                      _.meanBy(players, "career_seasons")),
                },
              ]}
            />

            <Tooltip
              formatter={(value, name, props) => {
                if (name === "PQI Score")
                  return [`${parseFloat(value).toFixed(2)}`, "PQI Score"];
                return [value, name];
              }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="custom-tooltip">
                      <p className="tooltip-name">{data.name}</p>
                      <p className="tooltip-sport">
                        {data.sport} / {data.league} - {data.position}
                      </p>
                      <p className="tooltip-stat">
                        Career: <strong>{data.careerSeasons} seasons</strong>
                      </p>
                      <p className="tooltip-stat">
                        Prime: <strong>{data.primeSeasons} seasons</strong> (
                        {data.primePct.toFixed(1)}% of career)
                      </p>
                      <p className="tooltip-pqi">
                        PQI: <strong>{data.pqiScore.toFixed(2)}</strong> (
                        {data.tier})
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />

            {Object.keys(tierGroups).map((tier) => (
              <Scatter
                key={tier}
                name={tier}
                data={tierGroups[tier]}
                fill={tierColorMapping[tier] || "#6d1945"}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="insight-box">
        <h4>Key Insights</h4>
        <ul>
          <li>
            The solid diagonal line represents the theoretical maximum where an
            athlete's entire career would be in their prime.
          </li>
          <li>
            The dashed orange line shows the average prime-to-career ratio
            across all athletes.
          </li>
          <li>
            Hall of Fame athletes typically maintain prime performance for a
            larger portion of their career.
          </li>
          <li>
            Point size indicates PQI score - higher scores have larger points.
          </li>
        </ul>
      </div>
    </div>
  );
};

// PQI Rankings Table component
const RankingsTable = ({ players }) => {
  if (!players || players.length === 0) return null;

  return (
    <div className="table-view">
      <h3>
        PQI Rankings Table
        <ContextInfo
          title="PQI Rankings"
          description="This table lists athletes ranked by their Performance Quotient Index (PQI) score. PQI is a standardized metric that allows comparing performance across different sports and positions. The table includes each athlete's tier classification, career seasons, and prime seasons data."
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
              <th>PQI Score</th>
              <th>Tier</th>
              <th>Career</th>
              <th>Prime</th>
              <th>Prime %</th>
              <th>Peak Value</th>
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
                <td>{safeFormat(player.pqi_selected)}</td>
                <td style={{ color: tierColorMapping[player.selected_tier] }}>
                  {player.selected_tier}
                </td>
                <td>{player.career_seasons}</td>
                <td>{player.prime_seasons}</td>
                <td>
                  {player.career_seasons && player.prime_seasons
                    ? safeFormat(
                        (player.prime_seasons / player.career_seasons) * 100,
                        1
                      ) + "%"
                    : "N/A"}
                </td>
                <td>{safeFormat(player.prime_peak_value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Main PQI Explorer component
const PQIExplorer = ({
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
  const [players, setPlayers] = useState([]);

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

  useEffect(() => {
    if (data && data.pqiData) {
      // Create filters object with multi-select arrays
      const filters = {
        sport: selectedSports.length > 0 ? selectedSports : undefined,
        league: selectedLeagues.length > 0 ? selectedLeagues : undefined,
        position: selectedPositions.length > 0 ? selectedPositions : undefined,
      };

      // Use 0 as "None" (all) option
      const limitValue = limit === 0 ? 7000 : limit;

      const topPlayers = getTopPlayersByPQI(data.pqiData, limitValue, filters);
      setPlayers(topPlayers);
    }
  }, [data, selectedSports, selectedLeagues, selectedPositions, limit]);

  const renderOverview = () => {
    return (
      <div className="overview-view">
        <PQISummaryStats players={players} />
        <CareerVsPrime players={players} />
        <CardView players={players} />
      </div>
    );
  };

  const renderFactorAnalysis = () => {
    return (
      <div className="factor-analysis-view">
        <PQIFactorAnalysis players={players} />
        <PQIDistribution players={players} />
      </div>
    );
  };

  const renderTableView = () => {
    return <RankingsTable players={players} />;
  };

  return (
    <div className="pqi-explorer">
      <div className="section-header">
        <h2>
          PQI Explorer
          <ContextInfo
            title="Performance Quotient Index Explorer"
            description="The PQI Explorer allows you to analyze the Performance Quotient Index - a metric that quantifies career achievement by considering peak performance, career longevity, and consistency. It provides insights into what differentiates elite performers across different sports and leagues."
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
            className={viewMode === "factors" ? "active" : ""}
            onClick={() => setViewMode("factors")}
          >
            Factor Analysis
          </button>
          <button
            className={viewMode === "table" ? "active" : ""}
            onClick={() => setViewMode("table")}
          >
            Rankings Table
          </button>
        </div>
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
        {viewMode === "factors" && renderFactorAnalysis()}
        {viewMode === "table" && renderTableView()}
      </div>
    </div>
  );
};

export default PQIExplorer;
