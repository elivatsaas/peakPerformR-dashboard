import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
} from "recharts";
import ContextInfo from "./ContextInfo";
import _ from "lodash";

const CareerPhaseVisualization = ({ data, selectedAge }) => {
  const [phaseData, setPhaseData] = useState([]);
  const [currentAgeData, setCurrentAgeData] = useState(null);
  const [displayMode, setDisplayMode] = useState("flow"); // "flow" or "current"

  // Process data when it changes
  useEffect(() => {
    if (!data || !data.fullData) return;

    // Calculate career phase distribution across all ages
    const ageData = {};
    const validAges = [];

    // Count athletes in each phase at each age
    data.fullData.forEach((player) => {
      if (!player.age) return;

      const age = parseInt(player.age);
      if (age < 18 || age > 40) return; // Only include typical career ages

      if (!ageData[age]) {
        ageData[age] = {
          age,
          prePeak: 0,
          atPeak: 0,
          postPeak: 0,
          outsidePrime: 0,
          total: 0,
        };
        validAges.push(age);
      }

      ageData[age].total++;

      if (player.is_peak_age === true) {
        ageData[age].atPeak++;
      } else if (player.in_prime === true) {
        if (player.years_from_peak < 0) {
          ageData[age].prePeak++;
        } else {
          ageData[age].postPeak++;
        }
      } else {
        ageData[age].outsidePrime++;
      }
    });

    // Convert to percentages and create data array
    const formattedData = validAges
      .sort((a, b) => a - b)
      .map((age) => {
        const ageStats = ageData[age];
        const total = ageStats.total;

        return {
          age,
          "Pre-Peak": (ageStats.prePeak / total) * 100,
          "At Peak": (ageStats.atPeak / total) * 100,
          "Post-Peak": (ageStats.postPeak / total) * 100,
          "Outside Prime": (ageStats.outsidePrime / total) * 100,
          prePeakCount: ageStats.prePeak,
          atPeakCount: ageStats.atPeak,
          postPeakCount: ageStats.postPeak,
          outsidePrimeCount: ageStats.outsidePrime,
          totalCount: total,
        };
      });

    setPhaseData(formattedData);

    // Find data for the currently selected age
    const currentData = formattedData.find((item) => item.age === selectedAge);
    if (currentData) {
      // Transform to format needed for the bar chart
      const currentAgeBarData = [
        {
          name: "Pre-Peak",
          value: currentData["Pre-Peak"],
          count: currentData.prePeakCount,
          color: "#8884d8",
        },
        {
          name: "At Peak",
          value: currentData["At Peak"],
          count: currentData.atPeakCount,
          color: "#ff7300",
        },
        {
          name: "Post-Peak",
          value: currentData["Post-Peak"],
          count: currentData.postPeakCount,
          color: "#82ca9d",
        },
        {
          name: "Outside Prime",
          value: currentData["Outside Prime"],
          count: currentData.outsidePrimeCount,
          color: "#d0d0d0",
        },
      ];
      setCurrentAgeData(currentAgeBarData);
    }
  }, [data, selectedAge]);

  // No data handling
  if (!phaseData.length || !currentAgeData) {
    return (
      <div className="no-data">
        Insufficient data to visualize career phases
      </div>
    );
  }

  return (
    <div className="career-phase-visualization">
      <div className="visualization-header">
        <h3>
          Career Phase Distribution at Age {selectedAge}
          <ContextInfo
            title="Career Phase Distribution"
            description="This visualization shows how athletes progress through different career phases with age. The stacked area chart shows the proportion of athletes in each phase across all ages, while the bar chart shows the specific breakdown at the selected age."
          />
        </h3>
        <div className="view-toggle">
          <button
            className={displayMode === "flow" ? "active" : ""}
            onClick={() => setDisplayMode("flow")}
          >
            Career Flow
          </button>
          <button
            className={displayMode === "current" ? "active" : ""}
            onClick={() => setDisplayMode("current")}
          >
            Current Age
          </button>
        </div>
      </div>

      {displayMode === "flow" ? (
        <div className="flow-visualization">
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart
              data={phaseData}
              margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
              stackOffset="expand"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="age"
                label={{
                  value: "Age",
                  position: "insideBottom",
                  offset: -10,
                  style: { textAnchor: "middle" },
                }}
              />
              <YAxis
                tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                label={{
                  value: "Percentage of Athletes",
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle" },
                }}
              />
              <Tooltip
                formatter={(value) => [`${value.toFixed(1)}%`, ""]}
                labelFormatter={(label) => `Age ${label}`}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="Pre-Peak"
                stackId="1"
                stroke="#8884d8"
                fill="#8884d8"
              />
              <Area
                type="monotone"
                dataKey="At Peak"
                stackId="1"
                stroke="#ff7300"
                fill="#ff7300"
              />
              <Area
                type="monotone"
                dataKey="Post-Peak"
                stackId="1"
                stroke="#82ca9d"
                fill="#82ca9d"
              />
              <Area
                type="monotone"
                dataKey="Outside Prime"
                stackId="1"
                stroke="#d0d0d0"
                fill="#d0d0d0"
              />
              {/* Vertical marker for the selected age */}
              <ReferenceLine
                x={selectedAge}
                stroke="#6d1945"
                strokeWidth={2}
                label={{
                  value: "Selected Age",
                  position: "top",
                  fill: "#6d1945",
                  fontSize: 12,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>

          <div className="flow-insights">
            <div className="insight-card">
              <h4>Career Flow Insights</h4>
              <p>
                This stacked area chart shows how the distribution of athlete
                career phases changes with age.
              </p>
              <ul>
                <li>
                  <span
                    className="color-dot"
                    style={{ backgroundColor: "#8884d8" }}
                  ></span>{" "}
                  <strong>Pre-Peak:</strong> Athletes still improving toward
                  their peak performance
                </li>
                <li>
                  <span
                    className="color-dot"
                    style={{ backgroundColor: "#ff7300" }}
                  ></span>{" "}
                  <strong>At Peak:</strong> Athletes at their absolute best
                  performance
                </li>
                <li>
                  <span
                    className="color-dot"
                    style={{ backgroundColor: "#82ca9d" }}
                  ></span>{" "}
                  <strong>Post-Peak:</strong> Athletes past their peak but still
                  in their prime
                </li>
                <li>
                  <span
                    className="color-dot"
                    style={{ backgroundColor: "#d0d0d0" }}
                  ></span>{" "}
                  <strong>Outside Prime:</strong> Athletes outside their prime
                  performance window
                </li>
              </ul>
              <p>
                The vertical line marks the currently selected age (
                {selectedAge}).
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="current-age-visualization">
          <div className="current-charts">
            <div className="bar-chart-container">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={currentAgeData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                    label={{
                      value: "Percentage of Athletes",
                      position: "insideBottom",
                      offset: -5,
                      style: { textAnchor: "middle" },
                    }}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={120}
                    tick={{ fontSize: 14 }}
                  />
                  <Tooltip
                    formatter={(value, name, props) => {
                      return [
                        `${value.toFixed(1)}% (${
                          props.payload.count
                        } athletes)`,
                        props.payload.name,
                      ];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="value" name="Percentage">
                    {currentAgeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="stats-container">
              <h4>Statistics at Age {selectedAge}</h4>
              <div className="stats-grid">
                {currentAgeData.map((phase, index) => (
                  <div
                    className="stat-card"
                    key={index}
                    style={{ borderColor: phase.color }}
                  >
                    <div
                      className="stat-header"
                      style={{ backgroundColor: phase.color }}
                    >
                      {phase.name}
                    </div>
                    <div className="stat-body">
                      <div className="stat-value">
                        {phase.value.toFixed(1)}%
                      </div>
                      <div className="stat-count">{phase.count} athletes</div>
                    </div>
                  </div>
                ))}
                <div className="stat-card total">
                  <div className="stat-header">Total Sample</div>
                  <div className="stat-body">
                    <div className="stat-value">
                      {
                        phaseData.find((item) => item.age === selectedAge)
                          ?.totalCount
                      }
                    </div>
                    <div className="stat-count">
                      athletes at age {selectedAge}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .career-phase-visualization {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .visualization-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .visualization-header h3 {
          margin: 0;
          display: flex;
          align-items: center;
        }

        .view-toggle {
          display: flex;
          gap: 10px;
        }

        .view-toggle button {
          padding: 8px 12px;
          background: #f0f0f0;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .view-toggle button.active {
          background: #6d1945;
          color: white;
          border-color: #6d1945;
        }

        .flow-insights {
          margin-top: 20px;
          background: #f8f8f8;
          border-radius: 6px;
          padding: 15px;
        }

        .insight-card h4 {
          margin-top: 0;
          margin-bottom: 10px;
          color: #6d1945;
        }

        .insight-card p {
          margin: 0 0 10px;
          font-size: 14px;
        }

        .insight-card ul {
          margin: 0;
          padding-left: 5px;
          list-style-type: none;
        }

        .insight-card li {
          margin-bottom: 5px;
          font-size: 14px;
          display: flex;
          align-items: center;
        }

        .color-dot {
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-right: 6px;
        }

        .current-charts {
          display: flex;
          gap: 20px;
        }

        .bar-chart-container {
          flex: 3;
        }

        .stats-container {
          flex: 2;
        }

        .stats-container h4 {
          margin-top: 0;
          margin-bottom: 15px;
          color: #6d1945;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }

        .stat-card {
          border: 1px solid;
          border-radius: 6px;
          overflow: hidden;
        }

        .stat-card.total {
          grid-column: span 2;
          border-color: #6d1945;
        }

        .stat-header {
          padding: 8px;
          color: white;
          font-weight: 500;
          text-align: center;
        }

        .stat-card.total .stat-header {
          background-color: #6d1945;
        }

        .stat-body {
          padding: 10px;
          text-align: center;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
        }

        .stat-count {
          font-size: 12px;
          color: #666;
        }

        .no-data {
          padding: 40px;
          text-align: center;
          font-style: italic;
          color: #666;
          background: #f5f5f5;
          border-radius: 8px;
        }

        @media (max-width: 768px) {
          .current-charts {
            flex-direction: column;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .stat-card.total {
            grid-column: span 1;
          }
        }
      `}</style>
    </div>
  );
};

export default CareerPhaseVisualization;
