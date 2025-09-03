import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyDashboardProps {
  onStartInterview: () => void;
}

export default function EmptyDashboard({ onStartInterview }: EmptyDashboardProps) {
  return (
    <div className="text-center py-12">
      <div className="mb-6">
        <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto flex items-center justify-center shadow-lg">
          <FileText className="w-12 h-12 text-white" />
        </div>
      </div>
      <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
        Welcome to Your Interview Dashboard
      </h2>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Start practicing for your Public Service interview with AI-powered coaching and real-time feedback.
      </p>
      <Button 
        onClick={onStartInterview}
        size="lg"
        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
      >
        <Plus className="w-5 h-5 mr-2" />
        Start Your First Interview
      </Button>
    </div>
  );
}