import React, { Component } from 'react';
import { FiRefreshCw, FiAlertTriangle, FiHome, FiSettings, FiMail } from 'react-icons/fi';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    this.setState({
      error,
      errorInfo
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught An Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.groupEnd();
    }

    // In production, you might want to log to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  logErrorToService = (error, errorInfo) => {
    // This would integrate with services like Sentry, LogRocket, etc.
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.props.userId || 'anonymous'
    };

    // Example: Send to error reporting service
    if (window.errorReporting) {
      window.errorReporting.log(errorData);
    }
  };

  handleRetry = async () => {
    this.setState({ isRetrying: true });
    
    // Add a small delay to prevent rapid retries
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
      isRetrying: false
    }));
  };

  handleGoHome = () => {
    window.location.href = '/app';
  };

  handleReportError = () => {
    const { error, errorInfo } = this.state;
    const errorReport = `
Error Report:
=============
Message: ${error?.message || 'Unknown error'}
Stack: ${error?.stack || 'No stack trace'}
Component Stack: ${errorInfo?.componentStack || 'No component stack'}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
Timestamp: ${new Date().toISOString()}
    `.trim();

    const mailto = `mailto:support@lymbus.com?subject=Error Report&body=${encodeURIComponent(errorReport)}`;
    window.open(mailto);
  };

  render() {
    const { hasError, error, isRetrying, retryCount } = this.state;
    const { children, fallback, showDetails = false } = this.props;

    if (hasError) {
      // Custom fallback UI
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="glass-card p-8 text-center">
              {/* Error Icon */}
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
                <FiAlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>

              {/* Error Message */}
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                ¡Ups! Algo salió mal
              </h1>
              
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado y está trabajando en una solución.
              </p>

              {/* Error Details (Development Only) */}
              {showDetails && process.env.NODE_ENV === 'development' && error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-left">
                  <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">
                    Detalles del Error (Solo Desarrollo):
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-400 font-mono break-all">
                    {error.message}
                  </p>
                </div>
              )}

              {/* Retry Info */}
              {retryCount > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Intentos de recuperación: {retryCount}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={this.handleRetry}
                  disabled={isRetrying || retryCount >= 3}
                  className="w-full btn-primary flex items-center justify-center space-x-2"
                >
                  {isRetrying ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      <span>Reintentando...</span>
                    </>
                  ) : (
                    <>
                      <FiRefreshCw className="h-4 w-4" />
                      <span>
                        {retryCount >= 3 ? 'Máximo de reintentos alcanzado' : 'Reintentar'}
                      </span>
                    </>
                  )}
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={this.handleGoHome}
                    className="btn-secondary flex items-center justify-center space-x-2"
                  >
                    <FiHome className="h-4 w-4" />
                    <span>Ir a Inicio</span>
                  </button>

                  <button
                    onClick={this.handleReportError}
                    className="btn-secondary flex items-center justify-center space-x-2"
                  >
                    <FiSettings className="h-4 w-4" />
                    <span>Reportar</span>
                  </button>
                </div>
              </div>

              {/* Contact Support */}
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                  ¿Necesitas ayuda adicional?
                </p>
                <a
                  href="mailto:support@lymbus.com"
                  className="inline-flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:underline text-sm"
                >
                  <FiMail className="h-3 w-3" />
                  <span>Contactar Soporte</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

// Higher-order component for easier error boundary usage
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Hook for error handling in functional components
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null);

  const resetError = () => setError(null);

  const captureError = React.useCallback((error, errorInfo = {}) => {
    console.error('Captured error:', error);
    setError({ error, errorInfo });
    
    // You could also report to an error service here
    if (process.env.NODE_ENV === 'production' && window.errorReporting) {
      window.errorReporting.log({
        message: error.message,
        stack: error.stack,
        ...errorInfo
      });
    }
  }, []);

  // Throw error to be caught by error boundary
  if (error) {
    throw error.error;
  }

  return { captureError, resetError };
};

export default ErrorBoundary; 