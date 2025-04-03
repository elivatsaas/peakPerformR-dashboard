import React from "react";
import "../styles/LandingPage.css";

const LandingPage = ({ onEnterDashboard }) => {
  return (
    <div className="landing-page">
      <div className="landing-content">
        <h1 className="landing-title">peakPerformR</h1>
        <h2 className="landing-subtitle">
          Sports Performance Analysis Dashboard
        </h2>

        <div className="landing-description">
          <p>
            Welcome to the peakPerformR Dashboard - a comprehensive tool for
            analyzing how athlete performance varies across different sports
            throughout their careers. We focus on two complementary metrics to
            evaluate athlete careers: PQI and CQI.
          </p>

          <div className="feature-section">
            <h3>Key Metrics</h3>
            <div className="features">
              <div className="feature">
                <h4>Performance Quotient Index (PQI)</h4>
                <p>
                  Measures an athlete's career achievement by evaluating peak
                  performance, prime years, and performance consistency
                </p>
              </div>

              <div className="feature">
                <h4>Career Quality Index (CQI)</h4>
                <p>
                  Evaluates an athlete's overall career quality by analyzing
                  career length, average performance, and statistical
                  accumulation
                </p>
              </div>

              <div className="feature">
                <h4>Comparative Analysis</h4>
                <p>
                  Compare how athletes rank differently based on peak
                  performance (PQI) versus career-wide contributions (CQI)
                </p>
              </div>

              <div className="feature">
                <h4>Career Trajectory</h4>
                <p>
                  Visualize the ages at which different players performed their
                  best
                </p>
              </div>
            </div>
          </div>

          <div className="feature-section">
            <h3>Key Questions We Answer</h3>
            <div className="features">
              <div className="feature">
                <h4>When Do Primes Occur?</h4>
                <p>
                  Discover the average age at which athletes reach their prime
                  performance in different sports
                </p>
              </div>

              <div className="feature">
                <h4>Prime vs Career Quality</h4>
                <p>
                  Identify which athletes delivered more value in their prime
                  years versus their entire career
                </p>
              </div>

              <div className="feature">
                <h4>Sport Comparisons</h4>
                <p>
                  Compare career trajectories and prime periods between
                  different sports and leagues
                </p>
              </div>

              <div className="feature">
                <h4>Individual Analysis</h4>
                <p>
                  Examine detailed performance metrics for specific athletes
                </p>
              </div>
            </div>
          </div>

          <div className="methodology-section">
            <h3>About Our Research</h3>
            <p>
              Our analysis examines data from multiple sports including the NBA,
              WNBA, NFL, MLB, NHL, PWHL, MLS, NWSL, and chess. We've collected
              and normalized performance metrics to allow meaningful cross-sport
              comparisons.
            </p>
            <p>
              Each sport shows distinct patterns in when athletes reach their
              peak and how long they maintain it. These differences may be
              influenced by physical demands, skill development, strategic
              knowledge, and other sport-specific factors.
            </p>
            <p>
              The Performance Quotient Index (PQI) provides a standardized
              measure that allows for meaningful comparisons between athlete
              primes, taking into account career longevity, peak performance,
              and prime duration. The Career Quality Index (CQI) complements
              this by focusing on an athlete's overall career contribution and
              statistical accumulation.
            </p>
          </div>
        </div>

        <button className="enter-button" onClick={onEnterDashboard}>
          Explore the Dashboard
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
