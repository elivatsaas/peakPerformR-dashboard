import React from "react";
import "../styles/Navbar.css";

const Navbar = ({ activeTab, setActiveTab }) => {
  // Consolidated tabs - modified "PQI Explorer" to "Index Explorer"
  const tabs = [
    { id: "playerComparison", label: "Player Comparison" },
    { id: "indexExplorer", label: "Index Explorer" }, // Updated label from "PQI Explorer"
    { id: "primeAnalysis", label: "Prime Analysis" },
    { id: "agingPatterns", label: "Aging Patterns" },
  ];

  return (
    <div className="navbar">
      <div className="navbar-brand">peakPerformR Dashboard</div>
      <div className="navbar-tabs">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`navbar-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Navbar;
