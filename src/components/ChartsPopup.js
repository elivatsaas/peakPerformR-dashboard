// This is a fixed version of the ChartIcon component and ChartsPopup component
// to resolve the ESLint errors in PlayerComparison.js

import React from "react";
import { leagueColorMapping } from "../utils/constants";

// Chart Icon SVG component
export const ChartIcon = () => (
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

// Fixed ChartsPopup component
export const ChartsPopup = ({
  showChartPopup,
  setShowChartPopup,
  selectedPlayers,
  playerData,
}) => {
  if (!showChartPopup) return null;

  // Prevent click propagation to allow clicking inside the modal
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className="charts-popup-overlay"
      onClick={() => setShowChartPopup(false)}
    >
      <div className="charts-popup-container" onClick={handleModalClick}>
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
              {selectedPlayers.map((player) => {
                const playerInfo = playerData[player.id];
                if (!playerInfo) return null;
                const { careerData = [], primeRaw } = playerInfo;
                const hasValidData = careerData && careerData.length > 0;

                return (
                  <div
                    className="comparison-chart-container"
                    key={`actual-${player.id}`}
                  >
                    <div
                      className="chart-player-name"
                      style={{
                        color: leagueColorMapping[player.league] || "#6d1945",
                      }}
                    >
                      {player.player_name}
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
                          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
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
                              fillOpacity={0.3}
                              stroke={
                                leagueColorMapping[currentPlayer.league] ||
                                "#8884d8"
                              }
                              strokeOpacity={0.5}
                              strokeWidth={1}
                            />
                          )}

                          {/* Peak age line */}
                          {primeRaw && (
                            <ReferenceLine
                              x={primeRaw.max_value_age}
                              stroke={
                                leagueColorMapping[player.league] || "#8884d8"
                              }
                              strokeDasharray="3 3"
                            />
                          )}

                          <Line
                            type="monotone"
                            dataKey="normalizedValue"
                            stroke={
                              leagueColorMapping[player.league] || "#8884d8"
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
              {selectedPlayers.map((player) => {
                const playerInfo = playerData[player.id];
                if (!playerInfo) return null;
                const { predictedData = [], primeSpline } = playerInfo;
                const hasPredictedData =
                  predictedData && predictedData.length > 0;

                return (
                  <div
                    className="comparison-chart-container"
                    key={`predicted-${player.id}`}
                  >
                    <div
                      className="chart-player-name"
                      style={{
                        color: leagueColorMapping[player.league] || "#6d1945",
                      }}
                    >
                      {player.player_name}
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
                          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
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
                              fillOpacity={0.3}
                              stroke={
                                leagueColorMapping[currentPlayer.league] ||
                                "#82ca9d"
                              }
                              strokeOpacity={0.5}
                              strokeWidth={1}
                            />
                          )}

                          {/* Peak age line */}
                          {primeSpline && (
                            <ReferenceLine
                              x={primeSpline.max_value_age}
                              stroke={
                                leagueColorMapping[player.league] || "#82ca9d"
                              }
                              strokeDasharray="3 3"
                            />
                          )}

                          <Line
                            type="monotone"
                            dataKey="normalizedValue"
                            stroke={
                              leagueColorMapping[player.league] || "#82ca9d"
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

// Import necessary Recharts components to avoid undefined errors
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
} from "recharts";

// Export both components for use in PlayerComparison.js
export default ChartsPopup;
