import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  HelpCircle, 
  Calendar,
  Filter,
  Download,
  ChevronDown,
  Settings,
  User,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProfessionalHeaderProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

export default function ProfessionalHeader({ 
  title = "Dashboard", 
  subtitle,
  className 
}: ProfessionalHeaderProps) {
  const [searchValue, setSearchValue] = useState('');

  return (
    <header className={cn(
      "border-b px-6 py-4",
      className
    )} style={{ 
      backgroundColor: 'hsl(var(--background))', 
      borderColor: 'hsl(var(--border))',
      borderBottomWidth: '1px'
    }}>
      <div className="flex items-center justify-between">
        {/* Left Section - Title and Search */}
        <div className="flex items-center space-x-8">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{title}</h1>
            {subtitle && (
              <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{subtitle}</p>
            )}
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search 
              className="absolute left-3 top-1/2 transform -translate-y-1/2" 
              style={{ color: 'hsl(var(--muted-foreground))' }}
              size={16} 
            />
            <input
              type="text"
              placeholder="Search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-10 pr-4 py-2 w-80 text-sm rounded-lg 
                       focus:outline-none focus:ring-2 focus:border-transparent
                       transition-colors duration-200"
              style={{ 
                border: '1px solid hsl(var(--input))',
                backgroundColor: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                borderRadius: '0.5rem'
              }}
            />
            <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 
                          px-2 py-1 text-xs rounded border"
                 style={{ 
                   backgroundColor: 'hsl(var(--muted))',
                   color: 'hsl(var(--muted-foreground))',
                   borderColor: 'hsl(var(--border))'
                 }}>
              ⌘ F
            </kbd>
          </div>
        </div>

        {/* Right Section - Date Range, Actions, User */}
        <div className="flex items-center space-x-4">
          {/* Date Range Picker */}
          <div className="flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer transition-colors duration-200"
               style={{ 
                 border: '1px solid hsl(var(--input))',
                 backgroundColor: 'hsl(var(--background))'
               }}>
            <Calendar size={16} style={{ color: 'hsl(var(--muted-foreground))' }} />
            <span className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>Oct 18 - Nov 18</span>
            <ChevronDown size={14} style={{ color: 'hsl(var(--muted-foreground))' }} />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button className="flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition-colors duration-200"
                    style={{ 
                      border: '1px solid hsl(var(--input))',
                      backgroundColor: 'hsl(var(--background))'
                    }}>
              <Filter size={16} style={{ color: 'hsl(var(--muted-foreground))' }} />
              <span style={{ color: 'hsl(var(--foreground))' }}>Filter</span>
            </button>
            
            <button className="flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition-colors duration-200"
                    style={{ 
                      border: '1px solid hsl(var(--input))',
                      backgroundColor: 'hsl(var(--background))'
                    }}>
              <Download size={16} style={{ color: 'hsl(var(--muted-foreground))' }} />
              <span style={{ color: 'hsl(var(--foreground))' }}>Export</span>
            </button>
          </div>

          {/* Notification Bell */}
          <button className="relative p-2 rounded-lg transition-colors duration-200"
                  style={{ ':hover': { backgroundColor: 'hsl(var(--accent))' } }}>
            <Bell size={18} style={{ color: 'hsl(var(--muted-foreground))' }} />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full" 
                  style={{ backgroundColor: 'hsl(var(--destructive))' }}></span>
          </button>

          {/* Help Icon */}
          <button className="p-2 rounded-lg transition-colors duration-200"
                  style={{ ':hover': { backgroundColor: 'hsl(var(--accent))' } }}>
            <HelpCircle size={18} style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center space-x-3 p-2 rounded-lg transition-colors duration-200">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" 
                     style={{ backgroundColor: 'hsl(var(--primary))' }}>
                  <span className="text-sm font-medium" style={{ color: 'hsl(var(--primary-foreground))' }}>YA</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Young Alaska</p>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Business</p>
                </div>
                <ChevronDown size={14} style={{ color: 'hsl(var(--muted-foreground))' }} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className="flex items-center space-x-2">
                <User size={16} />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center space-x-2">
                <Settings size={16} />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center space-x-2 text-destructive">
                <LogOut size={16} />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}