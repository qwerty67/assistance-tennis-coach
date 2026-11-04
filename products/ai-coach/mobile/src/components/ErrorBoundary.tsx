import React, { Component, ErrorInfo } from 'react';

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
    errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({
            error,
            errorInfo,
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <Text style={{ fontSize: 20, color: 'red' }}>خطا در اجرای اپلیکیشن</Text>
                    <Text style={{ marginTop: 10 }}>{this.state.error?.toString()}</Text>
                    <Text style={{ marginTop: 10, color: 'gray' }}>{this.state.errorInfo?.componentStack}</Text>
                </View>
            );
        }

        return this.props.children;
    }
}