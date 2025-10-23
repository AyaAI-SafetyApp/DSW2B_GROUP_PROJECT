// Test Supabase Edge Function - Send Welcome Email
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://gfrnxqhivmgfgdersflu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmcm54cWhpdm1nZmdkZXJzZmx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAwMjY1MjIsImV4cCI6MjA0NTYwMjUyMn0.96e09bc4c3bb04be6c1c12d681e46f689551be1e48420b7e7d856dffd3956444';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testEmail() {
  console.log('\n🧪 Testing Email Function...\n');
  
  const testData = {
    email: 'qwabembongeni074@gmail.com',
    credentialId: 'test_cred_' + Date.now(),
    provider: 'Apple',
    userName: 'Qwabe Mbongeni',
    isWelcome: true,
  };
  
  console.log('📧 Sending email with data:');
  console.log(JSON.stringify(testData, null, 2));
  console.log('\n');
  
  try {
    const { data, error } = await supabase.functions.invoke('dynamic-api', {
      body: testData,
    });
    
    if (error) {
      console.error('❌ Error occurred:');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error context:', error.context);
      console.error('\nFull error:');
      console.error(JSON.stringify(error, null, 2));
      return;
    }
    
    console.log('✅ Success!');
    console.log('Response data:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n✉️ Check your email inbox!');
    
  } catch (err) {
    console.error('❌ Exception caught:');
    console.error(err.message);
    console.error('\nFull exception:');
    console.error(err);
  }
}

// Run the test
testEmail().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch(err => {
  console.error('\n💥 Test failed:', err);
  process.exit(1);
});
