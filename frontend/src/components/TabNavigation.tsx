import { cn } from "@/lib/utils";
import { CheckCircle, Circle, Clock, Upload, Play, BarChart3, BookOpen, Target, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const steps = [
  { 
    id: "setup", 
    label: "Setup & Upload", 
    shortLabel: "Setup",
    description: "Upload CV and Job Specification",
    icon: Upload
  },
  { 
    id: "practice", 
    label: "Interview Questions", 
    shortLabel: "Interview",
    description: "AI-Generated Interview Questions",
    icon: Play
  },
  { 
    id: "analytics", 
    label: "Performance Analytics", 
    shortLabel: "Analytics",
    description: "Review Your Progress",
    icon: BarChart3
  },
  { 
    id: "competencies", 
    label: "HEO Competencies", 
    shortLabel: "Competencies",
    description: "Learn the Framework",
    icon: BookOpen
  },
];

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  // Check if documents are uploaded to determine step completion
  const { data: documents } = useQuery<{ id: number; type: string; filename: string; size: number; uploadedAt: string }[]>({
    queryKey: ["/api/documents"],
  });

  const hasCv = documents?.some((doc: { type: string }) => doc.type === 'cv');
  const hasJobSpec = documents?.some((doc: { type: string }) => doc.type === 'job_spec');
  const setupCompleted = hasCv && hasJobSpec;

  const getStepStatus = (stepId: string, index: number) => {
    const currentIndex = steps.findIndex(step => step.id === activeTab);
    
    // If this is the active tab, always show as active (not completed)
    if (stepId === activeTab) {
      return "active";
    }
    
    if (stepId === "setup") {
      return setupCompleted ? "completed" : "pending";
    }
    
    if (index < currentIndex) {
      return "completed";
    } else {
      return "pending";
    }
  };

  const isStepAccessible = (stepId: string, index: number) => {
    if (stepId === "setup") return true;
    if (stepId === "practice") return setupCompleted;
    if (stepId === "analytics") return setupCompleted;
    if (stepId === "competencies") return true; // Always accessible
    return false;
  };



  return (
    <div className="mb-8">
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-6 left-6 right-6 h-0.5 bg-neutral-200">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ 
                width: `${((steps.findIndex(step => step.id === activeTab) + (setupCompleted && activeTab === "setup" ? 1 : 0)) / steps.length) * 100}%` 
              }}
            />
          </div>
          
          {/* Steps */}
          <div className="relative flex justify-between">
            {steps.map((step, index) => {
              const status = getStepStatus(step.id, index);
              const isAccessible = isStepAccessible(step.id, index);
              const IconComponent = step.icon;
              
              return (
                <div key={step.id} className={cn(
                  "flex flex-col items-center space-y-3 p-3 rounded-xl transition-all duration-300",
                  // Active step backgrounds matching button colors - includes icon and content
                  status === "active" && step.id === "setup" && "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg",
                  status === "active" && step.id === "practice" && "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg", 
                  status === "active" && step.id === "competencies" && "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg",
                  status === "active" && step.id === "analytics" && "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg",
                  // Completed and pending states  
                  status === "completed" && "bg-green-50 border border-green-200",
                  status === "pending" && "bg-transparent"
                )}>
                  {/* Step Circle */}
                  <button
                    onClick={() => isAccessible && onTabChange(step.id)}
                    disabled={!isAccessible}
                    className={cn(
                      "relative w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 group hover-lift",
                      "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                      status === "completed" && "bg-green-500 border-green-500 text-white shadow-md hover:shadow-lg",
                      status === "active" && "bg-white/20 border-white/40 text-white shadow-lg backdrop-blur-sm",
                      status === "pending" && isAccessible && "bg-white border-neutral-300 text-neutral-400 hover:border-primary/50 hover:text-primary/70 hover:scale-110",
                      status === "pending" && !isAccessible && "bg-neutral-100 border-neutral-200 text-neutral-300 cursor-not-allowed opacity-50"
                    )}
                  >
                    {status === "completed" ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <IconComponent className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                    )}
                    
                    {/* Success checkmark for completed steps */}
                    {status === "completed" && (
                      <div className="absolute -top-1 -right-1 bg-white rounded-full w-4 h-4 flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      </div>
                    )}
                    
                    {/* Encouraging tooltip on hover for accessible pending steps */}
                    {status === "pending" && isAccessible && (
                      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-primary text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        Ready to unlock!
                      </div>
                    )}
                  </button>
                  
                  {/* Step Content */}
                  <div className="text-center max-w-[120px]">
                    <div className={cn(
                      "text-sm font-medium transition-colors",
                      status === "active" && "text-white font-semibold",
                      status === "completed" && "text-neutral-700",
                      status === "pending" && isAccessible && "text-neutral-500",
                      status === "pending" && !isAccessible && "text-neutral-400"
                    )}>
                      {step.shortLabel}
                    </div>
                    {status === "active" && (
                      <div className="mt-2">
                        <div className="inline-block px-2 py-1 bg-white/20 text-white text-xs rounded-full backdrop-blur-sm border border-white/30">
                          Current Step
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        

      </div>
    </div>
  );
}
