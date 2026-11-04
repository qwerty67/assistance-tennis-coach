import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User, RegisterPayload } from '../services/authService';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (identifier: string, password: string) => Promise<void>;
    register: (payload: RegisterPayload | { fullName?: string; username?: string; password: string }) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const isAuth = await authService.isAuthenticated();
            if (isAuth) {
                const userData = await authService.getUser();
                setUser(userData);
                // Background refresh
                authService.getMe().then((updated) => {
                    if (updated) setUser(updated);
                }).catch(() => {});
            }
        } catch (error) {
            console.error('Auth check error:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (identifier: string, password: string) => {
        const response = await authService.login(identifier, password);
        setUser(response.user);
    };

    const register = async (payload: RegisterPayload | { fullName?: string; username?: string; password: string }) => {
        const response = await authService.register(payload);
        if (response.user) {
            setUser(response.user);
        }
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
    };

    const refreshUser = async () => {
        const updated = await authService.getMe();
        if (updated) setUser(updated);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, register, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
