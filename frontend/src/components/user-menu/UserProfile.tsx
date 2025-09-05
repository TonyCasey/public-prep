import { User, Mail, Calendar, X, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface UserProfileProps {
  user: any;
  showProfile: boolean;
  onClose: () => void;
  getInitials: (firstName?: string | null, lastName?: string | null) => string;
  getUserDisplayName: () => string;
}

export default function UserProfile({ 
  user, 
  showProfile, 
  onClose, 
  getInitials, 
  getUserDisplayName 
}: UserProfileProps) {
  if (!showProfile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/50 backdrop-blur-sm p-2 pt-4 sm:pt-2">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white p-4 sm:p-6 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="relative flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Profile Information</h2>
                <p className="text-purple-100 text-sm">Your account details</p>
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

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 flex-1 overflow-y-auto">
          {/* Profile Section */}
          <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-3 sm:space-y-0 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 ring-4 ring-white shadow-lg">
              <AvatarImage src={user?.profileImageUrl || undefined} alt={getUserDisplayName()} />
              <AvatarFallback className="text-lg sm:text-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                {getInitials(user?.firstName, user?.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">{getUserDisplayName()}</h3>
              <p className="text-purple-600 font-medium flex items-center justify-center sm:justify-start gap-2 text-sm break-all">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{user?.email}</span>
              </p>
              <Badge className="mt-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                <Sparkles className="w-3 h-3 mr-1" />
                Active Member
              </Badge>
            </div>
          </div>
          
          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <p className="font-semibold text-blue-700 text-sm uppercase tracking-wide mb-1">First Name</p>
              <p className="text-gray-900 font-medium">{user?.firstName || "Not provided"}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
              <p className="font-semibold text-green-700 text-sm uppercase tracking-wide mb-1">Last Name</p>
              <p className="text-gray-900 font-medium">{user?.lastName || "Not provided"}</p>
            </div>
            <div className="col-span-1 sm:col-span-2 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100">
              <p className="font-semibold text-amber-700 text-sm uppercase tracking-wide mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Member Since
              </p>
              <p className="text-gray-900 font-medium">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) : "Recently joined"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}