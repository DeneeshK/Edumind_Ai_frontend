import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] Caught render error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "2rem", fontFamily: "monospace", color: "#ef4444", background: "#0f172a", minHeight: "100vh" }}>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>⚠ Page crashed — check the browser console for details</h2>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem", color: "#fca5a5" }}>
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ marginTop: "1rem", padding: "0.5rem 1rem", background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: "0.5rem", cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
