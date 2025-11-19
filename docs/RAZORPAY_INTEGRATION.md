# Razorpay Integration for Plannova

This document explains how to set up and use Razorpay payment integration in the Plannova platform.

## Setup Instructions

### 1. Server Setup

1. Install the Razorpay SDK:
   ```bash
   cd server
   npm install razorpay
   ```

2. Update your `.env` file with your Razorpay credentials:
   ```env
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   ```

3. Restart the server:
   ```bash
   npm run dev
   ```

### 2. Client Setup

1. Update your `.env.local` file with your Razorpay key ID:
   ```env
   NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
   ```

2. Restart the client:
   ```bash
   cd client
   npm run dev
   ```

## How It Works

### Server-Side Components

1. **Razorpay Service** (`server/src/services/razorpayService.ts`):
   - Handles all Razorpay API interactions
   - Creates payment orders
   - Verifies payment signatures
   - Captures and refunds payments

2. **Payments Routes** (`server/src/routes/payments.ts`):
   - `/api/payments/create-order` - Creates a payment order for a booking
   - `/api/payments/verify-payment` - Verifies payment and updates booking status
   - `/api/payments/status/:bookingId` - Gets payment status for a booking

### Client-Side Components

1. **Payment Service** (`client/src/lib/paymentService.ts`):
   - Loads Razorpay SDK dynamically
   - Handles payment order creation
   - Processes payments through Razorpay checkout
   - Verifies payments with the server

2. **Payment Button** (`client/src/components/booking/PaymentButton.tsx`):
   - UI component for initiating payments
   - Handles loading states and errors
   - Redirects to login if user is not authenticated

3. **Payment Status** (`client/src/components/booking/PaymentStatus.tsx`):
   - Displays payment status information
   - Shows amount breakdown (total, advance, remaining)

## Usage

### Making a Payment

1. Import the PaymentButton component:
   ```tsx
   import PaymentButton from '@/components/booking/PaymentButton';
   ```

2. Use it in your component:
   ```tsx
   <PaymentButton
     bookingId="booking_id_here"
     amount={totalAmount}
     customerName="John Doe"
     customerEmail="john@example.com"
     customerPhone="9876543210"
     onPaymentSuccess={() => {
       // Handle successful payment
       console.log('Payment successful!');
     }}
   />
   ```

### Displaying Payment Status

1. Import the PaymentStatus component:
   ```tsx
   import PaymentStatus from '@/components/booking/PaymentStatus';
   ```

2. Use it in your component:
   ```tsx
   <PaymentStatus bookingId="booking_id_here" />
   ```

## Security

- All payment operations are verified server-side
- Payment signatures are validated to prevent tampering
- Sensitive information (key secrets) is never exposed to the client
- All API calls require authentication

## Testing

### Test Credentials

Use Razorpay's test credentials for development:
- Key ID: `rzp_test_...`
- Key Secret: `your_test_key_secret`

### Test Cards

Razorpay provides test cards for different scenarios:
- Successful payment: `4111 1111 1111 1111`
- Failed payment: `4000 0000 0000 0002`

## Error Handling

The integration handles common errors:
- Network issues
- Payment verification failures
- Invalid booking IDs
- Unauthorized access
- Rate limiting

## Customization

### Styling

The payment button and status components use Tailwind CSS and can be customized:
```tsx
<PaymentButton
  // ... other props
  className="custom-button-class"
/>
```

### Payment Options

Additional payment options can be configured in the `processPayment` function in `paymentService.ts`:
- Prefill customer information
- Add custom notes
- Customize the theme color

## Troubleshooting

### Common Issues

1. **Razorpay SDK not loading**:
   - Check internet connectivity
   - Ensure the script URL is not blocked by ad blockers

2. **Payment verification failing**:
   - Verify Razorpay credentials in `.env`
   - Check that the server is running and accessible

3. **CORS errors**:
   - Ensure `FRONTEND_URL` in server `.env` includes your client URL

### Debugging

Enable debug logging by setting `NODE_ENV=development` in your environment files.

## API Endpoints

### Create Payment Order
```
POST /api/payments/create-order
```
**Request Body**:
```json
{
  "bookingId": "booking_id_here"
}
```

**Response**:
```json
{
  "orderId": "order_id",
  "amount": 50000,
  "currency": "INR",
  "bookingId": "booking_id_here"
}
```

### Verify Payment
```
POST /api/payments/verify-payment
```
**Request Body**:
```json
{
  "razorpay_order_id": "order_id",
  "razorpay_payment_id": "payment_id",
  "razorpay_signature": "signature",
  "bookingId": "booking_id_here"
}
```

**Response**:
```json
{
  "message": "Payment successful",
  "bookingId": "booking_id_here",
  "paymentStatus": "paid"
}
```

### Get Payment Status
```
GET /api/payments/status/:bookingId
```

**Response**:
```json
{
  "bookingId": "booking_id_here",
  "paymentStatus": "paid",
  "totalPrice": 50000,
  "advanceAmount": 50000,
  "remainingAmount": 0
}
```