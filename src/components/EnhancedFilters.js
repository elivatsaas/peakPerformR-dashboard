import React, { useState, useEffect } from "react";
import "../styles/EnhancedFilters.css";

const MultiSelect = ({
  id,
  label,
  options,
  value,
  onChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOptionClick = (option) => {
    // If the option is already selected, remove it
    if (value.includes(option)) {
      onChange(value.filter((item) => item !== option));
    } else {
      // Otherwise, add it
      onChange([...value, option]);
    }
  };

  return (
    <div className="multi-select-container">
      <label htmlFor={id}>{label}:</label>
      <div
        className={`multi-select-input ${disabled ? "disabled" : ""}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {value.length === 0 ? (
          <span className="placeholder">Select {label}</span>
        ) : (
          <span className="selected-values">
            {value.length === 1 ? value[0] : `${value.length} items selected`}
          </span>
        )}
        <span className="dropdown-arrow">▼</span>
      </div>

      {isOpen && !disabled && (
        <div className="multi-select-dropdown">
          <div className="select-all-option" onClick={() => onChange([])}>
            Clear All
          </div>
          <div
            className="select-all-option"
            onClick={() => onChange([...options])}
          >
            Select All
          </div>
          {options.map((option) => (
            <div
              key={option}
              className={`multi-select-option ${
                value.includes(option) ? "selected" : ""
              }`}
              onClick={() => handleOptionClick(option)}
            >
              <input
                type="checkbox"
                checked={value.includes(option)}
                onChange={() => {}} // Handled by div click
                id={`${id}-${option}`}
              />
              <label htmlFor={`${id}-${option}`}>{option}</label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Create a custom select for limit
const LimitSelect = ({ value, onChange }) => {
  const options = [
    { value: 0, label: "None (All)" },
    { value: 10, label: "10" },
    { value: 25, label: "25" },
    { value: 50, label: "50" },
    { value: 100, label: "100" },
    { value: 500, label: "500" },
  ];

  return (
    <div className="filter-item">
      <label>Limit:</label>
      <select
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

// Main enhanced filters component to be used across the app
const EnhancedFilters = ({
  allData = [], // Provide default empty array
  sports = [],
  leagues = [],
  positions = [],
  selectedSports = [],
  selectedLeagues = [],
  selectedPositions = [],
  limit = 25,
  onSportsChange,
  onLeaguesChange,
  onPositionsChange,
  onLimitChange,
  showLimit = true,
}) => {
  const [filteredLeagues, setFilteredLeagues] = useState(leagues);
  const [filteredPositions, setFilteredPositions] = useState(positions);

  // FIX: Keep all leagues visible but apply filtering logic to positions
  // Keep all leagues visible regardless of sport selection
  useEffect(() => {
    setFilteredLeagues(leagues);
  }, [leagues]);

  // Filter positions based on selected leagues and sports
  useEffect(() => {
    if (!Array.isArray(allData) || allData.length === 0) {
      setFilteredPositions(positions);
      return;
    }

    let positionsToShow = positions;

    // If sports are selected, filter by sports
    if (selectedSports.length > 0) {
      const filteredData = allData.filter(
        (item) => item && selectedSports.includes(item.sport)
      );

      // If leagues are also selected, further filter
      if (selectedLeagues.length > 0) {
        const filteredBySportAndLeague = filteredData.filter((item) =>
          selectedLeagues.includes(item.league)
        );

        positionsToShow = [
          ...new Set(
            filteredBySportAndLeague
              .map((item) => item.position)
              .filter(Boolean)
          ),
        ];
      } else {
        positionsToShow = [
          ...new Set(filteredData.map((item) => item.position).filter(Boolean)),
        ];
      }
    } else if (selectedLeagues.length > 0) {
      // Only leagues are selected
      const filteredByLeague = allData.filter(
        (item) => item && selectedLeagues.includes(item.league)
      );

      positionsToShow = [
        ...new Set(
          filteredByLeague.map((item) => item.position).filter(Boolean)
        ),
      ];
    }

    setFilteredPositions(positionsToShow);
  }, [selectedSports, selectedLeagues, positions, allData]);

  return (
    <div className="filters enhanced-filters">
      <MultiSelect
        id="sports-select"
        label="Sport"
        options={sports}
        value={selectedSports}
        onChange={onSportsChange}
      />

      <MultiSelect
        id="leagues-select"
        label="League"
        options={leagues}
        value={selectedLeagues.filter((l) => leagues.includes(l))}
        onChange={onLeaguesChange}
        disabled={filteredLeagues.length === 0}
      />

      <MultiSelect
        id="positions-select"
        label="Position"
        options={filteredPositions}
        value={selectedPositions.filter((p) => filteredPositions.includes(p))}
        onChange={onPositionsChange}
        disabled={filteredPositions.length === 0}
      />

      {showLimit && <LimitSelect value={limit} onChange={onLimitChange} />}
    </div>
  );
};

export default EnhancedFilters;
