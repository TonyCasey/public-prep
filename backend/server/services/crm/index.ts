/**
 * CRM Service Setup
 * Initializes all configured CRM providers
 */
import { crmService } from './CRMInterface';
import { HubSpotProvider } from './HubSpotProvider';
import { MondayProvider } from './MondayProvider';

// Initialize providers
const hubspotProvider = new HubSpotProvider();
const mondayProvider = new MondayProvider();

// Register enabled providers
crmService.addProvider(hubspotProvider);
crmService.addProvider(mondayProvider);

// Export the configured service
export { crmService };

// Re-export types for convenience
export type { 
  ContactData, 
  UpdateData, 
  PageViewData, 
  FeatureUsageData 
} from './CRMInterface';