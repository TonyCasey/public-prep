import React from 'react';
import ProfessionalDashboard from './professional/ProfessionalDashboard';

export default function ProfessionalDemo() {
  return (
    <div className="professional-theme" style={{
      '--background': '0 0% 100%',
      '--foreground': '215 25% 17%',
      '--card': '0 0% 100%',
      '--card-foreground': '215 25% 17%',
      '--popover': '0 0% 100%',
      '--popover-foreground': '215 25% 17%',
      '--primary': '215 25% 50%',
      '--primary-foreground': '0 0% 98%',
      '--secondary': '215 16% 93%',
      '--secondary-foreground': '215 25% 17%',
      '--muted': '215 20% 95%',
      '--muted-foreground': '215 13% 40%',
      '--accent': '215 16% 93%',
      '--accent-foreground': '215 25% 17%',
      '--destructive': '0 70% 50%',
      '--destructive-foreground': '0 0% 98%',
      '--border': '215 28% 88%',
      '--input': '215 28% 88%',
      '--ring': '215 25% 50%',
      '--chart-1': '215 25% 65%',
      '--chart-2': '215 20% 75%',
      '--chart-3': '215 15% 85%',
      '--chart-4': '215 25% 55%',
      '--chart-5': '215 20% 45%',
      '--radius': '0.5rem',
      '--sidebar-background': '0 0% 98%',
      '--sidebar-foreground': '215 25% 17%',
      '--sidebar-primary': '215 25% 50%',
      '--sidebar-primary-foreground': '0 0% 98%',
      '--sidebar-accent': '215 16% 93%',
      '--sidebar-accent-foreground': '215 25% 17%',
      '--sidebar-border': '215 28% 88%',
      '--sidebar-ring': '215 25% 50%'
    } as React.CSSProperties}>
      <ProfessionalDashboard />
    </div>
  );
}