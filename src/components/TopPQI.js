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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { getTopPlayersByPQI } from "../utils/dataProcessing";
import { leagueColorMapping, tierColorMapping } from "../utils/constants";
import EnhancedFilters from "./EnhancedFilters";
import ContextInfo from "./ContextInfo";
import "../styles/TopPQI.css";
import "../styles/EnhancedFilters.css";

// PQI Summary Table component
const PQISummaryStats = ({ players }) => {
  if (!players || players.length === 0) return null;

  // Calculate statistics by tier
  const tierStats = {};
  let totalPQI = 0;
  let totalPlayers = 0;

  players.forEach((player) => {
    if (!player.selected_tier) return;

    totalPQI += player.pqi_selected || 0;
    totalPlayers++;

    if (!tierStats[player.selected_tier]) {
      tierStats[player.selected_tier] = {
        count: 0,
        totalPQI: 0,
        avgPQI: 0,
        sports: new Set(),
        leagues: new Set(),
      };
    }

    tierStats[player.selected_tier].count++;
    tierStats[player.selected_tier].totalPQI += player.pqi_selected || 0;

    if (player.sport) {
      tierStats[player.selected_tier].sports.add(player.sport);
    }

    if (player.league) {
      tierStats[player.selected_tier].leagues.add(player.league);
    }
  });

  // Calculate averages
  Object.keys(tierStats).forEach((tier) => {
    tierStats[tier].avgPQI = tierStats[tier].totalPQI / tierStats[tier].count;
  });

  // Convert to array for rendering
  const tierStatsArray = Object.keys(tierStats).map((tier) => ({
    tier,
    count: tierStats[tier].count,
    avgPQI: tierStats[tier].avgPQI,
    sportsCount: tierStats[tier].sports.size,
    leaguesCount: tierStats[tier].leagues.size,
    percentage: (tierStats[tier].count / totalPlayers) * 100,
  }));

  // Sort by tier rank
  const tierOrder = [
    "Hall of Fame",
    "Elite Player",
    "Great Starter",
    "Starter",
    "Backup",
  ];
  tierStatsArray.sort(
    (a, b) => tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier)
  );

  return (
    <div className="pqi-summary-stats">
      <h3>
        PQI Tier Statistics
        <ContextInfo
          title="PQI Tier Statistics"
          description="This table summarizes the distribution of athletes across different Performance Quotient Index (PQI) tiers. It shows the count and percentage of athletes in each tier, their average PQI scores, and the diversity of sports and leagues represented in each tier."
        />
      </h3>
      <table>
        <thead>
          <tr>
            <th>Tier</th>
            <th>Count</th>
            <th>Percentage</th>
            <th>Avg. PQI</th>
            <th>Sports</th>
            <th>Leagues</th>
          </tr>
        </thead>
        <tbody>
          {tierStatsArray.map((stat) => (
            <tr key={stat.tier}>
              <td
                style={{
                  color: tierColorMapping[stat.tier],
                  fontWeight: "bold",
                }}
              >
                {stat.tier}
              </td>
              <td>{stat.count}</td>
              <td>{stat.percentage.toFixed(1)}%</td>
              <td>{stat.avgPQI.toFixed(2)}</td>
              <td>{stat.sportsCount}</td>
              <td>{stat.leaguesCount}</td>
            </tr>
          ))}
          <tr className="summary-row">
            <td>Overall</td>
            <td>{totalPlayers}</td>
            <td>100%</td>
            <td>{(totalPQI / totalPlayers).toFixed(2)}</td>
            <td colSpan="2">Average PQI Score</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const TopPQI = ({
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
  const [topPlayers, setTopPlayers] = useState([]);

  // Get all unique sports
  const allSports = React.useMemo(() => {
    if (!data || !data.pqiData) return [];
    return [...new Set(data.pqiData.map((player) => player.sport))].filter(
      Boolean
    );
  }, [data]);

  useEffect(() => {
    if (data) {
      // Create filters object with multi-select arrays
      const filters = {
        sport: selectedSports.length > 0 ? selectedSports : undefined,
        league: selectedLeagues.length > 0 ? selectedLeagues : undefined,
        position: selectedPositions.length > 0 ? selectedPositions : undefined,
      };

      // Use 0 as "None" (all) option
      const limitValue = limit === 0 ? 7000 : limit;

      const players = getTopPlayersByPQI(data.pqiData, limitValue, filters);
      setTopPlayers(players);
    }
  }, [data, selectedSports, selectedLeagues, selectedPositions, limit]);

  const renderTableView = () => {
    return (
      <div className="table-view">
        <PQISummaryStats players={topPlayers} />

        <h3>
          Top PQI Players
          <ContextInfo
            title="Top PQI Players Table"
            description="This table lists athletes ranked by their Performance Quotient Index (PQI) score. PQI is a standardized metric that allows comparing performance across different sports and positions. The table includes each athlete's tier classification, career seasons, and prime seasons data."
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
              <th>PQI Score</th>
              <th>Tier</th>
              <th>Career Seasons</th>
              <th>Prime Seasons</th>
              <th>Prime Peak Value</th>
            </tr>
          </thead>
          <tbody>
            {topPlayers.map((player, index) => (
              <tr key={player.id}>
                <td>{index + 1}</td>
                <td>{player.player_name}</td>
                <td>{player.sport}</td>
                <td>{player.league}</td>
                <td>{player.position}</td>
                <td>{player.pqi_selected?.toFixed(2)}</td>
                <td style={{ color: tierColorMapping[player.selected_tier] }}>
                  {player.selected_tier}
                </td>
                <td>{player.career_seasons}</td>
                <td>{player.prime_seasons}</td>
                <td>{player.prime_peak_value?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderCardView = () => {
    return (
      <div className="card-view">
        <h3>
          Top PQI Player Cards
          <ContextInfo
            title="PQI Player Cards"
            description="These cards display the top athletes by PQI score in a visual format. Each card is color-coded by league and shows key performance metrics including PQI score, tier classification, and career/prime season data."
          />
        </h3>
        {topPlayers.map((player, index) => (
          <div
            className="pqi-card"
            key={player.id}
            style={{ borderColor: leagueColorMapping[player.league] }}
          >
            <div
              className="card-header"
              style={{ backgroundColor: leagueColorMapping[player.league] }}
            >
              <div className="card-rank">{index + 1}</div>
              <h3>{player.player_name}</h3>
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
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderChartView = () => {
    // Prepare data for bar chart
    const barData = topPlayers.slice(0, 10).map((player) => ({
      name: player.player_name,
      pqi: player.pqi_selected,
      league: player.league,
    }));

    // Prepare data for league comparison radar chart
    const leagueCounts = {};
    const tierCounts = {};

    topPlayers.forEach((player) => {
      leagueCounts[player.league] = (leagueCounts[player.league] || 0) + 1;
      tierCounts[player.selected_tier] =
        (tierCounts[player.selected_tier] || 0) + 1;
    });

    const radarData = Object.keys(leagueCounts).map((leagueKey) => ({
      league: leagueKey,
      count: leagueCounts[leagueKey],
    }));

    const pieData = Object.keys(tierCounts).map((tierKey) => ({
      name: tierKey,
      value: tierCounts[tierKey],
      color: tierColorMapping[tierKey],
    }));
    return (
      <div className="chart-view">
        <div className="chart-container">
          <h3>
            Top 10 Players by PQI Score
            <ContextInfo
              title="Top 10 PQI Scores"
              description="This bar chart visualizes the 10 highest PQI (Performance Quotient Index) scores in the selected dataset. Each bar is color-coded by the athlete's league for easy identification."
            />
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={120} />
              <YAxis
                label={{
                  value: "PQI Score",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip />
              <Legend />
              <Bar dataKey="pqi" name="PQI Score">
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
              League Distribution
              <ContextInfo
                title="League Distribution"
                description="This radar chart shows the distribution of top PQI athletes across different leagues. Each spoke represents a league, with distance from center indicating the number of athletes from that league in the top PQI list."
              />
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="league" />
                <PolarRadiusAxis />
                <Radar
                  name="Players"
                  dataKey="count"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container half-width">
            <h3>
              Tier Distribution
              <ContextInfo
                title="Tier Distribution"
                description="This pie chart shows the distribution of athletes across different performance tiers in the selected dataset. Each tier is color-coded according to the standard tier classification system."
              />
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  fill="#8884d8"
                  label={(entry) => entry.name}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="top-pqi">
      <div className="section-header">
        <h2>
          Top PQI Scores
          <ContextInfo
            title="Performance Quotient Index (PQI)"
            description="PQI is a standardized metric that quantifies athlete performance across different sports. It accounts for career longevity, peak performance level, and prime duration. Higher PQI scores indicate more impressive career achievements relative to peers in the same sport."
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
            className={viewMode === "card" ? "active" : ""}
            onClick={() => setViewMode("card")}
          >
            Card View
          </button>
          <button
            className={viewMode === "chart" ? "active" : ""}
            onClick={() => setViewMode("chart")}
          >
            Chart View
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
        {viewMode === "card" && renderCardView()}
        {viewMode === "chart" && renderChartView()}
      </div>
    </div>
  );
};

export default TopPQI;
