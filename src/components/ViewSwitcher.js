import React, { useState } from "react";

// Create a reusable component for switching between views in combined tabs
const ViewSwitcher = ({ views }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="combined-view">
      <div className="view-selector">
        {views.map((view, index) => (
          <button
            key={index}
            className={`view-button ${activeIndex === index ? "active" : ""}`}
            onClick={() => setActiveIndex(index)}
          >
            {view.label}
          </button>
        ))}
      </div>
      <div className="view-content">
        {views.map((view, index) => (
          <div
            key={index}
            style={{ display: activeIndex === index ? "block" : "none" }}
          >
            {view.component}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ViewSwitcher;
