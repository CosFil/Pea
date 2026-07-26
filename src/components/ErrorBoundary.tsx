import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught Error in Component Tree:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold text-white">Παρουσιάστηκε μη αναμενόμενο σφάλμα</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Προέκυψε σφάλμα κατά την εκτέλεση της εφαρμογής. Τα δεδομένα σας στο localStorage παραμένουν ασφαλή.
            </p>

            {this.state.error && (
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-left text-[11px] font-mono text-red-400 overflow-x-auto max-h-32 scrollbar-thin">
                {this.state.error.toString()}
              </div>
            )}

            <button
              onClick={this.handleReset}
              type="button"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Ανανέωση Εφαρμογής
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
