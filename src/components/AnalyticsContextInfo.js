import React, { useState } from "react";
import ContextInfo from "./ContextInfo";
import "../styles/AnalyticsContextInfo.css";

const AnalyticsContextInfo = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const switchTab = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <div className="analytics-context">
      <div className="section-header">
        <h2>
          Sports Performance Analysis: Methodology & Metrics
          <ContextInfo
            title="About This Dashboard"
            description="This information hub explains the methodology, metrics, and principles behind the peakPerformR Dashboard."
          />
        </h2>
      </div>

      <div className="tab-selector context-tabs">
        <button
          className={activeTab === "overview" ? "active" : ""}
          onClick={() => switchTab("overview")}
        >
          Overview
        </button>
        <button
          className={activeTab === "metrics" ? "active" : ""}
          onClick={() => switchTab("metrics")}
        >
          League Metrics
        </button>
        <button
          className={activeTab === "indexes" ? "active" : ""}
          onClick={() => switchTab("indexes")}
        >
          PQI & CQI
        </button>
        <button
          className={activeTab === "prime" ? "active" : ""}
          onClick={() => switchTab("prime")}
        >
          Prime Years
        </button>
        <button
          className={activeTab === "methodology" ? "active" : ""}
          onClick={() => switchTab("methodology")}
        >
          Methodology
        </button>
      </div>

      {/* Overview Tab */}
      <div
        className={`tab-content ${activeTab === "overview" ? "active" : ""}`}
      >
        <div className="context-content">
          <p>
            The peakPerformR dashboard provides analytics on how athlete
            performance varies across different sports throughout their careers.
            We focus on two complementary metrics to evaluate athlete careers:
          </p>

          <div className="metric-boxes">
            <div className="metric-box">
              <h3>Prime Quality Index (PQI)</h3>
              <p>
                Measures an athlete's career achievement by evaluating peak
                performance and prime years
              </p>
            </div>

            <div className="metric-box">
              <h3>Career Quality Index (CQI)</h3>
              <p>
                Evaluates an athlete's overall career quality by analyzing
                career length, average performance, and statistical accumulation
              </p>
            </div>
          </div>

          <p>
            Our analysis examines data from multiple sports leagues, allowing
            for cross-sport comparisons of career trajectories and prime
            periods. The dashboard standardizes player values across different
            sports by accounting for position-specific performance and player
            availability.
          </p>

          <div className="methodology-highlight">
            <h4>Key Standardization Approach</h4>
            <p>
              To enable cross-sport comparison, all player statistics are first
              converted to a sport-specific value metric. Then, these raw values
              are multiplied by the player's yearly availability percentile
              (their percentile rank of games played within their league and
              position). This ensures that players are rewarded for both
              performance quality and availability/durability.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Tab */}
      <div className={`tab-content ${activeTab === "metrics" ? "active" : ""}`}>
        <div className="context-content">
          <p>
            Each league uses sport-specific metrics to evaluate player
            performance, which are then normalized to enable cross-sport
            comparisons. Below are the primary metrics used for each league,
            along with the data time periods covered:
          </p>

          <div className="league-metrics-grid">
            <div className="league-card">
              <div
                className="league-header"
                style={{ backgroundColor: "#6389b5" }}
              >
                NHL (Hockey) - NHL: 2011-2023
              </div>
              <div className="league-content">
                <p>
                  <span className="metric-label">Primary Metric:</span> Position
                  Value
                </p>
                <p>
                  <span className="metric-label">Skaters:</span> Goals, assists,
                  shots, hits, takeaways, plus/minus, time on ice
                </p>
                <p>
                  <span className="metric-label">Goalies:</span> Saves, goals
                  against average, save percentage, win percentage
                </p>
                <p>
                  <span className="metric-label">Position Value:</span>{" "}
                  Position-specific weighted formula accounting for
                  offensive/defensive contributions
                </p>
              </div>
            </div>

            <div className="league-card">
              <div
                className="league-header"
                style={{ backgroundColor: "#6d1945" }}
              >
                NBA/WNBA (Basketball) - NBA: 2002-2024, WNBA: 2003-2024
              </div>
              <div className="league-content">
                <p>
                  <span className="metric-label">Primary Metric:</span> Player
                  Impact Estimate per game (pie.game)
                </p>
                <p>
                  <span className="metric-label">Calculation:</span> Formula
                  considering points, rebounds, assists, steals, blocks,
                  turnovers, field goal percentage, etc.
                </p>
                <p>
                  <span className="metric-label">Normalization:</span> PIE per
                  game, scaled by position
                </p>
              </div>
            </div>

            <div className="league-card">
              <div
                className="league-header"
                style={{ backgroundColor: "#e48a5f" }}
              >
                MLB (Baseball) - 1994-2024
              </div>
              <div className="league-content">
                <p>
                  <span className="metric-label">Primary Metric:</span> Total
                  Wins Above Replacement (total_war)
                </p>
                <p>
                  <span className="metric-label">Position Players:</span> WAR,
                  on-base plus slugging, weighted on-base average, weighted runs
                  created
                </p>
                <p>
                  <span className="metric-label">Pitchers:</span> Earned run
                  average, strikeouts, walks, home runs allowed, WHIP
                </p>
                <p>
                  <span className="metric-label">Value Calculation:</span>{" "}
                  Combines offensive, defensive, and pitching contributions
                  relative to replacement-level player
                </p>
              </div>
            </div>

            <div className="league-card">
              <div
                className="league-header"
                style={{ backgroundColor: "#8a8c4c" }}
              >
                NFL (Football) - 1999-2024
              </div>
              <div className="league-content">
                <p>
                  <span className="metric-label">Primary Metric:</span> Fantasy
                  points per game (fpts.game)
                </p>
                <p>
                  <span className="metric-label">Offensive Players:</span>{" "}
                  Yards, touchdowns, completions, receptions, rushing attempts
                </p>
                <p>
                  <span className="metric-label">Defensive Players:</span>{" "}
                  Tackles, sacks, interceptions, fumble recoveries, defensive
                  touchdowns
                </p>
              </div>
            </div>

            <div className="league-card">
              <div
                className="league-header"
                style={{ backgroundColor: "#bf98c5" }}
              >
                MLS/NWSL (Soccer) - MLS: 2013-2024, NWSL: 2016-2024
              </div>
              <div className="league-content">
                <p>
                  <span className="metric-label">Primary Metric:</span> Player
                  quality score (player_quality_score)
                </p>
                <p>
                  <span className="metric-label">Attackers:</span> Goals,
                  assists, expected goals, shots, key passes
                </p>
                <p>
                  <span className="metric-label">Midfielders/Defenders:</span>{" "}
                  Pass completion, tackles, interceptions, aerial duels, goals
                  added
                </p>
                <p>
                  <span className="metric-label">Goalkeepers:</span> Save
                  percentage, goals against average, clean sheets
                </p>
              </div>
            </div>

            <div className="league-card">
              <div
                className="league-header"
                style={{ backgroundColor: "#3b243e" }}
              >
                CHESS (Chess) - 2009-2025 (Men's and Women's)
              </div>
              <div className="league-content">
                <p>
                  <span className="metric-label">Primary Metric:</span> Maximum
                  rating (max_rating)
                </p>
                <p>
                  <span className="metric-label">Calculation:</span> Peak
                  Elo-based rating achieved during the player's career
                </p>
                <p>
                  <span className="metric-label">Position:</span> Maximum title
                  achieved (GM, IM, FM, etc.)
                </p>
                <p>
                  <span className="metric-label">Additional Metrics:</span>{" "}
                  Games played, tournament wins, average rating
                </p>
              </div>
            </div>
          </div>

          <p className="methodology-note">
            Each sport's metrics are normalized to create a standardized measure
            of player performance. For all sports, the raw performance values
            are multiplied by the player's availability percentile to ensure
            that both quality and playing time are factored into the final
            metrics. All data is standardized by league and position.
          </p>
        </div>
      </div>

      {/* Indexes Tab */}
      <div className={`tab-content ${activeTab === "indexes" ? "active" : ""}`}>
        <div className="context-content">
          <h3>Performance Indices: PQI and CQI</h3>
          <p>
            Our dashboard uses two complementary indices to provide a
            comprehensive view of athlete careers: Prime Quality Index (PQI) and
            Career Quality Index (CQI). Each measures different aspects of an
            athlete's career.
          </p>

          <div className="indices-comparison">
            <div className="pqi-box">
              <h4>Prime Quality Index (PQI)</h4>
              <p>
                PQI focuses on an athlete's peak performance and prime years,
                emphasizing quality over quantity. It evaluates the intensity
                and impact of their best seasons.
              </p>
              <div className="formula-components">
                <h5>PQI Components:</h5>
                <ul>
                  <li>
                    <strong>Prime seasons duration</strong> (weighted by
                    logarithmic scaling)
                  </li>
                  <li>
                    <strong>Average tier score</strong> during prime years
                  </li>
                  <li>
                    <strong>Peak performance value</strong> (with 30% bonus
                    weight)
                  </li>
                  <li>
                    <strong>Average performance value</strong> in prime seasons
                  </li>
                </ul>
              </div>
              <div className="archetype">
                <h5>Favors:</h5>
                <p>
                  Athletes with exceptional peak performance, even if their
                  careers were shorter. Players who had an extraordinary impact
                  during their prime years.
                </p>
              </div>
            </div>

            <div className="cqi-box">
              <h4>Career Quality Index (CQI)</h4>
              <p>
                CQI evaluates an athlete's entire career contribution, focusing
                on longevity, and total accumulated value over time.
              </p>
              <div className="formula-components">
                <h5>CQI Components:</h5>
                <ul>
                  <li>
                    <strong>Total career seasons</strong> (weighted by
                    logarithmic scaling)
                  </li>
                  <li>
                    <strong>Average tier score</strong> across entire career
                  </li>
                  <li>
                    <strong>Career average value</strong> across all seasons
                  </li>
                  <li>
                    <strong>Career peak value</strong> (with only 10% bonus
                    weight)
                  </li>
                </ul>
              </div>
              <div className="archetype">
                <h5>Favors:</h5>
                <p>
                  Athletes with extended careers who maintained high performance
                  over many seasons. Players who accumulated significant
                  statistical value throughout their career.
                </p>
              </div>
            </div>
          </div>

          <div className="tier-explanation">
            <h4>Understanding Average Tier Score</h4>
            <p>
              The "average tier score" used in both PQI and CQI is based on a
              clustering of all player seasons across all sports into five
              tiers:
            </p>
            <ul>
              <li>
                <strong>Elite</strong>
              </li>
              <li>
                <strong>Above Average</strong>
              </li>
              <li>
                <strong>Average</strong>
              </li>
              <li>
                <strong>Below Average</strong>
              </li>
              <li>
                <strong>Replacement Level</strong>
              </li>
            </ul>
            <p>
              These tiers provide a standardized way to classify performance
              levels across different sports and positions, allowing for
              meaningful cross-sport comparisons.
            </p>
          </div>

          <div className="index-insights">
            <h4>Insights from Comparing PQI and CQI</h4>
            <p>
              The relationship between an athlete's PQI and CQI reveals
              important insights about their career arc:
            </p>
            <ul>
              <li>
                <strong>PQI > CQI (Peak Performers):</strong> Athletes with
                significantly higher PQI than CQI had exceptional peak seasons
                but shorter careers or less consistency outside their prime.
                They are characterized by brilliant but potentially abbreviated
                careers.
              </li>
              <li>
                <strong>CQI > PQI (Career Accumulators):</strong> Athletes with
                higher CQI than PQI maintained solid performance over many
                seasons, showing remarkable longevity and consistency. While
                they may not have reached the same heights as peak performers,
                they delivered sustained value over time.
              </li>
              <li>
                <strong>PQI ≈ CQI (Balanced Careers):</strong> Athletes with
                similar PQI and CQI scores maintained their prime level of
                performance for a significant portion of their career, showing
                both excellence and longevity.
              </li>
            </ul>
          </div>

          <div className="availability-impact">
            <h4>Impact of Availability on Indices</h4>
            <p>
              Both PQI and CQI incorporate the availability adjustment in their
              foundation. Since each season's performance value is already
              weighted by the player's availability percentile, this factor
              influences both indices in the following ways:
            </p>
            <ul>
              <li>
                Players who miss significant time during their prime years will
                see a greater negative impact on PQI
              </li>
              <li>
                Players with chronic availability issues throughout their career
                will see a greater negative impact on CQI
              </li>
              <li>
                Players who maintain high availability during peak seasons but
                decline in later years may have PQI > CQI
              </li>
              <li>
                Players who improve their availability as their career
                progresses may have CQI > PQI
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Prime Years Tab */}
      <div className={`tab-content ${activeTab === "prime" ? "active" : ""}`}>
        <div className="context-content">
          <h3>Prime Years Analysis</h3>
          <p>
            The identification and analysis of an athlete's "prime" years is a
            central feature of the peakPerformR dashboard. We define each
            athlete's prime period using objective criteria based on their
            performance over time.
          </p>

          <div className="prime-definition-box">
            <h4>Defining a Player's Prime</h4>
            <p>
              A player's prime is defined as the continuous period where
              performance remains above 70% of their peak value, with
              adjustments for seasons with low games played.
            </p>
            <p>This approach allows us to:</p>
            <ul>
              <li>
                Identify the age range when athletes perform at or near their
                best
              </li>
              <li>Compare prime durations across different sports</li>
              <li>Determine peak age by sport and position</li>
              <li>Measure how quickly performance rises and declines</li>
            </ul>
          </div>

          <div className="methodology-steps">
            <h4>Prime Detection Methodology</h4>
            <ol>
              <li>
                <strong>Raw Performance Collection:</strong> Gather
                season-by-season performance data, already adjusted by
                availability percentile
              </li>
              <li>
                <strong>Smoothing Spline Fitting:</strong> Apply statistical
                smoothing to filter out random variations and identify
                underlying performance trend
              </li>
              <li>
                <strong>Peak Identification:</strong> Locate the maximum
                performance value point on the smoothed curve (peak age)
              </li>
              <li>
                <strong>Threshold Application:</strong> Find all continuous
                seasons where performance exceeds 70% of the peak value
              </li>
              <li>
                <strong>Skip Allowance:</strong> We allow one skip year, where a
                player can dip below the 70% threshold once on either side of
                their max value, but must recover above the threshold in the
                following year
              </li>
              <li>
                <strong>Prime Period Definition:</strong> The continuous span
                from the first to the last season above the threshold defines
                the player's prime
              </li>
            </ol>
          </div>

          <div className="prime-insights">
            <h4>Prime Period Insights</h4>
            <p>
              Our analysis reveals significant patterns in how prime periods
              differ across sports:
            </p>
            <ul>
              <li>
                <strong>Prime Start Age:</strong> The age at which athletes
                typically begin their prime period varies by sport, with some
                sports seeing earlier primes than others
              </li>
              <li>
                <strong>Prime Duration:</strong> How long athletes maintain
                their prime performance differs by sport, position, and
                individual factors
              </li>
              <li>
                <strong>Peak Age:</strong> The specific age at which athletes
                reach their absolute maximum performance level
              </li>
              <li>
                <strong>Prime Density:</strong> The ratio of prime seasons to
                total career seasons, indicating how concentrated a player's
                value was in their prime years
              </li>
            </ul>
          </div>

          <div className="availability-impact">
            <h4>Impact of Availability on Prime Detection</h4>
            <p>
              Since the prime analysis uses performance values that have already
              been adjusted by availability percentile, players with significant
              missed time during potential prime years may show different prime
              patterns:
            </p>
            <ul>
              <li>
                Seasons with low games played will show reduced performance
                values
              </li>
              <li>
                This may cause some seasons to fall below the prime threshold
              </li>
              <li>
                Players with injury-interrupted careers may show multiple
                separate prime periods
              </li>
              <li>
                The model accounts for this by focusing on the longest
                continuous prime period
              </li>
            </ul>
            <p>
              This ensures that prime period identification reflects not just
              peak ability, but also the player's ability to maintain that
              performance consistently over time.
            </p>
          </div>
        </div>
      </div>

      {/* Methodology Tab */}
      <div
        className={`tab-content ${activeTab === "methodology" ? "active" : ""}`}
      >
        <div className="context-content">
          <h3>Data Processing Methodology</h3>
          <p>
            The peakPerformR analysis pipeline involves several stages of data
            processing to enable meaningful comparison across different sports.
          </p>

          <div className="pipeline-steps">
            <h4>End-to-End Data Processing Pipeline</h4>
            <ol>
              <li>
                <strong>Data Collection:</strong>
                <ul>
                  <li>
                    Sport-specific data is collected from official league
                    sources
                  </li>
                  <li>
                    Player demographic information including birth dates is
                    gathered
                  </li>
                  <li>Raw performance statistics are compiled by season</li>
                </ul>
              </li>
              <li>
                <strong>Sport-Specific Value Calculation:</strong>
                <ul>
                  <li>NBA/WNBA: Player Impact Estimate per game (pie.game)</li>
                  <li>NFL: Fantasy Points per game (fpts.game)</li>
                  <li>MLB: Total Wins Above Replacement (total_war)</li>
                  <li>NHL: Position-specific value metrics (position_value)</li>
                  <li>MLS/NWSL: Player quality score (player_quality_score)</li>
                  <li>Chess: Maximum rating achieved (max_rating)</li>
                </ul>
              </li>
              <li>
                <strong>Availability Adjustment:</strong>
                <ul>
                  <li>
                    Calculate games played percentile by position and league
                  </li>
                  <li>
                    Multiply raw performance value by availability
                    percentile/100
                  </li>
                  <li>
                    This step ensures that availability/durability is factored
                    into all analyses
                  </li>
                </ul>
              </li>
              <li>
                <strong>Performance Standardization:</strong>
                <ul>
                  <li>Values are standardized by league and position</li>
                  <li>This allows for comparison across different sports</li>
                </ul>
              </li>
              <li>
                <strong>Career Metrics Aggregation:</strong>
                <ul>
                  <li>Cumulative statistics (total games, seasons)</li>
                  <li>Career trajectory modeling using smoothing techniques</li>
                  <li>Prime period identification with threshold analysis</li>
                </ul>
              </li>
              <li>
                <strong>Index Calculation:</strong>
                <ul>
                  <li>Prime Quality Index (PQI) - focused on prime years</li>
                  <li>
                    Career Quality Index (CQI) - focused on career-wide
                    contribution
                  </li>
                  <li>Tier assignment based on index values</li>
                </ul>
              </li>
            </ol>
          </div>

          <div className="availability-formula-box">
            <h4>Core Formula: Player Value with Availability Adjustment</h4>
            <div className="formula">
              player_value = raw_metric × (availability_percentile ÷ 100)
            </div>
            <p>Where:</p>
            <ul>
              <li>
                <strong>raw_metric</strong> = Sport-specific value metric (e.g.,
                pie.game, position_value, total_war)
              </li>
              <li>
                <strong>availability_percentile</strong> = Percentile rank
                (0-100) of games played within position group
              </li>
            </ul>
            <p>
              This formula is the foundation of our approach, ensuring that all
              performance metrics properly account for both quality of play and
              quantity of contribution. Athletes who perform well but miss
              significant time are valued appropriately, as are those who
              maintain consistency and availability throughout their careers.
            </p>
          </div>

          <div className="methodological-notes">
            <h4>Methodological Notes and Limitations</h4>
            <ul>
              <li>
                <strong>Historical Data Limitations:</strong> Data availability
                varies by sport and era, with more complete data in recent
                seasons
              </li>
              <li>
                <strong>Position Classification:</strong> Some players change
                positions during their career; we use their primary position or
                create position groups
              </li>
              <li>
                <strong>Sport-Specific Nuances:</strong> Each sport has unique
                characteristics that may affect cross-sport comparability
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsContextInfo;
