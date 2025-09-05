// API Configuration
// In production, the client (Vercel) will connect to the server (Heroku)
// In development, both run locally

// Get API base URL from environment or default to current origin
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Helper to build full API URLs
export function getApiUrl(path: string): string {
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // If API_BASE_URL is set, use it (for production)
  if (API_BASE_URL) {
    return `${API_BASE_URL}${cleanPath}`;
  }
  
  // Otherwise use relative URL (for development)
  return cleanPath;
}