import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Scatter,
  Line,
  ScatterChart,
  ComposedChart,
  Area,
  ReferenceLine,
  Bar,
  Text,
} from "recharts";
import { getPrimeDistributionByAge } from "../utils/dataProcessing";
import { leagueColorMapping } from "../utils/constants";
import EnhancedFilters from "./EnhancedFilters";
import ContextInfo from "./ContextInfo";
import _ from "lodash";
import "../styles/PrimeDistribution.css";
import "../styles/EnhancedFilters.css";

// Add a new summary component
const PrimeDistributionSummary = ({ primeDistribution }) => {
  if (!primeDistribution || primeDistribution.length === 0) return null;

  // Calculate key statistics
  const peakPrimeAge =
    _.maxBy(primeDistribution, "primePercentage")?.age || "N/A";
  const peakPrimePercentage =
    _.maxBy(primeDistribution, "primePercentage")?.primePercentage.toFixed(1) ||
    "N/A";

  const peakAgeDistribution =
    _.maxBy(primeDistribution, "peakPercentage")?.age || "N/A";
  const peakAgePercentage =
    _.maxBy(primeDistribution, "peakPercentage")?.peakPercentage.toFixed(1) ||
    "N/A";

  // Calculate average age in prime
  let totalInPrimeWeighted = 0;
  let totalInPrime = 0;

  primeDistribution.forEach((data) => {
    const inPrimeCount = (data.primePercentage / 100) * data.totalPlayers;
    totalInPrimeWeighted += data.age * inPrimeCount;
    totalInPrime += inPrimeCount;
  });

  const avgAgeInPrime =
    totalInPrime > 0 ? (totalInPrimeWeighted / totalInPrime).toFixed(1) : "N/A";

  // Calculate weighted average peak age
  let totalPeakWeighted = 0;
  let totalPeak = 0;

  primeDistribution.forEach((data) => {
    const peakCount = (data.peakPercentage / 100) * data.totalPlayers;
    totalPeakWeighted += data.age * peakCount;
    totalPeak += peakCount;
  });

  const avgPeakAge =
    totalPeak > 0 ? (totalPeakWeighted / totalPeak).toFixed(1) : "N/A";

  // Calculate total sample size
  const totalSampleSize = _.sumBy(primeDistribution, "totalPlayers") || 0;

  return (
    <div className="prime-distribution-summary">
      <h3>
        Prime Distribution Summary
        <ContextInfo
          title="Prime Phase Distribution"
          description="This chart shows the distribution of athletes across different career phases at the selected age. A player's prime is determined using a fitted smoothing spline model, identifying the continuous period where performance remains above a threshold percentage of their peak value."
        />
      </h3>
      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-value">{peakPrimeAge}</div>
          <div className="summary-label">Age with Highest % In Prime</div>
          <div className="summary-subtext">
            {peakPrimePercentage}% of athletes
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-value">{peakAgeDistribution}</div>
          <div className="summary-label">Most Common Peak Age</div>
          <div className="summary-subtext">
            {peakAgePercentage}% of athletes
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-value">{avgAgeInPrime}</div>
          <div className="summary-label">Average Age In Prime</div>
          <div className="summary-subtext">Weighted average</div>
        </div>

        <div className="summary-card">
          <div className="summary-value">{avgPeakAge}</div>
          <div className="summary-label">Average Peak Age</div>
          <div className="summary-subtext">Weighted average</div>
        </div>

        <div className="summary-card">
          <div className="summary-value">
            {totalSampleSize.toLocaleString()}
          </div>
          <div className="summary-label">Total Sample Size</div>
          <div className="summary-subtext">Data points analyzed</div>
        </div>
      </div>
    </div>
  );
};

const PrimeDistribution = ({
  data,
  leagues,
  // New props from Dashboard
  selectedSports = [],
  selectedLeagues = [],
  selectedPositions = [],
  setSelectedSports = () => {},
  setSelectedLeagues = () => {},
  setSelectedPositions = () => {},
}) => {
  const [primeDistribution, setPrimeDistribution] = useState([]);
  const [leagueDistributions, setLeagueDistributions] = useState({});
  const [combinedAgeData, setCombinedAgeData] = useState([]);
  const [averages, setAverages] = useState({});

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
    if (data) {
      // Apply filters to the data - if no filters selected, use all data
      let filteredData = [...data.fullData];

      // If no league or sport filters are selected, select all leagues and sports
      const useAllLeagues = selectedLeagues.length === 0;
      const useAllSports = selectedSports.length === 0;

      // Apply sport filter if selected
      if (!useAllSports) {
        filteredData = filteredData.filter((item) =>
          selectedSports.includes(item.sport)
        );
      }

      // Apply league filter if selected
      if (!useAllLeagues) {
        filteredData = filteredData.filter((item) =>
          selectedLeagues.includes(item.league)
        );
      }

      // Apply position filter if selected
      if (selectedPositions.length > 0) {
        filteredData = filteredData.filter((item) =>
          selectedPositions.includes(item.position)
        );
      }

      // Process main distribution data
      const distribution = getPrimeDistributionByAge(filteredData);
      setPrimeDistribution(distribution);

      // Process league-specific distributions
      const leagueGroups = _.groupBy(filteredData, "league");
      const distributions = {};
      Object.keys(leagueGroups).forEach((league) => {
        distributions[league] = getPrimeDistributionByAge(leagueGroups[league]);
      });
      setLeagueDistributions(distributions);

      // Process combined age data with trends
      const { startAgeData, peakAgeData, endAgeData } = calculateAgeCounts(
        data.primesSplineData
      );
      const combined = combineAgeData(startAgeData, peakAgeData, endAgeData);
      setCombinedAgeData(combined);

      // Calculate averages
      setAverages({
        start: _.meanBy(data.primesSplineData, "start_age"),
        peak: _.meanBy(data.primesSplineData, "max_value_age"),
        end: _.meanBy(data.primesSplineData, "end_age"),
      });
    }
  }, [data, selectedSports, selectedLeagues, selectedPositions]);

  // Data processing functions
  const calculateAgeCounts = (primesData) => {
    if (!primesData)
      return { startAgeData: [], peakAgeData: [], endAgeData: [] };

    const counts = { start: {}, peak: {}, end: {} };
    primesData.forEach((player) => {
      counts.start[player.start_age] =
        (counts.start[player.start_age] || 0) + 1;
      counts.peak[player.max_value_age] =
        (counts.peak[player.max_value_age] || 0) + 1;
      counts.end[player.end_age] = (counts.end[player.end_age] || 0) + 1;
    });

    return {
      startAgeData: processAgeData(counts.start),
      peakAgeData: processAgeData(counts.peak),
      endAgeData: processAgeData(counts.end),
    };
  };

  const processAgeData = (counts) => {
    return Object.entries(counts)
      .map(([age, count]) => ({ age: parseInt(age), count }))
      .sort((a, b) => a.age - b.age);
  };

  const combineAgeData = (start, peak, end) => {
    if (!start.length || !peak.length || !end.length) {
      return [];
    }

    const minAge = Math.min(
      ...start.map((d) => d.age),
      ...peak.map((d) => d.age),
      ...end.map((d) => d.age)
    );

    const maxAge = Math.max(
      ...start.map((d) => d.age),
      ...peak.map((d) => d.age),
      ...end.map((d) => d.age)
    );

    return Array.from({ length: maxAge - minAge + 1 }, (_, i) => {
      const age = minAge + i;
      return {
        age,
        startCount: start.find((d) => d.age === age)?.count || 0,
        peakCount: peak.find((d) => d.age === age)?.count || 0,
        endCount: end.find((d) => d.age === age)?.count || 0,
      };
    });
  };

  // Improved trend line calculation function
  const calculateTrendLines = (data, key, smoothingFactor = 0.2) => {
    if (!data || data.length === 0) return [];

    const sortedData = [...data].sort((a, b) => a.age - b.age);
    const result = [];

    // Simple exponential smoothing for trend lines
    let smoothed = sortedData[0][key] || 0;

    for (let i = 0; i < sortedData.length; i++) {
      const currentValue = sortedData[i][key] || 0;
      // Update the exponential moving average
      smoothed =
        smoothingFactor * currentValue + (1 - smoothingFactor) * smoothed;

      result.push({
        age: sortedData[i].age,
        value: smoothed,
      });
    }

    return result;
  };

  // Calculate league characteristics with career start/end ages
  const calculateLeagueChars = () => {
    if (!data || !data.primesSplineData) return [];

    // Filter primesSplineData based on selected filters
    let filteredData = [...data.primesSplineData];

    // If no filters are selected, use all data
    const useAllLeagues = selectedLeagues.length === 0;
    const useAllSports = selectedSports.length === 0;

    // Apply sport filter if selected
    if (!useAllSports) {
      filteredData = filteredData.filter((item) =>
        selectedSports.includes(item.sport)
      );
    }

    // Apply league filter if selected
    if (!useAllLeagues) {
      filteredData = filteredData.filter((item) =>
        selectedLeagues.includes(item.league)
      );
    }

    // Apply position filter if selected
    if (selectedPositions.length > 0) {
      filteredData = filteredData.filter((item) =>
        selectedPositions.includes(item.position)
      );
    }

    const leagueGroups = _.chain(filteredData)
      .groupBy("league")
      .mapValues((group) => ({
        avgStartAge: _.meanBy(group, "start_age"),
        avgPeakAge: _.meanBy(group, "max_value_age"),
        avgEndAge: _.meanBy(group, "end_age"),
        careerStartAge: _.chain(group)
          .map((p) =>
            p.career_start_age !== undefined
              ? p.career_start_age
              : p.start_age - 2
          )
          .filter((age) => age && age >= 16 && age <= 40)
          .mean()
          .value(),
        careerEndAge: _.chain(group)
          .map((p) =>
            p.career_end_age !== undefined ? p.career_end_age : p.end_age + 2
          )
          .filter((age) => age && age >= 16 && age <= 45)
          .mean()
          .value(),
      }))
      .value();

    return (
      Object.entries(leagueGroups)
        .filter(
          ([league, values]) =>
            !isNaN(values.avgStartAge) &&
            !isNaN(values.avgPeakAge) &&
            !isNaN(values.avgEndAge) &&
            leagueColorMapping[league] // Ensure only known leagues
        )
        .map(([league, values]) => ({
          league,
          avgStartAge: Number(values.avgStartAge.toFixed(1)),
          avgPeakAge: Number(values.avgPeakAge.toFixed(1)),
          avgEndAge: Number(values.avgEndAge.toFixed(1)),
          careerStartAge: values.careerStartAge
            ? Number(values.careerStartAge.toFixed(1))
            : Number(values.avgStartAge.toFixed(1)) - 2,
          careerEndAge: values.careerEndAge
            ? Number(values.careerEndAge.toFixed(1))
            : Number(values.avgEndAge.toFixed(1)) + 2,
        }))
        // Sort by minimum peak age
        .sort((a, b) => a.avgPeakAge - b.avgPeakAge)
    );
  };

  const leagueChars = data ? calculateLeagueChars() : [];

  const renderPrimePhaseDistribution = () => {
    // Make sure data exists and is properly formatted
    if (!combinedAgeData || combinedAgeData.length === 0) {
      return <div className="no-data">No data available for visualization</div>;
    }

    // Filter data to relevant age range and normalize for better visualization
    const validData = combinedAgeData.filter(
      (d) =>
        d.age >= 18 &&
        d.age <= 40 &&
        (d.startCount > 0 || d.peakCount > 0 || d.endCount > 0)
    );

    // Calculate proper trend lines
    const startTrend = calculateTrendLines(validData, "startCount", 0.2);
    const peakTrend = calculateTrendLines(validData, "peakCount", 0.2);
    const endTrend = calculateTrendLines(validData, "endCount", 0.2);

    // Find the maximum count value for proper Y-axis scaling
    const maxCount = Math.max(
      ...validData.map((d) => Math.max(d.startCount, d.peakCount, d.endCount))
    );

    // Round up to the nearest 100 for a cleaner Y-axis
    const yAxisMax = Math.ceil(maxCount / 100) * 100;

    return (
      <div className="chart-container">
        <h3>
          Prime Phase Distribution
          <ContextInfo
            title="Prime Phase Distribution"
            description="This chart shows the distribution of prime starts, peaks, and ends across different ages. The bars represent the actual number of athletes at each career phase, while the smooth curves represent statistical trends showing when athletes typically start, reach, and exit their prime performance period."
          />
        </h3>
        <ResponsiveContainer width="100%" height={500}>
          <ComposedChart
            data={validData}
            margin={{ top: 40, right: 50, left: 50, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="age"
              type="number"
              domain={[18, 40]}
              allowDataOverflow={false}
              label={{
                value: "Age",
                position: "insideBottom",
                offset: -5,
                style: { textAnchor: "middle" },
              }}
              ticks={[18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40]}
            />
            <YAxis
              domain={[0, yAxisMax]}
              tickFormatter={(value) => new Intl.NumberFormat().format(value)}
              label={{
                value: "Player Count",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle" },
                dx: -10,
              }}
            />
            <Tooltip
              formatter={(value, name) => {
                return [new Intl.NumberFormat().format(value), name];
              }}
            />
            <Legend
              layout="horizontal"
              align="center"
              verticalAlign="top"
              wrapperStyle={{ paddingBottom: 10 }}
            />

            {/* Bars with improved visibility and spacing */}
            <Bar
              dataKey="startCount"
              fill="#8884d8"
              opacity={0.7}
              name="Prime Starts"
              barSize={8} // Make bars narrower
            />
            <Bar
              dataKey="peakCount"
              fill="#82ca9d"
              opacity={0.7}
              name="Peak Ages"
              barSize={8}
            />
            <Bar
              dataKey="endCount"
              fill="#ffc658"
              opacity={0.7}
              name="Prime Ends"
              barSize={8}
            />

            {/* Trend Lines with more distinct styling */}
            <Line
              data={startTrend}
              type="monotone"
              dataKey="value"
              stroke="#413ea0"
              strokeWidth={3}
              name="Start Trend"
              dot={false}
              activeDot={false}
            />
            <Line
              data={peakTrend}
              type="monotone"
              dataKey="value"
              stroke="#1f7a4d"
              strokeWidth={3}
              name="Peak Trend"
              dot={false}
              activeDot={false}
            />
            <Line
              data={endTrend}
              type="monotone"
              dataKey="value"
              stroke="#cc8b00"
              strokeWidth={3}
              name="End Trend"
              dot={false}
              activeDot={false}
            />

            {/* Average Lines with labels at the bottom of the chart */}
            {averages.start && (
              <ReferenceLine
                x={averages.start}
                stroke="#413ea0"
                strokeDasharray="3 3"
                strokeWidth={2}
                label={{
                  value: `Avg Start: ${averages.start?.toFixed(1)}`,
                  position: "bottom",
                  fill: "#413ea0",
                  fontSize: 12,
                  dy: 20, // Move label to bottom
                }}
              />
            )}
            {averages.peak && (
              <ReferenceLine
                x={averages.peak}
                stroke="#1f7a4d"
                strokeDasharray="3 3"
                strokeWidth={2}
                label={{
                  value: `Avg Peak: ${averages.peak?.toFixed(1)}`,
                  position: "bottom",
                  fill: "#1f7a4d",
                  fontSize: 12,
                  dy: 35, // Move label to bottom with offset
                }}
              />
            )}
            {averages.end && (
              <ReferenceLine
                x={averages.end}
                stroke="#cc8b00"
                strokeDasharray="3 3"
                strokeWidth={2}
                label={{
                  value: `Avg End: ${averages.end?.toFixed(1)}`,
                  position: "bottom",
                  fill: "#cc8b00",
                  fontSize: 12,
                  dy: 50, // Move label to bottom with larger offset
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>

        {/* Add a summary box below the chart */}
        <div className="phase-summary-box">
          <h4>Key Insights</h4>
          <ul>
            <li>
              <strong>Prime Start Age:</strong> Athletes typically begin their
              prime around age {averages.start?.toFixed(1) || "N/A"}
            </li>
            <li>
              <strong>Peak Performance Age:</strong> Peak performance is most
              common at age {averages.peak?.toFixed(1) || "N/A"}
            </li>
            <li>
              <strong>Prime End Age:</strong> Athletes typically exit their
              prime around age {averages.end?.toFixed(1) || "N/A"}
            </li>
            <li>
              <strong>Average Prime Duration:</strong>{" "}
              {averages.end && averages.start
                ? (averages.end - averages.start + 1).toFixed(1)
                : "N/A"}{" "}
              years
            </li>
          </ul>
        </div>
      </div>
    );
  };

  const renderLeaguePrimeCharacteristics = () => {
    if (leagueChars.length === 0) return null;

    return (
      <div className="chart-container full-width">
        <h3>
          League Prime Characteristics
          <ContextInfo
            title="League Prime Characteristics"
            description="This chart shows the average prime age ranges for each league on a horizontal scale. The colored dots and lines represent the start, peak, and end of prime periods, allowing direct comparison of career trajectories across different sports."
          />
        </h3>
        <ResponsiveContainer width="100%" height={600}>
          <ScatterChart margin={{ left: 120, right: 30, top: 20, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              type="number"
              domain={[18, 40]}
              tickCount={10}
              allowDataOverflow={true}
              label={{
                value: "Age",
                position: "bottom",
                offset: 20,
                style: { textAnchor: "middle", fontSize: 16 },
              }}
            />
            <YAxis
              type="category"
              dataKey="league"
              tick={{ fontSize: 16 }}
              width={120}
              interval={0}
            />

            {/* Career Duration Lines (Light Gray) */}
            {leagueChars.map((league) => (
              <Line
                key={`career-${league.league}`}
                data={[
                  { x: league.careerStartAge, y: league.league },
                  { x: league.careerEndAge, y: league.league },
                ]}
                stroke="#cccccc"
                strokeWidth={3}
                dot={false}
              />
            ))}

            {/* Prime Duration Lines (Main Color) */}
            {leagueChars.map((league) => (
              <Line
                key={`prime-${league.league}`}
                data={[
                  { x: league.avgStartAge, y: league.league },
                  { x: league.avgEndAge, y: league.league },
                ]}
                stroke={leagueColorMapping[league.league] || "#8884d8"}
                strokeWidth={5}
                dot={false}
              />
            ))}

            {/* Career Start Markers (Gray Circles) */}
            <Scatter
              data={leagueChars}
              dataKey="careerStartAge"
              name="Career Start"
              fill="#999999"
              shape={<circle r={7} />}
            />

            {/* Prime Start Markers (Purple Circles) */}
            <Scatter
              data={leagueChars}
              dataKey="avgStartAge"
              name="Prime Start"
              fill="#8884d8"
              shape={<circle r={8} />}
            />

            {/* Peak Age Markers (Stars) */}
            <Scatter
              data={leagueChars}
              dataKey="avgPeakAge"
              name="Peak Age"
              fill="#82ca9d"
              shape={(props) => (
                <path
                  d="M12 0l3.09 6.26L22 7.27l-5 4.87 1.18 6.88L12 16l-6.18 3.02L7 12.14 2 7.27l6.91-1.01L12 0z"
                  transform={`translate(${props.cx - 12},${
                    props.cy - 12
                  }) scale(1.2)`}
                  fill="#82ca9d"
                />
              )}
            />

            {/* Prime End Markers (Orange Circles) */}
            <Scatter
              data={leagueChars}
              dataKey="avgEndAge"
              name="Prime End"
              fill="#ffc658"
              shape={<circle r={8} />}
            />

            {/* Career End Markers (Gray Circles) */}
            <Scatter
              data={leagueChars}
              dataKey="careerEndAge"
              name="Career End"
              fill="#999999"
              shape={<circle r={7} />}
            />

            {/* Add text labels directly on the chart - THIS NEEDS THE TEXT COMPONENT IMPORT */}
            {leagueChars.map((league, index) => (
              <React.Fragment key={`labels-${league.league}`}>
                <Text
                  x={league.avgStartAge}
                  y={index}
                  textAnchor="middle"
                  verticalAnchor="middle"
                  fill="#333"
                  style={{ fontSize: 11, fontWeight: "bold" }}
                  dy={-25}
                >
                  {league.avgStartAge}
                </Text>
                <Text
                  x={league.avgPeakAge}
                  y={index}
                  textAnchor="middle"
                  verticalAnchor="middle"
                  fill="#333"
                  style={{ fontSize: 11, fontWeight: "bold" }}
                  dy={25}
                >
                  {league.avgPeakAge}
                </Text>
                <Text
                  x={league.avgEndAge}
                  y={index}
                  textAnchor="middle"
                  verticalAnchor="middle"
                  fill="#333"
                  style={{ fontSize: 11, fontWeight: "bold" }}
                  dy={-25}
                >
                  {league.avgEndAge}
                </Text>
              </React.Fragment>
            ))}

            <Tooltip
              formatter={(value) => [`${value} years`]}
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
              wrapperStyle={{ zIndex: 100 }}
            />
            <Legend
              verticalAlign="bottom"
              align="center"
              layout="horizontal"
              wrapperStyle={{ paddingTop: 30 }}
            />
          </ScatterChart>
        </ResponsiveContainer>

        {/* Add a detailed table below the chart for more data */}
        <div className="league-details-table">
          <h4>Detailed League Prime Data</h4>
          <table>
            <thead>
              <tr>
                <th>League</th>
                <th>Career Start</th>
                <th>Prime Start</th>
                <th>Peak Age</th>
                <th>Prime End</th>
                <th>Career End</th>
                <th>Prime Duration</th>
              </tr>
            </thead>
            <tbody>
              {leagueChars.map((league) => (
                <tr key={`table-${league.league}`}>
                  <td
                    style={{
                      color: leagueColorMapping[league.league],
                      fontWeight: "bold",
                    }}
                  >
                    {league.league}
                  </td>
                  <td>{league.careerStartAge}</td>
                  <td>{league.avgStartAge}</td>
                  <td>{league.avgPeakAge}</td>
                  <td>{league.avgEndAge}</td>
                  <td>{league.careerEndAge}</td>
                  <td>
                    {(league.avgEndAge - league.avgStartAge + 1).toFixed(1)}{" "}
                    years
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="prime-distribution">
      <div className="section-header">
        <h2>
          Prime Distribution Analysis
          <ContextInfo
            title="Prime Distribution Analysis"
            description="This analysis examines how athlete prime periods are distributed across different ages. It shows when athletes are most likely to be in their prime, at their peak, or past their prime, and allows comparing these patterns across different sports and leagues."
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

      {/* Add summary component */}
      <PrimeDistributionSummary primeDistribution={primeDistribution} />

      {/* Full-width Main Chart - moved out of the charts-container */}
      <div className="full-width-chart">
        <h3>
          Percentage of Athletes in Prime by Age
          <ContextInfo
            title="Athletes in Prime by Age"
            description="This chart shows the percentage of athletes who are in their prime at each age (green bars), as well as those at their absolute peak (orange line). The gray area shows the total number of athletes at each age in the dataset."
          />
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart
            data={primeDistribution}
            margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="age"
              label={{
                value: "Age",
                position: "insideBottom",
                offset: -5,
                style: { textAnchor: "middle" },
              }}
            />
            <YAxis
              yAxisId="left"
              domain={[0, 100]}
              label={{
                value: "Percentage (%)",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle" },
                dx: -10,
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{
                value: "Total Players",
                angle: 90,
                position: "insideRight",
                style: { textAnchor: "middle" },
                dx: 10,
              }}
            />
            <Tooltip contentStyle={{ fontSize: "13px" }} />
            <Legend wrapperStyle={{ paddingTop: 10, paddingBottom: 10 }} />
            <Area
              yAxisId="right"
              dataKey="totalPlayers"
              fill="#f0f0f0"
              stroke="#d0d0d0"
              name="Total Players"
            />
            <Bar
              yAxisId="left"
              dataKey="primePercentage"
              fill="#82ca9d"
              name="In Prime %"
              barSize={12}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="peakPercentage"
              stroke="#ff7300"
              name="At Peak Age %"
              dot={{ r: 4 }}
              strokeWidth={2}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Prime Phase Distribution chart */}
      {renderPrimePhaseDistribution()}

      {/* Expanded League Prime Characteristics view */}
      {renderLeaguePrimeCharacteristics()}
    </div>
  );
};

export default PrimeDistribution;
