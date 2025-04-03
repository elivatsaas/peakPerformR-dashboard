import React from "react";

class DataErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
    console.error("Error caught by DataErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "20px",
            backgroundColor: "#ffebee",
            borderRadius: "8px",
            margin: "20px",
          }}
        >
          <h2>Something went wrong when rendering the dashboard.</h2>
          <p>
            This is likely due to issues with the data structure or missing
            required fields.
          </p>
          <details style={{ whiteSpace: "pre-wrap", marginTop: "10px" }}>
            <summary>View error details</summary>
            <p>{this.state.error && this.state.error.toString()}</p>
            <p>Component Stack:</p>
            <pre>
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </details>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              backgroundColor: "#6d1945",
              color: "white",
              border: "none",
              padding: "10px 15px",
              borderRadius: "4px",
              marginTop: "15px",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DataErrorBoundary;
