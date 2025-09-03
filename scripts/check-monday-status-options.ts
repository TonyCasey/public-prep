#!/usr/bin/env tsx
/**
 * Check Monday.com Status Column Options
 * Gets the available status options for each status column
 */

import dotenv from 'dotenv';
dotenv.config();

const MONDAY_API_KEY = process.env.MONDAY_API_KEY;
const MONDAY_BOARD_ID = process.env.MONDAY_BOARD_ID;

async function checkStatusOptions() {
  console.log(`🔍 Checking status column options for board ${MONDAY_BOARD_ID}...`);
  
  try {
    // Query to get board columns with their settings
    const query = `
      query ($boardId: ID!) {
        boards(ids: [$boardId]) {
          columns {
            id
            title
            type
            settings_str
          }
        }
      }
    `;

    const response = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': MONDAY_API_KEY!,
        'API-Version': '2024-10'
      },
      body: JSON.stringify({ 
        query,
        variables: { boardId: parseInt(MONDAY_BOARD_ID!) }
      })
    });

    const data = await response.json();
    const board = data.data.boards[0];
    
    console.log('📊 Status columns and their options:');
    
    board.columns.forEach((column: any) => {
      if (column.type === 'status') {
        console.log(`\n📌 ${column.title} (ID: ${column.id})`);
        
        try {
          const settings = JSON.parse(column.settings_str);
          if (settings.labels) {
            console.log('   Available options:');
            Object.entries(settings.labels).forEach(([key, value]: [string, any]) => {
              console.log(`   - ${key}: "${value}" (use "${key}" as value)`);
            });
          }
        } catch (error) {
          console.log('   Settings:', column.settings_str);
        }
      }
    });

  } catch (error) {
    console.error('❌ Error checking status options:', error);
  }
}

checkStatusOptions();