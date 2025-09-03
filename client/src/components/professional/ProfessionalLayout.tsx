import React from 'react';
import ProfessionalSidebar from './ProfessionalSidebar';
import ProfessionalHeader from './ProfessionalHeader';

interface ProfessionalLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

export default function ProfessionalLayout({ 
  children, 
  title, 
  subtitle,
  className 
}: ProfessionalLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <ProfessionalSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <ProfessionalHeader title={title} subtitle={subtitle} />
        
        {/* Page Content */}
        <main className={`flex-1 overflow-y-auto ${className || 'p-6'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}