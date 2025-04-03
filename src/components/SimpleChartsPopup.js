import React from "react";

// Simple popup component that shows the existing charts
const SimpleChartsPopup = ({
  isOpen,
  onClose,
  selectedPlayers,
  playerData,
}) => {
  if (!isOpen) return null;

  // Prevent click propagation to allow clicking inside the modal
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="charts-popup-overlay" onClick={onClose}>
      <div className="charts-popup-container" onClick={handleModalClick}>
        <div className="charts-popup-header">
          <h3>Performance Charts</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="charts-popup-content">
          {selectedPlayers.map((player) => {
            const playerInfo = playerData[player.id];
            if (!playerInfo) return null;

            return (
              <div className="popup-player-charts" key={player.id}>
                <h4
                  style={{
                    color: player.league
                      ? leagueColorMapping[player.league]
                      : "#6d1945",
                  }}
                >
                  {player.player_name}
                </h4>
                <div className="popup-charts-row">
                  {/* We're grabbing a reference to the actual chart DOM nodes and cloning them */}
                  <div
                    className="popup-chart-column"
                    id={`actual-chart-${player.id}`}
                  >
                    <h5>Actual Performance</h5>
                    <div className="chart-placeholder">
                      {/* This div will be populated by JavaScript to clone the chart */}
                    </div>
                  </div>

                  <div
                    className="popup-chart-column"
                    id={`predicted-chart-${player.id}`}
                  >
                    <h5>Predicted Performance</h5>
                    <div className="chart-placeholder">
                      {/* This div will be populated by JavaScript to clone the chart */}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SimpleChartsPopup;
