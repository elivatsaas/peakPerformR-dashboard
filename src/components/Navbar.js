import React from "react";
import "../styles/Navbar.css";

const Navbar = ({ activeTab, setActiveTab }) => {
  // Updated tabs to include Prime Identifier
  const tabs = [
    { id: "playerComparison", label: "Player Comparison" },
    { id: "indexExplorer", label: "Index Explorer" },
    { id: "primeAnalysis", label: "Prime Analysis" },
    { id: "agingPatterns", label: "Aging Patterns" },
    { id: "primeIdentifier", label: "Prime Identifier" },
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
