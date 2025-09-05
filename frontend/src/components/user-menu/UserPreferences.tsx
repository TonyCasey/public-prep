import { Badge } from "@/components/ui/badge";
import { Settings, Clock, Target, Bell, Shield, X, Sparkles, Zap } from "lucide-react";

interface UserPreferencesProps {
  showPreferences: boolean;
  onClose: () => void;
}

export default function UserPreferences({ showPreferences, onClose }: UserPreferencesProps) {
  if (!showPreferences) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/50 backdrop-blur-sm p-2 pt-4 sm:pt-2">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-lg md:max-w-2xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-4 sm:p-6 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="relative flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Preferences</h2>
                <p className="text-indigo-100 text-sm">Customize your experience</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 flex-1 overflow-y-auto">
          {/* Interview Settings */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-blue-900">Interview Settings</h3>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-white/70 rounded-lg border border-blue-200 gap-2 sm:gap-3">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">Default Session Duration</p>
                    <p className="text-xs sm:text-sm text-gray-600">Preferred length for practice sessions</p>
                  </div>
                </div>
                <Badge className="bg-blue-500 text-white text-xs sm:text-sm self-start sm:self-center">30 minutes</Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/70 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Difficulty Level</p>
                    <p className="text-sm text-gray-600">Question complexity preference</p>
                  </div>
                </div>
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">Intermediate</Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/70 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Focus Competencies</p>
                    <p className="text-sm text-gray-600">Primary areas for improvement</p>
                  </div>
                </div>
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">All Areas</Badge>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-500 rounded-lg">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-green-900">Notifications</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/70 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Practice Reminders</p>
                    <p className="text-sm text-gray-600">Get notified about regular practice</p>
                  </div>
                </div>
                <Badge className="bg-gray-400 text-white flex items-center gap-1">
                  <X className="w-3 h-3" />
                  Disabled
                </Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/70 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Progress Updates</p>
                    <p className="text-sm text-gray-600">Weekly progress summaries</p>
                  </div>
                </div>
                <Badge className="bg-gray-400 text-white flex items-center gap-1">
                  <X className="w-3 h-3" />
                  Disabled
                </Badge>
              </div>
            </div>
          </div>

          {/* Data & Privacy */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-purple-900">Data & Privacy</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/70 rounded-lg border border-purple-200">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Data Analytics</p>
                    <p className="text-sm text-gray-600">Share anonymous usage data to improve the service</p>
                  </div>
                </div>
                <Badge className="bg-gray-400 text-white flex items-center gap-1">
                  <X className="w-3 h-3" />
                  Disabled
                </Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/70 rounded-lg border border-purple-200">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Data Export</p>
                    <p className="text-sm text-gray-600">Download your interview data and progress reports</p>
                  </div>
                </div>
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">Request</Badge>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
            <button className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}