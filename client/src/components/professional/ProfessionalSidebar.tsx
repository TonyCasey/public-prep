import React from 'react';
import { useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  Target, 
  TrendingUp, 
  Upload, 
  Settings, 
  HelpCircle,
  Shield,
  Mic,
  FileText,
  BarChart3,
  Award,
  Clock,
  type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: string | number;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

const sidebarSections: SidebarSection[] = [
  {
    title: 'GENERAL',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        href: '/app'
      },
      {
        id: 'practice',
        label: 'Practice Session',
        icon: Target,
        href: '/app/practice'
      },
      {
        id: 'progress',
        label: 'Progress Report',
        icon: TrendingUp,
        href: '/app/progress'
      }
    ]
  },
  {
    title: 'TRAINING',
    items: [
      {
        id: 'interview',
        label: 'Mock Interview',
        icon: Mic,
        href: '/app/interview'
      },
      {
        id: 'voice-practice',
        label: 'Voice Practice',
        icon: Clock,
        href: '/app/voice-practice'
      },
      {
        id: 'documents',
        label: 'Document Upload',
        icon: Upload,
        href: '/app/documents'
      }
    ]
  },
  {
    title: 'INSIGHTS',
    items: [
      {
        id: 'analytics',
        label: 'Performance Analytics',
        icon: BarChart3,
        href: '/app/analytics'
      },
      {
        id: 'competencies',
        label: 'Competency Scores',
        icon: Award,
        href: '/app/competencies'
      },
      {
        id: 'feedback',
        label: 'Feedback History',
        icon: FileText,
        href: '/app/feedback'
      }
    ]
  },
  {
    title: 'SUPPORT',
    items: [
      {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        href: '/app/settings'
      },
      {
        id: 'help',
        label: 'Help & Support',
        icon: HelpCircle,
        href: '/app/help'
      }
    ]
  }
];

interface ProfessionalSidebarProps {
  className?: string;
}

export default function ProfessionalSidebar({ className }: ProfessionalSidebarProps) {
  const [location] = useLocation();

  const isItemActive = (href: string) => {
    if (href === '/app') {
      return location === '/app';
    }
    return location.startsWith(href);
  };

  return (
    <div className={cn(
      "w-64 border-r flex flex-col h-full",
      className
    )} style={{ 
      backgroundColor: 'hsl(var(--sidebar-background))', 
      borderColor: 'hsl(var(--sidebar-border))',
      borderRightWidth: '1px'
    }}>
      {/* Logo Header */}
      <div className="p-6 border-b" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" 
               style={{ backgroundColor: 'hsl(var(--primary))' }}>
            <Shield className="w-5 h-5" style={{ color: 'hsl(var(--primary-foreground))' }} />
          </div>
          <div>
            <h1 className="text-lg font-semibold" style={{ color: 'hsl(var(--sidebar-foreground))' }}>Nexus</h1>
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Interview Prep</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {sidebarSections.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-medium uppercase tracking-wider mb-3" 
                style={{ color: 'hsl(var(--muted-foreground))' }}>
              {section.title}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = isItemActive(item.href);
                
                return (
                  <li key={item.id}>
                    <a
                      href={item.href}
                      className={cn(
                        "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors duration-200",
                        "text-sm font-medium group",
                        isActive 
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" 
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <Icon 
                        size={18} 
                        className={cn(
                          "transition-colors duration-200",
                          isActive 
                            ? "text-sidebar-primary-foreground" 
                            : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
                        )} 
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className={cn(
                          "px-2 py-0.5 text-xs font-medium rounded-full",
                          isActive 
                            ? "bg-sidebar-primary-foreground/20 text-sidebar-primary-foreground"
                            : "bg-primary/10 text-primary"
                        )}>
                          {item.badge}
                        </span>
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom User Section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center space-x-3 p-3 rounded-lg bg-sidebar-accent">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-primary-foreground">YA</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              Young Alaska
            </p>
            <p className="text-xs text-muted-foreground">Business Plan</p>
          </div>
        </div>
        
        <button className="w-full mt-3 px-4 py-2 text-sm font-medium text-primary border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors duration-200">
          Upgrade Plan
        </button>
      </div>
    </div>
  );
}