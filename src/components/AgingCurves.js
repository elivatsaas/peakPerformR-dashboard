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
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ReferenceLine,
  Text,
} from "recharts";
import { getAgingCurvesByLeague } from "../utils/dataProcessing";
import { leagueColorMapping } from "../utils/constants";
import EnhancedFilters from "./EnhancedFilters";
import ContextInfo from "./ContextInfo";
import _ from "lodash";
import "../styles/AgingCurves.css";
import "../styles/EnhancedFilters.css";

// Career Phase Pie Chart Component with Fixed Positioning
const CareerPhasePieChart = ({ phaseData }) => {
  if (!phaseData || phaseData.length === 0) return null;

  // Custom render for pie chart labels - avoiding cutoff
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
  }) => {
    // Only show labels for segments that are large enough
    if (percent < 0.08) return null;

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.7;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  // Modified phaseData with updated color for Post-Prime
  const updatedPhaseData = phaseData.map((item) => {
    if (item.name === "Post-Prime") {
      return { ...item, color: "#9e9e9e" }; // Changed to a different gray shade
    }
    return item;
  });

  return (
    <div
      className="career-phase-chart"
      style={{ paddingTop: "30px", height: "400px" }}
    >
      <h3 style={{ textAlign: "center", marginBottom: "25px" }}>
        Career Phase Distribution
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={updatedPhaseData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
          >
            {updatedPhaseData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name, props) => [
              `${value.toFixed(1)}% (${props.payload.count} athletes)`,
              name,
            ]}
          />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ paddingTop: "20px" }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Additional stats display */}
      <div
        className="phase-stats"
        style={{
          display: "flex",
          justifyContent: "center",
          margin: "0 auto",
          width: "80%",
          paddingTop: "10px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "13px", color: "#666" }}>
            Total Athletes: {updatedPhaseData[0]?.totalSample || "N/A"}
          </div>
        </div>
      </div>
    </div>
  );
};

// Improved league aging visualization with performance change rates
const LeagueAgingVisual = ({ agingCurves }) => {
  if (!agingCurves || agingCurves.length === 0) return null;

  // Updated context info description with critical growth/decline definition
  const contextDescription =
    "League Aging Analysis shows key metrics across different leagues. 'Peak Age' represents when athletes typically reach their maximum performance. This analysis tracks year-over-year performance changes, identifying ages with maximum average performance increase (early career growth) and maximum average decline (post-peak decline).";

  // Process data into a more visualization-friendly format
  const processedData = agingCurves.map((curve) => {
    // Get valid data points with sufficient sample size (20 players minimum)
    const validData = curve.agingCurve.filter(
      (point) =>
        typeof point.avgValue === "number" &&
        !isNaN(point.avgValue) &&
        point.count >= 20 // Increased threshold to 20 players
    );

    // Find peak performance age and value
    const peakPoint = _.maxBy(validData, "avgValue") || {};

    let yearOverYearChanges = [];
    let maxIncrease = 0;
    let maxIncreaseAge = null;
    let maxDecline = 0;
    let maxDeclineAge = null;

    // Minimum sample size threshold for reliable measurements
    const MIN_SAMPLE_SIZE = 20;

    for (let i = 1; i < validData.length; i++) {
      const currPoint = validData[i];
      const prevPoint = validData[i - 1];

      // Skip calculations for ages with insufficient sample size
      if (
        currPoint.count < MIN_SAMPLE_SIZE ||
        prevPoint.count < MIN_SAMPLE_SIZE
      )
        continue;

      const changeAmount = currPoint.avgValue - prevPoint.avgValue;
      const changePercentage = (changeAmount / prevPoint.avgValue) * 100;

      // Calculate weight based on sample size
      // Using sqrt to prevent very large samples from dominating too much
      const sampleWeight =
        Math.sqrt((currPoint.count + prevPoint.count) / 2) / 10;
      const weightedChange = changePercentage * sampleWeight;

      yearOverYearChanges.push({
        age: currPoint.age,
        changePercentage: changePercentage,
        weightedChange: weightedChange,
        sampleSize: (currPoint.count + prevPoint.count) / 2,
        weight: sampleWeight,
      });

      // Track maximum growth using weighted change
      if (
        weightedChange > 0 &&
        weightedChange > maxIncrease * (maxIncrease === 0 ? 1 : 0.8)
      ) {
        maxIncrease = changePercentage; // Store original percentage for display
        maxIncreaseAge = currPoint.age;
      }

      // Track maximum decline using weighted change
      if (
        weightedChange < 0 &&
        Math.abs(weightedChange) > maxDecline * (maxDecline === 0 ? 1 : 0.8)
      ) {
        maxDecline = Math.abs(changePercentage); // Store original percentage for display
        maxDeclineAge = currPoint.age;
      }
    }

    return {
      league: curve.league,
      peakAge: peakPoint.age || "N/A",
      peakValue: peakPoint.avgValue?.toFixed(2) || "N/A",
      maxIncreaseAge: maxIncreaseAge || "N/A",
      maxDeclineAge: maxDeclineAge || "N/A",
      maxIncrease: maxIncrease ? maxIncrease.toFixed(1) : "N/A",
      maxDecline: maxDecline ? maxDecline.toFixed(1) : "N/A",
      sampleSize: _.sumBy(curve.agingCurve, "count") || 0,
      performanceCurve: validData,
      yearOverYearChanges: yearOverYearChanges,
    };
  });

  return (
    <div className="league-aging-analysis">
      <h3>
        League Aging Analysis
        <ContextInfo
          title="League Aging Analysis"
          description={contextDescription}
        />
      </h3>

      <div className="league-grid">
        {processedData.map((league) => (
          <div className="league-card" key={league.league}>
            <div
              className="league-header"
              style={{ backgroundColor: leagueColorMapping[league.league] }}
            >
              {league.league}
            </div>

            <div className="league-content">
              <div className="key-metrics">
                <div className="metric">
                  <div className="metric-label">Peak Age</div>
                  <div className="metric-value">{league.peakAge}</div>
                </div>
                <div className="metric">
                  <div className="metric-label">Fastest Decline</div>
                  <div className="metric-value">{league.maxDeclineAge}</div>
                </div>
              </div>

              <div className="performance-curve">
                <ResponsiveContainer width="100%" height={100}>
                  <LineChart data={league.performanceCurve}>
                    <Line
                      type="monotone"
                      dataKey="avgValue"
                      stroke={leagueColorMapping[league.league]}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                    <XAxis
                      dataKey="age"
                      domain={[20, 40]}
                      tick={{ fontSize: 10 }}
                      tickCount={5}
                    />
                    <YAxis hide={true} />
                    <Tooltip
                      formatter={(value) => [value.toFixed(2), "Performance"]}
                      labelFormatter={(value) => `Age: ${value}`}
                    />

                    {/* Peak age marker */}
                    {league.peakAge !== "N/A" && (
                      <ReferenceLine
                        x={parseInt(league.peakAge)}
                        stroke={leagueColorMapping[league.league]}
                        strokeDasharray="3 3"
                      />
                    )}

                    {/* Maximum decline marker */}
                    {league.maxDeclineAge !== "N/A" && (
                      <ReferenceLine
                        x={parseInt(league.maxDeclineAge)}
                        stroke="#d32f2f"
                        strokeDasharray="3 3"
                      />
                    )}

                    {/* Maximum increase marker */}
                    {league.maxIncreaseAge !== "N/A" && (
                      <ReferenceLine
                        x={parseInt(league.maxIncreaseAge)}
                        stroke="#2e7d32"
                        strokeDasharray="3 3"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="growth-decline-stats">
                <div className="growth-stat">
                  <span className="stat-value">+{league.maxIncrease}%</span>
                  <span className="stat-label">
                    max growth at age {league.maxIncreaseAge}
                  </span>
                </div>
                <div className="decline-stat">
                  <span className="stat-value">-{league.maxDecline}%</span>
                  <span className="stat-label">
                    max decline at age {league.maxDeclineAge}
                  </span>
                </div>
              </div>

              <div className="sample-size">
                Sample size: {league.sampleSize.toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="legend">
        <div className="legend-item">
          <span className="legend-marker peak"></span>
          <span>Peak Performance Age</span>
        </div>
        <div className="legend-item">
          <span
            className="legend-marker growth"
            style={{ backgroundColor: "#2e7d32" }}
          ></span>
          <span>Maximum Growth Age</span>
        </div>
        <div className="legend-item">
          <span className="legend-marker decline"></span>
          <span>Maximum Decline Age</span>
        </div>
      </div>
      <div
        className="methodology-note"
        style={{
          marginTop: "20px",
          padding: "10px 15px",
          backgroundColor: "#f8f8f8",
          borderRadius: "6px",
          fontSize: "13px",
          color: "#555",
          borderLeft: "3px solid #6d1945",
        }}
      >
        <p>
          <strong>Note:</strong> Growth and decline rates are weighted by sample
          size to prioritize more reliable age ranges with sufficient data. This
          helps prevent outlier ages with few athletes from appearing as
          significant trends. A minimum threshold of 20 athletes is required for
          an age to be considered in these calculations.
        </p>
      </div>
    </div>
  );
};

// Full AgingCurves component
const AgingCurves = ({
  data,
  leagues,
  selectedSports = [],
  selectedLeagues = [],
  selectedPositions = [],
  setSelectedSports = () => {},
  setSelectedLeagues = () => {},
  setSelectedPositions = () => {},
}) => {
  const [agingCurves, setAgingCurves] = useState([]);
  const [selectedAge, setSelectedAge] = useState(28);
  const [agePerformance, setAgePerformance] = useState([]);
  const [careerPhases, setCareerPhases] = useState([]);

  // Get all unique sports
  const allSports = React.useMemo(() => {
    if (!data || !data.pqiData) return [];
    return [...new Set(data.pqiData.map((player) => player.sport))].filter(
      Boolean
    );
  }, [data]);

  // Get all unique positions
  const allPositions = React.useMemo(() => {
    if (!data || !data.pqiData) return [];
    return [...new Set(data.pqiData.map((player) => player.position))].filter(
      Boolean
    );
  }, [data]);

  useEffect(() => {
    if (data && data.primesSplineData) {
      // Apply filters to data
      let filteredData = [...data.fullData];

      // If no filters selected, use all data
      const useAllSports = selectedSports.length === 0;
      const useAllLeagues = selectedLeagues.length === 0;

      if (!useAllSports) {
        filteredData = filteredData.filter((item) =>
          selectedSports.includes(item.sport)
        );
      }

      if (!useAllLeagues) {
        filteredData = filteredData.filter((item) =>
          selectedLeagues.includes(item.league)
        );
      }

      if (selectedPositions.length > 0) {
        filteredData = filteredData.filter((item) =>
          selectedPositions.includes(item.position)
        );
      }

      // Get aging curves by league - using spline data for smoother curves
      const curves = getAgingCurvesByLeague(filteredData);
      setAgingCurves(curves);

      // Calculate performance at selected age
      calculateAgePerformance(selectedAge, filteredData);
    }
  }, [data, selectedAge, selectedSports, selectedLeagues, selectedPositions]);

  const calculateAgePerformance = (age, filteredData) => {
    // Get all players at the selected age
    const playersAtAge = filteredData.filter((player) => player.age === age);

    // Group by league
    const leagueGroups = _.groupBy(playersAtAge, "league");

    // Calculate average performance by league
    const leaguePerformance = Object.keys(leagueGroups)
      .map((league) => {
        const leaguePlayers = leagueGroups[league];
        const avgValue = _.meanBy(leaguePlayers, "scaled_value");

        return {
          league,
          avgValue,
          count: leaguePlayers.length,
        };
      })
      .filter((league) => league.count >= 20) // Ensure enough data points (20 minimum)
      .sort((a, b) => b.avgValue - a.avgValue);

    setAgePerformance(leaguePerformance);

    // Calculate career phases for selected age with proper in prime separation
    const primeCounts = {
      prePrime: 0,
      inPrimePre: 0,
      atPeak: 0,
      inPrimePost: 0,
      postPrime: 0,
    };

    playersAtAge.forEach((player) => {
      if (player.is_peak_age) {
        primeCounts.atPeak++;
      } else if (player.in_prime) {
        if (player.years_from_peak < 0) {
          primeCounts.inPrimePre++;
        } else {
          primeCounts.inPrimePost++;
        }
      } else {
        if (player.years_from_peak < 0) {
          primeCounts.prePrime++;
        } else {
          primeCounts.postPrime++;
        }
      }
    });

    const total = playersAtAge.length || 1; // Avoid division by zero

    const phases = [
      {
        name: "Pre-Prime",
        value: (primeCounts.prePrime / total) * 100,
        percentage: (primeCounts.prePrime / total) * 100,
        color: "#8884d8",
        count: primeCounts.prePrime,
        totalSample: total,
      },
      {
        name: "In Prime (Pre-Peak)",
        value: (primeCounts.inPrimePre / total) * 100,
        percentage: (primeCounts.inPrimePre / total) * 100,
        color: "#82ca9d",
        count: primeCounts.inPrimePre,
        totalSample: total,
      },
      {
        name: "At Peak",
        value: (primeCounts.atPeak / total) * 100,
        percentage: (primeCounts.atPeak / total) * 100,
        color: "#e1ca44",
        count: primeCounts.atPeak,
        totalSample: total,
      },
      {
        name: "In Prime (Post-Peak)",
        value: (primeCounts.inPrimePost / total) * 100,
        percentage: (primeCounts.inPrimePost / total) * 100,
        color: "#ff7300",
        count: primeCounts.inPrimePost,
        totalSample: total,
      },
      {
        name: "Post-Prime",
        value: (primeCounts.postPrime / total) * 100,
        percentage: (primeCounts.postPrime / total) * 100,
        color: "#9e9e9e", // Changed from #d0d0d0 to a darker gray
        count: primeCounts.postPrime,
        totalSample: total,
      },
    ];

    setCareerPhases(phases);
  };

  // Filter aging curves to only include those with sufficient data
  const validAgingCurves = agingCurves.filter((curve) => {
    const hasEnoughData = curve.agingCurve.some((point) => point.count >= 20);
    return hasEnoughData;
  });

  return (
    <div className="aging-curves">
      <div className="section-header">
        <h2>
          Aging Curves
          <ContextInfo
            title="Aging Curves Analysis"
            description="This analysis examines how athlete performance changes with age across different sports and leagues. It includes normalized performance curves, performance comparisons at specific ages, and career phase distribution data."
          />
        </h2>
      </div>

      {/* Add EnhancedFilters component */}
      <EnhancedFilters
        allData={data?.pqiData || []}
        sports={allSports}
        leagues={leagues}
        positions={allPositions}
        selectedSports={selectedSports}
        selectedLeagues={selectedLeagues}
        selectedPositions={selectedPositions}
        onSportsChange={setSelectedSports}
        onLeaguesChange={setSelectedLeagues}
        onPositionsChange={setSelectedPositions}
        showLimit={false} // No limit needed for this component
      />

      {/* Age selector in its own row */}
      <div className="age-selector-container">
        <h3>
          Select Age to Explore: {selectedAge}
          <ContextInfo
            title="Age Selector"
            description="This slider allows you to select a specific age to analyze athlete performance and career phase distribution across different leagues."
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

      {/* New league aging visualization */}
      <LeagueAgingVisual agingCurves={validAgingCurves} />

      {/* Charts - max two per row */}
      <div className="charts-container">
        <div className="charts-row">
          {/* Performance at Age */}
          <div className="chart-container full-width">
            <h3>
              Normalized Performance by Age
              <ContextInfo
                title="Normalized Performance by Age"
                description="This chart shows how athlete performance evolves with age across different leagues. Values are normalized to allow direct comparison. The x-axis represents age, while the y-axis shows relative performance value."
              />
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="age"
                  type="number"
                  domain={[18, 40]}
                  label={{
                    value: "Age",
                    position: "insideBottom",
                    offset: -5,
                    style: { textAnchor: "middle" },
                  }}
                />
                <YAxis
                  label={{
                    value: "Normalized Performance Value",
                    angle: -90,
                    position: "insideLeft",
                    style: { textAnchor: "middle" },
                    dx: -10,
                  }}
                  yAxisId="default"
                />
                <Tooltip />
                <Legend wrapperStyle={{ paddingTop: 10, paddingBottom: 10 }} />

                {validAgingCurves.map((curve) => (
                  <Line
                    key={curve.league}
                    data={curve.agingCurve.filter((point) => point.count >= 20)} // Apply threshold here as well
                    type="monotone"
                    dataKey="avgValue"
                    name={curve.league}
                    stroke={leagueColorMapping[curve.league]}
                    dot={{ r: 2 }}
                    activeDot={{ r: 4 }}
                    yAxisId="default"
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="charts-row">
          {/* Performance at Selected Age */}
          <div className="chart-container half-width">
            <h3>
              Performance at Age {selectedAge}
              <ContextInfo
                title="Performance at Selected Age"
                description="This bar chart compares average performance values across different leagues at the selected age. This allows you to see which sports/leagues have better relative performance at this specific age point."
              />
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={agePerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="league"
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  label={{
                    value: "Average Performance",
                    angle: -90,
                    position: "insideLeft",
                    style: { textAnchor: "middle" },
                    dx: -10,
                  }}
                />
                <Tooltip />
                <Legend wrapperStyle={{ paddingTop: 15 }} />
                <Bar dataKey="avgValue" name="Performance">
                  {agePerformance.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={leagueColorMapping[entry.league]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Career Phase Distribution - Fixed positioning with the new component */}
          <div className="chart-container half-width">
            <CareerPhasePieChart phaseData={careerPhases} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgingCurves;
