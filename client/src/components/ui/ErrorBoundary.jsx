import React from 'react';

// =============================================================================
// ErrorBoundary.jsx
// =============================================================================
// Purpose:
//   Catches JavaScript errors anywhere in its child component tree, logs those
//   errors, and displays a fallback UI instead of a blank white screen.
// =============================================================================

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  // Update state so the next render will show the fallback UI
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  // Log the error to an error reporting service or console
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <h1 style={styles.title}>Oops! Something went wrong.</h1>
            <p style={styles.message}>
              We're sorry, but the application encountered an unexpected error.
            </p>
            <button
              style={styles.button}
              onClick={() => window.location.assign('/')}
            >
              Refresh Page
            </button>
            
            {/* Show error details only in development mode */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={styles.details}>
                <summary style={styles.summary}>View Error Details</summary>
                <pre style={styles.pre}>
                  {this.state.error.toString()}
                  <br />
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    // Normally, just render children
    return this.props.children;
  }
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f1f5f9',
    padding: '20px'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    padding: '40px',
    maxWidth: '600px',
    width: '100%',
    textAlign: 'center'
  },
  title: {
    color: '#dc2626',
    marginBottom: '16px',
    fontSize: '24px'
  },
  message: {
    color: '#475569',
    marginBottom: '24px',
    fontSize: '16px'
  },
  button: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '6px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: '600'
  },
  details: {
    marginTop: '32px',
    textAlign: 'left',
    backgroundColor: '#f8fafc',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },
  summary: {
    cursor: 'pointer',
    fontWeight: 'bold',
    color: '#334155'
  },
  pre: {
    marginTop: '12px',
    whiteSpace: 'pre-wrap',
    fontSize: '12px',
    color: '#ef4444',
    overflowX: 'auto'
  }
};

export default ErrorBoundary;
