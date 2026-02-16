import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'patient' | 'doctor';
    language: 'EN' | 'KO' | 'JP' | 'CN';
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check for saved session on mount
        const savedUser = localStorage.getItem('user_session');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                console.error("Failed to parse user session", e);
                localStorage.removeItem('user_session');
            }
        }
        setLoading(false);
    }, []);

    const login = (token: string, userData: User) => {
        // In a real app, verify token with backend. Here we trust the response.
        setUser(userData);
        localStorage.setItem('user_session', JSON.stringify(userData));
        localStorage.setItem('auth_token', token);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user_session');
        localStorage.removeItem('auth_token');
        router.push('/');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
