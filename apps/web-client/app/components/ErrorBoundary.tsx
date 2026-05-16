'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * ErrorBoundary: Catches unhandled React errors in children
 * and shows a fallback UI instead of crashing the whole app.
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="w-screen h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-8">
                    <div className="text-5xl mb-4">⚠️</div>
                    <h1 className="text-2xl font-bold mb-2 text-slate-100">Terjadi Kesalahan</h1>
                    <p className="text-slate-400 text-sm mb-6 text-center max-w-md">
                        Aplikasi mengalami error yang tidak terduga. 
                        Silakan muat ulang halaman.
                    </p>
                    {this.state.error && (
                        <pre className="text-xs text-slate-500 bg-slate-800 px-4 py-3 rounded-lg mb-6 max-w-lg overflow-hidden text-ellipsis">
                            {this.state.error.message}
                        </pre>
                    )}
                    <button
                        onClick={this.handleReset}
                        className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition-colors"
                    >
                        Muat Ulang
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
