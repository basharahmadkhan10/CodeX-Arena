// src/components/ErrorBoundary.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Log to analytics if you have it
    // analytics.logError(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-h-screen bg-[rgb(238,11,22)] flex items-center justify-center p-4"
        >
          <div className="bg-white border-2 border-black shadow-[8px_8px_0px_#000] rounded-2xl p-8 max-w-md w-full text-center">
            <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-black shadow-[3px_3px_0px_#000]">
              <AlertTriangle size={40} className="text-red-600" />
            </div>
            
            <h2 className="text-2xl font-black text-black mb-2">Something Went Wrong</h2>
            <p className="text-black/60 text-sm mb-6">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-[#f0fafa] border-2 border-black rounded-xl p-3 mb-6 text-left overflow-auto max-h-40">
                <code className="text-xs text-black/70">
                  {this.state.error?.stack}
                </code>
              </div>
            )}
            
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 bg-[rgb(238,11,22)] text-white font-black px-6 py-3 rounded-xl border-2 border-black shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <RefreshCw size={16} />
              Refresh Page
            </button>
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
