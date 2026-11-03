import React, { createContext, useContext, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    showToast: (type: ToastType, message: string, duration?: number) => void;
    hideToast: (id: string) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const hideToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback(
        (type: ToastType, message: string, duration = 3000) => {
            const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            const newToast: Toast = { id, type, message, duration };

            setToasts((prev) => [...prev, newToast]);

            if (duration > 0) {
                setTimeout(() => {
                    hideToast(id);
                }, duration);
            }
        },
        [hideToast]
    );

    const success = useCallback(
        (message: string) => showToast('success', message),
        [showToast]
    );

    const error = useCallback(
        (message: string) => showToast('error', message, 4000),
        [showToast]
    );

    const warning = useCallback(
        (message: string) => showToast('warning', message),
        [showToast]
    );

    const info = useCallback(
        (message: string) => showToast('info', message),
        [showToast]
    );

    return (
        <ToastContext.Provider
            value={{ toasts, showToast, hideToast, success, error, warning, info }}
        >
            {children}
        </ToastContext.Provider>
    );
};