import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testTimelineUpdate() {
  const MONDAY_API_KEY = process.env.MONDAY_API_KEY;
  const BOARD_ID = '2059996270';
  
  if (!MONDAY_API_KEY) {
    console.log('❌ MONDAY_API_KEY not found in environment');
    return;
  }

  console.log('🧪 Testing Monday.com Timeline/Updates API...');
  
  try {
    // First, find a test item to add timeline entry to
    const searchQuery = `
      query ($boardId: ID!) {
        boards(ids: [$boardId]) {
          items_page {
            items {
              id
              name
            }
          }
        }
      }
    `;
    
    const searchResponse = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': MONDAY_API_KEY
      },
      body: JSON.stringify({
        query: searchQuery,
        variables: { boardId: parseInt(BOARD_ID) }
      })
    });

    const searchResult = await searchResponse.json();
    
    if (searchResult.errors) {
      console.error('❌ Monday API errors:', searchResult.errors);
      return;
    }

    const items = searchResult.data?.boards?.[0]?.items_page?.items;
    if (!items || items.length === 0) {
      console.log('❌ No items found in board');
      return;
    }

    const testItem = items[0];
    console.log(`📝 Found test item: ${testItem.name} (ID: ${testItem.id})`);

    // Now add a timeline update
    const updateQuery = `
      mutation ($itemId: ID!, $body: String!) {
        create_update (
          item_id: $itemId,
          body: $body
        ) {
          id
          body
          created_at
        }
      }
    `;

    const updateResponse = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': MONDAY_API_KEY
      },
      body: JSON.stringify({
        query: updateQuery,
        variables: {
          itemId: testItem.id,
          body: `🎯 User Activity: Started interview preparation session at ${new Date().toLocaleString()}`
        }
      })
    });

    const updateResult = await updateResponse.json();
    
    if (updateResult.errors) {
      console.error('❌ Timeline update errors:', updateResult.errors);
      return;
    }

    if (updateResult.data?.create_update) {
      console.log('✅ Timeline update created successfully!');
      console.log(`📅 Update ID: ${updateResult.data.create_update.id}`);
      console.log(`📝 Body: ${updateResult.data.create_update.body}`);
      console.log(`⏰ Created: ${updateResult.data.create_update.created_at}`);
    }

  } catch (error) {
    console.error('❌ Error testing timeline:', error);
  }
}

testTimelineUpdate();
