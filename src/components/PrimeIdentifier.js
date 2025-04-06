// src/components/PrimeIdentifier.js
import React, { useState, useEffect, useRef, useCallback } from "react";
// Remove Recharts imports if player viz is fully removed
// import { LineChart, Line, XAxis, ... } from "recharts";
import { leagueColorMapping } from "../utils/constants";
import ContextInfo from "./ContextInfo";
import _ from "lodash";
import toast, { Toaster } from 'react-hot-toast'; // Needs npm/yarn install
import "../styles/PrimeIdentifier.css";

// --- Constants ---
const DEFAULT_THRESHOLD_PCT = 70;
const DEFAULT_GAMES_PCT_THRESHOLD = 40;
const MAX_CUSTOM_DEFINITIONS = 5;
const ORIGINAL_DEFINITION_ID = "original_data_definition";
const API_ENDPOINT = "https://youraccount.shinyapps.io/peakperformr-api/recalculate"; // Replace!
// const API_ENDPOINT = "http://localhost:8000/recalculate"; // Local

// --- Utility Functions ---
const getParamsKey = (params) => `t${params.thresholdPct}_g${params.gamesPctThreshold}`;

const calculateLeaguePrimeStats = (primes) => {
    if (!Array.isArray(primes) || primes.length === 0) return [];
    const leagueGroups = _.groupBy(primes, "league");
    const stats = Object.keys(leagueGroups).map((league) => {
      const playersInLeague = leagueGroups[league];
      if (!playersInLeague || playersInLeague.length === 0) return null;
      const validDurations = playersInLeague.map(p => p?.prime_duration).filter(d => typeof d === 'number' && isFinite(d));
      const avgDuration = validDurations.length > 0 ? _.mean(validDurations) : 0;
      // Add more stats if needed for league comparison table
      return {
        league: league,
        avgDuration: avgDuration,
        playerCount: playersInLeague.length,
        color: leagueColorMapping[league] || '#cccccc'
      };
    }).filter(Boolean);
    return _.orderBy(stats, ["playerCount", "avgDuration"], ["desc", "desc"]);
};

// --- Main Component ---
// Removed selectedPlayer state and related search states/handlers
const PrimeIdentifier = ({ data, onPrimeChange }) => {
  const [thresholdPct, setThresholdPct] = useState(DEFAULT_THRESHOLD_PCT);
  const [gamesPctThreshold, setGamesPctThreshold] = useState(DEFAULT_GAMES_PCT_THRESHOLD);
  const [activeApiRequests, setActiveApiRequests] = useState({});
  const [apiErrors, setApiErrors] = useState({});
  const [availableDefinitions, setAvailableDefinitions] = useState({});
  const [activeDefinitionKey, setActiveDefinitionKey] = useState(ORIGINAL_DEFINITION_ID);
  const [displayData, setDisplayData] = useState({ rawPrimes: [], splinePrimes: [], pqi: [], cqi: [], fullData: [], leagueStats: [] });
  const isInitialized = useRef(false);

  // --- Effects ---

  // 1. Initialize Original Data Definition ONCE (Unchanged)
  useEffect(() => {
    const checkData = (d) => d && Array.isArray(d);
    const hasAllData = data && checkData(data.fullData) && checkData(data.playerPredictions) &&
                       checkData(data.primesRawData) && checkData(data.primesSplineData) &&
                       checkData(data.pqiData) && checkData(data.cqiData);
    if (!hasAllData || isInitialized.current) return;
    console.log("PrimeIdentifier: Initializing original data definition.");
    const originalDefinition = {
        id: ORIGINAL_DEFINITION_ID, parameters: { thresholdPct: 'N/A', gamesPctThreshold: 'N/A' },
        label: "Original Data", timestamp: Date.now(),
        rawPrimes: _.cloneDeep(data.primesRawData), splinePrimes: _.cloneDeep(data.primesSplineData),
        pqi: _.cloneDeep(data.pqiData), cqi: _.cloneDeep(data.cqiData),
        fullData: _.cloneDeep(data.fullData),
    };
    setAvailableDefinitions({ [ORIGINAL_DEFINITION_ID]: originalDefinition });
    setActiveDefinitionKey(ORIGINAL_DEFINITION_ID);
    isInitialized.current = true;
  }, [data]);

  // 2. Update Display Data when Active Definition Changes (Unchanged)
  useEffect(() => {
    if (!isInitialized.current) return;
    const currentDef = availableDefinitions[activeDefinitionKey];
    if (!currentDef) {
        console.warn(`Active definition key "${activeDefinitionKey}" not found. Reverting view.`);
        const originalDef = availableDefinitions[ORIGINAL_DEFINITION_ID];
        if (originalDef) {
             setActiveDefinitionKey(ORIGINAL_DEFINITION_ID); // Reset key
             // Display original temporarily
             setDisplayData({
                 rawPrimes: originalDef.rawPrimes, splinePrimes: originalDef.splinePrimes,
                 pqi: originalDef.pqi, cqi: originalDef.cqi, fullData: originalDef.fullData,
                 leagueStats: calculateLeaguePrimeStats(originalDef.splinePrimes)
             });
        } else {
            setDisplayData({ rawPrimes: [], splinePrimes: [], pqi: [], cqi: [], fullData: [], leagueStats: [] }); // Empty if error
        }
        return;
    }
    console.log(`PrimeIdentifier: Updating display for definition: ${activeDefinitionKey}`);
    setDisplayData({
        rawPrimes: currentDef.rawPrimes, splinePrimes: currentDef.splinePrimes,
        pqi: currentDef.pqi, cqi: currentDef.cqi, fullData: currentDef.fullData,
        leagueStats: calculateLeaguePrimeStats(currentDef.splinePrimes)
    });
  }, [activeDefinitionKey, availableDefinitions]);

  // 3. Detailed Player Data Effect - REMOVED (or move logic elsewhere)

  // 4. Player Search Effect - REMOVED

  // --- Event Handlers ---

  const handleParameterChange = (setter) => (event) => {
    setter(parseInt(event.target.value, 10));
  };

  // Trigger API Call (Unchanged logic, ensure API response includes fullData)
  const handleCalculateRequest = useCallback(async () => {
    const currentParams = { thresholdPct, gamesPctThreshold };
    const paramsKey = getParamsKey(currentParams);
    if (activeApiRequests[paramsKey]) return;
    if (availableDefinitions[paramsKey]) {
        toast.success(`Data for T=${thresholdPct}% / G=${gamesPctThreshold}% already available. Switching view.`);
        setActiveDefinitionKey(paramsKey); return;
    }
    if (Object.keys(availableDefinitions).length - 1 >= MAX_CUSTOM_DEFINITIONS) {
        toast.error(`Max ${MAX_CUSTOM_DEFINITIONS} custom definitions reached.`); return;
    }
    setActiveApiRequests(prev => ({ ...prev, [paramsKey]: 'loading' }));
    setApiErrors(prev => { const n = {...prev}; delete n[paramsKey]; return n; });
    const toastId = toast.loading(`Calculating: T=${thresholdPct}% / G=${gamesPctThreshold}%...`);
    try {
        const response = await fetch(API_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(currentParams) });
        if (!response.ok) { const errorText = await response.text(); throw new Error(`API failed (${response.status}). ${errorText}`); }
        const results = await response.json();
        if (results?.success) {
            const newLabel = `Custom: T=${results.parameters.thresholdPct}% / G=${results.parameters.gamesPctThreshold}%`;
            const newDefinition = {
                id: paramsKey, parameters: results.parameters, label: newLabel, timestamp: Date.now(),
                rawPrimes: results.rawPrimes || [], splinePrimes: results.splinePrimes || [],
                pqi: results.pqi || [], cqi: results.cqi || [],
                fullData: results.fullData || [] // IMPORTANT: API must return this
            };
            setAvailableDefinitions(prev => ({ ...prev, [paramsKey]: newDefinition }));
            toast.success(`Calculation complete for ${newLabel}`, { id: toastId });
            setActiveDefinitionKey(paramsKey);
            if (onPrimeChange) { // Auto-apply if callback provided
                onPrimeChange({ ...newDefinition, isOriginal: false });
                console.log("Auto-applied new definition to dashboard.");
            }
        } else { throw new Error(results?.message || "API returned unsuccessful data."); }
    } catch (error) {
        console.error(`API Call failed for ${paramsKey}:`, error);
        setApiErrors(prev => ({ ...prev, [paramsKey]: error.message }));
        toast.error(`Calculation failed: ${error.message}`, { id: toastId });
    } finally {
        setActiveApiRequests(prev => { const n = { ...prev }; delete n[paramsKey]; return n; });
    }
  }, [thresholdPct, gamesPctThreshold, activeApiRequests, availableDefinitions, onPrimeChange]);

  // Select definition to VIEW (Unchanged)
  const handleSelectDefinition = (event) => {
    const selectedKey = event.target.value;
    if (selectedKey !== activeDefinitionKey) {
        setActiveDefinitionKey(selectedKey);
        setApiErrors(prev => { const n = {...prev}; delete n[selectedKey]; return n; });
    }
  };

  // Apply the currently VIEWED definition GLOBALLY (Unchanged logic)
  const handleApplySelected = useCallback(() => {
    const definitionToApply = availableDefinitions[activeDefinitionKey];
    if (!onPrimeChange || !definitionToApply) return;
    const isOriginal = activeDefinitionKey === ORIGINAL_DEFINITION_ID;
    console.log(`Applying definition '${activeDefinitionKey}' globally.`);
    onPrimeChange({
        raw: definitionToApply.rawPrimes, spline: definitionToApply.splinePrimes,
        pqi: definitionToApply.pqi, cqi: definitionToApply.cqi,
        fullData: definitionToApply.fullData, // Pass definition-specific fullData
        isOriginal: isOriginal, definitionLabel: definitionToApply.label,
        definitionParams: definitionToApply.parameters
    });
    toast.success(`Applied definition "${definitionToApply.label}" to dashboard.`);
  }, [activeDefinitionKey, availableDefinitions, onPrimeChange]);

   // Delete a saved definition (Unchanged logic)
   const handleDeleteDefinition = useCallback((keyToDelete) => {
       if (keyToDelete === ORIGINAL_DEFINITION_ID || activeApiRequests[keyToDelete]) return;
       const deletedLabel = availableDefinitions[keyToDelete]?.label || keyToDelete;
       setAvailableDefinitions(prev => { const n = { ...prev }; delete n[keyToDelete]; return n; });
       setApiErrors(prev => { const n = {...prev}; delete n[keyToDelete]; return n; });
       if (activeDefinitionKey === keyToDelete) {
           setActiveDefinitionKey(ORIGINAL_DEFINITION_ID);
           toast.info(`Deleted "${deletedLabel}". Viewing original data.`);
       } else { toast.success(`Deleted definition "${deletedLabel}".`); }
   }, [activeDefinitionKey, availableDefinitions, activeApiRequests]);

  // --- Derived State for Rendering --- (Simplified)
  const isLoadingAny = Object.values(activeApiRequests).includes('loading');
  const customDefCount = Object.keys(availableDefinitions).length - (availableDefinitions[ORIGINAL_DEFINITION_ID] ? 1 : 0);
  const canCalculate = !isLoadingAny && customDefCount < MAX_CUSTOM_DEFINITIONS;
  const currentParamsKey = getParamsKey({ thresholdPct, gamesPctThreshold });
  const isCurrentParamLoading = activeApiRequests[currentParamsKey] === 'loading';
  const isCurrentParamAvailable = !!availableDefinitions[currentParamsKey];

  const definitionOptions = Object.values(availableDefinitions)
    .sort((a, b) => (a.id === ORIGINAL_DEFINITION_ID ? -1 : b.id === ORIGINAL_DEFINITION_ID ? 1 : a.timestamp - b.timestamp))
    .map(def => ({ value: def.id, label: `${def.label}${activeApiRequests[def.id] ? ' (Calculating...)' : ''}${apiErrors[def.id] ? ' (Error!)' : ''}`, error: apiErrors[def.id] || null }));

  // Stats based on currently displayed data
  const avgSplineDuration = (displayData.splinePrimes.reduce((sum, p) => sum + (p.prime_duration || 0), 0) / (displayData.splinePrimes.length || 1)).toFixed(1); // Avoid div by zero
  const splineCount = displayData.splinePrimes.length;

  // --- Render ---
  return (
    <div className="prime-identifier component-box">
        <Toaster position="top-right" containerStyle={{ zIndex: 9999 }} />
        <div className="section-header">
            <h2>Prime Definition Explorer <ContextInfo title="Prime Definition Explorer" description="Adjust parameters and calculate alternative prime year definitions. Apply a definition globally to update other dashboard components." /></h2>
            <span className={`status-indicator ${activeDefinitionKey === ORIGINAL_DEFINITION_ID ? 'original' : 'modified'}`}>
                Viewing: {availableDefinitions[activeDefinitionKey]?.label ?? (isLoadingAny ? 'Loading...' : 'N/A')}
            </span>
             {apiErrors[activeDefinitionKey] && <div className="api-error-message inline-error">Error viewing this definition: {apiErrors[activeDefinitionKey]}</div>}
        </div>

       {/* --- Settings Panel --- */}
       <div className="settings-panel">
         {/* Parameters */}
         <div className="threshold-controls control-group">
            <div>
                <label htmlFor="threshold-pct">Prime Threshold (%): {thresholdPct}%</label>
                <input type="range" id="threshold-pct" min="50" max="95" step="5" value={thresholdPct} onChange={handleParameterChange(setThresholdPct)} disabled={isLoadingAny} />
            </div>
            <div>
                <label htmlFor="games-pct-threshold">Low Games Skip (%ile): {gamesPctThreshold}%</label>
                <input type="range" id="games-pct-threshold" min="0" max="75" step="5" value={gamesPctThreshold} onChange={handleParameterChange(setGamesPctThreshold)} disabled={isLoadingAny} />
            </div>
         </div>

         {/* Definition Management */}
         <div className="definition-management">
            <div className="control-group definition-selector">
                <label htmlFor="definition-select">View Definition:</label>
                <select id="definition-select" value={activeDefinitionKey} onChange={handleSelectDefinition} disabled={isLoadingAny}>
                    {definitionOptions.map(opt => <option key={opt.value} value={opt.value} title={opt.error || ''}>{opt.label}</option> )}
                </select>
                {apiErrors[activeDefinitionKey] && <span className="error-text"> (Load Error!)</span>}
            </div>
            <div className="action-buttons">
                <button onClick={handleCalculateRequest} disabled={!canCalculate || isCurrentParamLoading || isCurrentParamAvailable} className={`calculate-button ${isCurrentParamLoading ? 'loading' : ''}`} title={ /* Tooltip logic unchanged */ }>
                    {isCurrentParamLoading ? "Calculating..." : "Calculate & Add"}
                </button>
                <button onClick={handleApplySelected} disabled={isLoadingAny || !availableDefinitions[activeDefinitionKey]} className="apply-button" title="Update dashboard with the currently viewed definition">
                    Apply Selected Globally
                </button>
            </div>
         </div>

         {/* Saved Definitions List */}
         {customDefCount > 0 && (
            <div className="saved-definitions-list">
                <h5>Saved Definitions ({customDefCount}/{MAX_CUSTOM_DEFINITIONS}):</h5>
                <ul>
                    {Object.values(availableDefinitions).filter(def => def.id !== ORIGINAL_DEFINITION_ID).sort((a,b)=>a.timestamp-b.timestamp).map(def => {
                        const isLoadingThis = activeApiRequests[def.id] === 'loading';
                        const hasError = !!apiErrors[def.id];
                        return ( <li key={def.id} className={`${def.id === activeDefinitionKey ? 'active-def' : ''} ${hasError ? 'error-def' : ''}`}>
                                <span onClick={() => !isLoadingThis && setActiveDefinitionKey(def.id)} style={{cursor: isLoadingThis ? 'default' : 'pointer'}} title={hasError ? `Error: ${apiErrors[def.id]}` : `View: ${def.label}`}>
                                    {def.label}{isLoadingThis && ' (Calculating...)'}{hasError && ' (Error!)'}
                                </span>
                                <button onClick={() => handleDeleteDefinition(def.id)} className="delete-button" title="Delete this definition" disabled={isLoadingAny || isLoadingThis}> × </button>
                            </li> );
                        })}
                </ul>
            </div>
         )}
       </div>

        {/* --- Player Detail Visualization REMOVED --- */}

        {/* --- Global Stats (Based on Displayed Data) --- */}
        <div className="global-stats-summary component-box">
            <h4>Overall Stats (Viewing: {availableDefinitions[activeDefinitionKey]?.label ?? 'N/A'})</h4>
             <div className="stat-cards">
                <div className="stat-card">Players (Spline Primes): <span>{splineCount}</span></div>
                <div className="stat-card">Avg. Prime Duration (Spline): <span>{avgSplineDuration} yrs</span></div>
                {/* Add more cards using displayData.pqi, displayData.cqi etc. */}
            </div>
        </div>

        {/* --- League Comparison (Based on Displayed Data) --- */}
        {displayData.leagueStats.length > 0 && (
             <div className="league-prime-comparison component-box">
                <h4>League Comparison (Viewing: {availableDefinitions[activeDefinitionKey]?.label ?? 'N/A'})</h4>
                {/* Add Bar Chart/Table using displayData.leagueStats here */}
                {/* Example: <LeagueComparisonChart data={displayData.leagueStats} /> */}
                <table>
                    <thead><tr><th>League</th><th>Players</th><th>Avg Duration</th>{/* Add more headers */}</tr></thead>
                    <tbody>
                        {displayData.leagueStats.map(lg => (
                            <tr key={lg.league}>
                                <td><span className="color-swatch" style={{backgroundColor: lg.color}}></span>{lg.league}</td>
                                <td>{lg.playerCount}</td>
                                <td>{lg.avgDuration?.toFixed(1)}</td>
                                {/* Add more cells */}
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        )}

    </div> // end prime-identifier
  );
};

export default PrimeIdentifier;