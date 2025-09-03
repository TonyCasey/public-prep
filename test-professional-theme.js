import puppeteer from 'puppeteer';

async function testProfessionalTheme() {
  console.log('🚀 Starting Puppeteer test for professional theme...');
  
  const browser = await puppeteer.launch({ 
    headless: false,  // Show browser for debugging
    defaultViewport: { width: 1280, height: 720 }
  });
  
  try {
    const page = await browser.newPage();
    
    console.log('📄 Navigating to professional demo...');
    await page.goto('http://localhost:5000/professional-demo', { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    
    // Wait for React to render
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('📸 Taking screenshot...');
    await page.screenshot({ 
      path: 'professional-theme-test.png',
      fullPage: true
    });
    
    console.log('🔍 Checking if components are rendered...');
    
    // Check if main components exist
    const sidebar = await page.$('[class*="w-64"]');
    const header = await page.$('h1');
    const cards = await page.$$('[class*="bg-card"]');
    
    console.log('✅ Results:');
    console.log(`   Sidebar found: ${sidebar ? 'YES' : 'NO'}`);
    console.log(`   Header found: ${header ? 'YES' : 'NO'}`);
    console.log(`   Cards found: ${cards.length} cards`);
    
    // Check computed styles
    if (sidebar) {
      const sidebarStyles = await page.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          borderRight: computed.borderRight,
          width: computed.width
        };
      }, sidebar);
      console.log('🎨 Sidebar styles:', sidebarStyles);
    }
    
    // Get page title and check for errors
    const title = await page.title();
    console.log(`📝 Page title: ${title}`);
    
    // Check for console errors
    const logs = [];
    page.on('console', msg => logs.push(`${msg.type()}: ${msg.text()}`));
    
    // Check for JavaScript errors
    page.on('pageerror', err => {
      console.error('❌ JavaScript error:', err.message);
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (logs.length > 0) {
      console.log('📋 Console logs:');
      logs.forEach(log => console.log(`   ${log}`));
    }
    
    console.log('✨ Test completed! Check professional-theme-test.png');
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testProfessionalTheme();