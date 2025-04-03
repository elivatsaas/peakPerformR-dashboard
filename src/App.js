import React, { useState, useEffect } from "react";
import Dashboard from "./components/Dashboard";
import DataErrorBoundary from "./components/DataErrorBoundary";
import { loadAllData } from "./utils/dataLoader";
import "./styles/App.css";

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingStage, setLoadingStage] = useState("Initializing...");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingStage("Preparing to load data...");
        console.log("App is attempting to load data...");

        setLoadingStage("Loading data...");
        const loadedData = await loadAllData();

        console.log("Data loaded successfully in App.js");
        setData(loadedData);
        setLoading(false);
      } catch (err) {
        console.error("Error loading data in App.js:", err);
        setError(`${err.message}`);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-stage">{loadingStage}</div>
        <div className="loading-message">This should only take a moment.</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-title">Error Loading Data</div>
        <div className="error">{error}</div>
        <div className="troubleshooting">
          <h3>Troubleshooting Steps:</h3>
          <ol>
            <li>Verify that your CSV files exist in the public/data folder</li>
            <li>
              Check that your CSV files have the correct structure and headers
            </li>
            <li>Try refreshing the page</li>
            <li>Restart your development server (npm start)</li>
            <li>
              Check your browser's console (F12) for more detailed error
              messages
            </li>
          </ol>
          <button
            onClick={() => window.location.reload()}
            className="reload-button"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <DataErrorBoundary>
        <Dashboard data={data} />
      </DataErrorBoundary>
    </div>
  );
}

export default App;
