import { CRMProvider, ContactData, UpdateData, PageViewData, FeatureUsageData } from './CRMInterface';

/**
 * HubSpot CRM Provider Implementation
 * Adapts the existing HubSpot service to the CRMProvider interface
 */
export class HubSpotProvider implements CRMProvider {
  name = 'HubSpot';
  private apiKey: string | undefined;
  private apiUrl = 'https://api.hubapi.com';
  
  constructor() {
    this.apiKey = process.env.HUBSPOT_API_KEY;
  }
  
  isEnabled(): boolean {
    return !!this.apiKey;
  }
  
  async createContact(contact: ContactData): Promise<boolean> {
    if (!this.isEnabled()) {
      console.log('HubSpot integration not configured');
      return false;
    }
    
    try {
      const properties = {
        email: contact.email,
        firstname: contact.firstName,
        lastname: contact.lastName,
        lifecyclestage: contact.lifecycleStage || 'lead',
        hs_lead_status: 'NEW',
        company: 'Public Prep User'
      };
      
      const response = await fetch(`${this.apiUrl}/crm/v3/objects/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({ properties })
      });
      
      if (!response.ok) {
        if (response.status === 409) {
          console.log(`HubSpot contact exists for ${contact.email}, updating`);
          return await this.updateContact(contact.email, {
            subscriptionStatus: contact.subscriptionStatus,
            lifecycleStage: contact.lifecycleStage
          });
        }
        
        const errorText = await response.text();
        console.error(`HubSpot API error (${response.status}):`, errorText);
        return false;
      }
      
      const result = await response.json();
      console.log(`Created HubSpot contact for ${contact.email}`);
      return true;
    } catch (error) {
      console.error('Error creating HubSpot contact:', error);
      return false;
    }
  }
  
  async updateContact(email: string, data: UpdateData): Promise<boolean> {
    if (!this.isEnabled()) {
      return false;
    }
    
    try {
      const properties: any = {};
      
      if (data.subscriptionStatus) {
        properties.lifecyclestage = data.subscriptionStatus === 'premium' || data.subscriptionStatus === 'starter' 
          ? 'customer' 
          : 'lead';
      }
      
      if (data.lifecycleStage) {
        properties.lifecyclestage = data.lifecycleStage;
      }
      
      if (data.lastActivity) {
        properties.last_activity_date = data.lastActivity.getTime();
      }
      
      const response = await fetch(`${this.apiUrl}/crm/v3/objects/contacts/${email}?idProperty=email`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({ properties })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HubSpot update error (${response.status}):`, errorText);
        return false;
      }
      
      console.log(`Updated HubSpot contact for ${email}`);
      return true;
    } catch (error) {
      console.error('Error updating HubSpot contact:', error);
      return false;
    }
  }
  
  async trackPageView(email: string, data: PageViewData): Promise<boolean> {
    if (!this.isEnabled()) {
      return false;
    }
    
    try {
      // Update last activity with page view
      await this.updateContact(email, {
        lastActivity: new Date(data.timestamp)
      });
      
      console.log(`Tracked HubSpot page view for ${email}: ${data.page}`);
      return true;
    } catch (error) {
      console.error('Error tracking HubSpot page view:', error);
      return false;
    }
  }
  
  async trackFeatureUsage(email: string, data: FeatureUsageData): Promise<boolean> {
    if (!this.isEnabled()) {
      return false;
    }
    
    try {
      // Update last activity
      await this.updateContact(email, {
        lastActivity: new Date(data.timestamp)
      });
      
      console.log(`Tracked HubSpot feature usage for ${email}: ${data.feature}`);
      return true;
    } catch (error) {
      console.error('Error tracking HubSpot feature usage:', error);
      return false;
    }
  }
  
  async trackTransaction(email: string, amount: number, planType: string): Promise<boolean> {
    if (!this.isEnabled()) {
      return false;
    }
    
    try {
      await this.updateContact(email, {
        subscriptionStatus: planType,
        lifecycleStage: 'customer'
      });
      
      console.log(`Tracked HubSpot transaction for ${email}: €${amount} - ${planType}`);
      return true;
    } catch (error) {
      console.error('Error tracking HubSpot transaction:', error);
      return false;
    }
  }
}