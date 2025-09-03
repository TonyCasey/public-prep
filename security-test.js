#!/usr/bin/env node

/**
 * Security Penetration Testing Suite for Sample Question Endpoint
 * Tests various attack vectors against /api/sample/evaluate
 */

const API_BASE = 'http://localhost:5000';
const ENDPOINT = '/api/sample/evaluate';

// Test utilities
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeRequest(payload, testName) {
  try {
    const startTime = Date.now();
    const response = await fetch(`${API_BASE}${ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SecurityTest/1.0'
      },
      body: JSON.stringify(payload)
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const contentType = response.headers.get('content-type');
    
    let responseData;
    try {
      responseData = await response.json();
    } catch (e) {
      responseData = { error: 'Could not parse JSON response' };
    }
    
    return {
      testName,
      status: response.status,
      responseTime,
      contentType,
      data: responseData,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    return {
      testName,
      status: 'ERROR',
      error: error.message,
      responseTime: 0
    };
  }
}

// Test cases
const securityTests = [
  {
    name: "Baseline Valid Request",
    payload: {
      questionText: "Tell me about a time when you led a team",
      answerText: "I led a team of 5 people during a project to implement new software. I organized weekly meetings, delegated tasks based on team member strengths, and ensured we met our deadline while maintaining quality standards.",
      competency: "team_leadership"
    }
  },
  {
    name: "XSS Attack - Script Tag",
    payload: {
      questionText: "Test question",
      answerText: "<script>alert('XSS')</script>This is my answer",
      competency: "team_leadership"
    }
  },
  {
    name: "XSS Attack - JavaScript Protocol",
    payload: {
      questionText: "Test question", 
      answerText: "javascript:alert('XSS') My leadership experience",
      competency: "team_leadership"
    }
  },
  {
    name: "XSS Attack - Event Handler",
    payload: {
      questionText: "Test question",
      answerText: "My answer <img src=x onerror=alert('XSS')>",
      competency: "team_leadership"
    }
  },
  {
    name: "SQL Injection - Union Select",
    payload: {
      questionText: "Test question",
      answerText: "My answer' UNION SELECT * FROM users--",
      competency: "team_leadership"
    }
  },
  {
    name: "SQL Injection - Drop Table",
    payload: {
      questionText: "Test question",
      answerText: "My answer'; DROP TABLE practice_sessions;--",
      competency: "team_leadership"
    }
  },
  {
    name: "Code Injection - System Command",
    payload: {
      questionText: "Test question",
      answerText: "My answer $(rm -rf /)",
      competency: "team_leadership"
    }
  },
  {
    name: "Code Injection - Eval Function",
    payload: {
      questionText: "Test question",
      answerText: "eval('malicious code') in my leadership role",
      competency: "team_leadership"
    }
  },
  {
    name: "Path Traversal Attack",
    payload: {
      questionText: "Test question",
      answerText: "My answer ../../../etc/passwd",
      competency: "team_leadership"
    }
  },
  {
    name: "URL/Link Spam",
    payload: {
      questionText: "Test question",
      answerText: "Check out this amazing site: https://malicious-site.com and also http://spam-link.net for more info",
      competency: "team_leadership"
    }
  },
  {
    name: "Excessive Length Attack",
    payload: {
      questionText: "Test question",
      answerText: "A".repeat(10000), // 10k characters
      competency: "team_leadership"
    }
  },
  {
    name: "Minimal Length Test",
    payload: {
      questionText: "Test question",
      answerText: "Hi", // Too short
      competency: "team_leadership"
    }
  },
  {
    name: "Invalid Competency",
    payload: {
      questionText: "Test question",
      answerText: "Valid answer here",
      competency: "invalid_competency_injection"
    }
  },
  {
    name: "Missing Required Fields",
    payload: {
      answerText: "My answer without other fields"
    }
  },
  {
    name: "Empty Payload",
    payload: {}
  },
  {
    name: "Repeated Pattern Spam",
    payload: {
      questionText: "Test question",
      answerText: "SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM",
      competency: "team_leadership"
    }
  },
  {
    name: "Malformed JSON Characters",
    payload: {
      questionText: "Test question",
      answerText: "Answer with special chars: \u0000\u0001\u0002\u0003\u0004\u0005",
      competency: "team_leadership"
    }
  },
  {
    name: "Unicode Bypass Attempt",
    payload: {
      questionText: "Test question",
      answerText: "\u003cscript\u003ealert('XSS')\u003c/script\u003e",
      competency: "team_leadership"
    }
  },
  {
    name: "Buffer Overflow Simulation",
    payload: {
      questionText: "Q".repeat(2000), // Oversized question
      answerText: "Standard answer here",
      competency: "team_leadership"
    }
  },
  {
    name: "Nested Object Injection",
    payload: {
      questionText: "Test question",
      answerText: "My answer",
      competency: "team_leadership",
      __proto__: { malicious: "prototype pollution" },
      admin: true,
      role: "superuser"
    }
  }
];

// Rate limiting tests
const rateLimitTests = [
  { name: "Request 1", delay: 0 },
  { name: "Request 2", delay: 100 },
  { name: "Request 3", delay: 100 },
  { name: "Request 4", delay: 100 },
  { name: "Request 5", delay: 100 },
  { name: "Request 6 (Should be blocked)", delay: 100 },
  { name: "Request 7 (Should be blocked)", delay: 100 },
];

async function runSecurityTests() {
  console.log('🔒 SECURITY PENETRATION TESTING SUITE');
  console.log('=====================================\n');
  
  console.log('📊 Running Security Tests...\n');
  
  const results = [];
  
  for (const test of securityTests) {
    console.log(`Testing: ${test.name}`);
    const result = await makeRequest(test.payload, test.name);
    results.push(result);
    
    // Brief delay between tests
    await delay(200);
  }
  
  return results;
}

async function runRateLimitTests() {
  console.log('\n🚦 RATE LIMITING TESTS');
  console.log('=====================\n');
  
  const rateLimitResults = [];
  const basePayload = {
    questionText: "Test question for rate limiting",
    answerText: "This is a test answer for rate limiting verification",
    competency: "team_leadership"
  };
  
  for (const test of rateLimitTests) {
    if (test.delay > 0) {
      await delay(test.delay);
    }
    
    console.log(`Testing: ${test.name}`);
    const result = await makeRequest(basePayload, test.name);
    rateLimitResults.push(result);
  }
  
  return rateLimitResults;
}

function analyzeResults(securityResults, rateLimitResults) {
  console.log('\n📈 SECURITY TEST ANALYSIS');
  console.log('=========================\n');
  
  // Security test analysis
  const blockedTests = securityResults.filter(r => r.status === 400 || r.status === 429);
  const passedTests = securityResults.filter(r => r.status === 200);
  const errorTests = securityResults.filter(r => r.status === 'ERROR' || r.status >= 500);
  
  console.log(`Total Security Tests: ${securityResults.length}`);
  console.log(`✅ Properly Blocked: ${blockedTests.length}`);
  console.log(`⚠️  Allowed Through: ${passedTests.length}`);
  console.log(`❌ System Errors: ${errorTests.length}\n`);
  
  // Detailed security analysis
  console.log('🛡️ SECURITY PROTECTION ANALYSIS:');
  console.log('--------------------------------');
  
  const xssTests = securityResults.filter(r => r.testName.includes('XSS'));
  const sqlTests = securityResults.filter(r => r.testName.includes('SQL'));
  const injectionTests = securityResults.filter(r => r.testName.includes('Injection') || r.testName.includes('injection'));
  
  console.log(`XSS Protection: ${xssTests.filter(r => r.status !== 200).length}/${xssTests.length} blocked`);
  console.log(`SQL Injection Protection: ${sqlTests.filter(r => r.status !== 200).length}/${sqlTests.length} blocked`);
  console.log(`Code Injection Protection: ${injectionTests.filter(r => r.status !== 200).length}/${injectionTests.length} blocked`);
  
  // Rate limiting analysis
  console.log('\n🚦 RATE LIMITING ANALYSIS:');
  console.log('-------------------------');
  
  const blockedByRateLimit = rateLimitResults.filter(r => r.status === 429);
  console.log(`Rate Limited Requests: ${blockedByRateLimit.length}/${rateLimitResults.length}`);
  
  if (blockedByRateLimit.length > 0) {
    console.log('✅ Rate limiting is working correctly');
  } else {
    console.log('⚠️ Rate limiting may not be functioning as expected');
  }
  
  // Response time analysis
  const avgResponseTime = securityResults
    .filter(r => r.responseTime > 0)
    .reduce((sum, r) => sum + r.responseTime, 0) / securityResults.length;
  
  console.log(`\n⏱️ Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
  
  // Security headers check
  const securityHeaders = securityResults[0]?.headers || {};
  console.log('\n🔐 SECURITY HEADERS ANALYSIS:');
  console.log('----------------------------');
  console.log(`X-Content-Type-Options: ${securityHeaders['x-content-type-options'] || 'Not Set'}`);
  console.log(`X-Frame-Options: ${securityHeaders['x-frame-options'] || 'Not Set'}`);
  console.log(`X-XSS-Protection: ${securityHeaders['x-xss-protection'] || 'Not Set'}`);
  console.log(`X-Security-Protected: ${securityHeaders['x-security-protected'] || 'Not Set'}`);
  
  return {
    securityScore: Math.round((blockedTests.length / securityResults.length) * 100),
    rateLimitingWorks: blockedByRateLimit.length > 0,
    avgResponseTime,
    securityHeaders: Object.keys(securityHeaders).filter(h => h.startsWith('x-')).length
  };
}

function generateReport(securityResults, rateLimitResults, analysis) {
  console.log('\n📋 FINAL SECURITY REPORT');
  console.log('========================\n');
  
  console.log(`🛡️ Overall Security Score: ${analysis.securityScore}%`);
  console.log(`🚦 Rate Limiting: ${analysis.rateLimitingWorks ? 'WORKING' : 'NEEDS ATTENTION'}`);
  console.log(`⏱️ Performance: ${analysis.avgResponseTime}ms average response`);
  console.log(`🔒 Security Headers: ${analysis.securityHeaders} headers configured\n`);
  
  console.log('🎯 RECOMMENDATIONS:');
  console.log('------------------');
  
  if (analysis.securityScore >= 80) {
    console.log('✅ Excellent security implementation');
  } else if (analysis.securityScore >= 60) {
    console.log('⚠️ Good security, minor improvements needed');
  } else {
    console.log('❌ Security implementation needs significant improvement');
  }
  
  if (!analysis.rateLimitingWorks) {
    console.log('⚠️ Implement or verify rate limiting configuration');
  }
  
  if (analysis.avgResponseTime > 5000) {
    console.log('⚠️ Consider optimizing response times');
  }
  
  console.log('\n📊 DETAILED RESULTS:');
  console.log('-------------------');
  
  securityResults.forEach(result => {
    const status = result.status === 200 ? '⚠️ ALLOWED' : 
                  result.status === 400 ? '✅ BLOCKED' :
                  result.status === 429 ? '✅ RATE LIMITED' : '❌ ERROR';
    console.log(`${status} | ${result.testName} | Status: ${result.status}`);
  });
}

// Main execution
async function main() {
  try {
    const securityResults = await runSecurityTests();
    const rateLimitResults = await runRateLimitTests();
    const analysis = analyzeResults(securityResults, rateLimitResults);
    generateReport(securityResults, rateLimitResults, analysis);
    
    console.log('\n🔒 Penetration testing completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Testing failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}