import { Component, type ReactNode } from "react";

type Props = { children: ReactNode; label?: string };
type State = { hasError: boolean; error: Error | null };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.label ? `: ${this.props.label}` : ""}] CRASH:`, error.message, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-red-950/90 text-white p-8">
          <div className="text-4xl mb-4">💥</div>
          <h2 className="text-lg font-bold text-red-300 mb-2">Scene crashed</h2>
          <p className="text-sm text-red-200/70 mb-1">{this.state.error?.message}</p>
          <pre className="text-[10px] text-red-400/50 max-w-lg overflow-auto max-h-40 whitespace-pre-wrap">
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
