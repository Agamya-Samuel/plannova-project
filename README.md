# Plannova Project

## Project Overview

Plannova is a comprehensive event planning platform that connects customers with service providers for various event needs including venues, catering, photography, videography, bridal makeup, decoration, and entertainment.

## Table of Contents

- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Payment Integration](#payment-integration)
- [Testing](#testing)
- [Deployment](#deployment)

## Project Structure

```
plannova-project/
├── client/          # Next.js frontend application
├── server/          # Node.js backend with Express
└── README.md        # This file
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB
- Firebase account
- Razorpay account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
```

2. Install dependencies for both client and server:
```bash
cd server
npm install
cd ../client
npm install
```

3. Set up environment variables (see below)

4. Start the development servers:
```bash
# In server directory
npm run dev

# In client directory
npm run dev
```

## Environment Variables

### Server (.env)
Create a `.env` file in the `server/` directory based on `.env.example`:

```bash
# Required variables
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
# ... other variables
```

### Client (.env.local)
Create a `.env.local` file in the `client/` directory:

```bash
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
```

## Payment Integration

### Razorpay Setup

1. Create a Razorpay account at [https://razorpay.com](https://razorpay.com)
2. Get your API keys from the Razorpay Dashboard:
   - Go to Settings → API Keys
   - Generate new keys if needed
3. Add the keys to your environment variables:
   - Server: `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
   - Client: `NEXT_PUBLIC_RAZORPAY_KEY_ID`

### Testing Payments

For testing payments in development, use Razorpay's test card details:

- Card Number: `4111 1111 1111 1111`
- Expiry: Any future date
- CVV: `123`

### Payment Flow

1. User creates a booking
2. User clicks "Pay Now" button
3. System creates a Razorpay order
4. User is redirected to Razorpay checkout
5. User completes payment
6. Razorpay redirects back to the application
7. System verifies payment signature
8. Booking status is updated to "paid"

## Testing

### Running Tests

```bash
# Server tests
cd server
npm test

# Client tests
cd client
npm test
```

### Testing Payment Flow

To test the payment flow without actually making payments:

```bash
cd server
npm run test:payment-flow
```

Or manually test using the test script:
```bash
cd server
npx ts-node scripts/test-payment-flow.ts
```

## Deployment

### Server Deployment

1. Set up environment variables on your server
2. Build the server:
```bash
cd server
npm run build
```
3. Start the server:
```bash
npm start
```

### Client Deployment

1. Set up environment variables
2. Build the client:
```bash
cd client
npm run build
```
3. Start the client:
```bash
npm start
```

Or deploy to Vercel/Netlify for easier deployment.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

This project is licensed under the MIT License.