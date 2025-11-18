import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Er is een fout opgetreden</h1>
            <p className="text-gray-700 mb-4">
              Er is een fout opgetreden bij het laden van de applicatie.
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Fout: {this.state.error?.message || 'Onbekende fout'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full bg-oet-blue text-white py-2 px-4 rounded-lg font-medium hover:bg-oet-blue-dark transition-colors"
            >
              Pagina opnieuw laden
            </button>
            <p className="text-xs text-gray-500 mt-4 text-center">
              Open de browser console (F12) voor meer details
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

