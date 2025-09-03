#!/usr/bin/env tsx
/**
 * Discover Monday.com Board Column Structure
 * Gets the actual column IDs from your board for proper mapping
 */

import dotenv from 'dotenv';
dotenv.config();

const MONDAY_API_KEY = process.env.MONDAY_API_KEY;
const MONDAY_BOARD_ID = process.env.MONDAY_BOARD_ID;

if (!MONDAY_API_KEY || !MONDAY_BOARD_ID) {
  console.error('❌ Missing MONDAY_API_KEY or MONDAY_BOARD_ID in environment variables');
  process.exit(1);
}

async function discoverBoardColumns() {
  console.log(`🔍 Discovering column structure for board ${MONDAY_BOARD_ID}...`);
  
  try {
    // Query to get board columns
    const query = `
      query ($boardId: ID!) {
        boards(ids: [$boardId]) {
          id
          name
          description
          columns {
            id
            title
            type
            settings_str
          }
          items_page(limit: 1) {
            items {
              id
              name
              column_values {
                id
                column {
                  id
                  title
                  type
                }
                text
                value
              }
            }
          }
        }
      }
    `;

    const response = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': MONDAY_API_KEY,
        'API-Version': '2024-10'
      },
      body: JSON.stringify({ 
        query,
        variables: { boardId: parseInt(MONDAY_BOARD_ID) }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      console.error('❌ Monday.com API errors:', data.errors);
      return;
    }

    const board = data.data.boards[0];
    if (!board) {
      console.error('❌ Board not found');
      return;
    }

    console.log(`✅ Board: "${board.name}"`);
    console.log(`📋 Description: ${board.description || 'No description'}`);
    console.log('\n📊 Available columns:');
    
    const columnMapping: Record<string, string> = {};
    
    board.columns.forEach((column: any) => {
      console.log(`   📌 "${column.title}" (ID: ${column.id}, Type: ${column.type})`);
      
      // Map column titles to IDs for our CRM
      const title = column.title.toLowerCase();
      if (title.includes('email')) {
        columnMapping.email = column.id;
      } else if (title.includes('first') && title.includes('name')) {
        columnMapping.firstName = column.id;
      } else if (title.includes('last') && title.includes('name')) {
        columnMapping.lastName = column.id;
      } else if (title.includes('subscription') && title.includes('status')) {
        columnMapping.subscriptionStatus = column.id;
      } else if (title.includes('lifecycle') && title.includes('stage')) {
        columnMapping.lifecycleStage = column.id;
      }
    });

    console.log('\n🎯 Column mapping for CRM integration:');
    console.log(JSON.stringify(columnMapping, null, 2));
    
    // Check if we have a sample item to see data structure
    if (board.items_page?.items?.length > 0) {
      const sampleItem = board.items_page.items[0];
      console.log('\n📄 Sample item structure:');
      console.log(`   Item: "${sampleItem.name}" (ID: ${sampleItem.id})`);
      sampleItem.column_values.forEach((cv: any) => {
        console.log(`   - ${cv.column.title}: "${cv.text}" (ID: ${cv.id})`);
      });
    }

    return columnMapping;

  } catch (error) {
    console.error('❌ Error discovering board columns:', error);
  }
}

// Run the discovery
discoverBoardColumns()
  .then((mapping) => {
    if (mapping) {
      console.log('\n💡 Copy this mapping to update your Monday.com provider!');
    }
    console.log('\n✨ Discovery complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Discovery failed:', error);
    process.exit(1);
  });