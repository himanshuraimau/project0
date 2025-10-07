/**
 * Quick API Key Validator
 * Run this to check if your Dodo Payments API key is valid
 * 
 * Usage: npx tsx scripts/validate-dodo-key.ts
 */

import 'dotenv/config';
import DodoPayments from 'dodopayments';

const API_KEY = process.env.DODO_PAYMENTS_API_KEY;
const ENVIRONMENT = process.env.DODO_PAYMENTS_ENVIRONMENT || 'test_mode';
const PRODUCT_ID = process.env.NEXT_PUBLIC_DODO_PAYMENT_SUBSCRIPTION_ID;

console.log('🔍 Validating Dodo Payments Configuration...\n');

// Check 1: API Key exists
console.log('1. Checking API Key...');
if (!API_KEY) {
  console.error('   ❌ DODO_PAYMENTS_API_KEY is not set in .env file');
  process.exit(1);
}
console.log('   ✅ API Key found');
console.log(`   📝 Length: ${API_KEY.length} characters`);
console.log(`   📝 Prefix: ${API_KEY.substring(0, 15)}...`);

// Check 2: API Key format
console.log('\n2. Checking API Key format...');
if (!API_KEY.includes('.')) {
  console.error('   ⚠️  API Key format looks unusual (no dot separator)');
} else {
  console.log('   ✅ API Key format looks correct');
}

// Check 3: Environment
console.log('\n3. Checking Environment...');
console.log(`   📝 Environment: ${ENVIRONMENT}`);
if (ENVIRONMENT !== 'test_mode' && ENVIRONMENT !== 'live_mode') {
  console.warn('   ⚠️  Unusual environment value. Should be "test_mode" or "live_mode"');
}

// Check 4: Product ID
console.log('\n4. Checking Product ID...');
if (!PRODUCT_ID) {
  console.error('   ❌ NEXT_PUBLIC_DODO_PAYMENT_SUBSCRIPTION_ID is not set');
} else {
  console.log('   ✅ Product ID found');
  console.log(`   📝 Product ID: ${PRODUCT_ID}`);
  if (!PRODUCT_ID.startsWith('pdt_')) {
    console.warn('   ⚠️  Product ID should typically start with "pdt_"');
  }
}

// Check 5: Test API connection using the SDK
console.log('\n5. Testing API Connection with Dodo SDK...');
console.log('   📡 Initializing Dodo client...\n');

async function testConnection() {
  try {
    const client = new DodoPayments({
      bearerToken: API_KEY,
      environment: ENVIRONMENT as 'test_mode' | 'live_mode',
    });

    console.log('   📡 Attempting to list products...');
    const products = await client.products.list({ page_size: 1 });
    
    console.log('   ✅ API Connection Successful!');
    console.log(`   📝 Found ${products.items?.length || 0} product(s) in your account`);
    
    // Try to fetch the specific product
    if (PRODUCT_ID) {
      console.log(`\n   📡 Attempting to retrieve product ${PRODUCT_ID}...`);
      try {
        const product = await client.products.retrieve(PRODUCT_ID);
        console.log('   ✅ Product retrieved successfully!');
        console.log(`   📝 Product Name: ${product.name}`);
        console.log(`   📝 Product ID: ${product.product_id}`);
      } catch (err: any) {
        console.error(`   ❌ Product not found: ${err.message}`);
        console.error('   ⚠️  Make sure your product ID is correct in your Dodo dashboard');
      }
    }
    
    return true;
  } catch (error: any) {
    console.error('   ❌ API Connection Failed!\n');
    console.error(`   Error: ${error.message}`);
    console.error(`   Status: ${error.status || 'N/A'}`);
    
    if (error.status === 401) {
      console.error('\n   🔧 AUTHENTICATION ERROR (401):');
      console.error('   Your API key is invalid or expired.');
      console.error('\n   � SOLUTION:');
      console.error('   1. Go to https://dashboard.dodopayments.com/');
      console.error('   2. Navigate to Settings → API Keys');
      console.error('   3. Generate a new API key for TEST MODE');
      console.error('   4. Update DODO_PAYMENTS_API_KEY in your .env file');
      console.error('   5. Restart your dev server\n');
    } else if (error.status === 404) {
      console.error('\n   ⚠️  Resource not found. This might be a configuration issue.');
    }
    
    return false;
  }
}

testConnection().then(success => {
  console.log('\n' + '='.repeat(60));
  if (success) {
    console.log('✅ All checks passed! Your Dodo Payments setup is ready.');
  } else {
    console.log('❌ Configuration issues found. Please fix them and try again.');
    console.log('📖 See DODO_API_KEY_TROUBLESHOOTING.md for detailed help.');
  }
  console.log('='.repeat(60));
  process.exit(success ? 0 : 1);
});
