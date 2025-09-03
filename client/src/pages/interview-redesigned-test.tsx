import { useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function InterviewRedesignedTestPage() {
  console.log('InterviewRedesignedTestPage: Component mounted');
  
  const { interviewId } = useParams<{ interviewId: string }>();
  const { user } = useAuth();
  
  console.log('InterviewRedesignedTestPage: Params:', { interviewId });
  console.log('InterviewRedesignedTestPage: User:', user);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Interview Redesigned Test Page (No AppLayout)</h1>
        <p>Interview ID: {interviewId}</p>
        <p>User: {user?.email || 'No user'}</p>
        <p>If you can see this, the route is working!</p>
      </div>
    </div>
  );
}