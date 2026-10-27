import { translateUi, useSiteLanguage } from '../../i18n/language';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, } from "react";
import { authApi } from "@/api/services";
import { getToken, setToken, USE_MOCK } from "@/api/client";
import { prefetchDashboardOverview } from "@/hooks/use-queries";
import type { User } from "@/types";
interface RegisterInput {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    schoolName?: string;
    district?: string;
    coordinatorPhone?: string;
}
interface AuthContextValue {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<User>;
    register: (input: RegisterInput) => Promise<User>;
    logout: () => void;
    isNational: boolean;
    isCoordinator: boolean;
}
const STORAGE_KEY = "plp-mis-user";
const AuthContext = createContext<AuthContextValue | undefined>(undefined);
function readStoredUser(): User | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as User) : null;
    }
    catch {
        return null;
    }
}
export function AuthProvider({ children }: {
    children: React.ReactNode;
}) {
    useSiteLanguage();
    const storedUser = readStoredUser();
    const [user, setUser] = useState<User | null>(storedUser);
    const [isLoading, setIsLoading] = useState(() => !!getToken() && !storedUser);
    useEffect(() => {
        if (USE_MOCK) {
            setIsLoading(false);
            return;
        }
        const token = getToken();
        if (!token) {
            setIsLoading(false);
            return;
        }
        if (storedUser) {
            setIsLoading(false);
            const scope = storedUser.roleCode === "COORDINATOR" ? "coordinator" : "national";
            void prefetchDashboardOverview(scope);
            window.setTimeout(() => {
                authApi
                    .me()
                    .then((u) => {
                    setUser(u);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
                })
                    .catch(() => {
                    setToken(null);
                    setUser(null);
                    localStorage.removeItem(STORAGE_KEY);
                });
            }, 10000);
            return;
        }
        authApi
            .me()
            .then((u) => {
            setUser(u);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
        })
            .catch(() => {
            setToken(null);
            setUser(null);
            localStorage.removeItem(STORAGE_KEY);
        })
            .finally(() => setIsLoading(false));
    }, []);
    const login = useCallback(async (email: string, password: string) => {
        const { user: nextUser, token } = await authApi.login(email, password);
        setToken(token);
        setUser(nextUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
        const scope = nextUser.roleCode === "COORDINATOR" ? "coordinator" : "national";
        void prefetchDashboardOverview(scope);
        return nextUser;
    }, []);
    const register = useCallback(async (input: RegisterInput) => {
        const { user: nextUser, token } = await authApi.register(input);
        setToken(token);
        setUser(nextUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
        return nextUser;
    }, []);
    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
    }, []);
    const value = useMemo<AuthContextValue>(() => ({
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        isNational: user?.roleCode === "NATIONAL_ADMIN",
        isCoordinator: user?.roleCode === "COORDINATOR",
    }), [user, isLoading, login, register, logout]);
    return <AuthContext.Provider value={value}>{translateUi(children)}</AuthContext.Provider>;
}
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
