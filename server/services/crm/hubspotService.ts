interface HubSpotContact {
  email: string;
  firstName: string;
  lastName: string;
  registrationDate: string;
  subscriptionStatus: string;
  source: string;
  lifecycleStage?: string;
}

interface HubSpotResponse {
  id?: string;
  properties?: any;
  errors?: Array<{
    message: string;
  }>;
}

class HubSpotService {
  private apiKey: string | undefined;
  private apiUrl = 'https://api.hubapi.com';

  constructor() {
    this.apiKey = process.env.HUBSPOT_API_KEY;
  }

  private isEnabled(): boolean {
    return !!this.apiKey;
  }

  async createContact(userData: HubSpotContact): Promise<boolean> {
    if (!this.isEnabled()) {
      console.log('HubSpot integration not configured - would create contact:', userData.email);
      return false;
    }

    try {
      // Map user data to HubSpot properties (enhanced with custom properties)
      const properties = {
        email: userData.email,
        firstname: userData.firstName,
        lastname: userData.lastName,
        lifecyclestage: userData.lifecycleStage || 'lead',
        hs_lead_status: 'NEW',
        company: 'Public Prep User',
        // Custom properties for Stage 2 analytics
        subscription_status: userData.subscriptionStatus || 'free',
        original_source: userData.source || 'direct_registration',
        interviews_completed: 0,
        cv_uploaded: false,
        first_interview_date: null,
        total_spent: 0,
        engagement_score: 25, // Starting engagement score
        pages_visited: 1, // Registration page counts as first visit
        session_count: 1
      };

      const response = await fetch(`${this.apiUrl}/crm/v3/objects/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          properties
        })
      });

      if (!response.ok) {
        // Check if contact already exists (409 conflict)
        if (response.status === 409) {
          console.log(`HubSpot contact already exists for ${userData.email}, attempting update`);
          return await this.updateContactByEmail(userData.email, properties);
        }
        
        const errorText = await response.text();
        console.error(`HubSpot API error (${response.status}):`, errorText);
        return false;
      }

      const result = await response.json() as HubSpotResponse;

      if (result.id) {
        console.log(`Successfully created HubSpot contact for ${userData.email} with ID: ${result.id}`);
        return true;
      }

      console.error('Unexpected HubSpot API response:', result);
      return false;

    } catch (error) {
      console.error('Error creating HubSpot contact:', error);
      return false;
    }
  }

  private async updateContactByEmail(email: string, properties: any): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/crm/v3/objects/contacts/${email}?idProperty=email`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          properties
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HubSpot update error (${response.status}):`, errorText);
        return false;
      }

      console.log(`Successfully updated HubSpot contact for ${email}`);
      return true;

    } catch (error) {
      console.error('Error updating HubSpot contact:', error);
      return false;
    }
  }

  async updateContactSubscription(email: string, subscriptionStatus: string): Promise<boolean> {
    if (!this.isEnabled()) {
      console.log(`HubSpot integration not configured - would update ${email} to ${subscriptionStatus}`);
      return false;
    }

    try {
      // Determine lifecycle stage based on subscription
      let lifecycleStage = 'lead';
      if (subscriptionStatus === 'starter' || subscriptionStatus === 'premium') {
        lifecycleStage = 'customer';
      }

      // Calculate total spent based on subscription history
      let totalSpent = 0;
      if (subscriptionStatus === 'starter') totalSpent = 49;
      if (subscriptionStatus === 'premium') totalSpent = 149; // Could be 149 or 100 for upgrades

      const properties = {
        lifecyclestage: lifecycleStage,
        hs_lead_status: subscriptionStatus === 'premium' ? 'CONVERTED' : subscriptionStatus === 'starter' ? 'IN_PROGRESS' : 'NEW',
        company: subscriptionStatus === 'premium' ? 'Public Prep - Premium Customer' : 
                subscriptionStatus === 'starter' ? 'Public Prep - Starter Customer' : 
                'Public Prep User',
        // Basic tracking with standard properties only
        last_activity_date: new Date().toISOString()
      };

      return await this.updateContactByEmail(email, properties);

    } catch (error) {
      console.error('Error updating HubSpot contact subscription:', error);
      return false;
    }
  }

  // Track page views and user activity
  async trackPageView(email: string, page: string): Promise<boolean> {
    if (!this.isEnabled()) return false;

    try {
      const contact = await this.findContactByEmail(email);
      if (!contact) return false;

      // Only update basic properties that exist in HubSpot
      const properties = {
        // Use correct property name with underscores
        last_activity_date: new Date().toISOString()
      };

      const success = await this.updateContactProperties(contact.id, properties);
      if (success) {
        console.log(`Tracked page view for ${email}: ${page}`);
      }
      return success;
    } catch (error) {
      console.error('HubSpot page tracking error:', error);
      return false;
    }
  }

  // Track feature usage and engagement
  async trackFeatureUsage(email: string, feature: string, metadata: any = {}): Promise<boolean> {
    if (!this.isEnabled()) return false;

    try {
      const contact = await this.findContactByEmail(email);
      if (!contact) return false;

      // Only update standard HubSpot properties to avoid errors
      const properties: any = {
        last_activity_date: new Date().toISOString()
      };

      // Simplified feature tracking with notes instead of custom properties
      const featureNote = `${feature} - ${new Date().toISOString()}`;
      
      // Log feature usage without updating non-existent properties
      console.log(`Feature usage tracked for ${email}: ${featureNote}`);

      const success = await this.updateContactProperties(contact.id, properties);
      if (success) {
        console.log(`Tracked feature usage for ${email}: ${feature}`);
      }
      return success;
    } catch (error) {
      console.error('HubSpot feature tracking error:', error);
      return false;
    }
  }

  // Calculate engagement score based on user activity
  calculateEngagementScore(contact: any, updates: any = {}): number {
    let score = 25; // Base score

    const data = { ...contact.properties, ...updates };

    // CV upload adds significant engagement
    if (data.cv_uploaded) score += 20;
    
    // Interview completion is key engagement
    const interviews = parseInt(data.interviews_completed) || 0;
    if (interviews > 0) score += 25;
    if (interviews >= 3) score += 15;
    if (interviews >= 5) score += 10;
    
    // Page views indicate exploration
    const pages = parseInt(data.pages_visited) || 0;
    score += Math.min(pages * 2, 20);
    
    // AI feedback engagement
    const feedback = parseInt(data.ai_feedback_views) || 0;
    score += Math.min(feedback * 3, 15);

    return Math.min(score, 100);
  }

  // Find contact by email
  async findContactByEmail(email: string): Promise<any> {
    if (!this.isEnabled()) return null;

    try {
      const response = await fetch(
        `https://api.hubapi.com/crm/v3/objects/contacts/search`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.HUBSPOT_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            filterGroups: [{
              filters: [{
                propertyName: 'email',
                operator: 'EQ',
                value: email
              }]
            }]
          })
        }
      );

      const data = await response.json();
      return data.results?.[0] || null;
    } catch (error) {
      console.error('HubSpot contact search error:', error);
      return null;
    }
  }

  // Update contact properties
  async updateContactProperties(contactId: string, properties: any): Promise<boolean> {
    if (!this.isEnabled()) return false;

    try {
      const response = await fetch(
        `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${process.env.HUBSPOT_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ properties })
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('HubSpot update error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('HubSpot property update error:', error);
      return false;
    }
  }
}

// Create singleton instance
export const hubspotService = new HubSpotService();

// Helper function for async contact creation (fire and forget)
export async function createHubSpotContact(userData: HubSpotContact): Promise<void> {
  // Run asynchronously without blocking the main flow
  setImmediate(async () => {
    try {
      await hubspotService.createContact(userData);
    } catch (error) {
      console.error('Async HubSpot contact creation failed:', error);
    }
  });
}

// Helper function for async subscription updates
export async function updateHubSpotContactSubscription(email: string, subscriptionStatus: string): Promise<void> {
  setImmediate(async () => {
    try {
      await hubspotService.updateContactSubscription(email, subscriptionStatus);
    } catch (error) {
      console.error('Async HubSpot subscription update failed:', error);
    }
  });
}

// Helper function for async page view tracking
export async function trackHubSpotPageView(email: string, page: string): Promise<void> {
  setImmediate(async () => {
    try {
      await hubspotService.trackPageView(email, page);
    } catch (error) {
      console.error('Async HubSpot page tracking failed:', error);
    }
  });
}

// Helper function for async feature tracking
export async function trackHubSpotFeatureUsage(email: string, feature: string, metadata?: any): Promise<void> {
  setImmediate(async () => {
    try {
      await hubspotService.trackFeatureUsage(email, feature, metadata);
    } catch (error) {
      console.error('Async HubSpot feature tracking failed:', error);
    }
  });
}