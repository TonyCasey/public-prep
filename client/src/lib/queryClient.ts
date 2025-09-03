import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Global logout function - will be set by AuthProvider
let globalLogout: (() => void) | null = null;

export function setGlobalLogout(logoutFn: () => void) {
  globalLogout = logoutFn;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Handle 401 Unauthorized - trigger logout and clear session
    if (res.status === 401) {
      const currentPath = window.location.pathname;
      const isOnAuthPage = currentPath === '/auth' || currentPath === '/' || currentPath.startsWith('/auth');
      
      if (!isOnAuthPage) {
        console.log('401 Unauthorized - clearing session and redirecting to auth');
        
        // Trigger global logout to clear all data
        if (globalLogout) {
          globalLogout();
        } else {
          // Fallback: clear manually and redirect
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = '/auth';
        }
        
        throw new Error('Unauthorized - logged out and redirecting');
      }
    }
    
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const isFormData = data instanceof FormData;
  
  console.log("apiRequest:", { method, url, isFormData, hasData: !!data });
  
  try {
    const res = await fetch(url, {
      method,
      headers: (data && !isFormData) ? { "Content-Type": "application/json" } : {},
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
      credentials: "include",
    });

    console.log("Fetch response:", { status: res.status, statusText: res.statusText, ok: res.ok });
    
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error("apiRequest error:", error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    // Handle 401 Unauthorized - trigger logout and clear session
    if (res.status === 401) {
      const currentPath = window.location.pathname;
      const isOnAuthPage = currentPath === '/auth' || currentPath === '/' || currentPath.startsWith('/auth');
      
      if (!isOnAuthPage) {
        console.log('401 Unauthorized in query - clearing session and redirecting to auth');
        
        // Trigger global logout to clear all data
        if (globalLogout) {
          globalLogout();
        } else {
          // Fallback: clear manually and redirect
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = '/auth';
        }
        
        throw new Error('Unauthorized - logged out and redirecting');
      }
    }

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes cache by default
      gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
