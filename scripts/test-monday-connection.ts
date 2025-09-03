#!/usr/bin/env tsx
/**
 * Monday.com API Connection Test
 * Tests API key and lists available boards to help find board ID
 */

import dotenv from 'dotenv';
dotenv.config();

const MONDAY_API_KEY = process.env.MONDAY_API_KEY;

if (!MONDAY_API_KEY) {
  console.error('❌ MONDAY_API_KEY not found in environment variables');
  process.exit(1);
}

async function testMondayConnection() {
  console.log('🔍 Testing Monday.com API connection...');
  
  try {
    // Query to get all boards
    const query = `
      query {
        boards {
          id
          name
          description
          state
          board_folder_id
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
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      console.error('❌ Monday.com API errors:', data.errors);
      return;
    }

    console.log('✅ Monday.com API connection successful!');
    console.log('\n📋 Available boards:');
    
    if (data.data.boards.length === 0) {
      console.log('   No boards found. Create a board first in Monday.com');
    } else {
      data.data.boards.forEach((board: any) => {
        console.log(`   📌 "${board.name}" - ID: ${board.id}`);
        if (board.description) {
          console.log(`      Description: ${board.description}`);
        }
        console.log(`      State: ${board.state}`);
        console.log('');
      });
    }

    // Suggest board ID for Public Service Prep
    const crmBoard = data.data.boards.find((board: any) => 
      board.name.toLowerCase().includes('public service') || 
      board.name.toLowerCase().includes('crm') ||
      board.name.toLowerCase().includes('prep')
    );

    if (crmBoard) {
      console.log(`🎯 Suggested board for Public Service Prep: ${crmBoard.id}`);
      console.log(`   Add this to your .env file: MONDAY_BOARD_ID=${crmBoard.id}`);
    } else {
      console.log('💡 No CRM board found. Create a board called "Public Service Prep - CRM"');
    }

  } catch (error) {
    console.error('❌ Monday.com API connection failed:', error);
  }
}

// Run the test
testMondayConnection()
  .then(() => {
    console.log('\n✨ Test complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });