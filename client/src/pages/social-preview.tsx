import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function SocialPreview() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Social Media Preview
          </h1>
          <p className="text-gray-600">
            This is how your website will appear when shared on social media platforms
          </p>
        </div>

        {/* Preview Container */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">WhatsApp/Facebook/Twitter Preview:</h2>
            
            {/* Social Media Card Mockup */}
            <div className="border border-gray-200 rounded-lg overflow-hidden max-w-lg mx-auto">
              <img 
                src={`/attached_assets/social-preview.svg?v=${Date.now()}`}
                alt="Social Media Preview"
                className="w-full h-auto"
              />
              <div className="p-4 bg-gray-50">
                <h3 className="font-semibold text-gray-900 text-sm">
                  Public Prep - Irish Public Service Interview Practice
                </h3>
                <p className="text-gray-600 text-xs mt-1">
                  Practice questions for Public Sector interviews in Ireland. Get AI-powered feedback and master the STAR method with real competency-based questions.
                </p>
                <p className="text-gray-500 text-xs mt-2">publicprep.ie</p>
              </div>
            </div>

            {/* Direct Image View */}
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Full Preview Image:</h2>
              <div className="border border-gray-200 rounded-lg overflow-hidden inline-block">
                <img 
                  src={`/attached_assets/social-preview.svg?v=${Date.now()}`}
                  alt="Social Media Preview - Full Size"
                  className="max-w-full h-auto"
                  style={{ maxWidth: '600px' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}