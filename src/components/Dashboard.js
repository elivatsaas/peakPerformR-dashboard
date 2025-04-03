import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import PlayerComparison from "./PlayerComparison";
import IndexExplorer from "./IndexExplorer"; // Renamed from PQIExplorer to IndexExplorer
import LongestPrimes from "./LongestPrimes";
import PrimeDistribution from "./PrimeDistribution";
import AgingCurves from "./AgingCurves";
import PrimeExplorer from "./PrimeExplorer";
import { getUniquePositions, getUniqueLeagues } from "../utils/dataProcessing";
import "../styles/Dashboard.css";
import { verifyDataStructure } from "../utils/dataVerify";
import LandingPage from "./LandingPage";

// New combined view components
const PrimeAnalysis = ({ data, positions, leagues, filterProps }) => (
  <div className="combined-view">
    <h2 className="section-title">Prime Performance Analysis</h2>
    <p className="section-description">
      This section combines analytics on player prime durations and the
      distribution of prime periods across different ages and leagues.
    </p>

    <div className="tab-selector">
      <button
        className={filterProps.subView === "longestPrimes" ? "active" : ""}
        onClick={() => filterProps.setSubView("longestPrimes")}
      >
        Longest Primes
      </button>
      <button
        className={filterProps.subView === "primeDistribution" ? "active" : ""}
        onClick={() => filterProps.setSubView("primeDistribution")}
      >
        Prime Distribution
      </button>
    </div>

    <div className="sub-view-container">
      {filterProps.subView === "longestPrimes" ? (
        <LongestPrimes
          data={data}
          positions={positions}
          leagues={leagues}
          {...filterProps}
        />
      ) : (
        <PrimeDistribution data={data} leagues={leagues} {...filterProps} />
      )}
    </div>
  </div>
);

const AgingPatterns = ({ data, positions, leagues, filterProps }) => (
  <div className="combined-view">
    <h2 className="section-title">Aging & Performance Patterns</h2>
    <p className="section-description">
      This section explores how athlete performance changes with age and allows
      interactive exploration of performance metrics at specific ages.
    </p>

    <div className="tab-selector">
      <button
        className={filterProps.subView === "agingCurves" ? "active" : ""}
        onClick={() => filterProps.setSubView("agingCurves")}
      >
        Aging Curves
      </button>
      <button
        className={filterProps.subView === "primeExplorer" ? "active" : ""}
        onClick={() => filterProps.setSubView("primeExplorer")}
      >
        Prime Explorer
      </button>
    </div>

    <div className="sub-view-container">
      {filterProps.subView === "agingCurves" ? (
        <AgingCurves data={data} leagues={leagues} {...filterProps} />
      ) : (
        <PrimeExplorer
          data={data}
          positions={positions}
          leagues={leagues}
          {...filterProps}
        />
      )}
    </div>
  </div>
);

const Dashboard = ({ data }) => {
  const [showLanding, setShowLanding] = useState(true);
  const [activeTab, setActiveTab] = useState("playerComparison");
  const [subView, setSubView] = useState("longestPrimes"); // For combined tabs
  const [positions, setPositions] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [dataError, setDataError] = useState(null);

  // Shared filter state for all components
  const [selectedSports, setSelectedSports] = useState([]);
  const [selectedLeagues, setSelectedLeagues] = useState([]);
  const [selectedPositions, setSelectedPositions] = useState([]);
  const [limit, setLimit] = useState(25);

  // Get all unique sports
  const allSports = React.useMemo(() => {
    if (!data || !data.pqiData) return [];
    return [...new Set(data.pqiData.map((player) => player.sport))].filter(
      Boolean
    );
  }, [data]);

  // Process data and extract positions and leagues
  useEffect(() => {
    if (data) {
      try {
        console.log("Dashboard received data:", {
          fullDataRows: data.fullData?.length || 0,
          pqiDataRows: data.pqiData?.length || 0,
          primesRawDataRows: data.primesRawData?.length || 0,
          primesSplineDataRows: data.primesSplineData?.length || 0,
          cqiDataRows: data.cqiData?.length || 0, // Added CQI data rows
        });

        // Get unique positions and leagues for filters
        const uniquePositions = getUniquePositions(data.pqiData);
        const uniqueLeagues = getUniqueLeagues(data.pqiData);

        // If we don't get any positions or leagues, something might be wrong with the data
        if (uniquePositions.length === 0 || uniqueLeagues.length === 0) {
          console.warn(
            "No positions or leagues found. Data structure may be incorrect."
          );

          // Try to provide default values if needed
          if (uniquePositions.length === 0) {
            console.log("Using default positions as fallback");
            setPositions([
              "Forward",
              "Guard",
              "Center",
              "Quarterback",
              "Pitcher",
              "Defender",
              "Midfielder",
              "Player",
            ]);
          } else {
            setPositions(uniquePositions);
          }

          if (uniqueLeagues.length === 0) {
            console.log("Using default leagues as fallback");
            setLeagues([
              "NBA",
              "WNBA",
              "NFL",
              "MLB",
              "NHL",
              "PWHL",
              "MLS",
              "NWSL",
              "CHESS_M",
              "CHESS_F",
            ]);
          } else {
            setLeagues(uniqueLeagues);
          }
        } else {
          setPositions(uniquePositions);
          setLeagues(uniqueLeagues);
        }

        setDataError(null);
      } catch (err) {
        console.error("Error processing dashboard data:", err);
        setDataError(`Error processing data: ${err.message}`);
      }
    } else {
      console.warn("Dashboard received null/undefined data");
      setDataError(
        "No data available. Please check if the CSV files loaded correctly."
      );
    }
  }, [data]);

  // Verify data structure
  useEffect(() => {
    if (data) {
      try {
        const isValid = verifyDataStructure(data);
        if (!isValid) {
          console.error(
            "Dashboard data verification failed - see errors above"
          );
          setDataError(
            "Data verification failed. The data structure doesn't match the expected format."
          );
        } else {
          console.log("Dashboard data verification passed");
        }
      } catch (err) {
        console.error("Error verifying data structure:", err);
        setDataError(`Error verifying data: ${err.message}`);
      }
    }
  }, [data]);

  // Shared toggleLeague function
  const toggleLeague = (league) => {
    if (selectedLeagues.includes(league)) {
      // Only remove if not the last selected league
      if (selectedLeagues.length > 1) {
        setSelectedLeagues((prev) => prev.filter((l) => l !== league));
      }
    } else {
      setSelectedLeagues((prev) => [...prev, league]);
    }
  };

  if (showLanding) {
    return <LandingPage onEnterDashboard={() => setShowLanding(false)} />;
  }

  const renderActiveTab = () => {
    if (!data) return <div className="loading-message">Loading data...</div>;

    // Show error message if there are data issues
    if (dataError) {
      return (
        <div className="data-error">
          <h3>Data Issue Detected</h3>
          <p>{dataError}</p>
          <p>Check the browser console for more details.</p>
        </div>
      );
    }

    try {
      // Pass shared filter state to all components
      const filterProps = {
        selectedSports,
        setSelectedSports,
        selectedLeagues,
        setSelectedLeagues,
        selectedPositions,
        setSelectedPositions,
        limit,
        setLimit,
        allSports,
        toggleLeague,
        subView,
        setSubView,
      };

      // Handle the consolidated dashboard structure
      switch (activeTab) {
        case "playerComparison":
          return (
            <PlayerComparison
              data={data}
              positions={positions}
              leagues={leagues}
              {...filterProps}
            />
          );
        case "indexExplorer":
          // Updated to use IndexExplorer (renamed from PQIExplorer)
          return (
            <IndexExplorer
              data={data}
              positions={positions}
              leagues={leagues}
              {...filterProps}
            />
          );
        case "primeAnalysis":
          return (
            <PrimeAnalysis
              data={data}
              positions={positions}
              leagues={leagues}
              filterProps={filterProps}
            />
          );
        case "agingPatterns":
          return (
            <AgingPatterns
              data={data}
              positions={positions}
              leagues={leagues}
              filterProps={filterProps}
            />
          );
        default:
          return (
            <PlayerComparison
              data={data}
              positions={positions}
              leagues={leagues}
              {...filterProps}
            />
          );
      }
    } catch (err) {
      console.error(`Error rendering ${activeTab}:`, err);
      return (
        <div className="component-error">
          <h3>Error Rendering Component</h3>
          <p>{err.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="reload-button"
          >
            Reload Page
          </button>
        </div>
      );
    }
  };

  return (
    <div className="dashboard-container">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="dashboard-content">{renderActiveTab()}</div>
    </div>
  );
};

export default Dashboard;
