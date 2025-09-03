import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MobileDebug() {
  const [debugInfo, setDebugInfo] = useState<{
    auth?: { success: boolean; data?: any; error?: string };
    cv?: { success: boolean; data?: any; error?: string };
    interview?: { success: boolean; data?: any; error?: string };
  } | null>(null);

  // Test authentication
  const testAuthMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/user', { 
        method: 'GET',
        credentials: 'include'
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setDebugInfo((prev: any) => ({ ...prev, auth: { success: true, data } }));
    },
    onError: (error: any) => {
      setDebugInfo((prev: any) => ({ ...prev, auth: { success: false, error: error.message } }));
    }
  });

  // Test CV check
  const testCvMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', '/api/documents');
      return await response.json();
    },
    onSuccess: (data) => {
      setDebugInfo((prev: any) => ({ ...prev, cv: { success: true, data } }));
    },
    onError: (error: any) => {
      setDebugInfo((prev: any) => ({ ...prev, cv: { success: false, error: error.message } }));
    }
  });

  // Test interview start
  const testInterviewMutation = useMutation({
    mutationFn: async () => {
      // First check CV analysis
      const analysisRes = await apiRequest('GET', '/api/documents/analysis');
      const analysisData = await analysisRes.json();
      
      if (!analysisData) {
        throw new Error('No CV analysis found');
      }
      
      // Try to start interview
      const response = await apiRequest('POST', '/api/practice/start', {
        sessionType: 'full',
        questionCount: 12,
        framework: 'old',
        grade: 'heo'
      });
      
      return await response.json();
    },
    onSuccess: (data) => {
      setDebugInfo((prev: any) => ({ ...prev, interview: { success: true, data } }));
    },
    onError: (error: any) => {
      setDebugInfo((prev: any) => ({ ...prev, interview: { success: false, error: error.message } }));
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Mobile Debug Panel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => testAuthMutation.mutate()}
              disabled={testAuthMutation.isPending}
              className="w-full"
            >
              Test Authentication
            </Button>
            
            <Button 
              onClick={() => testCvMutation.mutate()}
              disabled={testCvMutation.isPending}
              className="w-full"
            >
              Test CV Documents
            </Button>
            
            <Button 
              onClick={() => testInterviewMutation.mutate()}
              disabled={testInterviewMutation.isPending}
              className="w-full"
            >
              Test Interview Start
            </Button>
            
            <Button 
              onClick={() => setDebugInfo(null)}
              variant="outline"
              className="w-full"
            >
              Clear Results
            </Button>
          </CardContent>
        </Card>

        {debugInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Debug Results</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}