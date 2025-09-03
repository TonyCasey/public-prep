import { CRMProvider, ContactData, UpdateData, PageViewData, FeatureUsageData } from './CRMInterface';

/**
 * Monday.com CRM Provider Implementation
 * 
 * Stores contacts as items in a Monday board with custom columns for tracking
 */
export class MondayProvider implements CRMProvider {
  name = 'Monday.com';
  private apiKey: string | undefined;
  private boardId: string | undefined;
  private apiUrl = 'https://api.monday.com/v2';
  
  constructor() {
    this.apiKey = process.env.MONDAY_API_KEY;
    this.boardId = process.env.MONDAY_BOARD_ID;
  }
  
  isEnabled(): boolean {
    return !!(this.apiKey && this.boardId);
  }
  
  private async query(query: string, variables?: Record<string, any>): Promise<any> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.apiKey!,
        'API-Version': '2024-01'
      },
      body: JSON.stringify({
        query,
        variables
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Monday API error: ${error}`);
    }
    
    const result = await response.json();
    if (result.errors) {
      throw new Error(`Monday GraphQL errors: ${JSON.stringify(result.errors)}`);
    }
    
    return result.data;
  }
  
  async createContact(contact: ContactData): Promise<boolean> {
    if (!this.isEnabled()) {
      console.log('Monday.com integration not configured');
      return false;
    }
    
    try {
      // First check if contact exists
      const searchQuery = `
        query ($boardId: ID!, $email: String!) {
          items_page_by_column_values (
            board_id: $boardId,
            columns: [{column_id: "contact_email", column_values: [$email]}]
          ) {
            items {
              id
              name
            }
          }
        }
      `;
      
      const searchResult = await this.query(searchQuery, {
        boardId: parseInt(this.boardId!),
        email: contact.email
      });
      
      // If contact exists, update instead
      if (searchResult.items_page_by_column_values?.items?.length > 0) {
        console.log(`Monday.com contact exists for ${contact.email}, updating`);
        return await this.updateContact(contact.email, {
          subscriptionStatus: contact.subscriptionStatus,
          lifecycleStage: contact.lifecycleStage,
          customProperties: contact.customProperties
        });
      }
      
      // Create new item (contact) using actual column IDs with proper formatting
      // Map our CRM values to Monday.com status values
      const subscriptionStatusMap: Record<string, string> = {
        'free': '0',     // Working on it
        'starter': '1',  // Done  
        'premium': '2'   // Stuck (we'll update labels later)
      };
      
      const lifecycleStageMap: Record<string, string> = {
        'lead': '0',     // Working on it
        'customer': '1', // Done
        'churned': '2'   // Stuck
      };
      
      const columnValues = {
        contact_email: { email: contact.email, text: contact.email },
        color_mkt29wd0: { index: parseInt(subscriptionStatusMap[contact.subscriptionStatus || 'free'] || '0') }, // Subscription status
        color_mkt2afm9: { index: parseInt(lifecycleStageMap[contact.lifecycleStage || 'lead'] || '0') } // Lifecycle stage
      };
      
      const createQuery = `
        mutation ($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
          create_item (
            board_id: $boardId,
            item_name: $itemName,
            column_values: $columnValues
          ) {
            id
          }
        }
      `;
      
      const result = await this.query(createQuery, {
        boardId: parseInt(this.boardId!),
        itemName: `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.email,
        columnValues: JSON.stringify(columnValues)
      });
      
      if (result.create_item?.id) {
        console.log(`Created Monday.com contact for ${contact.email}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error creating Monday.com contact:', error);
      return false;
    }
  }
  
  async updateContact(email: string, data: UpdateData): Promise<boolean> {
    if (!this.isEnabled()) {
      return false;
    }
    
    try {
      // Find the item by email
      const searchQuery = `
        query ($boardId: ID!, $email: String!) {
          items_page_by_column_values (
            board_id: $boardId,
            columns: [{column_id: "contact_email", column_values: [$email]}]
          ) {
            items {
              id
            }
          }
        }
      `;
      
      const searchResult = await this.query(searchQuery, {
        boardId: parseInt(this.boardId!),
        email
      });
      
      const itemId = searchResult.items_page_by_column_values?.items?.[0]?.id;
      if (!itemId) {
        console.log(`Monday.com contact not found for ${email}`);
        return false;
      }
      
      // Prepare column updates using actual column IDs
      const columnValues: any = {};
      
      // Map our CRM values to Monday.com status indices
      const subscriptionStatusMap: Record<string, string> = {
        'free': '0',     // Working on it
        'starter': '1',  // Done  
        'premium': '2'   // Stuck
      };
      
      const lifecycleStageMap: Record<string, string> = {
        'lead': '0',     // Working on it
        'customer': '1', // Done
        'churned': '2'   // Stuck
      };
      
      if (data.subscriptionStatus) {
        const statusIndex = subscriptionStatusMap[data.subscriptionStatus] || '0';
        columnValues.color_mkt29wd0 = { index: parseInt(statusIndex) }; // Subscription Status column
      }
      
      if (data.lifecycleStage) {
        const stageIndex = lifecycleStageMap[data.lifecycleStage] || '0';
        columnValues.color_mkt2afm9 = { index: parseInt(stageIndex) }; // Lifecycle Stage column
      }
      
      if (data.lastActivity) {
        // Note: Board doesn't have a last activity date column yet
        // columnValues.date_column = data.lastActivity.toISOString().split('T')[0];
      }
      
      const updateQuery = `
        mutation ($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
          change_multiple_column_values (
            board_id: $boardId,
            item_id: $itemId,
            column_values: $columnValues
          ) {
            id
          }
        }
      `;
      
      await this.query(updateQuery, {
        boardId: parseInt(this.boardId!),
        itemId: parseInt(itemId),
        columnValues: JSON.stringify(columnValues)
      });
      
      console.log(`Updated Monday.com contact for ${email}`);
      return true;
    } catch (error) {
      console.error('Error updating Monday.com contact:', error);
      return false;
    }
  }
  
  async trackPageView(email: string, data: PageViewData): Promise<boolean> {
    if (!this.isEnabled()) {
      return false;
    }
    
    try {
      // Add timeline update for page view
      const activityMessage = `📄 Page View: ${data.page}`;
      await this.addTimelineUpdate(email, activityMessage);
      
      // Update last activity
      await this.updateContact(email, {
        lastActivity: new Date(data.timestamp),
        customProperties: {
          lastViewedPage: data.page
        }
      });
      
      console.log(`Tracked Monday.com page view for ${email}: ${data.page}`);
      return true;
    } catch (error) {
      console.error('Error tracking Monday.com page view:', error);
      return false;
    }
  }
  
  async trackFeatureUsage(email: string, data: FeatureUsageData): Promise<boolean> {
    if (!this.isEnabled()) {
      return false;
    }
    
    try {
      // Create timeline message based on feature
      let activityMessage = '';
      const updates: UpdateData = {
        lastActivity: new Date(data.timestamp),
        customProperties: {}
      };
      
      switch (data.feature) {
        case 'cv_upload':
          activityMessage = '📄 CV Upload: User uploaded their CV for analysis';
          updates.customProperties!.cvUploaded = true;
          break;
        case 'interview_start':
          activityMessage = '🎯 Interview Started: User began practice interview session';
          updates.customProperties!.lastInterviewDate = data.timestamp;
          break;
        case 'interview_complete':
          activityMessage = '🎉 Interview Completed: User finished practice interview session';
          updates.customProperties!.interviewsCompleted = '+1';
          break;
        case 'ai_feedback_view':
          activityMessage = '🤖 AI Feedback: User viewed AI coaching analysis';
          break;
        case 'payment_success':
          activityMessage = '💳 Payment Success: User upgraded to premium plan';
          break;
        case 'registration':
          activityMessage = '🎯 Registration: New user account created';
          break;
        default:
          activityMessage = `📊 Feature Used: ${data.feature}`;
      }
      
      // Add to timeline
      await this.addTimelineUpdate(email, activityMessage);
      
      // Update contact data
      await this.updateContact(email, updates);
      
      console.log(`Tracked Monday.com feature usage for ${email}: ${data.feature}`);
      return true;
    } catch (error) {
      console.error('Error tracking Monday.com feature usage:', error);
      return false;
    }
  }
  
  async trackTransaction(email: string, amount: number, planType: string): Promise<boolean> {
    if (!this.isEnabled()) {
      return false;
    }
    
    try {
      // Add timeline update for transaction
      const activityMessage = `💳 Payment: €${amount} - Upgraded to ${planType} plan`;
      await this.addTimelineUpdate(email, activityMessage);
      
      await this.updateContact(email, {
        subscriptionStatus: planType === 'premium' ? 'premium' : 'starter',
        lifecycleStage: 'customer',
        customProperties: {
          totalSpent: amount,
          lastPurchaseDate: new Date().toISOString(),
          planType
        }
      });
      
      console.log(`Tracked Monday.com transaction for ${email}: €${amount} - ${planType}`);
      return true;
    } catch (error) {
      console.error('Error tracking Monday.com transaction:', error);
      return false;
    }
  }

  // Helper method to add timeline updates
  private async addTimelineUpdate(email: string, message: string): Promise<boolean> {
    try {
      // First find the contact item by email
      const searchQuery = `
        query ($boardId: ID!, $email: String!) {
          items_page_by_column_values (
            board_id: $boardId,
            columns: [{column_id: "contact_email", column_values: [$email]}]
          ) {
            items {
              id
            }
          }
        }
      `;
      
      const searchResult = await this.query(searchQuery, {
        boardId: parseInt(this.boardId!),
        email
      });
      
      const items = searchResult.items_page_by_column_values?.items;
      if (!items || items.length === 0) {
        console.log(`No Monday.com contact found for ${email} to add timeline update`);
        return false;
      }
      
      const itemId = items[0].id;
      
      // Create timeline update
      const updateQuery = `
        mutation ($itemId: ID!, $body: String!) {
          create_update (
            item_id: $itemId,
            body: $body
          ) {
            id
          }
        }
      `;
      
      await this.query(updateQuery, {
        itemId,
        body: `${message} - ${new Date().toLocaleString()}`
      });
      
      return true;
    } catch (error) {
      console.error('Error adding timeline update:', error);
      return false;
    }
  }
}