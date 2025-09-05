import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient, setGlobalLogout } from "@/lib/queryClient";
// Toast imports removed - toasts can interfere with modal behavior
import { useLocation } from "wouter";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "email" | "password"> & { rememberMe?: boolean };

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Toast functionality removed
  const [, navigate] = useLocation();
  // Check if we have cached user data or a session cookie
  const cachedUser = queryClient.getQueryData<SelectUser>(["/api/user"]);
  
  // Only make API call if we have evidence of a session
  // This prevents unnecessary 401 errors on page load
  const hasSessionCookie = document.cookie.includes('connect.sid') || document.cookie.includes('session');
  const shouldFetch = hasSessionCookie && !cachedUser;
  
  console.log('🔍 Auth hook debug:', {
    hasSessionCookie,
    hasCachedUser: !!cachedUser,
    shouldFetch,
    cachedUserSubscriptionStatus: cachedUser?.subscriptionStatus
  });
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    // Only fetch if we have a session cookie but no cached data
    enabled: shouldFetch,
    // Always return cached data if available
    initialData: cachedUser || undefined,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", {
        username: credentials.email,
        password: credentials.password,
        rememberMe: credentials.rememberMe
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Login failed' }));
        const error: any = new Error(errorData.message || 'Invalid credentials');
        error.details = errorData.details;
        throw error;
      }
      
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error: Error) => {
      // Login error feedback handled in auth page component
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Registration failed' }));
        const error: any = new Error(errorData.message || 'Registration failed');
        error.details = errorData.details;
        throw error;
      }
      
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error: Error) => {
      // Registration error feedback handled in auth page component
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      performLogout();
    },
    onError: (error: Error) => {
      // Logout error feedback removed to prevent modal interference
      // Even if API logout fails, clear local session
      performLogout();
    },
  });

  // Debug user session data in console
  useEffect(() => {
    if (user) {
      console.log('🔧 AUTH HOOK - Complete user session object:', {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        subscription: {
          status: user.subscriptionStatus,
          id: user.subscriptionId,
          freeAnswersUsed: user.freeAnswersUsed,
          starterInterviewsUsed: user.starterInterviewsUsed,
          starterExpiresAt: user.starterExpiresAt
        },
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      });
    }
  }, [user]);

  // Centralized logout function
  const performLogout = () => {
    // Clear ALL query cache data
    queryClient.clear();
    
    // Clear localStorage data
    localStorage.clear();
    
    // Clear sessionStorage data
    sessionStorage.clear();
    
    // Navigate to home page
    navigate("/");
  };

  // Set up global logout for 401 handling
  useEffect(() => {
    setGlobalLogout(performLogout);
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        isAuthenticated: !!user,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}