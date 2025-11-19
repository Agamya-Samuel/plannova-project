#!/usr/bin/env node

/**
 * Test script for Razorpay payment flow
 * This script tests the basic functionality of the payment system
 */

import { createOrder } from '../src/services/razorpayService.js';

async function testPaymentFlow() {
  console.log('Testing Razorpay payment flow...\n');
  
  try {
    // Check if Razorpay is configured
    const { isConfigured } = await import('../src/services/razorpayService.js');
    if (!isConfigured()) {
      console.log('❌ Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file.');
      return;
    }
    
    console.log('✅ Razorpay is configured\n');
    
    // Test creating an order
    console.log('1. Testing order creation...');
    const order = await createOrder(
      50000, // ₹500 in paise
      'INR',
      'test_order_' + Date.now(),
      {
        test: 'true',
        description: 'Test order for payment flow verification'
      }
    );
    
    console.log('✅ Order created successfully');
    console.log('   Order ID:', order.id);
    console.log('   Amount:', order.amount);
    console.log('   Currency:', order.currency);
    console.log('');
    
    // Note: We can't test payment verification without actual payment
    // In a real scenario, this would be done after the user completes payment
    console.log('2. Payment verification can only be tested with actual payment');
    console.log('   In a real scenario, the user would complete payment on Razorpay checkout');
    console.log('   Then Razorpay would redirect back to our system with payment details');
    console.log('   Finally, we would verify the payment signature\n');
    
    console.log('✅ Payment flow test completed successfully!');
    console.log('\nTo test the complete flow:');
    console.log('1. Start the server: npm run dev');
    console.log('2. Make sure your .env file has valid Razorpay keys');
    console.log('3. Create a booking in the system');
    console.log('4. Use the payment button to initiate payment');
    console.log('5. Complete payment using test card details:');
    console.log('   - Card Number: 4111 1111 1111 1111');
    console.log('   - Expiry: Any future date');
    console.log('   - CVV: 123');
    
  } catch (error) {
    console.error('❌ Error during payment flow test:', error);
    process.exit(1);
  }
}

// Run the test
testPaymentFlow();