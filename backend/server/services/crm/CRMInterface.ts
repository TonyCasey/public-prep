/**
 * Provider-agnostic CRM interface
 * Supports multiple CRM providers (HubSpot, Monday.com, etc.)
 */

export interface ContactData {
  email: string;
  firstName?: string;
  lastName?: string;
  subscriptionStatus?: string;
  lifecycleStage?: string;
  source?: string;
  customProperties?: Record<string, any>;
}

export interface UpdateData {
  subscriptionStatus?: string;
  lifecycleStage?: string;
  lastActivity?: Date;
  customProperties?: Record<string, any>;
}

export interface PageViewData {
  page: string;
  timestamp: string;
  sessionId?: string;
  duration?: number;
}

export interface FeatureUsageData {
  feature: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface CRMProvider {
  // Provider name for logging
  name: string;
  
  // Check if provider is configured and enabled
  isEnabled(): boolean;
  
  // Contact management
  createContact(contact: ContactData): Promise<boolean>;
  updateContact(email: string, data: UpdateData): Promise<boolean>;
  
  // Activity tracking
  trackPageView(email: string, data: PageViewData): Promise<boolean>;
  trackFeatureUsage(email: string, data: FeatureUsageData): Promise<boolean>;
  
  // Transaction tracking
  trackTransaction(email: string, amount: number, planType: string): Promise<boolean>;
}

/**
 * CRM Service that manages multiple providers
 */
export class CRMService {
  private providers: CRMProvider[] = [];
  
  constructor() {
    // Providers will be registered here
  }
  
  addProvider(provider: CRMProvider) {
    if (provider.isEnabled()) {
      this.providers.push(provider);
      console.log(`CRM Provider ${provider.name} registered and enabled`);
    } else {
      console.log(`CRM Provider ${provider.name} is not configured`);
    }
  }
  
  async createContact(contact: ContactData): Promise<boolean> {
    const results = await Promise.allSettled(
      this.providers.map(provider => provider.createContact(contact))
    );
    
    return results.some(result => result.status === 'fulfilled' && result.value === true);
  }
  
  async updateContact(email: string, data: UpdateData): Promise<boolean> {
    const results = await Promise.allSettled(
      this.providers.map(provider => provider.updateContact(email, data))
    );
    
    return results.some(result => result.status === 'fulfilled' && result.value === true);
  }
  
  async trackPageView(email: string, data: PageViewData): Promise<boolean> {
    const results = await Promise.allSettled(
      this.providers.map(provider => provider.trackPageView(email, data))
    );
    
    return results.some(result => result.status === 'fulfilled' && result.value === true);
  }
  
  async trackFeatureUsage(email: string, data: FeatureUsageData): Promise<boolean> {
    const results = await Promise.allSettled(
      this.providers.map(provider => provider.trackFeatureUsage(email, data))
    );
    
    return results.some(result => result.status === 'fulfilled' && result.value === true);
  }
  
  async trackTransaction(email: string, amount: number, planType: string): Promise<boolean> {
    const results = await Promise.allSettled(
      this.providers.map(provider => provider.trackTransaction(email, amount, planType))
    );
    
    return results.some(result => result.status === 'fulfilled' && result.value === true);
  }
  
  getStatus() {
    return {
      providers: this.providers.map(provider => ({
        name: provider.name,
        enabled: provider.isEnabled()
      })),
      totalProviders: this.providers.length,
      enabledProviders: this.providers.filter(p => p.isEnabled()).length
    };
  }
}

// Export singleton instance
export const crmService = new CRMService();