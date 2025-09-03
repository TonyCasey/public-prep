import React from 'react';
import { Eye, DollarSign, TrendingDown, Users, Filter, MoreHorizontal } from 'lucide-react';
import ProfessionalSidebar from '@/components/professional/ProfessionalSidebar';
import ProfessionalHeader from '@/components/professional/ProfessionalHeader';
import ProfessionalMetricCard from '@/components/professional/ProfessionalMetricCard';
import { ProfessionalBarChart, ProfessionalLineChart } from '@/components/professional/ProfessionalChart';

// Sample data matching the Nexus design
const metricsData = [
  {
    title: 'Sessions Completed',
    value: '87',
    change: {
      value: '15.8%',
      trend: 'up' as const,
    },
    icon: Eye
  },
  {
    title: 'Average Score',
    value: '8.2/10',
    change: {
      value: '34.0%',
      trend: 'down' as const,
    },
    icon: DollarSign
  },
  {
    title: 'Improvement Rate',
    value: '86.5%',
    change: {
      value: '24.2%',
      trend: 'up' as const,
    },
    icon: TrendingDown
  }
];

const chartData = [
  { month: 'Oct', value: 2988 },
  { month: 'Nov', value: 1765 },
  { month: 'Dec', value: 4005 }
];

const competencyData = [
  { label: 'Leadership', value: 85, color: 'hsl(215, 25%, 65%)' },
  { label: 'Communication', value: 92, color: 'hsl(215, 20%, 75%)' },
  { label: 'Problem Solving', value: 78, color: 'hsl(215, 15%, 85%)' },
  { label: 'Teamwork', value: 88, color: 'hsl(215, 25%, 55%)' }
];

const subscriberData = [
  { month: 'Sun', value: 24473 },
  { month: 'Mon', value: 26500 },
  { month: 'Tue', value: 23800 },
  { month: 'Wed', value: 27200 },
  { month: 'Thu', value: 25900 },
  { month: 'Fri', value: 24100 },
  { month: 'Sat', value: 26800 }
];

const integrationData = [
  {
    application: 'Stripe',
    type: 'Finance',
    rate: 40,
    profit: '$650.00'
  },
  {
    application: 'Zapier',
    type: 'CRM',
    rate: 80,
    profit: '$720.50'
  },
  {
    application: 'Shopify',
    type: 'Marketplace',
    rate: 20,
    profit: '$432.25'
  }
];

export default function ProfessionalDashboard() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <ProfessionalSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <ProfessionalHeader 
          title="Dashboard"
          subtitle="Monitor your interview preparation progress"
        />
        
        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {metricsData.map((metric) => (
              <ProfessionalMetricCard
                key={metric.title}
                title={metric.title}
                value={metric.value}
                change={metric.change}
                icon={metric.icon}
              />
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Performance Overview */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-card-foreground">
                  Performance Overview
                </h3>
                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-accent rounded-lg">
                    <Filter size={16} className="text-muted-foreground" />
                  </button>
                  <button className="p-2 hover:bg-accent rounded-lg">
                    <MoreHorizontal size={16} className="text-muted-foreground" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="text-2xl font-semibold text-card-foreground">
                  $9,257.51
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-green-600 font-medium">↗ 15.8%</span>
                  <span className="text-muted-foreground">+$143.50 increased</span>
                </div>
              </div>

              <ProfessionalLineChart 
                data={chartData}
                className="border-0 p-0 mt-4"
              />
            </div>

            {/* Weekly Progress */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground">
                    Weekly Progress
                  </h3>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-2xl font-semibold text-card-foreground">
                      24,473
                    </span>
                    <span className="text-sm text-green-600 font-medium">
                      ↗ 8.3% +749 increased
                    </span>
                  </div>
                </div>
                <select className="text-sm border border-input rounded-lg px-3 py-2 bg-background">
                  <option>Weekly</option>
                  <option>Monthly</option>
                  <option>Yearly</option>
                </select>
              </div>

              <ProfessionalLineChart 
                data={subscriberData}
                className="border-0 p-0"
              />
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Competency Breakdown */}
            <ProfessionalBarChart
              title="Competency Breakdown"
              data={competencyData}
              showValues
            />

            {/* Integration List */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-card-foreground">
                  Performance Integration
                </h3>
                <button className="text-sm text-primary hover:underline">
                  See All
                </button>
              </div>

              <div className="space-y-4">
                {/* Table Header */}
                <div className="grid grid-cols-4 gap-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <div>Application</div>
                  <div>Type</div>
                  <div>Rate</div>
                  <div>Profit</div>
                </div>

                {/* Table Rows */}
                {integrationData.map((item, index) => (
                  <div key={index} className="grid grid-cols-4 gap-4 py-3 border-b border-border last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 border border-input rounded"
                      />
                      <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {item.application[0]}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-card-foreground">
                        {item.application}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-muted-foreground">{item.type}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="flex items-center space-x-2">
                        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${item.rate}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-card-foreground">
                          {item.rate}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-card-foreground">
                        {item.profit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}